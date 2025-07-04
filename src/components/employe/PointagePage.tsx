import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, query, where, orderBy, doc, getDoc, updateDoc } from 'firebase/firestore';
import { MapPin, Clock, CheckCircle, AlertCircle, Calendar, Coffee, LogOut, LogIn, Pause } from 'lucide-react';
import { db } from '../../config/firebase';
import { useAuth } from '../../hooks/useAuth';
import { useGeolocation } from '../../hooks/useGeolocation';
import { Presence, Magasin } from '../../types';
import toast from 'react-hot-toast';

export const PointagePage: React.FC = () => {
  const { user } = useAuth();
  const { getCurrentPosition, calculateDistance, loading: geoLoading, error: geoError } = useGeolocation();
  const [magasin, setMagasin] = useState<Magasin | null>(null);
  const [presences, setPresences] = useState<Presence[]>([]);
  const [loading, setLoading] = useState(true);
  const [pointageLoading, setPointageLoading] = useState(false);
  const [todayPresence, setTodayPresence] = useState<Presence | null>(null);
  const [currentStatus, setCurrentStatus] = useState<'absent' | 'present' | 'pause'>('absent');

  useEffect(() => {
    if (user?.magasin_id) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchData = async () => {
    if (!user?.magasin_id) return;

    try {
      // Récupérer le magasin
      const magasinDoc = await getDoc(doc(db, 'magasins', user.magasin_id));
      
      if (magasinDoc.exists()) {
        setMagasin({
          id: magasinDoc.id,
          ...magasinDoc.data(),
          createdAt: magasinDoc.data().createdAt?.toDate() || new Date()
        } as Magasin);
      }

      // Récupérer l'historique des présences
      const presencesQuery = query(
        collection(db, 'presences'),
        where('user_id', '==', user.id),
        orderBy('date_pointage', 'desc')
      );
      
      const presencesSnapshot = await getDocs(presencesQuery);
      const presencesData = presencesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date_pointage: doc.data().date_pointage.toDate(),
        heure_entree: doc.data().heure_entree?.toDate(),
        heure_sortie: doc.data().heure_sortie?.toDate(),
        pause_entree: doc.data().pause_entree?.toDate(),
        pause_sortie: doc.data().pause_sortie?.toDate()
      })) as Presence[];

      setPresences(presencesData);

      // Vérifier le statut actuel
      const today = new Date();
      const todayPresenceData = presencesData.find(p => {
        const pointageDate = p.date_pointage;
        return pointageDate.toDateString() === today.toDateString();
      });

      setTodayPresence(todayPresenceData || null);

      // Déterminer le statut actuel
      if (todayPresenceData) {
        if (todayPresenceData.heure_sortie) {
          setCurrentStatus('absent');
        } else if (todayPresenceData.pause_entree && !todayPresenceData.pause_sortie) {
          setCurrentStatus('pause');
        } else {
          setCurrentStatus('present');
        }
      } else {
        setCurrentStatus('absent');
      }

    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handlePointage = async (type: 'arrivee' | 'depart' | 'pause_entree' | 'pause_sortie') => {
    if (!user || !magasin) return;

    setPointageLoading(true);

    try {
      const position = await getCurrentPosition();
      const distance = calculateDistance(
        position.latitude,
        position.longitude,
        magasin.latitude,
        magasin.longitude
      );

      if (distance > 100) {
        toast.error(`Vous êtes trop loin du magasin (${Math.round(distance)}m). Vous devez être dans un rayon de 100m.`);
        return;
      }

      const now = new Date();

      if (type === 'arrivee') {
        // Nouveau pointage d'arrivée
        await addDoc(collection(db, 'presences'), {
          user_id: user.id,
          magasin_id: magasin.id,
          magasin_nom: magasin.nom,
          date_pointage: now,
          heure_entree: now,
          latitude: position.latitude,
          longitude: position.longitude,
          type: 'arrivee'
        });
        toast.success('Arrivée enregistrée avec succès !');
      } else if (todayPresence) {
        // Mise à jour du pointage existant
        const updateData: any = {};
        
        if (type === 'depart') {
          updateData.heure_sortie = now;
          updateData.type = 'depart';
        } else if (type === 'pause_entree') {
          updateData.pause_entree = now;
          updateData.type = 'pause_entree';
        } else if (type === 'pause_sortie') {
          updateData.pause_sortie = now;
          updateData.type = 'pause_sortie';
          
          // Calculer la durée de pause
          if (todayPresence.pause_entree) {
            const pauseDuration = Math.floor((now.getTime() - todayPresence.pause_entree.getTime()) / (1000 * 60));
            updateData.duree_pause = pauseDuration;
          }
        }

        await updateDoc(doc(db, 'presences', todayPresence.id), updateData);
        
        const messages = {
          depart: 'Départ enregistré avec succès !',
          pause_entree: 'Début de pause enregistré !',
          pause_sortie: 'Fin de pause enregistrée !'
        };
        
        toast.success(messages[type]);
      }

      fetchData(); // Recharger les données

    } catch (error) {
      toast.error('Erreur lors du pointage. Vérifiez que la géolocalisation est activée.');
    } finally {
      setPointageLoading(false);
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}min`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user?.magasin_id) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-16 w-16 text-yellow-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun magasin assigné</h3>
        <p className="text-gray-600">Contactez votre administrateur pour être assigné à un magasin.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Pointage</h1>
        <p className="text-gray-600 mt-1">Gérez vos heures de présence</p>
      </div>

      {/* Statut actuel */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Statut actuel</h2>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            currentStatus === 'present' ? 'bg-green-100 text-green-800' :
            currentStatus === 'pause' ? 'bg-yellow-100 text-yellow-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {currentStatus === 'present' ? 'Présent' :
             currentStatus === 'pause' ? 'En pause' : 'Absent'}
          </div>
        </div>

        <div className="flex items-center text-sm text-gray-500 mb-4">
          <Calendar className="h-4 w-4 mr-1" />
          {new Date().toLocaleDateString('fr-FR', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </div>

        <div className="flex items-center text-gray-600 mb-6">
          <MapPin className="h-5 w-5 mr-2" />
          <span>Magasin: {magasin?.nom || 'Non assigné'}</span>
        </div>

        {/* Boutons de pointage */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => handlePointage('arrivee')}
            disabled={pointageLoading || geoLoading || currentStatus !== 'absent'}
            className="flex flex-col items-center p-4 border-2 border-green-300 rounded-lg hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <LogIn className="h-6 w-6 text-green-600 mb-2" />
            <span className="text-sm font-medium text-green-700">Arrivée</span>
          </button>

          <button
            onClick={() => handlePointage('pause_entree')}
            disabled={pointageLoading || geoLoading || currentStatus !== 'present'}
            className="flex flex-col items-center p-4 border-2 border-yellow-300 rounded-lg hover:bg-yellow-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Coffee className="h-6 w-6 text-yellow-600 mb-2" />
            <span className="text-sm font-medium text-yellow-700">Début pause</span>
          </button>

          <button
            onClick={() => handlePointage('pause_sortie')}
            disabled={pointageLoading || geoLoading || currentStatus !== 'pause'}
            className="flex flex-col items-center p-4 border-2 border-orange-300 rounded-lg hover:bg-orange-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Pause className="h-6 w-6 text-orange-600 mb-2" />
            <span className="text-sm font-medium text-orange-700">Fin pause</span>
          </button>

          <button
            onClick={() => handlePointage('depart')}
            disabled={pointageLoading || geoLoading || currentStatus === 'absent'}
            className="flex flex-col items-center p-4 border-2 border-red-300 rounded-lg hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <LogOut className="h-6 w-6 text-red-600 mb-2" />
            <span className="text-sm font-medium text-red-700">Départ</span>
          </button>
        </div>

        {pointageLoading && (
          <div className="mt-4 flex items-center justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-2"></div>
            <span>Pointage en cours...</span>
          </div>
        )}

        {geoError && (
          <div className="mt-4 bg-red-50 text-red-800 p-4 rounded-lg border border-red-200 flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            {geoError}
          </div>
        )}
      </div>

      {/* Résumé du jour */}
      {todayPresence && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Résumé du jour</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">Arrivée</p>
              <p className="text-lg font-semibold text-green-600">
                {todayPresence.heure_entree?.toLocaleTimeString('fr-FR', {
                  hour: '2-digit',
                  minute: '2-digit'
                }) || '-'}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Départ</p>
              <p className="text-lg font-semibold text-red-600">
                {todayPresence.heure_sortie?.toLocaleTimeString('fr-FR', {
                  hour: '2-digit',
                  minute: '2-digit'
                }) || '-'}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Pause</p>
              <p className="text-lg font-semibold text-yellow-600">
                {todayPresence.pause_entree?.toLocaleTimeString('fr-FR', {
                  hour: '2-digit',
                  minute: '2-digit'
                }) || '-'}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Durée pause</p>
              <p className="text-lg font-semibold text-orange-600">
                {todayPresence.duree_pause ? formatDuration(todayPresence.duree_pause) : '-'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Historique des présences */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Historique des présences</h2>
        </div>

        {presences.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
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
                {presences.slice(0, 10).map((presence) => (
                  <tr key={presence.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {presence.date_pointage.toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {presence.magasin_nom || 'Magasin inconnu'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                      {presence.heure_entree?.toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      }) || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                      {presence.heure_sortie?.toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      }) || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-600">
                      {presence.pause_entree?.toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      }) || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-orange-600">
                      {presence.duree_pause ? formatDuration(presence.duree_pause) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <Clock className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun pointage enregistré</h3>
            <p className="text-gray-600">Votre historique de présences apparaîtra ici.</p>
          </div>
        )}
      </div>
    </div>
  );
};