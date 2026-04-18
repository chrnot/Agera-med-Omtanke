import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  X, 
  Check, 
  Clock, 
  AlertCircle,
  FileText,
  UserCheck,
  CheckCircle2,
  Trash2
} from 'lucide-react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  orderBy, 
  doc, 
  updateDoc, 
  writeBatch,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { Notification } from '../services/caseService';

interface NotificationInboxProps {
  userId: string;
  onOpenCase: (caseId: string) => void;
  onClose: () => void;
}

export const NotificationInbox = ({ userId, onOpenCase, onClose }: NotificationInboxProps) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const q = query(
      collection(db, 'notifications'),
      where('recipientUid', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(d => ({ 
        id: d.id, 
        ...d.data() 
      } as Notification));
      setNotifications(fetched);
      setLoading(false);
    });

    return unsubscribe;
  }, [userId]);

  const markAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { read: true });
    } catch (e) {
      console.error(e);
    }
  };

  const markAllAsRead = async () => {
    const unread = notifications.filter(n => !n.read);
    const batch = writeBatch(db);
    unread.forEach(n => {
      if (n.id) batch.update(doc(db, 'notifications', n.id), { read: true });
    });
    await batch.commit();
  };

  const deleteNotification = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'notifications', id));
    } catch (e) {
      console.error(e);
    }
  };

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'ACTION_REQUIRED': return <AlertCircle className="text-red-500" size={18} />;
      case 'INFO': return <FileText className="text-blue-500" size={18} />;
      case 'REMINDER': return <Clock className="text-amber-500" size={18} />;
      default: return <Bell className="text-slate-400" size={18} />;
    }
  };

  const getTimeMessage = (createdAt: any) => {
    if (!createdAt) return 'Just nu';
    const date = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return 'Just nu';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} min sedan`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} tim sedan`;
    return date.toLocaleDateString('sv-SE', { month: 'short', day: 'numeric' });
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Bell size={20} className="text-visuera-dark" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[8px] font-black rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </div>
          <h2 className="font-black text-visuera-dark uppercase tracking-widest text-sm">Notifieringar</h2>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button 
              onClick={markAllAsRead}
              className="text-[10px] font-bold text-visuera-green hover:underline uppercase tracking-widest"
            >
              Markera alla som lästa
            </button>
          )}
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-xl transition-all">
            <X size={18} className="text-slate-400" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-2 border-visuera-green/20 border-t-visuera-green rounded-full animate-spin mx-auto"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center space-y-4">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-200">
              <Bell size={32} />
            </div>
            <p className="text-slate-400 text-sm italic">Här var det tomt! Du har inga notifieringar just nu.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {notifications.map((n) => (
              <div 
                key={n.id} 
                className={`p-6 transition-all hover:bg-slate-50 cursor-pointer group relative ${!n.read ? 'bg-visuera-green/5' : ''}`}
                onClick={() => {
                  if (n.caseId) onOpenCase(n.caseId);
                  if (n.id) markAsRead(n.id);
                  onClose();
                }}
              >
                <div className="flex gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${!n.read ? 'bg-white' : 'bg-slate-50'}`}>
                    {getIcon(n.type)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between items-start">
                      <h4 className={`text-sm tracking-tight ${!n.read ? 'font-black text-visuera-dark' : 'font-bold text-slate-600'}`}>
                        {n.title}
                      </h4>
                      <span className="text-[9px] font-bold text-slate-400 uppercase flex items-center gap-1">
                        <Clock size={10} /> {getTimeMessage(n.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed pr-6">{n.message}</p>
                    {n.school && (
                      <span className="text-[9px] font-black text-visuera-green uppercase bg-visuera-green/10 px-2 py-0.5 rounded tracking-widest inline-block mt-2">
                        {n.school}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                   <button 
                    onClick={(e) => { e.stopPropagation(); if(n.id) deleteNotification(n.id); }}
                    className="p-1.5 hover:bg-red-50 text-slate-300 hover:text-red-500 rounded-lg"
                    title="Ta bort"
                   >
                     <Trash2 size={12} />
                   </button>
                   {!n.read && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); if(n.id) markAsRead(n.id); }}
                        className="p-1.5 hover:bg-visuera-green/10 text-slate-300 hover:text-visuera-green rounded-lg"
                        title="Markera som läst"
                      >
                        <Check size={12} />
                      </button>
                   )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
