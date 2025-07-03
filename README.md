# StockPro - Application de Gestion de Stock Multi-Magasin

## 📋 Description

StockPro est une application web moderne de gestion de stock multi-magasin conçue pour un usage professionnel. Elle offre une interface sécurisée avec des rôles différenciés et fonctionne entièrement avec React (frontend) et Firebase (backend).

## ✨ Fonctionnalités

### 🔐 Authentification & Sécurité
- Firebase Authentication (email + mot de passe)
- Application 100% privée (accès authentifié uniquement)
- Gestion de rôles : **admin** et **employé**
- Protection des routes selon les rôles
- Redirections automatiques selon le statut de connexion

### 👨‍💼 Gestion des Présences
- Pointage avec vérification de géolocalisation (rayon de 100m)
- Prévention du pointage frauduleux
- Historique des présences pour les administrateurs

### 📦 Gestion des Données
- **Produits** : CRUD complet avec images
- **Magasins** : Gestion avec coordonnées GPS
- **Fournisseurs** : CRUD complet
- **Stock** : Gestion par magasin avec alertes de seuil
- **Commandes** : Suivi des commandes fournisseurs

### 📊 Dashboard & Statistiques
- Tableau de bord administrateur avec graphiques (Recharts)
- Statistiques de stock et valeur
- Alertes visuelles pour les ruptures de stock
- Dashboard employé simplifié

## 🛠️ Technologies Utilisées

- **Frontend** : React 18 + TypeScript
- **Styling** : Tailwind CSS
- **Backend** : Firebase (Firestore, Auth, Storage)
- **Graphiques** : Recharts
- **Icons** : Lucide React
- **Routing** : React Router DOM

## 🔧 Configuration Firebase

### 1. Créer un projet Firebase
1. Allez sur [Firebase Console](https://console.firebase.google.com/)
2. Créez un nouveau projet
3. Activez les services suivants :
   - **Authentication** (Email/Password)
   - **Firestore Database**
   - **Storage**

### 2. Configuration de l'application
1. Copiez les clés de configuration Firebase
2. Remplacez les valeurs dans `src/config/firebase.ts`

```typescript
const firebaseConfig = {
  apiKey: "votre-api-key",
  authDomain: "votre-projet.firebaseapp.com",
  projectId: "votre-projet-id",
  storageBucket: "votre-projet.appspot.com",
  messagingSenderId: "123456789",
  appId: "votre-app-id"
};
```

### 3. Structure Firestore

L'application utilise les collections suivantes :

```
📁 collections/
├── users (id, email, role, magasin_id, createdAt)
├── magasins (id, nom, adresse, latitude, longitude, createdAt)
├── produits (id, nom, reference, categorie, prix_unitaire, seuil_alerte, image_url, createdAt)
├── fournisseurs (id, nom, adresse, contact, createdAt)
├── stocks (id, produit_id, magasin_id, quantite, updatedAt)
├── mouvements (id, produit_id, magasin_id, user_id, type, quantite, date, motif)
├── commandes (id, fournisseur_id, date, statut, total)
├── commandes_details (id, commande_id, produit_id, quantite, prix_unitaire)
└── presences (id, user_id, magasin_id, date_pointage, latitude, longitude, type)
```

### 4. Règles de sécurité Firestore

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Règles pour les utilisateurs authentifiés uniquement
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## 🚀 Installation et Démarrage

### Prérequis
- Node.js 18+
- npm ou yarn

### Étapes d'installation

1. **Cloner le projet**
```bash
git clone <votre-repo>
cd stock-management-app
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Configurer Firebase**
   - Suivez les étapes de configuration Firebase ci-dessus

4. **Lancer l'application**
```bash
npm run dev
```

L'application sera accessible sur `http://localhost:5173`

## 👥 Gestion des Utilisateurs

### Créer le premier administrateur

1. Créez un compte utilisateur via l'interface de connexion
2. Dans la console Firebase Firestore :
   - Allez dans la collection `users`
   - Trouvez votre utilisateur
   - Modifiez le champ `role` en `admin`

### Rôles et Permissions

#### Administrateur (`admin`)
- Accès complet à toutes les fonctionnalités
- Gestion des produits, magasins, fournisseurs
- Consultation des présences
- Dashboard statistique complet

#### Employé (`employe`)
- Pointage avec géolocalisation
- Consultation du stock de son magasin
- Saisie des mouvements de stock
- Dashboard simplifié

## 📱 Utilisation

### Pour les Administrateurs
1. Connectez-vous avec un compte admin
2. Créez des magasins avec leurs coordonnées GPS
3. Ajoutez des produits avec images
4. Gérez les fournisseurs et commandes
5. Consultez les statistiques sur le dashboard

### Pour les Employés
1. Connectez-vous avec un compte employé
2. Effectuez votre pointage quotidien
3. Consultez le stock de votre magasin
4. Enregistrez les mouvements de stock

## 🔒 Sécurité

- **Authentification obligatoire** : Aucun accès sans connexion
- **Géolocalisation sécurisée** : Pointage uniquement sur site (100m)
- **Rôles stricts** : Permissions selon le profil utilisateur
- **Protection des routes** : Accès contrôlé par composant

## 🚢 Déploiement

### Firebase Hosting

1. **Installer Firebase CLI**
```bash
npm install -g firebase-tools
```

2. **Initialiser Firebase**
```bash
firebase init hosting
```

3. **Build et déployer**
```bash
npm run build
firebase deploy
```

## 📝 Notes Importantes

- **Pas de données d'exemple** : Toutes les données sont saisies manuellement
- **Géolocalisation requise** : Le pointage nécessite l'autorisation GPS
- **Images optimisées** : Compression automatique via Firebase Storage
- **Responsive design** : Compatible mobile et desktop

## 🤝 Support

Pour toute question ou assistance :
1. Vérifiez la configuration Firebase
2. Consultez les logs de la console navigateur
3. Vérifiez les règles de sécurité Firestore

---

**StockPro** - Solution professionnelle de gestion de stock multi-magasin