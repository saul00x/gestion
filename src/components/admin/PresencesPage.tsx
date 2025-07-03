import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore';
import { Calendar, Clock, MapPin, User, Filter, Download } from 'lucide-react';
import { db } from '../../config/firebase';
import { Presence, User as UserType, Magasin } from '../../types';

export const PresencesPage: React.FC = () => {
  const [presences, setPresences] = useState<Presence[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);
  const [magasins, setMagasins] = useState<Magasin[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMagasin, setSelectedMagasin] = useState('');
  const [selectedUser, setSelectedUser] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchPresences();
  }, [selectedDate, selectedMagasin, selectedUser]);

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

      // Récupérer les magasins
      const magasinsSnapshot = await getDocs(collection(db, 'magasins'));
      const magasinsData = magasinsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      })) as Magasin[];
      setMagasins(magasinsData);

    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
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
        date_pointage: doc.data().date_pointage.toDate()
      })) as Presence[];

      // Filtrer par date
      if (selectedDate) {
        const filterDate = new Date(selectedDate);
        presencesData = presencesData.filter(presence => {
          const presenceDate = presence.date_pointage;
          return presenceDate.toDateString() === filterDate.toDateString();
        });
      }

      // Filtrer par magasin
      if (selectedMagasin) {
        presencesData = presencesData.filter(presence => presence.magasin_id === selectedMagasin);
      }

      // Filtrer par utilisateur
      if (selectedUser) {
        presencesData = presencesData.filter(presence => presence.user_id === selectedUser);
      }

      setPresences(presencesData);
    } catch (error) {
      console.error('Erreur lors du chargement des présences:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Heure', 'Utilisateur', 'Magasin', 'Type', 'Latitude', 'Longitude'];
    const csvData = presences.map(presence => {
      const user = users.find(u => u.id === presence.user_id);
      const magasin = magasins.find(m => m.id === presence.magasin_id);
      return [
        presence.date_pointage.toLocaleDateString('fr-FR'),
        presence.date_pointage.toLocaleTimeString('fr-FR'),
        user?.email || 'Utilisateur inconnu',
        magasin?.nom || 'Magasin inconnu',
        presence.type,
        presence.latitude.toString(),
        presence.longitude.toString()
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
          className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors duration-200 flex items-center space-x-2"
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
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              Magasin
            </label>
            <select
              value={selectedMagasin}
              onChange={(e) => setSelectedMagasin(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Tous les magasins</option>
              {magasins.map((magasin) => (
                <option key={magasin.id} value={magasin.id}>
                  {magasin.nom}
                </option>
              ))}
            </select>
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
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Heure
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Utilisateur
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Magasin
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Position GPS
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {presences.map((presence) => {
                  const user = users.find(u => u.id === presence.user_id);
                  const magasin = magasins.find(m => m.id === presence.magasin_id);
                  return (
                    <tr key={presence.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {presence.date_pointage.toLocaleDateString('fr-FR')}
                            </div>
                            <div className="text-sm text-gray-500 flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {presence.date_pointage.toLocaleTimeString('fr-FR')}
                            </div>
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
                              {user?.email || 'Utilisateur inconnu'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {magasin?.nom || 'Magasin inconnu'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          presence.type === 'arrivee' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {presence.type === 'arrivee' ? 'Arrivée' : 'Départ'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-500">
                          <MapPin className="h-4 w-4 mr-1" />
                          <span className="font-mono">
                            {presence.latitude.toFixed(6)}, {presence.longitude.toFixed(6)}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {presences.length === 0 && !loading && (
        <div className="text-center py-12">
          <Clock className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune présence trouvée</h3>
          <p className="text-gray-600">
            Aucun pointage ne correspond aux filtres sélectionnés.
          </p>
        </div>
      )}

      {/* Statistics */}
      {presences.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Statistiques du jour</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                <Clock className="h-8 w-8 text-green-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-600">Total pointages</p>
                  <p className="text-2xl font-bold text-green-900">{presences.length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="flex items-center">
                <MapPin className="h-8 w-8 text-orange-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-orange-600">Magasins actifs</p>
                  <p className="text-2xl font-bold text-orange-900">
                    {new Set(presences.map(p => p.magasin_id)).size}
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