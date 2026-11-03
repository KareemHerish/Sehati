/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, Type, Check } from 'lucide-react';
import { FontFamily, Language, TextSize } from '../types';

interface AppearanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  fontFamily: FontFamily;
  setFontFamily: (font: FontFamily) => void;
  textSize: TextSize;
  setTextSize: (size: TextSize) => void;
  simpleMode?: boolean;
  setSimpleMode?: (simple: boolean) => void;
}

export const AppearanceModal: React.FC<AppearanceModalProps> = ({
  isOpen,
  onClose,
  lang,
  fontFamily,
  setFontFamily,
  textSize,
  setTextSize,
  simpleMode,
  setSimpleMode,
}) => {
  if (!isOpen) return null;
  const isAr = lang === 'ar';

  const fonts: { id: FontFamily; labelAr: string; labelEn: string; sample: string }[] = [
    { id: 'cairo', labelAr: 'كايرو (الافتراضي)', labelEn: 'Cairo (Default)', sample: 'أبجد هوز - صحتي' },
    { id: 'alexandria', labelAr: 'الإسكندرية (هندسي)', labelEn: 'Alexandria', sample: 'أبجد هوز - صحتي' },
    { id: 'amiri', labelAr: 'أميري (نسخي كلاسيكي)', labelEn: 'Amiri (Classic)', sample: 'أبجد هوز - صحتي' },
    { id: 'system', labelAr: 'خط النظام القياسي', labelEn: 'System Clean', sample: 'أبجد هوز - صحتي' },
  ];

  const sizes: { id: TextSize; labelAr: string; labelEn: string; scale: string }[] = [
    { id: 'normal', labelAr: 'عادي (100%)', labelEn: 'Normal (100%)', scale: 'text-sm' },
    { id: 'large', labelAr: 'كبير (120%)', labelEn: 'Large (120%)', scale: 'text-base font-bold' },
    { id: 'xlarge', labelAr: 'كبير جداً (140%)', labelEn: 'Extra Large (140%)', scale: 'text-lg font-black' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full shadow-2xl p-5 space-y-5 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Type className="w-5 h-5 text-teal-600" />
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              {isAr ? 'إعدادات الخط' : 'Font Settings'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1. Font Family */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Type className="w-4 h-4 text-teal-600" />
            <span>{isAr ? 'نوع وشكل الخط (Font Family):' : 'Font Family:'}</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            {fonts.map((f) => {
              const isSelected = fontFamily === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => setFontFamily(f.id)}
                  className={`p-2.5 rounded-xl border text-start transition-all cursor-pointer ${
                    isSelected
                      ? 'border-teal-600 bg-teal-50 dark:bg-teal-950/50 text-teal-900 dark:text-teal-200 font-bold ring-2 ring-teal-500/20'
                      : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:border-teal-400'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span>{isAr ? f.labelAr : f.labelEn}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-teal-600 shrink-0" />}
                  </div>
                  <p className={`text-[11px] text-slate-400 mt-1 font-${f.id}`}>{f.sample}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Text Size */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <span className="text-sm font-black">A</span>
            <span>{isAr ? 'حجم الخط (Text Size):' : 'Text Size:'}</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {sizes.map((s) => {
              const isSelected = textSize === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setTextSize(s.id)}
                  className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                    isSelected
                      ? 'border-teal-600 bg-teal-50 dark:bg-teal-950/50 text-teal-900 dark:text-teal-200 font-bold ring-2 ring-teal-500/20'
                      : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:border-teal-400'
                  }`}
                >
                  <span className={`block ${s.scale}`}>A</span>
                  <span className="text-[10px] mt-0.5 block">{isAr ? s.labelAr : s.labelEn}</span>
                </button>
              );
            })}
          </div>
        </div>



        {/* Close Button */}
        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
          >
            {isAr ? 'تم' : 'Done'}
          </button>
        </div>
      </div>
    </div>
  );
};
