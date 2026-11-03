/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ChevronUp,
  ChevronDown,
  Copy,
  Check,
  Volume2,
  VolumeX,
  PhoneCall,
  AlertTriangle,
  Sparkles
} from 'lucide-react';
import { ChatMessage, Language } from '../types';

interface MessageItemProps {
  message: ChatMessage;
  lang: Language;
}

/**
 * Formats inline markdown like **bold**, *italic*, `code`
 */
const renderFormattedInline = (text: string) => {
  // Regex to match **bold**, *italic*, `code`
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    const chunk = match[0];
    if (chunk.startsWith('**') && chunk.endsWith('**')) {
      parts.push(
        <strong key={match.index} className="font-bold text-zinc-950 dark:text-zinc-50">
          {chunk.slice(2, -2)}
        </strong>
      );
    } else if (chunk.startsWith('*') && chunk.endsWith('*')) {
      parts.push(
        <em key={match.index} className="italic text-zinc-800 dark:text-zinc-200">
          {chunk.slice(1, -1)}
        </em>
      );
    } else if (chunk.startsWith('`') && chunk.endsWith('`')) {
      parts.push(
        <code
          key={match.index}
          className="px-1.5 py-0.5 rounded bg-zinc-200/70 dark:bg-zinc-800 font-mono text-xs text-teal-700 dark:text-teal-300"
        >
          {chunk.slice(1, -1)}
        </code>
      );
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts;
};

/**
 * Formats multiline markdown into paragraphs, lists, headers
 */
const FormattedMarkdown: React.FC<{ content: string }> = ({ content }) => {
  const paragraphs = content.split(/\n\s*\n/);

  return (
    <div className="space-y-4 text-[15px] sm:text-[16px] leading-[1.8] text-zinc-800 dark:text-zinc-200">
      {paragraphs.map((para, pIdx) => {
        const lines = para.trim().split('\n');

        // Check if paragraph is a list
        const isBulletList = lines.every((line) => /^(\* |- |• )/.test(line.trim()));
        const isNumberedList = lines.every((line) => /^\d+\.\s/.test(line.trim()));

        if (isBulletList) {
          return (
            <ul key={pIdx} className="space-y-2 my-2 ps-5 list-disc list-outside marker:text-teal-600 dark:marker:text-teal-400">
              {lines.map((line, lIdx) => {
                const cleanLine = line.trim().replace(/^(\* |- |• )\s*/, '');
                return <li key={lIdx} className="leading-relaxed">{renderFormattedInline(cleanLine)}</li>;
              })}
            </ul>
          );
        }

        if (isNumberedList) {
          return (
            <ol key={pIdx} className="space-y-2 my-2 ps-5 list-decimal list-outside marker:text-teal-600 dark:marker:text-teal-400">
              {lines.map((line, lIdx) => {
                const cleanLine = line.trim().replace(/^\d+\.\s*/, '');
                return <li key={lIdx} className="leading-relaxed">{renderFormattedInline(cleanLine)}</li>;
              })}
            </ol>
          );
        }

        // Check if header
        if (lines.length === 1 && /^#{1,4}\s/.test(lines[0])) {
          const headerText = lines[0].replace(/^#{1,4}\s*/, '');
          return (
            <h4 key={pIdx} className="font-bold text-base sm:text-lg text-zinc-950 dark:text-zinc-50 pt-2 pb-1">
              {renderFormattedInline(headerText)}
            </h4>
          );
        }

        // Regular paragraph with potential inline line breaks
        return (
          <p key={pIdx} className="leading-[1.8] my-0">
            {lines.map((line, lIdx) => (
              <React.Fragment key={lIdx}>
                {renderFormattedInline(line)}
                {lIdx < lines.length - 1 && <br />}
              </React.Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
};

export const MessageItem: React.FC<MessageItemProps> = ({ message, lang }) => {
  const isAr = lang === 'ar';
  const isUser = message.sender === 'user';
  const [isCopied, setIsCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Only consider prompt long if it exceeds ~160 characters or 3 lines
  const textLength = message.text ? message.text.length : 0;
  const lineCount = message.text ? message.text.split('\n').length : 1;
  const isLongPrompt = textLength > 160 || lineCount > 3;

  // Starts collapsed only if it's long, so the user can expand it
  const [isCollapsed, setIsCollapsed] = useState(isLongPrompt);

  // 1. User Message (Mimicking the reference screenshot style)
  if (isUser) {
    return (
      <div className="flex justify-end my-3 sm:my-4">
        <div className="relative group max-w-[92%] sm:max-w-[85%] md:max-w-2xl bg-[#f4f4f4] dark:bg-[#262626] text-zinc-900 dark:text-zinc-100 rounded-[24px] px-5 py-4 sm:px-6 sm:py-5 shadow-xs transition-all">
          <div
            className={`text-[15px] sm:text-[16px] leading-[1.75] text-right font-normal transition-all overflow-hidden ${
              isLongPrompt && isCollapsed ? 'max-h-24 line-clamp-3' : ''
            }`}
          >
            <p className="whitespace-pre-wrap">{message.text}</p>
          </div>

          {/* Toggle expand/collapse arrow appears ONLY if the prompt is actually long */}
          {isLongPrompt && (
            <div className="flex justify-end items-center mt-2 pt-1 border-t border-black/5 dark:border-white/5">
              <button
                type="button"
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="inline-flex items-center gap-1 text-xs font-medium text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 py-1 px-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                aria-label="Toggle user message preview"
              >
                <span>
                  {isCollapsed
                    ? (isAr ? 'عرض المزيد' : 'Show more')
                    : (isAr ? 'عرض أقل' : 'Show less')}
                </span>
                {isCollapsed ? (
                  <ChevronDown className="w-3.5 h-3.5" />
                ) : (
                  <ChevronUp className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 2. Assistant Message (Unboxed, pure typography flowing directly on background)
  const isRedFlag = message.status === 'red_flag';
  const isRefused = message.status === 'refused';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.text);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy message:', err);
    }
  };

  const handleSpeak = () => {
    if (!('speechSynthesis' in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = message.text.replace(/[*#`_]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);

    const hasArabic = /[\u0600-\u06FF]/.test(cleanText);
    const hasEnglish = /[a-zA-Z]/.test(cleanText);

    if (hasEnglish && !hasArabic) {
      utterance.lang = 'en-US';
    } else if (hasArabic) {
      utterance.lang = 'ar-EG';
    } else {
      utterance.lang = isAr ? 'ar-EG' : 'en-US';
    }

    utterance.rate = 1.0;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="my-5 sm:my-6 text-right">
      {/* Emergency Red Flag Notice Banner */}
      {isRedFlag && (
        <div className="mb-4 p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-800 text-red-950 dark:text-red-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <span className="w-3 h-3 rounded-full bg-red-600 animate-ping shrink-0" />
            <div>
              <p className="font-bold text-sm text-red-800 dark:text-red-200">
                {isAr ? 'حالة طوارئ طبية محتملة' : 'Potential Medical Emergency'}
              </p>
              <p className="text-xs text-red-700 dark:text-red-300">
                {isAr
                  ? 'الأعراض دي تتطلب تقييم طبي فوري ولا تحتمل التأخير.'
                  : 'These symptoms require immediate emergency evaluation.'}
              </p>
            </div>
          </div>
          <a
            href="tel:123"
            className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-black px-4 py-2 rounded-xl text-xs sm:text-sm transition-all shadow-xs shrink-0 cursor-pointer"
          >
            <PhoneCall className="w-4 h-4" />
            <span>{isAr ? 'اتصل بالإسعاف 123' : 'Call 123 Now'}</span>
          </a>
        </div>
      )}

      {/* Safety Guideline Note (for medication/dosage/chronic refusal) */}
      {isRefused && !isRedFlag && (
        <div className="mb-3 px-3.5 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            {isAr
              ? 'ملاحظة أمان: صحتي يقدم معلومات توعوية فقط ولا يصف علاجات أو يحدد جرعات دوائية.'
              : 'Safety note: Sehati provides health awareness only, never prescribing medication or dosages.'}
          </span>
        </div>
      )}

      {/* Unboxed Body - Clean Typography Directly on Page Background */}
      <div className="max-w-3xl w-full">
        <FormattedMarkdown content={message.text} />
      </div>

      {/* Subtle Bottom Action Bar (Copy, TTS, Timestamp) */}
      <div className="mt-3.5 flex items-center gap-2 text-zinc-400 dark:text-zinc-500">
        <button
          type="button"
          onClick={handleCopy}
          className="p-1.5 rounded-lg hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer flex items-center gap-1 text-xs"
        >
          {isCopied ? (
            <>
              <Check className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span className="text-[11px] text-teal-600 dark:text-teal-400 font-medium">
                {isAr ? 'تم النسخ' : 'Copied'}
              </span>
            </>
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
        </button>

        <button
          type="button"
          onClick={handleSpeak}
          className={`p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer flex items-center gap-1 text-xs ${
            isSpeaking ? 'text-teal-600 dark:text-teal-400' : 'hover:text-zinc-700 dark:hover:text-zinc-200'
          }`}
        >
          {isSpeaking ? (
            <>
              <VolumeX className="w-3.5 h-3.5" />
              <span className="text-[11px] font-medium">{isAr ? 'إيقاف' : 'Stop'}</span>
            </>
          ) : (
            <Volume2 className="w-3.5 h-3.5" />
          )}
        </button>

        {message.seconds !== undefined && (
          <span className="text-[10px] text-zinc-400 font-mono ms-2">
            {message.seconds}s
          </span>
        )}
      </div>
    </div>
  );
};
