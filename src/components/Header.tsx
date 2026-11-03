/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  PhoneCall,
  Languages,
  MessageSquare,
  LifeBuoy,
  Stethoscope,
  Type,
  Sun,
  Moon
} from 'lucide-react';
import { Language } from '../types';

interface HeaderProps {
  activeTab: 'chat' | 'emergency' | 'guide';
  setActiveTab: (tab: 'chat' | 'emergency' | 'guide') => void;
  lang: Language;
  toggleLang: () => void;
  openAppearanceModal: () => void;
  openHistoryDrawer?: () => void;
  isDark: boolean;
  toggleTheme: () => void;
}

import { motion } from 'motion/react';

// Navigation tab definitions
const NAV_TABS = [
  { id: 'chat' as const, labelAr: 'الدردشة', labelEn: 'Chat', icon: MessageSquare },
  { id: 'emergency' as const, labelAr: 'أرقام الطوارئ', labelEn: 'Emergency', icon: LifeBuoy },
  { id: 'guide' as const, labelAr: 'دليل الطبيب', labelEn: 'Doctor Prep', icon: Stethoscope },
];

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  lang,
  toggleLang,
  openAppearanceModal,
  isDark,
  toggleTheme,
}) => {
  const isAr = lang === 'ar';

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-slate-950 shadow-xs transition-colors shrink-0">
      {/* Quick Emergency Call Bar */}
      <div className="bg-red-600 text-white text-xs py-1.5 px-4 font-bold flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
          </span>
          <span>{isAr ? 'حالة طارئة؟ اطلب الإسعاف دلوقتي' : 'Emergency? Call 123 now'}</span>
        </div>
        <a
          href="tel:123"
          className="flex items-center gap-1.5 bg-white text-red-600 font-black px-3 py-0.5 rounded-full text-xs hover:bg-red-50 transition-colors shadow-xs"
        >
          <PhoneCall className="w-3.5 h-3.5" />
          <span>{isAr ? 'اتصل 123' : 'Call 123'}</span>
        </a>
      </div>

      {/* Main Bar */}
      <div className="max-w-7xl mx-auto px-2 sm:px-4">
        <div className="flex items-center justify-between h-14">
          {/* Brand - Logo & صحتي */}
          <div className="flex items-center gap-2.5">
            <img
              src="/assets/aistudio/logo_7537380a.png"
              alt={isAr ? 'شعار صحتي' : 'Sehati Logo'}
              className="w-9 h-9 object-contain rounded-lg"
            />
            <div className="flex items-center gap-2">
              <span
                className={`font-black text-xl text-slate-900 dark:text-white font-['Cairo'] select-none leading-none inline-block ${
                  isAr ? 'tracking-[-0.02em] [letter-spacing:-0.02em]' : 'tracking-normal'
                }`}
                style={{
                  textRendering: 'geometricPrecision',
                  fontVariantLigatures: 'normal',
                }}
              >
                {isAr ? 'صحتـــــــــي' : 'Sehati'}
              </span>
            </div>
          </div>

          {/* Actions: Dark/Light Mode, Font, Language & History */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Dark & Light Mode Quick Toggle Button */}
            <button
              onClick={toggleTheme}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {isDark ? (
                <Sun className="w-3.5 h-3.5 text-amber-500" />
              ) : (
                <Moon className="w-3.5 h-3.5 text-slate-700 dark:text-slate-300" />
              )}
              <span>{isDark ? (isAr ? 'نهاري' : 'Light') : (isAr ? 'ليلي' : 'Dark')}</span>
            </button>

            {/* Font Settings Only (الخط بس) */}
            <button
              onClick={openAppearanceModal}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Type className="w-3.5 h-3.5 text-teal-600" />
              <span>{isAr ? 'الخط' : 'Font'}</span>
            </button>

            {/* Language */}
            <button
              onClick={toggleLang}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Languages className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span>{isAr ? 'English' : 'عربي'}</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs with smooth motion slide animation */}
        <div className="flex space-x-2 py-1.5 overflow-x-auto no-scrollbar relative">
          {NAV_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors shrink-0 cursor-pointer ${
                  isActive
                    ? 'text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/70 dark:hover:bg-slate-800/70'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTabPill"
                    className="absolute inset-0 bg-emerald-600 rounded-lg shadow-xs"
                    transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  <Icon className="w-3.5 h-3.5" />
                  <span>{isAr ? tab.labelAr : tab.labelEn}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
