/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ChatView } from './components/ChatView';
import { EmergencyDirectoryView } from './components/EmergencyDirectoryView';
import { PatientGuideView } from './components/PatientGuideView';
import { AppearanceModal } from './components/AppearanceModal';
import { ChatHistoryDrawer } from './components/ChatHistoryDrawer';
import { ChatMessage, ChatSession, FontFamily, Language, PageTheme, TextSize } from './types';
import { motion, AnimatePresence } from 'motion/react';

const SESSIONS_KEY = 'sehati_chat_sessions_v1';
const SIDEBAR_STATE_KEY = 'sehati_sidebar_open_v1';

export default function App() {
  const [activeTab, setActiveTab] = useState<'chat' | 'emergency' | 'guide'>('chat');
  const [lang, setLang] = useState<Language>('ar');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAppearanceModalOpen, setIsAppearanceModalOpen] = useState(false);
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(SIDEBAR_STATE_KEY);
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  const handleSetIsSidebarOpen: React.Dispatch<React.SetStateAction<boolean>> = (action) => {
    setIsSidebarOpen((prev) => {
      const nextVal = typeof action === 'function' ? action(prev) : action;
      try {
        localStorage.setItem(SIDEBAR_STATE_KEY, String(nextVal));
      } catch (e) {
        console.error('Error saving sidebar state:', e);
      }
      return nextVal;
    });
  };

  // Appearance customization
  const [fontFamily, setFontFamily] = useState<FontFamily>('cairo');
  const [textSize, setTextSize] = useState<TextSize>('normal');
  const [pageTheme, setPageTheme] = useState<PageTheme>('light');
  const [simpleMode, setSimpleMode] = useState<boolean>(false);

  const isAr = lang === 'ar';

  const getWelcomeText = () =>
    isAr
      ? 'أهلاً بيك في صحتي! أنا مساعدك الصحي للمعلومات العامة.\n\n⚠️ مش بنحدد جرعات ولا بنشخص. في الطوارئ اتصل بـ 123 فوراً.'
      : 'Welcome to Sehati! I am your health guide for general info.\n\n⚠️ No dosages or clinical diagnosis. In emergencies call 123 now.';

  // Set page tab title to صحتي and link the logo as tab favicon
  useEffect(() => {
    document.title = 'صحتي';
    let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = '/logo.png';
  }, []);

  // Sync lang, dir, and dark theme attributes
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = isAr ? 'rtl' : 'ltr';
    const isDark = pageTheme === 'dark' || pageTheme === 'high-contrast';
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
      document.documentElement.style.colorScheme = 'dark';
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
      document.documentElement.removeAttribute('data-theme');
      document.documentElement.style.colorScheme = 'light';
    }
  }, [lang, isAr, pageTheme]);

  // Load saved sessions from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SESSIONS_KEY);
      if (raw) {
        const parsed: ChatSession[] = JSON.parse(raw);
        const valid = parsed.filter((s) => Array.isArray(s.messages) && s.messages.length > 0);
        if (valid.length > 0) {
          setSessions(valid);
          const latest = valid[0];
          setCurrentSessionId(latest.id);
          setMessages(latest.messages);
          return;
        }
      }
    } catch (e) {
      console.error('Error loading chat history:', e);
    }

    // Default clean initial session
    const newSessionId = `session_${Date.now()}`;
    setCurrentSessionId(newSessionId);
    setMessages([]);
  }, []);

  // Save sessions to localStorage whenever sessions change
  const persistSessions = (updatedSessions: ChatSession[]) => {
    setSessions(updatedSessions);
    try {
      localStorage.setItem(SESSIONS_KEY, JSON.stringify(updatedSessions));
    } catch (e) {
      console.error('Error saving chat history:', e);
    }
  };

  const handleNewChat = () => {
    const newSessionId = `session_${Date.now()}`;
    setCurrentSessionId(newSessionId);
    setMessages([]);
    setActiveTab('chat');
  };

  const handleSelectSession = (id: string) => {
    const found = sessions.find((s) => s.id === id);
    if (found) {
      setCurrentSessionId(found.id);
      setMessages(found.messages);
      setActiveTab('chat');
    }
  };

  const handleDeleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = sessions.filter((s) => s.id !== id);
    persistSessions(updated);

    if (currentSessionId === id) {
      if (updated.length > 0) {
        handleSelectSession(updated[0].id);
      } else {
        handleNewChat();
      }
    }
  };

  const handleClearAllSessions = () => {
    try {
      localStorage.removeItem(SESSIONS_KEY);
    } catch {}
    setSessions([]);
    const newSessionId = `session_${Date.now()}`;
    setCurrentSessionId(newSessionId);
    setMessages([]);
    setActiveTab('chat');
  };

  const toggleLang = () => {
    setLang((prev) => (prev === 'ar' ? 'en' : 'ar'));
  };

  const toggleTheme = () => {
    setPageTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text: text.trim(),
      timestamp: Date.now(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      // Multi-turn conversation history for context preservation
      const chatHistory = messages.slice(-25).map((m) => ({
        role: m.sender === 'user' ? 'user' : 'model',
        text: m.text,
      }));

      const response = await fetch('/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text.trim(),
          history: chatHistory,
          simpleMode,
          lang,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      const assistantMessage: ChatMessage = {
        id: `assistant_${Date.now()}`,
        sender: 'assistant',
        text: data.reply || (isAr ? 'حصل خطأ بسيط.' : 'An error occurred.'),
        timestamp: Date.now(),
        status: data.status || 'answered',
        seconds: data.seconds,
        model: isAr ? 'صحتي' : 'Sehati',
        triggerType: data.triggerType,
        matchedPattern: data.matchedPattern,
      };

      const finalMessages = [...updatedMessages, assistantMessage];
      setMessages(finalMessages);

      // Update session in history
      const titleCandidate =
        text.trim().length > 28 ? `${text.trim().slice(0, 28)}...` : text.trim();

      const updatedSessions = sessions.map((s) => {
        if (s.id === currentSessionId) {
          const isFirstUserMsg = s.messages.filter((m) => m.sender === 'user').length === 0;
          return {
            ...s,
            title: isFirstUserMsg ? titleCandidate : s.title,
            messages: finalMessages,
            updatedAt: Date.now(),
          };
        }
        return s;
      });

      // If current session not in list yet, prepend it
      const exists = updatedSessions.some((s) => s.id === currentSessionId);
      if (!exists && currentSessionId) {
        updatedSessions.unshift({
          id: currentSessionId,
          title: titleCandidate,
          messages: finalMessages,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      }

      persistSessions(updatedSessions);
    } catch {
      const errorMessage: ChatMessage = {
        id: `err_${Date.now()}`,
        sender: 'assistant',
        text: isAr
          ? 'حصلت مشكلة مؤقتة في الاتصال. جرّب تاني.'
          : 'Connection error. Please try again.',
        timestamp: Date.now(),
        status: 'error',
        seconds: 0.1,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    if (currentSessionId) {
      const updated = sessions.filter((s) => s.id !== currentSessionId);
      persistSessions(updated);
      const newSessionId = `session_${Date.now()}`;
      setCurrentSessionId(newSessionId);
    }
  };

  const isDarkOrContrast = pageTheme === 'dark' || pageTheme === 'high-contrast';

  return (
    <div
      className={`h-[100dvh] max-h-[100dvh] overflow-hidden flex flex-col font-${fontFamily} text-size-${textSize} theme-${pageTheme} ${
        isDarkOrContrast ? 'dark' : ''
      } ${
        pageTheme === 'high-contrast'
          ? 'bg-black text-white'
          : pageTheme === 'dark'
          ? 'bg-slate-950 text-slate-100'
          : pageTheme === 'soft'
          ? 'bg-[#f0fbf6] text-slate-900'
          : 'bg-slate-50 text-slate-900'
      } transition-colors`}
    >
      {/* Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        lang={lang}
        toggleLang={toggleLang}
        openAppearanceModal={() => setIsAppearanceModalOpen(true)}
        openHistoryDrawer={() => setIsHistoryDrawerOpen(true)}
        isDark={pageTheme === 'dark'}
        toggleTheme={toggleTheme}
      />

      {/* Main View with smooth motion tab transitions */}
      <main className="flex-1 min-h-0 overflow-hidden relative flex flex-col">
        <AnimatePresence mode="wait">
          {activeTab === 'chat' && (
            <motion.div
              key="chat"
              initial={{ opacity: 0, y: 8, scale: 0.995 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.995 }}
              transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
              className="h-full w-full flex items-center justify-center"
            >
              <ChatView
                messages={messages}
                onSendMessage={handleSendMessage}
                onClearChat={handleClearChat}
                onNewChat={handleNewChat}
                sessions={sessions}
                currentSessionId={currentSessionId}
                onSelectSession={handleSelectSession}
                onDeleteSession={handleDeleteSession}
                onClearAllSessions={handleClearAllSessions}
                isLoading={isLoading}
                lang={lang}
                isSidebarOpen={isSidebarOpen}
                setIsSidebarOpen={handleSetIsSidebarOpen}
              />
            </motion.div>
          )}

          {activeTab === 'emergency' && (
            <motion.div
              key="emergency"
              initial={{ opacity: 0, y: 8, scale: 0.995 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.995 }}
              transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
              className="h-full w-full overflow-y-auto flex flex-col items-center justify-center p-2 sm:p-4"
            >
              <EmergencyDirectoryView lang={lang} />
            </motion.div>
          )}

          {activeTab === 'guide' && (
            <motion.div
              key="guide"
              initial={{ opacity: 0, y: 8, scale: 0.995 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.995 }}
              transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
              className="h-full w-full overflow-y-auto flex flex-col items-center justify-center p-2 sm:p-4"
            >
              <PatientGuideView lang={lang} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Font Settings Modal */}
      <AppearanceModal
        isOpen={isAppearanceModalOpen}
        onClose={() => setIsAppearanceModalOpen(false)}
        lang={lang}
        fontFamily={fontFamily}
        setFontFamily={setFontFamily}
        textSize={textSize}
        setTextSize={setTextSize}
        simpleMode={simpleMode}
        setSimpleMode={setSimpleMode}
      />

      {/* Chat History Drawer */}
      <ChatHistoryDrawer
        isOpen={isHistoryDrawerOpen}
        onClose={() => setIsHistoryDrawerOpen(false)}
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSelectSession={handleSelectSession}
        onNewChat={handleNewChat}
        onDeleteSession={handleDeleteSession}
        onClearAllSessions={handleClearAllSessions}
        lang={lang}
      />
    </div>
  );
}
