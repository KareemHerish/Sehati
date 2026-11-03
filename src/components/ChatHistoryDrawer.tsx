/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  X,
  Plus,
  Trash2,
  Clock,
  MessageSquare,
  Search
} from 'lucide-react';
import { ChatSession, Language } from '../types';

interface ChatHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: ChatSession[];
  currentSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string, e: React.MouseEvent) => void;
  onClearAllSessions: () => void;
  lang: Language;
}

export const ChatHistoryDrawer: React.FC<ChatHistoryDrawerProps> = ({
  isOpen,
  onClose,
  sessions,
  currentSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  onClearAllSessions,
  lang,
}) => {
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const isAr = lang === 'ar';

  const filteredSessions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return sessions;
    return sessions.filter((s) => {
      const matchTitle = s.title.toLowerCase().includes(q);
      const matchMessage = s.messages?.some((m) => m.text.toLowerCase().includes(q));
      return matchTitle || matchMessage;
    });
  }, [sessions, searchQuery]);

  if (!isOpen) return null;

  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp);
    const today = new Date();
    const isToday =
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear();

    if (isToday) {
      return `${isAr ? 'اليوم' : 'Today'} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    return d.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const confirmDelete = () => {
    if (sessionToDelete) {
      onDeleteSession(sessionToDelete, { stopPropagation: () => {} } as any);
      setSessionToDelete(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className={`fixed inset-y-0 ${
          isAr ? 'right-0' : 'left-0'
        } max-w-xs sm:max-w-sm w-full bg-slate-50 dark:bg-slate-950 border-x border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col justify-between`}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-200/70 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-600" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              {isAr ? 'سجل المحادثات' : 'Chat History'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="p-3 border-b border-slate-200/70 dark:border-slate-800">
          <button
            onClick={() => {
              onNewChat();
              onClose();
            }}
            className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{isAr ? 'محادثة جديدة' : 'New Chat'}</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-3 py-2 border-b border-slate-200/70 dark:border-slate-800 shrink-0">
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute start-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isAr ? 'بحث في المحادثات بالكلمات...' : 'Filter chats by keywords...'}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs py-1.5 ps-8 pe-7 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute end-2 p-0.5 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                title={isAr ? 'مسح البحث' : 'Clear search'}
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {sessions.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-4 text-slate-400 text-xs">
              <MessageSquare className="w-8 h-8 text-slate-300 dark:text-slate-700 mb-2" />
              <p>{isAr ? 'لا يوجد محادثات سابقة بعد' : 'No previous chats yet'}</p>
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-4 text-slate-400 text-xs">
              <Search className="w-7 h-7 text-slate-300 dark:text-slate-700 mb-2" />
              <p>{isAr ? 'لا توجد محادثات تطابق بحثك' : 'No matching chats found'}</p>
              <button
                onClick={() => setSearchQuery('')}
                className="mt-2 text-[11px] text-emerald-600 hover:underline cursor-pointer"
              >
                {isAr ? 'إعادة تعيين البحث' : 'Reset search'}
              </button>
            </div>
          ) : (
            filteredSessions.map((session) => {
              const isActive = session.id === currentSessionId;
              return (
                <div
                  key={session.id}
                  onClick={() => {
                    onSelectSession(session.id);
                    onClose();
                  }}
                  className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-start justify-between gap-2 ${
                    isActive
                      ? 'border-emerald-500/80 bg-emerald-500/10 dark:bg-emerald-950/50 text-emerald-950 dark:text-emerald-100 font-semibold ring-1 ring-emerald-500/20'
                      : 'border-slate-200/70 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-800/40 text-slate-800 dark:text-slate-200 hover:border-emerald-300 dark:hover:border-emerald-700 hover:bg-slate-200/60 dark:hover:bg-slate-800/70'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-bold mb-1">{session.title}</p>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400">
                      <span>{formatDate(session.updatedAt)}</span>
                      <span>•</span>
                      <span>
                        {session.messages.filter((m) => m.sender === 'user').length}{' '}
                        {isAr ? 'سؤال' : 'questions'}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSessionToDelete(session.id);
                    }}
                    className="p-1 text-slate-400 hover:text-red-500 rounded transition-colors shrink-0 cursor-pointer"
                    title={isAr ? 'حذف المحادثة' : 'Delete chat'}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer with Clear All */}
        {sessions.length > 0 && (
          <div className="p-3 border-t border-slate-200/70 dark:border-slate-800">
            <button
              onClick={onClearAllSessions}
              className="w-full py-1.5 px-3 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{isAr ? 'مسح كل المحادثات' : 'Clear All History'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {sessionToDelete && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl max-w-xs w-full p-5 text-center animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 mx-auto flex items-center justify-center mb-3">
              <Trash2 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1.5">
              {isAr ? 'هل تريد حذف المحادثة؟' : 'Delete conversation?'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-5 leading-relaxed">
              {isAr
                ? 'سيتم حذف رسائل هذه المحادثة بشكل نهائي.'
                : 'This conversation will be permanently deleted.'}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSessionToDelete(null)}
                className="flex-1 py-2 px-3 text-xs font-semibold rounded-xl border border-slate-200 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="flex-1 py-2 px-3 text-xs font-bold rounded-xl bg-red-600 hover:bg-red-700 text-white transition-colors cursor-pointer shadow-xs"
              >
                {isAr ? 'حذف' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
