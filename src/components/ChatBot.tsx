import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

export const ChatBot: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      content: `Bonjour ${user?.email} ! Je suis votre assistant IA pour StockPro. Je peux vous aider avec des questions sur les stocks, produits, magasins, et bien plus encore. Comment puis-je vous aider aujourd'hui ?`,
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const generateBotResponse = (userMessage: string): string => {
    const message = userMessage.toLowerCase();

    // Réponses sur les stocks
    if (message.includes('stock') || message.includes('quantité')) {
      if (message.includes('combien') || message.includes('quantité')) {
        return "Pour consulter les quantités en stock, rendez-vous dans la section 'Stocks' du menu. Vous y trouverez le détail par produit et par magasin. Vous pouvez également utiliser la barre de recherche pour trouver un produit spécifique.";
      }
      if (message.includes('alerte') || message.includes('bas')) {
        return "Les alertes de stock bas sont configurées dans la section 'Produits'. Chaque produit a un seuil d'alerte personnalisable. Quand le stock descend en dessous de ce seuil, vous recevrez une notification.";
      }
      return "Je peux vous aider avec la gestion des stocks ! Vous pouvez consulter les quantités, configurer des alertes, ou effectuer des mouvements de stock. Que souhaitez-vous savoir exactement ?";
    }

    // Réponses sur les produits
    if (message.includes('produit') || message.includes('article')) {
      if (message.includes('ajouter') || message.includes('créer')) {
        return "Pour ajouter un nouveau produit, allez dans 'Produits' > 'Nouveau Produit'. Remplissez les informations : nom, référence, catégorie, prix unitaire, et seuil d'alerte. Vous pouvez aussi ajouter une image via Cloudinary.";
      }
      if (message.includes('modifier') || message.includes('éditer')) {
        return "Pour modifier un produit, cliquez sur l'icône d'édition dans la liste des produits. Vous pouvez changer toutes les informations sauf la référence une fois créée.";
      }
      return "La gestion des produits se fait dans la section 'Produits'. Vous pouvez ajouter, modifier, supprimer des produits et gérer leurs informations comme les prix et seuils d'alerte.";
    }

    // Réponses sur les magasins
    if (message.includes('magasin') || message.includes('boutique') || message.includes('point de vente')) {
      if (message.includes('localisation') || message.includes('adresse') || message.includes('gps')) {
        return "Chaque magasin a des coordonnées GPS précises pour le pointage des employés. Vous pouvez les définir lors de la création du magasin en utilisant la carte interactive ou en saisissant les coordonnées manuellement.";
      }
      return "Dans la section 'Magasins', vous pouvez gérer tous vos points de vente : ajouter de nouveaux magasins, définir leurs adresses et coordonnées GPS, et ajouter des photos.";
    }

    // Réponses sur le pointage
    if (message.includes('pointage') || message.includes('présence') || message.includes('horaire')) {
      if (message.includes('comment')) {
        return "Le pointage se fait via géolocalisation. L'employé doit être dans un rayon de 100m du magasin. Il peut pointer : arrivée, début/fin de pause, et départ. Chaque action ne peut être faite qu'une fois par jour.";
      }
      if (message.includes('historique')) {
        return "L'historique des pointages est disponible dans 'Présences' pour les admins, et dans 'Pointage' pour les employés. Vous y trouvez toutes les heures d'arrivée, départ, et pauses avec les durées calculées.";
      }
      return "Le système de pointage utilise la géolocalisation pour s'assurer que les employés sont bien sur site. Chaque employé peut pointer son arrivée, ses pauses et son départ.";
    }

    // Réponses sur les utilisateurs
    if (message.includes('utilisateur') || message.includes('employé') || message.includes('admin')) {
      if (message.includes('créer') || message.includes('ajouter')) {
        return "Pour créer un utilisateur, allez dans 'Utilisateurs' > 'Nouvel Utilisateur'. Choisissez le rôle (Admin ou Employé) et assignez un magasin si c'est un employé. L'admin reste connecté après la création.";
      }
      if (message.includes('rôle') || message.includes('permission')) {
        return "Il y a 2 rôles : Admin (accès complet) et Employé (pointage et gestion du stock de son magasin uniquement). Les permissions sont automatiquement appliquées selon le rôle.";
      }
      return "La gestion des utilisateurs permet de créer des comptes Admin ou Employé, d'assigner des magasins aux employés, et de gérer les permissions d'accès.";
    }

    // Réponses sur les fournisseurs
    if (message.includes('fournisseur') || message.includes('supplier')) {
      return "Dans la section 'Fournisseurs', vous pouvez gérer vos partenaires commerciaux : ajouter leurs informations de contact, adresses, et photos. Ces informations sont utiles pour la gestion des commandes.";
    }

    // Réponses sur les mouvements
    if (message.includes('mouvement') || message.includes('entrée') || message.includes('sortie')) {
      return "Les mouvements de stock (entrées/sorties) sont enregistrés avec le motif (livraison, vente, casse, etc.). Les employés peuvent saisir des mouvements pour leur magasin, et les admins reçoivent des notifications.";
    }

    // Réponses sur les notifications
    if (message.includes('notification') || message.includes('alerte')) {
      return "Vous recevez des notifications pour : nouveaux mouvements de stock, stock bas, nouveaux messages. Les notifications apparaissent en temps réel dans l'icône cloche en haut à droite.";
    }

    // Réponses sur les images
    if (message.includes('image') || message.includes('photo') || message.includes('cloudinary')) {
      return "Les images sont stockées sur Cloudinary (gratuit). Vous pouvez ajouter des photos pour les produits, magasins et fournisseurs. L'upload se fait automatiquement lors de la sauvegarde.";
    }

    // Réponses générales
    if (message.includes('aide') || message.includes('help')) {
      return "Je peux vous aider avec : la gestion des stocks, produits, magasins, utilisateurs, pointage, fournisseurs, et toutes les fonctionnalités de StockPro. Posez-moi une question spécifique !";
    }

    if (message.includes('bonjour') || message.includes('salut') || message.includes('hello')) {
      return `Bonjour ${user?.email} ! Comment puis-je vous aider avec StockPro aujourd'hui ?`;
    }

    if (message.includes('merci') || message.includes('thanks')) {
      return "De rien ! N'hésitez pas si vous avez d'autres questions sur StockPro.";
    }

    // Réponse par défaut
    return "Je ne suis pas sûr de comprendre votre question. Pouvez-vous me demander quelque chose de plus spécifique sur StockPro ? Par exemple : 'Comment ajouter un produit ?' ou 'Comment fonctionne le pointage ?'";
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: newMessage.trim(),
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setNewMessage('');
    setIsTyping(true);

    // Simuler un délai de réponse
    setTimeout(() => {
      const botResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: generateBotResponse(userMessage.content),
        sender: 'bot',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000); // 1-2 secondes
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex items-start space-x-2 max-w-xs ${
              message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''
            }`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                message.sender === 'user' ? 'bg-blue-600' : 'bg-gray-600'
              }`}>
                {message.sender === 'user' ? (
                  <User className="h-4 w-4 text-white" />
                ) : (
                  <Bot className="h-4 w-4 text-white" />
                )}
              </div>
              <div
                className={`px-3 py-2 rounded-lg ${
                  message.sender === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-900'
                }`}
              >
                <p className="text-sm">{message.content}</p>
                <p className={`text-xs mt-1 ${
                  message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  {message.timestamp.toLocaleTimeString('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="flex items-start space-x-2">
              <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div className="bg-gray-200 text-gray-900 px-3 py-2 rounded-lg">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Posez votre question sur StockPro..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isTyping}
          />
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim() || isTyping}
            className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};