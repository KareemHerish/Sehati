/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, ShieldCheck, AlertOctagon, HeartPulse } from 'lucide-react';
import { Language } from '../types';

interface SafetyModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
}

export const SafetyModal: React.FC<SafetyModalProps> = ({ isOpen, onClose, lang }) => {
  if (!isOpen) return null;
  const isAr = lang === 'ar';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full shadow-xl p-5 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-teal-600" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              {isAr ? 'قواعد الأمان' : 'Safety Rules'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 3 Core Points */}
        <div className="space-y-2.5 text-xs">
          <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-900 dark:text-red-200 flex items-start gap-2">
            <AlertOctagon className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">{isAr ? '1. طوارئ وإسعافات أولية (123)' : '1. Emergency & First Aid (123)'}</p>
              <p className="text-[11px] text-red-700 dark:text-red-300">
                {isAr ? 'إرشادات سلامة أولية غير دوائية وتوجيه فوري للإسعاف أو الطوارئ.' : 'Non-medicinal immediate first aid and direct emergency routing.'}
              </p>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">{isAr ? '2. ممنوع تشخيص أو إعطاء أي علاج' : '2. Zero Diagnosis & Treatments'}</p>
              <p className="text-[11px] text-amber-700 dark:text-amber-300">
                {isAr ? 'ممنوع وصف أدوية، جرعات، أو تشخيص أي مرض؛ العلاج مسؤولية طبيبك فقط.' : 'No prescribing, dosage calculation, or diagnosing any condition.'}
              </p>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-900 text-teal-900 dark:text-teal-200 flex items-start gap-2">
            <HeartPulse className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">{isAr ? '3. معلومات وتوعية فقط' : '3. Educational Info Only'}</p>
              <p className="text-[11px] text-teal-700 dark:text-teal-300">
                {isAr ? 'للأعراض المقلقة والأمراض المزمنة بنقدّم معلومات عامة ونمط حياة مع التوجيه للطبيب.' : 'Information on concerning symptoms & chronic wellness without clinical prescription.'}
              </p>
            </div>
          </div>
        </div>

        {/* Footer button */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl"
          >
            {isAr ? 'فهمت' : 'Got It'}
          </button>
        </div>
      </div>
    </div>
  );
};
