import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, where, addDoc, doc, getDoc } from 'firebase/firestore';
import { MapPin, Clock, Package, AlertCircle } from 'lucide-react';
import { db } from '../../config/firebase';
import { useAuth } from '../../hooks/useAuth';
import { useGeolocation } from '../../hooks/useGeolocation';
import { Stock, Produit, Magasin, Presence } from '../../types';

export const EmployeDashboard: React.FC = () => {
  const { user } = useAuth();
  const { getCurrentPosition, calculateDistance, loading: geoLoading, error: geoError } = useGeolocation();
  const [magasin, setMagasin] = useState<Magasin | null>(null);
  const [stats, setStats] = useState({
    totalProduits: 0,
    produitsAlertes: 0
  });
  const [pointageLoading, setPointageLoading] = useState(false);
  const [pointageMessage, setPointageMessage] = useState('');
  const [lastPointage, setLastPointage] = useState<Presence | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.magasin_id) return;

      try {
        // Récupérer le magasin de l'employé
        const magasinDoc = await getDoc(doc(db, 'magasins', user.magasin_id));
        if (magasinDoc.exists()) {
          setMagasin({ id: magasinDoc.id, ...magasinDoc.data() } as Magasin);
        }

        // Récupérer les stocks du magasin
        const stocksQuery = query(
          collection(db, 'stocks'),
          where('magasin_id', '==', user.magasin_id)
        );
        const stocksSnapshot = await getDocs(stocksQuery);
        const stocks = stocksSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Stock[];

        // Récupérer les produits pour vérifier les alertes
        const produitsSnapshot = await getDocs(collection(db, 'produits'));
        const produits = produitsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Produit[];

        let produitsAlertes = 0;
        stocks.forEach(stock => {
          const produit = produits.find(p => p.id === stock.produit_id);
          if (produit && stock.quantite <= produit.seuil_alerte) {
            produitsAlertes++;
          }
        });

        setStats({
          totalProduits: stocks.length,
          produitsAlertes
        });

        // Récupérer le dernier pointage
        const presencesQuery = query(
          collection(db, 'presences'),
          where('user_id', '==', user.id)
        );
        const presencesSnapshot = await getDocs(presencesQuery);
        const presences = presencesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          date_pointage: doc.data().date_pointage.toDate()
        })) as Presence[];

        const today = new Date();
        const todayPresence = presences.find(p => {
          const pointageDate = p.date_pointage;
          return pointageDate.toDateString() === today.toDateString();
        });

        if (todayPresence) {
          setLastPointage(todayPresence);
        }

      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
      }
    };

    fetchData();
  }, [user]);

  const handlePointage = async () => {
    if (!user || !magasin) return;

    setPointageLoading(true);
    setPointageMessage('');

    try {
      const position = await getCurrentPosition();
      const distance = calculateDistance(
        position.latitude,
        position.longitude,
        magasin.latitude,
        magasin.longitude
      );

      if (distance > 100) {
        setPointageMessage(`Vous êtes trop loin du magasin (${Math.round(distance)}m). Vous devez être dans un rayon de 100m.`);
        return;
      }

      // Vérifier s'il y a déjà un pointage aujourd'hui
      if (lastPointage) {
        setPointageMessage('Vous avez déjà pointé aujourd\'hui.');
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

      setPointageMessage('Pointage enregistré avec succès !');
      setLastPointage({
        id: '',
        user_id: user.id,
        magasin_id: magasin.id,
        date_pointage: new Date(),
        latitude: position.latitude,
        longitude: position.longitude,
        type: 'arrivee'
      });

    } catch (error) {
      setPointageMessage('Erreur lors du pointage. Vérifiez que la géolocalisation est activée.');
    } finally {
      setPointageLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Employé</h1>
        <p className="text-gray-600 mt-2">Bienvenue, {user?.email}</p>
      </div>

      {/* Cartes de statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Produits en stock</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalProduits}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Alertes stock</p>
              <p className="text-2xl font-bold text-gray-900">{stats.produitsAlertes}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <MapPin className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Magasin</p>
              <p className="text-lg font-bold text-gray-900">{magasin?.nom || 'Non assigné'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Section pointage */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Pointage</h2>
          <Clock className="h-6 w-6 text-gray-400" />
        </div>

        {lastPointage ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-800 font-medium">Pointage effectué aujourd'hui</p>
            <p className="text-green-600 text-sm">
              {lastPointage.date_pointage.toLocaleString('fr-FR')}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-gray-600">
              Vous pouvez pointer votre arrivée. Assurez-vous d'être dans un rayon de 100m du magasin.
            </p>
            <button
              onClick={handlePointage}
              disabled={pointageLoading || geoLoading}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {pointageLoading || geoLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Pointage en cours...
                </div>
              ) : (
                'Pointer mon arrivée'
              )}
            </button>

            {pointageMessage && (
              <div className={`p-4 rounded-lg ${
                pointageMessage.includes('succès') 
                  ? 'bg-green-50 text-green-800 border border-green-200' 
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {pointageMessage}
              </div>
            )}

            {geoError && (
              <div className="bg-red-50 text-red-800 p-4 rounded-lg border border-red-200">
                {geoError}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Actions rapides */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Actions rapides</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left transition-colors duration-200">
            <Package className="h-6 w-6 text-blue-600 mb-2" />
            <h3 className="font-medium text-gray-900">Consulter le stock</h3>
            <p className="text-sm text-gray-600">Voir les produits disponibles</p>
          </button>
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left transition-colors duration-200">
            <Clock className="h-6 w-6 text-green-600 mb-2" />
            <h3 className="font-medium text-gray-900">Saisir un mouvement</h3>
            <p className="text-sm text-gray-600">Enregistrer une entrée/sortie</p>
          </button>
        </div>
      </div>
    </div>
  );
};