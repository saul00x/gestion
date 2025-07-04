import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore';
import { Calendar, Clock, MapPin, User, Filter, Download, AlertCircle, Coffee, LogOut, LogIn } from 'lucide-react';
import { db } from '../../config/firebase';
import { Presence, User as UserType, Magasin } from '../../types';
import toast from 'react-hot-toast';

export const PresencesPage: React.FC = () => {
  const [presences, setPresences] = useState<Presence[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedUser, setSelectedUser] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchPresences();
  }, [selectedDate, selectedUser]);

  const fetchData = async () => {
    try {
      // Récupérer les utilisateurs
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const usersData = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      })) as UserType[];
      setUsers(usersData);

    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      toast.error('Erreur lors du chargement des données');
    }
  };

  const fetchPresences = async () => {
    setLoading(true);
    try {
      let presencesQuery = query(
        collection(db, 'presences'),
        orderBy('date_pointage', 'desc')
      );

      const snapshot = await getDocs(presencesQuery);
      let presencesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date_pointage: doc.data().date_pointage.toDate(),
        heure_entree: doc.data().heure_entree?.toDate(),
        heure_sortie: doc.data().heure_sortie?.toDate(),
        pause_entree: doc.data().pause_entree?.toDate(),
        pause_sortie: doc.data().pause_sortie?.toDate()
      })) as Presence[];

      // Filtrer par date
      if (selectedDate) {
        const filterDate = new Date(selectedDate);
        presencesData = presencesData.filter(presence => {
          const presenceDate = presence.date_pointage;
          return presenceDate.toDateString() === filterDate.toDateString();
        });
      }

      // Filtrer par utilisateur
      if (selectedUser) {
        presencesData = presencesData.filter(presence => presence.user_id === selectedUser);
      }

      setPresences(presencesData);
    } catch (error) {
      console.error('Erreur lors du chargement des présences:', error);
      toast.error('Erreur lors du chargement des présences');
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Utilisateur', 'Magasin', 'Arrivée', 'Départ', 'Début Pause', 'Fin Pause', 'Durée Pause'];
    const csvData = presences.map(presence => {
      const user = users.find(u => u.id === presence.user_id);
      return [
        presence.date_pointage.toLocaleDateString('fr-FR'),
        user?.email || 'Utilisateur supprimé',
        presence.magasin_nom || 'Magasin inconnu',
        presence.heure_entree?.toLocaleTimeString('fr-FR') || '-',
        presence.heure_sortie?.toLocaleTimeString('fr-FR') || '-',
        presence.pause_entree?.toLocaleTimeString('fr-FR') || '-',
        presence.pause_sortie?.toLocaleTimeString('fr-FR') || '-',
        presence.duree_pause ? `${Math.floor(presence.duree_pause / 60)}h ${presence.duree_pause % 60}min` : '-'
      ];
    });

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `presences_${selectedDate}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}min`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion des Présences</h1>
          <p className="text-gray-600 mt-1">Consultez l'historique des pointages</p>
        </div>
        <button
          onClick={exportToCSV}
          disabled={presences.length === 0}
          className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center space-x-2"
        >
          <Download className="h-5 w-5" />
          <span>Exporter CSV</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center space-x-2 mb-4">
          <Filter className="h-5 w-5 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900">Filtres</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Utilisateur
            </label>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Tous les utilisateurs</option>
              {users.filter(user => user.role === 'employe').map((user) => (
                <option key={user.id} value={user.id}>
                  {user.email}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Presences Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          </div>
        ) : presences.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Utilisateur
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Magasin
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Arrivée
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Départ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pause
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Durée pause
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {presences.map((presence) => {
                  const user = users.find(u => u.id === presence.user_id);
                  return (
                    <tr key={presence.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                          <div className="text-sm font-medium text-gray-900">
                            {presence.date_pointage.toLocaleDateString('fr-FR')}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8">
                            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                              <User className="h-4 w-4 text-blue-600" />
                            </div>
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              {user?.email || 'Utilisateur supprimé'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {presence.magasin_nom || 'Magasin inconnu'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-green-600">
                          <LogIn className="h-4 w-4 mr-1" />
                          {presence.heure_entree?.toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          }) || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-red-600">
                          <LogOut className="h-4 w-4 mr-1" />
                          {presence.heure_sortie?.toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          }) || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-yellow-600">
                          <Coffee className="h-4 w-4 mr-1" />
                          {presence.pause_entree?.toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          }) || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-orange-600">
                        {presence.duree_pause ? formatDuration(presence.duree_pause) : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <Clock className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune présence trouvée</h3>
            <p className="text-gray-600">
              Aucun pointage ne correspond aux filtres sélectionnés.
            </p>
          </div>
        )}
      </div>

      {/* Statistics */}
      {presences.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Statistiques du jour</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center">
                <User className="h-8 w-8 text-blue-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-blue-600">Employés présents</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {new Set(presences.map(p => p.user_id)).size}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center">
                <LogIn className="h-8 w-8 text-green-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-600">Arrivées</p>
                  <p className="text-2xl font-bold text-green-900">
                    {presences.filter(p => p.heure_entree).length}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="flex items-center">
                <LogOut className="h-8 w-8 text-red-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-red-600">Départs</p>
                  <p className="text-2xl font-bold text-red-900">
                    {presences.filter(p => p.heure_sortie).length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="flex items-center">
                <Coffee className="h-8 w-8 text-yellow-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-yellow-600">Pauses</p>
                  <p className="text-2xl font-bold text-yellow-900">
                    {presences.filter(p => p.pause_entree).length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};