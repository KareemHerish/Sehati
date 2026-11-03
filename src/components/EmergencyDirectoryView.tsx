/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  PhoneCall,
  AlertOctagon,
  Search,
  Copy,
  Check,
  Flame,
  Shield,
  HeartPulse
} from 'lucide-react';
import { Language } from '../types';
import { EMERGENCY_CONTACTS, TRIAGE_LEVELS } from '../data/constants';

interface EmergencyDirectoryViewProps {
  lang: Language;
}

export const EmergencyDirectoryView: React.FC<EmergencyDirectoryViewProps> = ({ lang }) => {
  const isAr = lang === 'ar';
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedNumber, setCopiedNumber] = useState<string | null>(null);

  const handleCopy = (number: string) => {
    navigator.clipboard.writeText(number);
    setCopiedNumber(number);
    setTimeout(() => setCopiedNumber(null), 1500);
  };

  const filteredContacts = EMERGENCY_CONTACTS.filter(
    (c) =>
      c.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.ambulance.includes(searchQuery)
  );

  return (
    <div className="w-full max-w-4xl mx-auto my-auto px-3 sm:px-4 py-4 space-y-4">
      {/* Emergency Header Card */}
      <div className="bg-red-600 text-white rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-white font-bold text-xs mb-2">
            <AlertOctagon className="w-3.5 h-3.5" />
            <span>{isAr ? 'طوارئ' : 'Emergency'}</span>
          </div>
          <h2 className="text-xl font-black">
            {isAr ? 'لو فيه خطر على حياتك: اتصل فوراً' : 'Life Threatening? Call Now'}
          </h2>
          <p className="text-xs text-red-100 mt-1">
            {isAr ? 'وجع صدر، خنقة، إغماء، أو نزيف شديد: متستناش الشات واطلب الإسعاف.' : 'Chest pain, choking, or passing out: call dispatch now.'}
          </p>
        </div>

        <div className="flex gap-2">
          <a
            href="tel:123"
            className="flex items-center gap-1.5 bg-white text-red-600 font-black px-4 py-2.5 rounded-xl text-sm shadow-xs hover:bg-red-50"
          >
            <PhoneCall className="w-4 h-4" />
            <span>{isAr ? 'إسعاف مصر 123' : 'Ambulance 123'}</span>
          </a>
        </div>
      </div>

      {/* Triage Levels - 3 cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {TRIAGE_LEVELS.map((triage) => (
          <div
            key={triage.level}
            className={`rounded-2xl p-4 border ${triage.border} ${triage.bgLight} text-xs space-y-2`}
          >
            <div className="flex items-center justify-between">
              <span className={`font-black px-2 py-0.5 rounded text-[10px] ${triage.level === 1 ? 'bg-red-600 text-white' : triage.level === 2 ? 'bg-amber-500 text-white' : 'bg-teal-600 text-white'}`}>
                Level {triage.level}
              </span>
              <span className="font-bold text-[11px]">{isAr ? triage.titleAr : triage.titleEn}</span>
            </div>
            <p className="font-semibold text-slate-900 dark:text-white text-xs">
              {isAr ? triage.actionAr : triage.actionEn}
            </p>
            <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-600 dark:text-slate-300">
              {(isAr ? triage.examplesAr : triage.examplesEn).slice(0, 3).map((ex, idx) => (
                <li key={idx}>{ex}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Directory Numbers */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
          <span className="font-bold text-xs text-slate-800 dark:text-white">
            {isAr ? 'أرقام الطوارئ' : 'Emergency Numbers'}
          </span>
          <div className="relative w-40">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2 rtl:right-2.5 ltr:left-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isAr ? 'بحث...' : 'Search...'}
              className="w-full text-xs py-1 px-7 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {filteredContacts.map((contact) => (
            <div
              key={contact.code}
              className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-xs space-y-2"
            >
              <div className="flex items-center justify-between font-bold">
                <span>{contact.country}</span>
                <span className="font-mono text-[10px] text-slate-400">{contact.code}</span>
              </div>

              {/* Ambulance */}
              <div className="flex items-center justify-between p-1.5 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 font-bold">
                <span className="flex items-center gap-1">
                  <HeartPulse className="w-3.5 h-3.5" />
                  {isAr ? 'الإسعاف' : 'Ambulance'}
                </span>
                <div className="flex items-center gap-1.5">
                  <a href={`tel:${contact.ambulance}`} className="hover:underline font-mono">
                    {contact.ambulance}
                  </a>
                  <button
                    onClick={() => handleCopy(contact.ambulance)}
                    className="p-0.5 text-slate-400 hover:text-slate-600"
                  >
                    {copiedNumber === contact.ambulance ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>

              {/* Police & Fire */}
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span className="flex items-center gap-1">
                  <Shield className="w-3 h-3 text-blue-500" />
                  {isAr ? 'شرطة: ' : 'Police: '}
                  <b className="text-slate-700 dark:text-slate-300 font-mono">{contact.police}</b>
                </span>
                <span className="flex items-center gap-1">
                  <Flame className="w-3 h-3 text-orange-500" />
                  {isAr ? 'مطافي: ' : 'Fire: '}
                  <b className="text-slate-700 dark:text-slate-300 font-mono">{contact.fire}</b>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
