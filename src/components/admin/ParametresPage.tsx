import React, { useState } from 'react';
import { Settings, Database, Shield, Bell, Globe, Save } from 'lucide-react';
import toast from 'react-hot-toast';

export const ParametresPage: React.FC = () => {
  const [settings, setSettings] = useState({
    // Paramètres généraux
    nomEntreprise: 'StockPro',
    emailContact: 'admin@stockpro.com',
    adresseEntreprise: '',
    
    // Paramètres de sécurité
    sessionTimeout: 30,
    forcePasswordChange: false,
    enableTwoFactor: false,
    
    // Paramètres de notification
    emailNotifications: true,
    stockAlerts: true,
    lowStockThreshold: 10,
    
    // Paramètres de géolocalisation
    gpsRadius: 100,
    enableGpsTracking: true,
    
    // Paramètres de sauvegarde
    autoBackup: true,
    backupFrequency: 'daily'
  });

  const [activeTab, setActiveTab] = useState('general');

  const handleSave = () => {
    // Ici vous pourriez sauvegarder les paramètres dans Firestore
    toast.success('Paramètres sauvegardés avec succès');
  };

  const tabs = [
    { id: 'general', label: 'Général', icon: Settings },
    { id: 'security', label: 'Sécurité', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'geolocation', label: 'Géolocalisation', icon: Globe },
    { id: 'backup', label: 'Sauvegarde', icon: Database }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Paramètres</h1>
          <p className="text-gray-600 mt-1">Configurez votre application</p>
        </div>
        <button
          onClick={handleSave}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2"
        >
          <Save className="h-5 w-5" />
          <span>Sauvegarder</span>
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <tab.icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </div>
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'general' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Paramètres généraux</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom de l'entreprise
                  </label>
                  <input
                    type="text"
                    value={settings.nomEntreprise}
                    onChange={(e) => setSettings({ ...settings, nomEntreprise: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email de contact
                  </label>
                  <input
                    type="email"
                    value={settings.emailContact}
                    onChange={(e) => setSettings({ ...settings, emailContact: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Adresse de l'entreprise
                </label>
                <textarea
                  value={settings.adresseEntreprise}
                  onChange={(e) => setSettings({ ...settings, adresseEntreprise: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                />
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Paramètres de sécurité</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Délai d'expiration de session (minutes)
                </label>
                <input
                  type="number"
                  value={settings.sessionTimeout}
                  onChange={(e) => setSettings({ ...settings, sessionTimeout: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="5"
                  max="480"
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Forcer le changement de mot de passe</h4>
                    <p className="text-sm text-gray-500">Obliger les utilisateurs à changer leur mot de passe régulièrement</p>
                  </div>
                  <button
                    onClick={() => setSettings({ ...settings, forcePasswordChange: !settings.forcePasswordChange })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.forcePasswordChange ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.forcePasswordChange ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Authentification à deux facteurs</h4>
                    <p className="text-sm text-gray-500">Activer l'authentification à deux facteurs pour plus de sécurité</p>
                  </div>
                  <button
                    onClick={() => setSettings({ ...settings, enableTwoFactor: !settings.enableTwoFactor })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.enableTwoFactor ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.enableTwoFactor ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Paramètres de notification</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Notifications par email</h4>
                    <p className="text-sm text-gray-500">Recevoir des notifications par email</p>
                  </div>
                  <button
                    onClick={() => setSettings({ ...settings, emailNotifications: !settings.emailNotifications })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.emailNotifications ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.emailNotifications ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Alertes de stock</h4>
                    <p className="text-sm text-gray-500">Recevoir des alertes quand le stock est bas</p>
                  </div>
                  <button
                    onClick={() => setSettings({ ...settings, stockAlerts: !settings.stockAlerts })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.stockAlerts ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.stockAlerts ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Seuil d'alerte de stock bas
                </label>
                <input
                  type="number"
                  value={settings.lowStockThreshold}
                  onChange={(e) => setSettings({ ...settings, lowStockThreshold: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="1"
                />
              </div>
            </div>
          )}

          {activeTab === 'geolocation' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Paramètres de géolocalisation</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rayon de pointage autorisé (mètres)
                </label>
                <input
                  type="number"
                  value={settings.gpsRadius}
                  onChange={(e) => setSettings({ ...settings, gpsRadius: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="10"
                  max="1000"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Distance maximale autorisée entre l'employé et le magasin pour le pointage
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Suivi GPS activé</h4>
                  <p className="text-sm text-gray-500">Activer la vérification de position pour le pointage</p>
                </div>
                <button
                  onClick={() => setSettings({ ...settings, enableGpsTracking: !settings.enableGpsTracking })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.enableGpsTracking ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.enableGpsTracking ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          )}

          {activeTab === 'backup' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Paramètres de sauvegarde</h3>
              
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Sauvegarde automatique</h4>
                  <p className="text-sm text-gray-500">Activer la sauvegarde automatique des données</p>
                </div>
                <button
                  onClick={() => setSettings({ ...settings, autoBackup: !settings.autoBackup })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.autoBackup ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.autoBackup ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fréquence de sauvegarde
                </label>
                <select
                  value={settings.backupFrequency}
                  onChange={(e) => setSettings({ ...settings, backupFrequency: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="hourly">Toutes les heures</option>
                  <option value="daily">Quotidienne</option>
                  <option value="weekly">Hebdomadaire</option>
                  <option value="monthly">Mensuelle</option>
                </select>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-yellow-800 mb-2">Information importante</h4>
                <p className="text-sm text-yellow-700">
                  Les sauvegardes sont automatiquement gérées par Firebase. Ces paramètres sont informatifs et peuvent être utilisés pour des sauvegardes supplémentaires.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};