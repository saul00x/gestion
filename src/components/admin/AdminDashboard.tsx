import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, where } from 'firebase/firestore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Package, Store, Users, AlertTriangle, TrendingUp, DollarSign } from 'lucide-react';
import { db } from '../../config/firebase';
import { Produit, Stock, Magasin, User } from '../../types';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalProduits: 0,
    totalMagasins: 0,
    totalUtilisateurs: 0,
    alertesStock: 0,
    valeurTotaleStock: 0
  });
  const [stockData, setStockData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Récupérer les produits
        const produitsSnapshot = await getDocs(collection(db, 'produits'));
        const produits = produitsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Produit[];

        // Récupérer les magasins
        const magasinsSnapshot = await getDocs(collection(db, 'magasins'));
        const magasins = magasinsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Magasin[];

        // Récupérer les utilisateurs
        const utilisateursSnapshot = await getDocs(collection(db, 'users'));
        const utilisateurs = utilisateursSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as User[];

        // Récupérer les stocks
        const stocksSnapshot = await getDocs(collection(db, 'stocks'));
        const stocks = stocksSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Stock[];

        // Calculer les alertes de stock
        let alertesCount = 0;
        let valeurTotale = 0;
        const stockDataMap = new Map();

        stocks.forEach(stock => {
          const produit = produits.find(p => p.id === stock.produit_id);
          if (produit) {
            if (stock.quantite <= produit.seuil_alerte) {
              alertesCount++;
            }
            valeurTotale += stock.quantite * produit.prix_unitaire;

            const magasin = magasins.find(m => m.id === stock.magasin_id);
            if (magasin) {
              const key = magasin.nom;
              if (stockDataMap.has(key)) {
                stockDataMap.set(key, stockDataMap.get(key) + stock.quantite);
              } else {
                stockDataMap.set(key, stock.quantite);
              }
            }
          }
        });

        const stockChartData = Array.from(stockDataMap.entries()).map(([nom, quantite]) => ({
          magasin: nom,
          quantite
        }));

        setStats({
          totalProduits: produits.length,
          totalMagasins: magasins.length,
          totalUtilisateurs: utilisateurs.length,
          alertesStock: alertesCount,
          valeurTotaleStock: valeurTotale
        });

        setStockData(stockChartData);
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Administrateur</h1>
        <div className="text-sm text-gray-500">
          Dernière mise à jour: {new Date().toLocaleString('fr-FR')}
        </div>
      </div>

      {/* Cartes de statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Produits</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalProduits}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Store className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Magasins</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalMagasins}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Utilisateurs</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalUtilisateurs}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Alertes Stock</p>
              <p className="text-2xl font-bold text-gray-900">{stats.alertesStock}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Valeur Stock</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.valeurTotaleStock.toLocaleString('fr-FR', {
                  style: 'currency',
                  currency: 'EUR'
                })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Stock par Magasin</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stockData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="magasin" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="quantite" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Répartition des Stocks</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={stockData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ magasin, percent }) => `${magasin} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="quantite"
              >
                {stockData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Alertes */}
      {stats.alertesStock > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center">
            <AlertTriangle className="h-6 w-6 text-red-600 mr-3" />
            <div>
              <h3 className="text-lg font-medium text-red-800">
                Attention: {stats.alertesStock} produit(s) en rupture de stock
              </h3>
              <p className="text-red-600 mt-1">
                Certains produits ont atteint leur seuil d'alerte. Vérifiez la section Produits pour plus de détails.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};