import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { Plus, Edit, Trash2, Search, Truck, Phone, MapPin, Save, X } from 'lucide-react';
import { db } from '../../config/firebase';
import { Fournisseur } from '../../types';
import { ImageUpload } from '../ImageUpload';
import toast from 'react-hot-toast';

export const FournisseursPage: React.FC = () => {
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingFournisseur, setEditingFournisseur] = useState<Fournisseur | null>(null);
  const [formData, setFormData] = useState({
    nom: '',
    adresse: '',
    contact: '',
    image_url: ''
  });

  useEffect(() => {
    fetchFournisseurs();
  }, []);

  const fetchFournisseurs = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'fournisseurs'));
      const fournisseursData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      })) as Fournisseur[];
      setFournisseurs(fournisseursData);
    } catch (error) {
      toast.error('Erreur lors du chargement des fournisseurs');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const fournisseurData = {
        ...formData,
        createdAt: editingFournisseur ? editingFournisseur.createdAt : new Date()
      };

      if (editingFournisseur) {
        await updateDoc(doc(db, 'fournisseurs', editingFournisseur.id), fournisseurData);
        toast.success('Fournisseur modifié avec succès');
      } else {
        await addDoc(collection(db, 'fournisseurs'), fournisseurData);
        toast.success('Fournisseur ajouté avec succès');
      }

      resetForm();
      fetchFournisseurs();
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (fournisseur: Fournisseur) => {
    setEditingFournisseur(fournisseur);
    setFormData({
      nom: fournisseur.nom,
      adresse: fournisseur.adresse,
      contact: fournisseur.contact,
      image_url: fournisseur.image_url || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (fournisseur: Fournisseur) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce fournisseur ?')) return;

    try {
      await deleteDoc(doc(db, 'fournisseurs', fournisseur.id));
      toast.success('Fournisseur supprimé avec succès');
      fetchFournisseurs();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const resetForm = () => {
    setFormData({
      nom: '',
      adresse: '',
      contact: '',
      image_url: ''
    });
    setEditingFournisseur(null);
    setShowModal(false);
  };

  const filteredFournisseurs = fournisseurs.filter(fournisseur =>
    fournisseur.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    fournisseur.contact.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && fournisseurs.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion des Fournisseurs</h1>
          <p className="text-gray-600 mt-1">Gérez vos partenaires commerciaux</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>Nouveau Fournisseur</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Rechercher par nom ou contact..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Fournisseurs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredFournisseurs.map((fournisseur) => (
          <div key={fournisseur.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
            {/* Image */}
            <div className="h-48 bg-gray-100 relative">
              {fournisseur.image_url ? (
                <img
                  src={fournisseur.image_url}
                  alt={fournisseur.nom}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Truck className="h-16 w-16 text-gray-400" />
                </div>
              )}
              <div className="absolute top-2 right-2 flex space-x-1">
                <button
                  onClick={() => handleEdit(fournisseur)}
                  className="p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors duration-200"
                >
                  <Edit className="h-4 w-4 text-gray-600" />
                </button>
                <button
                  onClick={() => handleDelete(fournisseur)}
                  className="p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors duration-200"
                >
                  <Trash2 className="h-4 w-4 text-red-600" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-4">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Truck className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg">{fournisseur.nom}</h3>
                  <p className="text-sm text-gray-600">Créé le {fournisseur.createdAt.toLocaleDateString('fr-FR')}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-start space-x-2">
                  <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                  <p className="text-sm text-gray-600">{fournisseur.adresse}</p>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <p className="text-sm text-gray-600">{fournisseur.contact}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredFournisseurs.length === 0 && (
        <div className="text-center py-12">
          <Truck className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun fournisseur trouvé</h3>
          <p className="text-gray-600">
            {searchTerm ? 'Aucun fournisseur ne correspond à votre recherche.' : 'Commencez par ajouter votre premier fournisseur.'}
          </p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingFournisseur ? 'Modifier le Fournisseur' : 'Nouveau Fournisseur'}
                </h2>
                <button
                  onClick={resetForm}
                  className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <ImageUpload
                  currentImage={formData.image_url}
                  onImageChange={(imageUrl) => setFormData({ ...formData, image_url: imageUrl })}
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom du fournisseur *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nom}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ex: Fournisseur ABC"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Adresse complète *
                  </label>
                  <textarea
                    required
                    value={formData.adresse}
                    onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Ex: 456 Avenue des Entreprises, 69000 Lyon"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact (téléphone/email) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.contact}
                    onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ex: 01 23 45 67 89 ou contact@fournisseur.com"
                  />
                </div>

                <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors duration-200 flex items-center space-x-2"
                  >
                    <Save className="h-4 w-4" />
                    <span>{editingFournisseur ? 'Modifier' : 'Ajouter'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};