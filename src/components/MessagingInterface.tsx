import React, { useState, useEffect, useRef } from 'react';
import { collection, query, where, orderBy, onSnapshot, addDoc, updateDoc, doc, getDocs, or } from 'firebase/firestore';
import { MessageCircle, Send, X, Users, Bell, Minimize2, Maximize2 } from 'lucide-react';
import { db } from '../config/firebase';
import { useAuth } from '../hooks/useAuth';
import { Message, User } from '../types';
import toast from 'react-hot-toast';

export const MessagingInterface: React.FC = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      fetchUsers();
      setupMessageListener();
    }
  }, [user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchUsers = async () => {
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const usersData = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      })) as User[];

      if (user?.role === 'admin') {
        setUsers(usersData.filter(u => u.role === 'employe'));
      } else {
        setUsers(usersData.filter(u => u.role === 'admin'));
      }
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
    }
  };

  const setupMessageListener = () => {
    if (!user) return;

    const messagesQuery = query(
      collection(db, 'messages'),
      or(
        where('sender_id', '==', user.id),
        where('receiver_id', '==', user.id)
      ),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const messagesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp.toDate()
      })) as Message[];

      setMessages(messagesData);

      const unread = messagesData.filter(msg => 
        msg.receiver_id === user.id && !msg.read
      ).length;
      setUnreadCount(unread);

      // Notification pour nouveaux messages
      const newMessages = messagesData.filter(msg => 
        msg.receiver_id === user.id && 
        !msg.read && 
        msg.timestamp > new Date(Date.now() - 5000) // Messages des 5 dernières secondes
      );

      newMessages.forEach(msg => {
        const sender = users.find(u => u.id === msg.sender_id);
        toast.success(`Nouveau message de ${sender?.email || 'Utilisateur inconnu'}`, {
          icon: '💬',
          duration: 4000
        });
      });
    });

    return unsubscribe;
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedUser || !user) return;

    try {
      await addDoc(collection(db, 'messages'), {
        sender_id: user.id,
        receiver_id: selectedUser.id,
        content: newMessage.trim(),
        timestamp: new Date(),
        read: false
      });

      setNewMessage('');
    } catch (error) {
      toast.error('Erreur lors de l\'envoi du message');
    }
  };

  const markAsRead = async (messageId: string) => {
    try {
      await updateDoc(doc(db, 'messages', messageId), {
        read: true
      });
    } catch (error) {
      console.error('Erreur lors du marquage comme lu:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getConversationMessages = () => {
    if (!selectedUser || !user) return [];
    
    return messages.filter(msg => 
      (msg.sender_id === user.id && msg.receiver_id === selectedUser.id) ||
      (msg.sender_id === selectedUser.id && msg.receiver_id === user.id)
    );
  };

  const handleUserSelect = (selectedUser: User) => {
    setSelectedUser(selectedUser);
    
    const conversationMessages = messages.filter(msg => 
      msg.sender_id === selectedUser.id && msg.receiver_id === user?.id && !msg.read
    );
    
    conversationMessages.forEach(msg => {
      markAsRead(msg.id);
    });
  };

  const getUserUnreadCount = (userId: string) => {
    return messages.filter(msg => 
      msg.sender_id === userId && msg.receiver_id === user?.id && !msg.read
    ).length;
  };

  if (!user) return null;

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors duration-200 z-50"
        >
          <MessageCircle className="h-6 w-6" />
          {unreadCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center animate-pulse">
              {unreadCount}
            </span>
          )}
        </button>
      )}

      {/* Full Screen Messaging Interface */}
      {isOpen && (
        <div className="fixed inset-0 bg-white z-50 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-blue-600 text-white">
            <div className="flex items-center space-x-3">
              <MessageCircle className="h-6 w-6" />
              <h1 className="text-xl font-semibold">Messagerie</h1>
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-sm rounded-full px-2 py-1">
                  {unreadCount} nouveau{unreadCount > 1 ? 'x' : ''}
                </span>
              )}
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:text-gray-200 transition-colors duration-200"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="flex flex-1 overflow-hidden">
            {/* Users List */}
            <div className="w-1/3 border-r border-gray-200 overflow-y-auto bg-gray-50">
              <div className="p-4">
                <div className="flex items-center space-x-2 mb-4 text-sm text-gray-600">
                  <Users className="h-4 w-4" />
                  <span>
                    {user.role === 'admin' ? 'Employés' : 'Administrateurs'}
                  </span>
                </div>
                {users.map((u) => {
                  const userUnreadCount = getUserUnreadCount(u.id);
                  return (
                    <button
                      key={u.id}
                      onClick={() => handleUserSelect(u)}
                      className={`w-full text-left p-4 rounded-lg hover:bg-white transition-colors duration-200 relative mb-2 ${
                        selectedUser?.id === u.id ? 'bg-white border-l-4 border-blue-500 shadow-sm' : ''
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-medium">
                            {u.email.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 truncate">
                            {u.email}
                          </div>
                          <div className="text-sm text-gray-500 capitalize">
                            {u.role}
                          </div>
                        </div>
                        {userUnreadCount > 0 && (
                          <span className="bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center">
                            {userUnreadCount}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col">
              {selectedUser ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b border-gray-200 bg-white">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-medium">
                          {selectedUser.email.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h2 className="font-semibold text-gray-900">{selectedUser.email}</h2>
                        <p className="text-sm text-gray-500 capitalize">{selectedUser.role}</p>
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                    {getConversationMessages().length === 0 ? (
                      <div className="text-center text-gray-500 mt-20">
                        <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
                        <p className="text-lg">Aucun message</p>
                        <p>Commencez la conversation !</p>
                      </div>
                    ) : (
                      getConversationMessages().map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${
                            message.sender_id === user.id ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                              message.sender_id === user.id
                                ? 'bg-blue-600 text-white'
                                : 'bg-white text-gray-900 border border-gray-200'
                            }`}
                          >
                            <p className="text-sm">{message.content}</p>
                            <p className={`text-xs mt-1 ${
                              message.sender_id === user.id ? 'text-blue-100' : 'text-gray-500'
                            }`}>
                              {message.timestamp.toLocaleString('fr-FR', {
                                hour: '2-digit',
                                minute: '2-digit',
                                day: '2-digit',
                                month: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input */}
                  <div className="p-4 border-t border-gray-200 bg-white">
                    <div className="flex space-x-3">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                        placeholder="Tapez votre message..."
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <button
                        onClick={sendMessage}
                        disabled={!newMessage.trim()}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center space-x-2"
                      >
                        <Send className="h-4 w-4" />
                        <span>Envoyer</span>
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-500 bg-gray-50">
                  <div className="text-center">
                    <MessageCircle className="h-16 w-16 mx-auto mb-4" />
                    <p className="text-lg">Sélectionnez un utilisateur</p>
                    <p>pour commencer à discuter</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};