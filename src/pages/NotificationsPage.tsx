import React from 'react';
import { useNotifications } from '../context/NotificationContext';
import { Bell, CheckCheck, Sparkles, ShieldCheck, Info, ArrowRight } from 'lucide-react';

interface NotificationsPageProps {
  onNavigate: (page: string, params?: any) => void;
}

export const NotificationsPage: React.FC<NotificationsPageProps> = ({ onNavigate }) => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, refreshNotifications } = useNotifications();

  const handleNotificationClick = async (notif: any) => {
    if (!notif.read) {
      await markAsRead(notif.id);
    }
    if (notif.link) {
      if (notif.link.includes('itemId=')) {
        const match = notif.link.match(/itemId=([^&]+)/);
        const itemId = match ? match[1] : undefined;
        onNavigate('matches', { itemId });
      } else if (notif.link.startsWith('/matches')) {
        onNavigate('matches');
      } else if (notif.link.startsWith('/my-claims') || notif.link.startsWith('/claims/my')) {
        onNavigate('my-claims');
      } else if (notif.link.startsWith('/my-reports') || notif.link.startsWith('/reports/my')) {
        onNavigate('my-reports');
      } else if (notif.link.startsWith('/admin-claims')) {
        onNavigate('admin-claims');
      } else if (notif.link.startsWith('/item/')) {
        const id = notif.link.replace('/item/', '');
        onNavigate('item-details', { id });
      } else if (notif.link.startsWith('/item-details/')) {
        const id = notif.link.replace('/item-details/', '');
        onNavigate('item-details', { id });
      } else {
        onNavigate('student-dashboard');
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-900">Notifications & Alerts</h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1">
            Stay updated with match discoveries, claim verification results, and item return updates.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={() => markAllAsRead()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-xl text-xs font-semibold transition-colors"
          >
            <CheckCheck className="w-4 h-4 text-zinc-600" />
            <span>Mark All as Read</span>
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-zinc-200">
          <Bell className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
          <h3 className="font-bold text-zinc-900 text-base mb-1">No Notifications Yet</h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            When you submit reports or when matches and claim updates occur, they will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map(notif => (
            <div
              key={notif.id}
              onClick={() => handleNotificationClick(notif)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-4 ${
                notif.read
                  ? 'bg-white border-zinc-200 hover:border-zinc-300'
                  : 'bg-indigo-50/50 border-indigo-200 shadow-xs hover:border-indigo-300'
              }`}
            >
              <div
                className={`p-2.5 rounded-xl shrink-0 ${
                  notif.type === 'potential_match'
                    ? 'bg-indigo-100 text-indigo-700'
                    : notif.type === 'claim_update'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-zinc-100 text-zinc-700'
                }`}
              >
                {notif.type === 'potential_match' && <Sparkles className="w-5 h-5" />}
                {notif.type === 'claim_update' && <ShieldCheck className="w-5 h-5" />}
                {notif.type !== 'potential_match' && notif.type !== 'claim_update' && (
                  <Info className="w-5 h-5" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-bold text-sm text-zinc-900 truncate">{notif.title}</h4>
                  <span className="text-[10px] text-zinc-400 shrink-0">
                    {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs text-zinc-600 mt-0.5 leading-relaxed">{notif.message}</p>
                {notif.link && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 mt-2 hover:underline">
                    <span>View Related Details</span>
                    <ArrowRight className="w-3 h-3" />
                  </span>
                )}
              </div>

              {!notif.read && (
                <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0 mt-2" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
