/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Stethoscope,
  Pill,
  HeartPulse,
  CheckCircle2
} from 'lucide-react';
import { Language } from '../types';
import { VITAL_SIGNS_REFERENCE } from '../data/constants';

interface PatientGuideViewProps {
  lang: Language;
}

export const PatientGuideView: React.FC<PatientGuideViewProps> = ({ lang }) => {
  const isAr = lang === 'ar';
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  const toggleCheck = (id: string) => {
    setCheckedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const pqrstSteps = [
    {
      letter: 'P',
      nameAr: 'إيه اللي بيزود أو يقلل الوجع؟',
      nameEn: 'What makes it better or worse?',
      descAr: 'حركة، أكل، راحة، ولا نفس عميق؟',
      descEn: 'Movement, food, rest, or deep breathing?',
    },
    {
      letter: 'Q',
      nameAr: 'نوع الوجع إيه؟',
      nameEn: 'What does the pain feel like?',
      descAr: 'حرقان، نغز، ضغط كتمة، ولا مغص؟',
      descEn: 'Burning, stabbing, pressure, or cramping?',
    },
    {
      letter: 'R',
      nameAr: 'مكانه فين ومسمّع فين؟',
      nameEn: 'Where is it radiating?',
      descAr: 'مكانه بالظبط، وهل مسمّع في كتفك، ضهرك، أو فكك؟',
      descEn: 'Exact spot, does it radiate to shoulder, jaw, or back?',
    },
    {
      letter: 'S',
      nameAr: 'شدته كام من 10؟',
      nameEn: 'Severity from 1 to 10?',
      descAr: 'تقييمك للألم وهل مانعك تنام؟',
      descEn: 'Pain score and does it affect sleep?',
    },
    {
      letter: 'T',
      nameAr: 'بدأ إمتى ومستمر بقاله قد إيه؟',
      nameEn: 'When did it start?',
      descAr: 'مفاجئ ولا بالتدريج، وبقاله دقايق ولا أيام؟',
      descEn: 'Sudden or gradual, minutes or days?',
    },
  ];

  const pharmacistQuestions = [
    { id: 'q1', qAr: 'قبل الأكل ولا بعده؟', qEn: 'Before or after meals?' },
    { id: 'q2', qAr: 'لو نسيت جرعة أعمل إيه؟', qEn: 'What to do if I miss a dose?' },
    { id: 'q3', qAr: 'هل بيتعارض مع علاجاتي التانية؟', qEn: 'Does it interact with other meds?' },
    { id: 'q4', qAr: 'إيه الآثار الجانبية المتوقعة؟', qEn: 'What side effects to expect?' },
    { id: 'q5', qAr: 'المفروض أكمله كام يوم بالظبط؟', qEn: 'How many days should I take it?' },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto my-auto px-3 sm:px-4 py-4 space-y-4">
      {/* PQRST Symptom Guide */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
          <Stethoscope className="w-4 h-4 text-teal-600" />
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
            {isAr ? 'إزاي تشرح وجعك للدكتور؟ (طريقة PQRST)' : 'How to Describe Pain to Your Doctor'}
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {pqrstSteps.map((step) => (
            <div
              key={step.letter}
              className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700 flex items-start gap-2"
            >
              <span className="w-6 h-6 rounded-lg bg-teal-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                {step.letter}
              </span>
              <div>
                <p className="font-bold text-slate-900 dark:text-white">{isAr ? step.nameAr : step.nameEn}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{isAr ? step.descAr : step.descEn}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Questions for Pharmacist */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
          <Pill className="w-4 h-4 text-amber-500" />
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
            {isAr ? 'اسأل الصيدلي الحاجات دي وأنت بتستلم العلاج' : 'Ask Your Pharmacist'}
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {pharmacistQuestions.map((q) => {
            const isChecked = !!checkedItems[q.id];
            return (
              <div
                key={q.id}
                onClick={() => toggleCheck(q.id)}
                className={`p-2.5 rounded-xl border cursor-pointer flex items-center gap-2 transition-colors ${
                  isChecked
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 text-emerald-900 dark:text-emerald-200'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 text-slate-800 dark:text-slate-200'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                    isChecked ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300'
                  }`}
                >
                  {isChecked && <CheckCircle2 className="w-3.5 h-3.5" />}
                </div>
                <span className="font-medium text-xs">{isAr ? q.qAr : q.qEn}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Vitals Normal Ranges */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
          <HeartPulse className="w-4 h-4 text-teal-600" />
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
            {isAr ? 'المعدلات الطبيعية للمؤشرات الحيوية' : 'Normal Vital Ranges'}
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-start">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold text-[11px]">
                <th className="py-2 px-2 text-start">{isAr ? 'المؤشر' : 'Vital'}</th>
                <th className="py-2 px-2 text-start">{isAr ? 'الطبيعي' : 'Normal'}</th>
                <th className="py-2 px-2 text-start">{isAr ? 'تحذير' : 'Warning'}</th>
                <th className="py-2 px-2 text-start">{isAr ? 'طوارئ' : 'Emergency'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-[11px]">
              {VITAL_SIGNS_REFERENCE.map((v, i) => (
                <tr key={i}>
                  <td className="py-2 px-2 font-bold">{isAr ? v.parameterAr : v.parameterEn}</td>
                  <td className="py-2 px-2 text-emerald-600 font-semibold">{isAr ? v.normal : v.normalEn}</td>
                  <td className="py-2 px-2 text-amber-600">{v.warning}</td>
                  <td className="py-2 px-2 text-red-600 font-bold">{v.emergency}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
