import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { Plus, Edit, Trash2, Search, Package, AlertTriangle, Upload, X, Save } from 'lucide-react';
import { db, storage } from '../../config/firebase';
import { Produit, Fournisseur } from '../../types';
import toast from 'react-hot-toast';

export const ProduitsPage: React.FC = () => {
  const [produits, setProduits] = useState<Produit[]>([]);
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduit, setEditingProduit] = useState<Produit | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [formData, setFormData] = useState({
    nom: '',
    reference: '',
    categorie: '',
    prix_unitaire: 0,
    seuil_alerte: 0,
    fournisseur_id: ''
  });

  useEffect(() => {
    fetchProduits();
    fetchFournisseurs();
  }, []);

  const fetchProduits = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'produits'));
      const produitsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      })) as Produit[];
      setProduits(produitsData);
    } catch (error) {
      toast.error('Erreur lors du chargement des produits');
    } finally {
      setLoading(false);
    }
  };

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
      console.error('Erreur lors du chargement des fournisseurs:', error);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    const storageRef = ref(storage, `produits/${Date.now()}_${file.name}`);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let imageUrl = editingProduit?.image_url || '';

      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }

      const produitData = {
        ...formData,
        image_url: imageUrl,
        createdAt: editingProduit ? editingProduit.createdAt : new Date()
      };

      if (editingProduit) {
        await updateDoc(doc(db, 'produits', editingProduit.id), produitData);
        toast.success('Produit modifié avec succès');
      } else {
        await addDoc(collection(db, 'produits'), produitData);
        toast.success('Produit ajouté avec succès');
      }

      resetForm();
      fetchProduits();
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (produit: Produit) => {
    setEditingProduit(produit);
    setFormData({
      nom: produit.nom,
      reference: produit.reference,
      categorie: produit.categorie,
      prix_unitaire: produit.prix_unitaire,
      seuil_alerte: produit.seuil_alerte,
      fournisseur_id: produit.fournisseur_id || ''
    });
    setImagePreview(produit.image_url || '');
    setShowModal(true);
  };

  const handleDelete = async (produit: Produit) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) return;

    try {
      await deleteDoc(doc(db, 'produits', produit.id));
      if (produit.image_url) {
        const imageRef = ref(storage, produit.image_url);
        await deleteObject(imageRef);
      }
      toast.success('Produit supprimé avec succès');
      fetchProduits();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const resetForm = () => {
    setFormData({
      nom: '',
      reference: '',
      categorie: '',
      prix_unitaire: 0,
      seuil_alerte: 0,
      fournisseur_id: ''
    });
    setEditingProduit(null);
    setImageFile(null);
    setImagePreview('');
    setShowModal(false);
  };

  const filteredProduits = produits.filter(produit =>
    produit.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    produit.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
    produit.categorie.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && produits.length === 0) {
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
          <h1 className="text-3xl font-bold text-gray-900">Gestion des Produits</h1>
          <p className="text-gray-600 mt-1">Gérez votre catalogue de produits</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>Nouveau Produit</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Rechercher par nom, référence ou catégorie..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProduits.map((produit) => {
          const fournisseur = fournisseurs.find(f => f.id === produit.fournisseur_id);
          return (
            <div key={produit.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
              {/* Image */}
              <div className="h-48 bg-gray-100 relative">
                {produit.image_url ? (
                  <img
                    src={produit.image_url}
                    alt={produit.nom}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="h-16 w-16 text-gray-400" />
                  </div>
                )}
                <div className="absolute top-2 right-2 flex space-x-1">
                  <button
                    onClick={() => handleEdit(produit)}
                    className="p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors duration-200"
                  >
                    <Edit className="h-4 w-4 text-gray-600" />
                  </button>
                  <button
                    onClick={() => handleDelete(produit)}
                    className="p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors duration-200"
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 text-lg">{produit.nom}</h3>
                  {produit.seuil_alerte > 0 && (
                    <AlertTriangle className="h-5 w-5 text-orange-500" />
                  )}
                </div>
                
                <p className="text-sm text-gray-600 mb-2">Réf: {produit.reference}</p>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Catégorie:</span>
                    <span className="text-sm font-medium text-gray-900">{produit.categorie}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Prix:</span>
                    <span className="text-lg font-bold text-blue-600">
                      {produit.prix_unitaire.toLocaleString('fr-FR', {
                        style: 'currency',
                        currency: 'EUR'
                      })}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Seuil d'alerte:</span>
                    <span className="text-sm font-medium text-gray-900">{produit.seuil_alerte}</span>
                  </div>
                  
                  {fournisseur && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Fournisseur:</span>
                      <span className="text-sm font-medium text-gray-900">{fournisseur.nom}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredProduits.length === 0 && (
        <div className="text-center py-12">
          <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun produit trouvé</h3>
          <p className="text-gray-600">
            {searchTerm ? 'Aucun produit ne correspond à votre recherche.' : 'Commencez par ajouter votre premier produit.'}
          </p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingProduit ? 'Modifier le Produit' : 'Nouveau Produit'}
                </h2>
                <button
                  onClick={resetForm}
                  className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Image du produit
                  </label>
                  <div className="flex items-center space-x-4">
                    {imagePreview && (
                      <img
                        src={imagePreview}
                        alt="Aperçu"
                        className="w-20 h-20 object-cover rounded-lg border border-gray-300"
                      />
                    )}
                    <label className="cursor-pointer bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-4 hover:bg-gray-100 transition-colors duration-200">
                      <div className="flex flex-col items-center">
                        <Upload className="h-8 w-8 text-gray-400 mb-2" />
                        <span className="text-sm text-gray-600">Choisir une image</span>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nom du produit *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.nom}
                      onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Référence *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.reference}
                      onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Catégorie *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.categorie}
                      onChange={(e) => setFormData({ ...formData, categorie: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Prix unitaire (€) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={formData.prix_unitaire}
                      onChange={(e) => setFormData({ ...formData, prix_unitaire: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Seuil d'alerte
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.seuil_alerte}
                      onChange={(e) => setFormData({ ...formData, seuil_alerte: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fournisseur
                    </label>
                    <select
                      value={formData.fournisseur_id}
                      onChange={(e) => setFormData({ ...formData, fournisseur_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Sélectionner un fournisseur</option>
                      {fournisseurs.map((fournisseur) => (
                        <option key={fournisseur.id} value={fournisseur.id}>
                          {fournisseur.nom}
                        </option>
                      ))}
                    </select>
                  </div>
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
                    <span>{editingProduit ? 'Modifier' : 'Ajouter'}</span>
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