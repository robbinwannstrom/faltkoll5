import React, { useState, useEffect } from 'react';
import { TeacherNotification, UserAccount } from '../types';
import { Bell, X, Send, CheckCircle2, Trash2, Sparkles } from 'lucide-react';
import { safeFetchJson } from '../services/apiHelper';
import { getContextVocabulary, inferAccountContextMode } from '../utils/contextLabels';

interface TeacherNoticesModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount | null;
  onUnreadCountChanged?: (count: number) => void;
}

export const TeacherNoticesModal: React.FC<TeacherNoticesModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUnreadCountChanged,
}) => {
  const [notices, setNotices] = useState<TeacherNotification[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const isTeacherOrAdmin =
    currentUser?.role === 'TEACHER' ||
    currentUser?.role === 'SCHOOL_ADMIN' ||
    currentUser?.role === 'ADMIN';

  const activeMode = currentUser ? inferAccountContextMode(currentUser) : 'WORKPLACE';
  const vocab = getContextVocabulary(activeMode);

  const getLocalReadIds = (): string[] => {
    if (!currentUser) return [];
    try {
      const raw = localStorage.getItem(`falthjalp_read_notices_${currentUser.id}`);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  };

  const saveLocalReadIds = (ids: string[]) => {
    if (!currentUser) return;
    try {
      localStorage.setItem(`falthjalp_read_notices_${currentUser.id}`, JSON.stringify(ids));
    } catch {}
  };

  const loadNotices = async () => {
    try {
      const res = await safeFetchJson<{ notifications: TeacherNotification[] }>('/api/notifications');
      if (res.ok && res.data?.notifications) {
        const list = (res.data.notifications || []).filter((n) => n.id !== 'notif_1');
        const localRead = getLocalReadIds();
        const merged = list.map((n) => {
          const readList = n.readBy || [];
          if (currentUser && localRead.includes(n.id) && !readList.includes(currentUser.id)) {
            return { ...n, readBy: [...readList, currentUser.id] };
          }
          return { ...n, readBy: readList };
        });
        setNotices(merged);
        if (onUnreadCountChanged && currentUser) {
          const unread = merged.filter((n) => !(n.readBy || []).includes(currentUser.id)).length;
          onUnreadCountChanged(unread);
        }
      } else {
        setNotices([]);
        if (onUnreadCountChanged) onUnreadCountChanged(0);
      }
    } catch {
      setNotices([]);
      if (onUnreadCountChanged) onUnreadCountChanged(0);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadNotices();
    }
  }, [isOpen, currentUser?.id]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleMarkRead = async (id: string) => {
    if (!currentUser) return;
    const localRead = Array.from(new Set([...getLocalReadIds(), id]));
    saveLocalReadIds(localRead);

    try {
      await safeFetchJson(`/api/notifications/${id}/read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id }),
      });
    } catch {}

    setNotices((prev) => {
      const next = prev.map((n) => {
        const readList = n.readBy || [];
        return n.id === id && !readList.includes(currentUser.id)
          ? { ...n, readBy: [...readList, currentUser.id] }
          : n;
      });
      if (onUnreadCountChanged) {
        const unread = next.filter((n) => !(n.readBy || []).includes(currentUser.id)).length;
        onUnreadCountChanged(unread);
      }
      return next;
    });
  };

  const handleMarkAllRead = async () => {
    if (!currentUser) return;
    const allIds = notices.map((n) => n.id);
    const localRead = Array.from(new Set([...getLocalReadIds(), ...allIds]));
    saveLocalReadIds(localRead);

    for (const id of allIds) {
      try {
        await safeFetchJson(`/api/notifications/${id}/read`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: currentUser.id }),
        });
      } catch {}
    }

    setNotices((prev) =>
      prev.map((n) => {
        const readList = n.readBy || [];
        return readList.includes(currentUser.id)
          ? n
          : { ...n, readBy: [...readList, currentUser.id] };
      })
    );
    if (onUnreadCountChanged) onUnreadCountChanged(0);
  };

  const handleSendNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newMessage.trim()) return;
    setIsSending(true);
    try {
      const res = await safeFetchJson<{ notification: TeacherNotification }>('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle.trim(),
          message: newMessage.trim(),
          senderName: currentUser?.displayName || vocab.roleTeacherShort,
        }),
      });
      if (res.ok && res.data?.notification) {
        setNotices((prev) => [res.data!.notification, ...prev]);
        setNewTitle('');
        setNewMessage('');
      }
    } catch {
      // Ignore
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteNotice = async (id: string) => {
    try {
      await safeFetchJson(`/api/notifications/${id}`, { method: 'DELETE' });
      setNotices((prev) => {
        const next = prev.filter((n) => n.id !== id);
        if (onUnreadCountChanged && currentUser) {
          const unread = next.filter((n) => !(n.readBy || []).includes(currentUser.id)).length;
          onUnreadCountChanged(unread);
        }
        return next;
      });
    } catch {
      // Ignore
    }
  };

  const unreadCount = currentUser
    ? notices.filter((n) => !(n.readBy || []).includes(currentUser.id)).length
    : 0;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto font-sans animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#1e1e1e] border-2 border-[#383838] rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl my-auto flex flex-col max-h-[88vh]"
      >
        {/* Header */}
        <div className="p-5 sm:p-6 bg-[#181818] border-b border-[#2e2e2e] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-orange-500/20 text-orange-400 border border-orange-500/40 flex items-center justify-center shrink-0">
              <Bell className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-orange-400 block">
                Meddelandecenter
              </span>
              <h2 className="text-lg sm:text-xl font-black text-white">{vocab.noticesTitle}</h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 text-xs font-bold cursor-pointer transition-colors"
              >
                Markera alla som lästa
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 rounded-xl bg-[#262626] hover:bg-[#333333] text-slate-300 flex items-center justify-center cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Teacher / Admin Create Notice Form */}
          {isTeacherOrAdmin && (
            <form
              onSubmit={handleSendNotice}
              className="p-4 bg-[#141414] border border-orange-500/40 rounded-2xl space-y-3"
            >
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-orange-400">
                <Sparkles className="w-4 h-4" />
                <span>Skicka ny notis till alla ({vocab.roleTeacherShort} / Admin)</span>
              </div>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Rubrik (t.ex. Samling vid förrådet kl. 13:00)"
                className="w-full min-h-[42px] px-3.5 bg-[#1e1e1e] border border-[#383838] rounded-xl text-sm font-bold text-white outline-none focus:border-orange-500"
              />
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                rows={2}
                placeholder="Skriv ditt meddelande eller din instruktion..."
                className="w-full p-3.5 bg-[#1e1e1e] border border-[#383838] rounded-xl text-sm text-white outline-none focus:border-orange-500"
              />
              <button
                type="submit"
                disabled={isSending || !newTitle.trim() || !newMessage.trim()}
                className="w-full min-h-[42px] bg-orange-500 hover:bg-orange-400 disabled:opacity-40 text-black font-black text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Skicka notis nu</span>
              </button>
            </form>
          )}

          {/* Notices List */}
          {notices.length === 0 ? (
            <div className="text-center py-10 space-y-2">
              <Bell className="w-8 h-8 text-slate-500 mx-auto" />
              <p className="text-slate-300 font-bold text-sm">Inga nya notiser just nu</p>
              <p className="text-xs text-slate-500">
                När {vocab.roleTeacherShort.toLowerCase()} eller administratör skickar ett meddelande visas det här.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {notices.map((n) => {
                const isRead = currentUser ? (n.readBy || []).includes(currentUser.id) : true;
                return (
                  <div
                    key={n.id}
                    onClick={() => handleMarkRead(n.id)}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                      isRead
                        ? 'bg-[#161616] border-[#2c2c2c] opacity-80'
                        : 'bg-orange-950/20 border-orange-500/60 shadow-md'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          {!isRead && (
                            <span className="px-2 py-0.5 rounded-full bg-orange-500 text-black font-black text-[10px] uppercase">
                              NY
                            </span>
                          )}
                          <h3 className="font-black text-white text-sm sm:text-base">{n.title}</h3>
                        </div>
                        <span className="text-[11px] text-slate-400 font-semibold block mt-0.5">
                          Från: {n.authorName || vocab.roleTeacherShort} • {n.createdAt}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {isRead && (
                          <span className="text-emerald-400 text-[11px] font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Läst
                          </span>
                        )}
                        {isTeacherOrAdmin && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteNotice(n.id);
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-400 cursor-pointer"
                            title="Radera notis"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-200 mt-2.5 leading-relaxed whitespace-pre-wrap">
                      {n.message}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#141414] border-t border-[#2e2e2e]">
          <button
            type="button"
            onClick={onClose}
            className="w-full min-h-[46px] bg-[#282828] hover:bg-[#333333] text-white font-black text-sm rounded-xl cursor-pointer"
          >
            Stäng fönster
          </button>
        </div>
      </div>
    </div>
  );
};
