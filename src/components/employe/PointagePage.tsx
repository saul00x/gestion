import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, query, where, orderBy } from 'firebase/firestore';
import { MapPin, Clock, CheckCircle, AlertCircle, Calendar } from 'lucide-react';
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

  useEffect(() => {
    if (user?.magasin_id) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user?.magasin_id) return;

    try {
      // Récupérer le magasin
      const magasinDoc = await getDocs(query(
        collection(db, 'magasins'),
        where('__name__', '==', user.magasin_id)
      ));
      
      if (!magasinDoc.empty) {
        const magasinData = magasinDoc.docs[0];
        setMagasin({
          id: magasinData.id,
          ...magasinData.data(),
          createdAt: magasinData.data().createdAt?.toDate() || new Date()
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
        date_pointage: doc.data().date_pointage.toDate()
      })) as Presence[];

      setPresences(presencesData);

      // Vérifier s'il y a déjà un pointage aujourd'hui
      const today = new Date();
      const todayPresenceData = presencesData.find(p => {
        const pointageDate = p.date_pointage;
        return pointageDate.toDateString() === today.toDateString();
      });

      setTodayPresence(todayPresenceData || null);

    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handlePointage = async () => {
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

      // Vérifier s'il y a déjà un pointage aujourd'hui
      if (todayPresence) {
        toast.error('Vous avez déjà pointé aujourd\'hui.');
        return;
      }

      await addDoc(collection(db, 'presences'), {
        user_id: user.id,
        magasin_id: magasin.id,
        date_pointage: new Date(),
        latitude: position.latitude,
        longitude: position.longitude,
        type: 'arrivee'
      });

      toast.success('Pointage enregistré avec succès !');
      fetchData(); // Recharger les données

    } catch (error) {
      toast.error('Erreur lors du pointage. Vérifiez que la géolocalisation est activée.');
    } finally {
      setPointageLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
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

      {/* Pointage du jour */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Pointage du jour</h2>
          <div className="flex items-center text-sm text-gray-500">
            <Calendar className="h-4 w-4 mr-1" />
            {new Date().toLocaleDateString('fr-FR', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </div>
        </div>

        {todayPresence ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600 mr-4" />
              <div>
                <h3 className="text-lg font-medium text-green-800">Pointage effectué</h3>
                <p className="text-green-600">
                  Arrivée enregistrée à {todayPresence.date_pointage.toLocaleTimeString('fr-FR')}
                </p>
                <p className="text-sm text-green-600 mt-1">
                  Magasin: {magasin?.nom}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center text-gray-600 mb-4">
              <MapPin className="h-5 w-5 mr-2" />
              <span>Magasin assigné: {magasin?.nom || 'Non assigné'}</span>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <h4 className="font-medium text-blue-800 mb-2">Instructions de pointage</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Assurez-vous d'être dans un rayon de 100m du magasin</li>
                <li>• Activez la géolocalisation sur votre appareil</li>
                <li>• Cliquez sur le bouton "Pointer mon arrivée"</li>
              </ul>
            </div>

            <button
              onClick={handlePointage}
              disabled={pointageLoading || geoLoading || !magasin}
              className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center space-x-2"
            >
              {pointageLoading || geoLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Pointage en cours...</span>
                </>
              ) : (
                <>
                  <Clock className="h-5 w-5" />
                  <span>Pointer mon arrivée</span>
                </>
              )}
            </button>

            {geoError && (
              <div className="bg-red-50 text-red-800 p-4 rounded-lg border border-red-200 flex items-center">
                <AlertCircle className="h-5 w-5 mr-2" />
                {geoError}
              </div>
            )}

            {!magasin && (
              <div className="bg-yellow-50 text-yellow-800 p-4 rounded-lg border border-yellow-200 flex items-center">
                <AlertCircle className="h-5 w-5 mr-2" />
                Aucun magasin assigné. Contactez votre administrateur.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Historique des présences */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Historique des présences</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Heure
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Magasin
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
                    {presence.date_pointage.toLocaleTimeString('fr-FR')}
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {magasin?.nom || 'Magasin inconnu'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {presences.length === 0 && (
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