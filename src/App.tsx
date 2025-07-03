import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './hooks/useAuth';
import { LoginPage } from './components/LoginPage';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { ProduitsPage } from './components/admin/ProduitsPage';
import { StockManagementPage } from './components/admin/StockManagementPage';
import { MagasinsPage } from './components/admin/MagasinsPage';
import { FournisseursPage } from './components/admin/FournisseursPage';
import { UtilisateursPage } from './components/admin/UtilisateursPage';
import { PresencesPage } from './components/admin/PresencesPage';
import { ParametresPage } from './components/admin/ParametresPage';
import { EmployeDashboard } from './components/employe/EmployeDashboard';
import { StockPage } from './components/employe/StockPage';
import { PointagePage } from './components/employe/PointagePage';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Layout>
                  <Routes>
                    <Route path="dashboard" element={<AdminDashboard />} />
                    <Route path="produits" element={<ProduitsPage />} />
                    <Route path="stocks" element={<StockManagementPage />} />
                    <Route path="magasins" element={<MagasinsPage />} />
                    <Route path="fournisseurs" element={<FournisseursPage />} />
                    <Route path="utilisateurs" element={<UtilisateursPage />} />
                    <Route path="presences" element={<PresencesPage />} />
                    <Route path="parametres" element={<ParametresPage />} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/employe/*"
            element={
              <ProtectedRoute allowedRoles={['employe']}>
                <Layout>
                  <Routes>
                    <Route path="dashboard" element={<EmployeDashboard />} />
                    <Route path="stock" element={<StockPage />} />
                    <Route path="pointage" element={<PointagePage />} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/"
            element={
              user ? (
                user.role === 'admin' ? (
                  <Navigate to="/admin/dashboard" replace />
                ) : (
                  <Navigate to="/employe/dashboard" replace />
                )
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
        </Routes>
      </Router>
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10B981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#EF4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </>
  );
}

export default App;