'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, Trash2, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';

export function NotificationBell() {
  const { isAuthenticated, user } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  
  const [notifications, setNotifications] = useState<any[]>([]);
  const { token } = useAuthStore();
  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5030';

  useEffect(() => {
    if (token) fetchNotifications();
  }, [token]);

  const handleToggle = () => {
    if (!isOpen && token) {
      fetchNotifications();
    }
    setIsOpen(!isOpen);
  };


  const fetchNotifications = async () => {
    try {
      const res = await fetch(`${API}/api/v1/notifications`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) setNotifications(json.data);
    } catch (e) {}
  };

  const markAsRead = async (id: number, linkUrl?: string) => {
    try {
      await fetch(`${API}/api/v1/notifications/${id}/read`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch(e) {}
    setIsOpen(false);
    if (linkUrl) router.push(linkUrl);
  };

  const clearNotification = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    try {
      await fetch(`${API}/api/v1/notifications/${id}/clear`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch(e) {}
  };


  const markAllRead = async () => {
    const unread = notifications.filter(n => !n.isRead);
    if (unread.length === 0) return;
    
    // Optimistic UI update
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    
    // Ping API for all
    try {
      await Promise.all(unread.map(n => 
        fetch(`${API}/api/v1/notifications/${n.id}/read`, {
          method: 'PATCH',
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ));
    } catch(e) {}
  };

  const clearAll = async () => {
    try {
      await fetch(`${API}/api/v1/notifications/clear-all`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setNotifications([]);
    } catch(e) {}
  };


    const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="relative" ref={dropdownRef}>
      <div 
        className="relative cursor-pointer p-2 hover:bg-gray-100 rounded-full transition-colors"
        onClick={handleToggle}
      >
        <Bell size={20} className="text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-amber-500 rounded-full border-2 border-white"></span>
        )}
      </div>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
          <div className="p-3 border-b border-gray-100 flex justify-between items-center bg-gray-50">
            <h3 className="text-sm font-bold text-[#0B192C]">Notifications</h3>
            <div className="flex gap-2">
              <button onClick={markAllRead} className="text-[10px] font-bold text-gray-500 hover:text-amber-600 uppercase tracking-widest" title="Mark all read">
                <CheckCircle2 size={14} />
              </button>
              <button onClick={clearAll} className="text-[10px] font-bold text-gray-500 hover:text-red-600 uppercase tracking-widest" title="Clear all">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
          <div className="max-h-[300px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-gray-400">
                <Bell size={24} className="mx-auto mb-2 opacity-20" />
                <p className="text-xs font-semibold">No notifications</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {notifications.map(n => (
                  <div 
                    key={n.id} 
                    onClick={() => markAsRead(n.id, n.linkUrl)}
                    className={`p-3 cursor-pointer hover:bg-gray-50 transition-colors relative group ${!n.isRead ? 'bg-amber-50/30' : ''}`}
                  >
                    {!n.isRead && <span className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-amber-500 rounded-full"></span>}
                    <div className="pl-3 pr-6">
                      <h4 className="text-xs font-bold text-[#0B192C]">{n.title}</h4>
                      <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                      <span className="text-[9px] font-bold text-gray-400 mt-1 block uppercase tracking-wider">
                        {new Date(n.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <button 
                      onClick={(e) => clearNotification(e, n.id)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
