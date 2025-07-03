export interface User {
  id: string;
  email: string;
  role: 'admin' | 'employe';
  magasin_id?: string;
  createdAt: Date;
}

export interface Magasin {
  id: string;
  nom: string;
  adresse: string;
  latitude: number;
  longitude: number;
  createdAt: Date;
}

export interface Produit {
  id: string;
  nom: string;
  reference: string;
  categorie: string;
  prix_unitaire: number;
  seuil_alerte: number;
  image_url?: string;
  fournisseur_id?: string;
  createdAt: Date;
}

export interface Fournisseur {
  id: string;
  nom: string;
  adresse: string;
  contact: string;
  createdAt: Date;
}

export interface Stock {
  id: string;
  produit_id: string;
  magasin_id: string;
  quantite: number;
  updatedAt: Date;
}

export interface Mouvement {
  id: string;
  produit_id: string;
  magasin_id: string;
  user_id: string;
  type: 'entrée' | 'sortie';
  quantite: number;
  date: Date;
  motif: string;
}

export interface Commande {
  id: string;
  fournisseur_id: string;
  date: Date;
  statut: 'en_attente' | 'livree' | 'annulee';
  total?: number;
}

export interface CommandeDetail {
  id: string;
  commande_id: string;
  produit_id: string;
  quantite: number;
  prix_unitaire: number;
}

export interface Presence {
  id: string;
  user_id: string;
  magasin_id: string;
  date_pointage: Date;
  latitude: number;
  longitude: number;
  type: 'arrivee' | 'depart';
}