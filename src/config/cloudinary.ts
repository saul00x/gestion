export const CLOUDINARY_CONFIG = {
  cloudName: process.env.REACT_APP_CLOUDINARY_CLOUD_NAME || 'your-cloud-name',
  uploadPreset: process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET || 'your-upload-preset'
};

export const uploadToCloudinary = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error('Erreur lors de l\'upload');
    }

    const data = await response.json();
    return data.secure_url;
  } catch (error) {
    console.error('Erreur upload Cloudinary:', error);
    throw error;
  }
};