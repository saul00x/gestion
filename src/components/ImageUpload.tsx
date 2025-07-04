import React, { useState } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { uploadToCloudinary } from '../config/cloudinary';
import toast from 'react-hot-toast';

interface ImageUploadProps {
  currentImage?: string;
  onImageChange: (imageUrl: string) => void;
  className?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  currentImage,
  onImageChange,
  className = ''
}) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentImage || null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Vérifier le type de fichier
    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez sélectionner une image');
      return;
    }

    // Vérifier la taille (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('L\'image ne doit pas dépasser 5MB');
      return;
    }

    // Créer un aperçu local immédiatement
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // L'upload se fera seulement lors de la sauvegarde du formulaire
    // Stocker le fichier temporairement
    (window as any).pendingImageFile = file;
  };

  const uploadPendingImage = async (): Promise<string> => {
    const file = (window as any).pendingImageFile;
    if (!file) return currentImage || '';

    setUploading(true);
    try {
      const imageUrl = await uploadToCloudinary(file);
      setPreview(imageUrl);
      delete (window as any).pendingImageFile;
      return imageUrl;
    } catch (error) {
      toast.error('Erreur lors de l\'upload de l\'image');
      setPreview(currentImage || null);
      return currentImage || '';
    } finally {
      setUploading(false);
    }
  };

  // Exposer la fonction d'upload pour le formulaire parent
  React.useEffect(() => {
    (window as any).uploadPendingImage = uploadPendingImage;
  }, []);

  const removeImage = () => {
    setPreview(null);
    onImageChange('');
    delete (window as any).pendingImageFile;
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="block text-sm font-medium text-gray-700">
        Image
      </label>
      
      {preview ? (
        <div className="relative">
          <img
            src={preview}
            alt="Aperçu"
            className="w-full h-32 object-cover rounded-lg border border-gray-300"
          />
          <button
            type="button"
            onClick={removeImage}
            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
          <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600 mb-2">
            Cliquez pour sélectionner une image
          </p>
          <p className="text-xs text-gray-500">
            PNG, JPG, GIF jusqu'à 5MB
          </p>
        </div>
      )}

      <input
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        disabled={uploading}
        className="hidden"
        id="image-upload"
      />
      
      <label
        htmlFor="image-upload"
        className={`inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer transition-colors ${
          uploading ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        {uploading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            Upload en cours...
          </>
        ) : (
          <>
            <Upload className="h-4 w-4 mr-2" />
            Choisir une image
          </>
        )}
      </label>
      
      {(window as any).pendingImageFile && (
        <p className="text-xs text-blue-600">
          Image sélectionnée. Elle sera uploadée lors de la sauvegarde.
        </p>
      )}
    </div>
  );
};