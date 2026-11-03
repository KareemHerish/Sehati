/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Send,
  Trash2,
  Mic,
  MicOff,
  Plus,
  PanelLeftClose,
  PanelLeftOpen,
  History,
  Sparkles,
  AlertTriangle,
  Brain,
  Pill,
  LifeBuoy,
  Apple,
  HeartPulse,
  Activity,
  Thermometer,
  Moon as MoonIcon,
  Stethoscope,
  ShieldAlert,
  Baby,
  Wind,
  Search,
  ArrowUpLeft,
  ArrowUpRight,
  X
} from 'lucide-react';
import { ChatMessage, ChatSession, Language } from '../types';
import { MessageItem } from './MessageItem';

interface ChatViewProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => Promise<void>;
  onClearChat: () => void;
  onNewChat: () => void;
  sessions: ChatSession[];
  currentSessionId: string | null;
  onSelectSession: (id: string) => void;
  onDeleteSession: (id: string, e: React.MouseEvent) => void;
  onClearAllSessions: () => void;
  isLoading: boolean;
  lang: Language;
  isSidebarOpen: boolean;
  setIsSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

// 5 rotating empathetic and helpful headlines (change every 30s)
const HELP_HEADLINES = [
  {
    ar: 'بماذا يمكنني مساعدتك صحياً اليوم؟',
    en: 'How can I assist your health today?',
  },
  {
    ar: 'معاك خطوة بخطوة للاطمئنان على صحتك وسلامتك',
    en: 'Here with you step-by-step for your health and safety.',
  },
  {
    ar: 'جاهز أجاوبك على استفساراتك الطبية وأعراضك بكل أمان',
    en: 'Ready to safely answer your medical questions & symptoms.',
  },
  {
    ar: 'صحتك أولويتنا.. اسألني عن أي تعب أو نصيحة وقائية',
    en: 'Your health is our priority.. ask about any symptom or tip.',
  },
  {
    ar: 'مرشدك الصحي الموثوق لمعلومات طبية دقيقة وإسعافات أولية',
    en: 'Your trusted health guide for reliable info and safe first aid.',
  },
];

// Rich knowledge suggestion bank for live question matching in Arabic & English
interface SuggestionItem {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  textAr: string;
  textEn: string;
  promptAr: string;
  promptEn: string;
  keywords: string[];
}

const SUGGESTIONS_BANK: SuggestionItem[] = [
  {
    id: 's-headache',
    icon: Brain,
    textAr: 'فحص أسباب الصداع المستمر والدوخة وعلامات الخطر',
    textEn: 'Causes of frequent headaches, dizziness & red flags',
    promptAr: 'إيه هي أسباب الصداع المستمر والتعب وإمتى يعتبر مقلق ويحتاج زيارة دكتور فوراً؟',
    promptEn: 'What are common causes of frequent headaches and when is it a red flag?',
    keywords: ['صداع', 'شقيقة', 'راسي', 'دوخة', 'دايخ', 'تعب', 'headache', 'migraine', 'head', 'dizzy', 'dizziness'],
  },
  {
    id: 's-painkillers',
    icon: Pill,
    textAr: 'الاستخدام الآمن للمسكنات وممنوعات خلط الأدوية',
    textEn: 'Safe painkiller usage & drug interaction precautions',
    promptAr: 'إيه هي القواعد الآمنة لاستخدام المسكنات وممنوعات خلط الأدوية بدون استشارة طبية؟',
    promptEn: 'What are safe rules for painkillers and medication interactions to avoid?',
    keywords: ['مسكن', 'مسكنات', 'بنادول', 'بروفين', 'باراسيتامول', 'علاج', 'دواء', 'ادوية', 'painkiller', 'panadol', 'paracetamol', 'brufen', 'medicine', 'drug'],
  },
  {
    id: 's-burns',
    icon: LifeBuoy,
    textAr: 'إسعافات الحروق بالماء الساخن والجروح السطحية',
    textEn: 'First aid for hot water burns and minor wound care',
    promptAr: 'لو حد اتعرض لحرق مية سخنة، إيه خطوات الإسعافات الأولية الآمنة فوراً وإيه اللي ممنوع يعمله؟',
    promptEn: 'What are immediate non-medicinal first aid steps for a hot water burn?',
    keywords: ['حرق', 'حروق', 'مية سخنة', 'جرح', 'جروح', 'دم', 'نزيف', 'اسعافات', 'طوارئ', 'burn', 'burns', 'wound', 'cut', 'bleed', 'bleeding', 'first aid', 'emergency'],
  },
  {
    id: 's-nutrition',
    icon: Apple,
    textAr: 'استفسارات التغذية وتقوية المناعة ونمط الحياة الصحي',
    textEn: 'Nutrition tips, immune boost & healthy lifestyle',
    promptAr: 'أهم النصايح الغذائية والعادات اليومية لتقوية الجهاز المناعي ونمط الحياة الصحي المتوازن',
    promptEn: 'What are top lifestyle and nutrition habits to build stronger immunity?',
    keywords: ['تغذية', 'اكل', 'دايت', 'مناعة', 'فيتامين', 'صحي', 'رياضة', 'وزن', 'nutrition', 'diet', 'food', 'immunity', 'immune', 'vitamin', 'lifestyle', 'healthy'],
  },
  {
    id: 's-blood-pressure',
    icon: HeartPulse,
    textAr: 'أعراض ارتفاع أو انخفاض ضغط الدم وكيفية قياسه',
    textEn: 'High/low blood pressure symptoms & home check',
    promptAr: 'إيه هي أعراض ارتفاع ضغط الدم المفاجئ، وإزاي أقيس الضغط في البيت بشكل صحيح؟',
    promptEn: 'What are sudden high blood pressure symptoms and how to measure it properly at home?',
    keywords: ['ضغط', 'عالي', 'واطي', 'نبض', 'قلب', 'نهجان', 'صدر', 'blood pressure', 'hypertension', 'pressure', 'heart', 'pulse', 'bp'],
  },
  {
    id: 's-stomach',
    icon: Activity,
    textAr: 'علاج مغص المعدة والحموضة وانتفاخ القولون العصبي',
    textEn: 'Relief for stomach cramps, acid reflux & IBS bloating',
    promptAr: 'إيه هي أسباب مغص المعدة والحموضة المتكررة وإزاي أهدي القولون بطرق طبيعية؟',
    promptEn: 'What causes frequent stomach cramps and acid reflux, and how to calm irritable bowel naturally?',
    keywords: ['معدة', 'بطن', 'مغص', 'حموضة', 'حرقان', 'قولون', 'اسهال', 'ترجيع', 'امساك', 'stomach', 'cramp', 'acid', 'reflux', 'heartburn', 'colon', 'ibs', 'nausea', 'diarrhea'],
  },
  {
    id: 's-fever',
    icon: Thermometer,
    textAr: 'التعامل السليم مع السخونية ونزلات البرد والكحة',
    textEn: 'Safe management of fever, cold, flu & persistent cough',
    promptAr: 'إيه خطوات تخفيض درجة الحرارة المرتفعة بأمان للكبار والأطفال وإمتى تستدعي الطوارئ؟',
    promptEn: 'What are safe home steps to reduce a high fever and when is medical care urgent?',
    keywords: ['سخونية', 'حرارة', 'برد', 'زكام', 'انفلونزا', 'كحة', 'سعال', 'احتقان', 'حلق', 'fever', 'cold', 'flu', 'cough', 'temperature', 'sore throat'],
  },
  {
    id: 's-sleep',
    icon: MoonIcon,
    textAr: 'طرق التخلص من الأرق وتحسين جودة النوم والتوتر',
    textEn: 'Overcoming insomnia, managing stress & deeper sleep',
    promptAr: 'إيه أفضل النصايح الطبية للمساعدة على النوم العميق والتخلص من الأرق والتوتر العصبي؟',
    promptEn: 'What are top medical tips for deep restorative sleep and relieving sleep anxiety?',
    keywords: ['نوم', 'ارق', 'توتر', 'قلق', 'تفكير', 'اعصاب', 'sleep', 'insomnia', 'stress', 'anxiety', 'relax'],
  },
  {
    id: 's-back-joints',
    icon: Stethoscope,
    textAr: 'تخفيف آلام أسفل الظهر والرقبة وخشونة المفاصل',
    textEn: 'Relieving lower back, neck pain & joint stiffness',
    promptAr: 'إيه النصايح والإرشادات لتخفيف وجع أسفل الظهر والرقبة الناتج عن الجلوس الطويل؟',
    promptEn: 'What are best tips and light exercises to relieve lower back and neck strain?',
    keywords: ['ظهر', 'رقبة', 'مفاصل', 'عظام', 'ركبة', 'فقرات', 'غضروف', 'كتف', 'back', 'neck', 'spine', 'joint', 'knee', 'bone', 'shoulder'],
  },
  {
    id: 's-diabetes',
    icon: ShieldAlert,
    textAr: 'علامات هبوط السكر المفاجئ وإسعافه السريع',
    textEn: 'Sudden hypoglycemia signs & rapid emergency response',
    promptAr: 'إيه هي أعراض هبوط السكر المفاجئ لمرضى السكري وإيه التصرف الإسعافي السريع؟',
    promptEn: 'What are the red flags of sudden low blood sugar and the quick response protocol?',
    keywords: ['سكر', 'هبوط', 'غيبوبة', 'تحليل', 'تراكمي', 'diabetes', 'sugar', 'glucose', 'hypo'],
  },
  {
    id: 's-child',
    icon: Baby,
    textAr: 'إرشادات تسنين الأطفال والتعامل مع حرارة الرضع',
    textEn: 'Infant teething signs & baby fever care guidelines',
    promptAr: 'إيه أعراض تسنين الأطفال الطبيعية وإزاي نخفف وجع اللثة ونراقب حرارة الرضيع بأمان؟',
    promptEn: 'What are natural infant teething symptoms and safe ways to soothe gum pain?',
    keywords: ['طفل', 'اطفال', 'بيبي', 'رضيع', 'تسنين', 'تطعيم', 'حرارة اطفال', 'baby', 'child', 'infant', 'teething', 'pediatric'],
  },
  {
    id: 's-breathing',
    icon: Wind,
    textAr: 'إرشادات نوبات ضيق التنفس وحساسية الصدر',
    textEn: 'Shortness of breath guidelines & chest tightness tips',
    promptAr: 'إيه الوضعيات الآمنة للتنفس لو حسيت بكتمة مفاجئة في الصدر وإمتى أروح الطوارئ فوراً؟',
    promptEn: 'What are safe breathing postures for chest tightness and when to call emergency?',
    keywords: ['تنفس', 'كتمة', 'صدر', 'نهجان', 'ربو', 'حساسية صدر', 'breath', 'breathing', 'asthma', 'shortness of breath', 'wheezing'],
  },
];

// Helper to normalize Arabic and English text for matching
function normalizeSearchText(str: string): string {
  return str
    .toLowerCase()
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[ًٌٍَُِّْ]/g, '') // remove diacritics
    .replace(/[^\w\s\u0600-\u06FF]/g, ' ')
    .trim();
}

export const ChatView: React.FC<ChatViewProps> = ({
  messages,
  onSendMessage,
  onClearChat,
  onNewChat,
  sessions,
  currentSessionId,
  onSelectSession,
  onDeleteSession,
  onClearAllSessions,
  isLoading,
  lang,
  isSidebarOpen,
  setIsSidebarOpen,
}) => {
  const isAr = lang === 'ar';
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const bottomTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Audio recording & recognition refs
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<any>(null);

  // 1. Rotating H1 State (automatically rotates every 30s with smooth transition)
  const [headlineIndex, setHeadlineIndex] = useState(0);
  const [isHeadlineFading, setIsHeadlineFading] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setIsHeadlineFading(true);
      setTimeout(() => {
        setHeadlineIndex((prev) => (prev + 1) % HELP_HEADLINES.length);
        setIsHeadlineFading(false);
      }, 300);
    }, 30000); // 30 seconds interval as requested (نص دقيقة)

    return () => clearInterval(timer);
  }, []);

  // 2. Dynamic live matching question suggestions based on user prompt
  const matchedSuggestions = useMemo(() => {
    const rawQuery = inputText.trim();
    if (!rawQuery) {
      // Return 4 balanced default suggestions when empty
      return SUGGESTIONS_BANK.slice(0, 4);
    }

    const normQuery = normalizeSearchText(rawQuery);
    const queryWords = normQuery.split(/\s+/).filter(Boolean);

    // Filter from bank
    const matched = SUGGESTIONS_BANK.filter((item) => {
      const normAr = normalizeSearchText(item.textAr);
      const normEn = normalizeSearchText(item.textEn);
      const normPromptAr = normalizeSearchText(item.promptAr);
      const normPromptEn = normalizeSearchText(item.promptEn);
      const normKeywords = item.keywords.map(normalizeSearchText);

      // Substring match
      if (
        normAr.includes(normQuery) ||
        normEn.includes(normQuery) ||
        normPromptAr.includes(normQuery) ||
        normPromptEn.includes(normQuery)
      ) {
        return true;
      }

      // Keyword match
      if (normKeywords.some((kw) => kw.includes(normQuery) || normQuery.includes(kw))) {
        return true;
      }

      // Word match
      return queryWords.some((w) =>
        normKeywords.some((kw) => kw.includes(w)) ||
        normAr.includes(w) ||
        normEn.includes(w)
      );
    });

    if (matched.length >= 2) {
      return matched.slice(0, 4);
    }

    // Dynamic tailored prompt completions incorporating typed query
    const customItems: SuggestionItem[] = [
      ...matched,
      {
        id: `dyn-ask-${rawQuery}`,
        icon: Search,
        textAr: `اسأل صحتي عن: "${rawQuery}"`,
        textEn: `Ask Sehati about: "${rawQuery}"`,
        promptAr: `عايز أعرف معلومات طبية موثوقة وإرشادات عامة بخصوص "${rawQuery}".`,
        promptEn: `I would like to know reliable health guidance regarding "${rawQuery}".`,
        keywords: [rawQuery],
      },
      {
        id: `dyn-symptoms-${rawQuery}`,
        icon: Stethoscope,
        textAr: `ما هي أسباب وأعراض "${rawQuery}" وعلامات الخطر؟`,
        textEn: `Causes, symptoms and warning signs of "${rawQuery}"`,
        promptAr: `إيه هي أسباب وأعراض "${rawQuery}" وإمتى تعتبر مقلقة وتستدعي زيارة طبيب فوراً؟`,
        promptEn: `What are the causes and symptoms of "${rawQuery}" and when is it a red flag?`,
        keywords: [rawQuery],
      },
      {
        id: `dyn-tips-${rawQuery}`,
        icon: LifeBuoy,
        textAr: `نصائح وإرشادات وقائية للتعامل مع "${rawQuery}" بأمان`,
        textEn: `Safe prevention tips and first aid for "${rawQuery}"`,
        promptAr: `إيه هي أفضل الإرشادات والنصائح الآمنة للتعامل مع "${rawQuery}" وتجنب المضاعفات؟`,
        promptEn: `What are safe guidelines and tips to manage "${rawQuery}" and prevent issues?`,
        keywords: [rawQuery],
      },
    ];

    return customItems.slice(0, 4);
  }, [inputText]);

  // When clicking a suggestion, populate it into the text area (per request 4)
  const handleSelectSuggestion = (prompt: string) => {
    setInputText(prompt);
    if (messages.length === 0) {
      inputRef.current?.focus();
    } else {
      bottomTextareaRef.current?.focus();
    }
  };

  // 3. Delete Confirmation Dialog State & Sidebar Search
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const [showClearAllConfirm, setShowClearAllConfirm] = useState(false);
  const [sidebarSearchQuery, setSidebarSearchQuery] = useState('');

  const filteredSessions = useMemo(() => {
    const q = sidebarSearchQuery.trim().toLowerCase();
    if (!q) return sessions;
    return sessions.filter((s) => {
      const matchTitle = s.title.toLowerCase().includes(q);
      const matchMessage = s.messages?.some((m) => m.text.toLowerCase().includes(q));
      return matchTitle || matchMessage;
    });
  }, [sessions, sidebarSearchQuery]);

  const confirmDeleteSession = () => {
    if (sessionToDelete) {
      onDeleteSession(sessionToDelete, { stopPropagation: () => {} } as any);
      setSessionToDelete(null);
    }
  };

  const confirmClearAll = () => {
    onClearAllSessions();
    setShowClearAllConfirm(false);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Clean up mic and recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim() || isLoading) return;
    const text = inputText;
    setInputText('');
    onSendMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Robust Voice Input System - No banner underneath, writes text to text area instead of auto-sending
  const startListening = async () => {
    try {
      if (!navigator?.mediaDevices?.getUserMedia) {
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      audioChunksRef.current = [];

      const supportedMime = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : '';

      const recorder = supportedMime
        ? new MediaRecorder(stream, { mimeType: supportedMime })
        : new MediaRecorder(stream);

      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };
      recorder.start(250);

      setIsListening(true);

      const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRec) {
        try {
          const recognition = new SpeechRec();
          recognitionRef.current = recognition;
          recognition.lang = isAr ? 'ar-EG' : 'en-US';
          recognition.continuous = false;
          recognition.interimResults = true;

          recognition.onresult = (event: any) => {
            let interim = '';
            let final = '';
            for (let i = 0; i < event.results.length; i++) {
              if (event.results[i].isFinal) {
                final += event.results[i][0].transcript;
              } else {
                interim += event.results[i][0].transcript;
              }
            }
            const spoken = (final || interim).trim();
            if (spoken) {
              // Write directly to text area
              setInputText(spoken);
            }
          };

          recognition.onerror = (e: any) => {
            console.warn('SpeechRecognition notice:', e.error);
          };

          recognition.onend = () => {
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
              stopListening();
            }
          };

          recognition.start();
        } catch (e) {
          console.warn('Speech recognition start note:', e);
        }
      }
    } catch (err: any) {
      console.warn('Microphone access notice:', err?.name || err?.message || err);
      setIsListening(false);
    }
  };

  const stopListening = async () => {
    setIsListening(false);

    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {}
      recognitionRef.current = null;
    }

    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      recorder.stop();
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    // Focus input so user can review/edit the transcribed text
    setTimeout(() => {
      if (messages.length === 0) {
        inputRef.current?.focus();
      } else {
        bottomTextareaRef.current?.focus();
      }
    }, 100);

    // If Web Speech already wrote into inputText, done!
    if (inputText.trim()) {
      return;
    }

    // Otherwise transcribe audio blob via Gemini backend into text area
    try {
      await new Promise((r) => setTimeout(r, 250));
      const blob = new Blob(audioChunksRef.current, {
        type: recorder?.mimeType || 'audio/webm',
      });

      if (blob.size > 2000) {
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64Audio = (reader.result as string)?.split(',')[1];
          if (base64Audio) {
            try {
              const res = await fetch('/api/transcribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  audio: base64Audio,
                  mimeType: recorder?.mimeType || 'audio/webm',
                }),
              });

              if (res.ok) {
                const data = await res.json();
                if (data.transcript && data.transcript.trim()) {
                  // Write directly to text area without auto-sending!
                  setInputText(data.transcript.trim());
                  if (messages.length === 0) {
                    inputRef.current?.focus();
                  } else {
                    bottomTextareaRef.current?.focus();
                  }
                }
              }
            } catch (e) {
              console.warn('Transcription notice:', e);
            }
          }
        };
        reader.readAsDataURL(blob);
      }
    } catch {
      // Quiet failover
    }
  };

  const handleToggleMic = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp);
    const today = new Date();
    const isToday =
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear();

    if (isToday) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString([], { month: 'numeric', day: 'numeric' });
  };

  return (
    <div className="flex h-full max-h-full w-full max-w-7xl mx-auto my-auto px-2 sm:px-4 py-2 gap-2.5 relative overflow-hidden items-center justify-center">
      {/* 1. Toggleable Sidebar (Compact & sized cleanly to viewport) */}
      <aside
        className={`transition-all duration-300 ease-in-out shrink-0 h-full flex flex-col bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-2xl shadow-xs overflow-hidden ${
          isSidebarOpen
            ? 'w-60 sm:w-64 opacity-100'
            : 'w-0 opacity-0 -me-2.5 pointer-events-none border-0 p-0'
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-2.5 border-b border-slate-200/70 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="font-bold text-xs text-slate-900 dark:text-white">
              {isAr ? 'سجل المحادثات' : 'Chat History'}
            </span>
          </div>

          <button
            onClick={() => setIsSidebarOpen(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
            title={isAr ? 'إخفاء السجل' : 'Hide history'}
          >
            <PanelLeftClose className={`w-4 h-4 ${isAr ? '' : 'rotate-180'}`} />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="p-2 border-b border-slate-200/70 dark:border-slate-800 shrink-0">
          <button
            onClick={onNewChat}
            className="w-full py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isAr ? 'محادثة جديدة' : 'New Chat'}</span>
          </button>
        </div>

        {/* Search Bar in Sidebar */}
        <div className="p-2 border-b border-slate-200/70 dark:border-slate-800 shrink-0">
          <div className="relative flex items-center">
            <Search className="w-3 h-3 text-slate-400 absolute start-2 pointer-events-none" />
            <input
              type="text"
              value={sidebarSearchQuery}
              onChange={(e) => setSidebarSearchQuery(e.target.value)}
              placeholder={isAr ? 'بحث في المحادثات...' : 'Search past chats...'}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs py-1.5 ps-7 pe-6 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
            />
            {sidebarSearchQuery && (
              <button
                type="button"
                onClick={() => setSidebarSearchQuery('')}
                className="absolute end-1.5 p-0.5 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                title={isAr ? 'مسح البحث' : 'Clear search'}
              >
                <X className="w-2.5 h-2.5" />
              </button>
            )}
          </div>
        </div>

        {/* Sessions List */}
        <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-1.5 no-scrollbar">
          {sessions.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-3 text-slate-400 text-xs">
              <p>{isAr ? 'مفيش محادثات سابقة' : 'No previous chats'}</p>
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-3 text-slate-400 text-xs">
              <p>{isAr ? 'لا توجد نتائج مطابقة' : 'No matches found'}</p>
              <button
                onClick={() => setSidebarSearchQuery('')}
                className="mt-1 text-[11px] text-emerald-600 hover:underline cursor-pointer"
              >
                {isAr ? 'إلغاء الفلترة' : 'Clear filter'}
              </button>
            </div>
          ) : (
            filteredSessions.map((session) => {
              const isActive = session.id === currentSessionId;
              return (
                <div
                  key={session.id}
                  onClick={() => onSelectSession(session.id)}
                  className={`p-2 rounded-xl border text-xs cursor-pointer transition-all flex items-start justify-between gap-1.5 ${
                    isActive
                      ? 'border-emerald-500/80 bg-emerald-500/10 dark:bg-emerald-950/50 text-emerald-950 dark:text-emerald-100 font-bold ring-1 ring-emerald-500/20'
                      : 'border-slate-200/70 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:border-emerald-300 dark:hover:border-emerald-700 hover:bg-slate-200/60 dark:hover:bg-slate-800/70'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-xs font-semibold">{session.title}</p>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      {formatDate(session.updatedAt)}
                    </span>
                  </div>

                  {/* Delete Button with Confirmation trigger */}
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

        {/* Clear All Sessions */}
        {sessions.length > 0 && (
          <div className="p-2 border-t border-slate-200/70 dark:border-slate-800 shrink-0 flex items-center justify-end">
            <button
              onClick={() => setShowClearAllConfirm(true)}
              className="py-1 px-2 text-slate-400 hover:text-red-600 font-semibold flex items-center gap-1 transition-colors cursor-pointer text-[11px]"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{isAr ? 'مسح الكل' : 'Clear All'}</span>
            </button>
          </div>
        )}
      </aside>

      {/* 2. Main Chat Column - strictly fits within viewport and centered */}
      <div className="flex-1 min-h-0 flex flex-col h-full relative overflow-hidden items-center justify-center w-full">
        {/* Pinned History Toggle Button - Fixed outside scroll area so it never scrolls with chat */}
        {!isSidebarOpen && (
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="absolute top-2.5 start-2.5 z-30 flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-white/95 dark:bg-zinc-800/95 backdrop-blur-xs border border-emerald-200 dark:border-zinc-700 hover:bg-emerald-100 dark:hover:bg-zinc-700 px-3 py-1 rounded-full transition-colors cursor-pointer shadow-xs"
          >
            <PanelLeftOpen className={`w-3.5 h-3.5 ${isAr ? '' : 'rotate-180'}`} />
            <span>{isAr ? 'سجل المحادثات' : 'History'}</span>
          </button>
        )}

        {/* Messages / Welcome View Scroll Area */}
        <div
          className={`flex-1 min-h-0 w-full ${
            messages.length === 0
              ? 'overflow-hidden flex flex-col items-center justify-center'
              : 'overflow-y-auto flex flex-col justify-between pt-9'
          } overflow-x-hidden px-2 sm:px-3 py-1 relative`}
        >

          {/* Active conversation messages */}
          {messages.length > 0 && (
            <div className="max-w-3xl w-full mx-auto space-y-3.5 relative z-10 px-1 sm:px-2 pb-2">
              {messages.map((m) => (
                <MessageItem key={m.id} message={m} lang={lang} />
              ))}

              {/* Thinking Indicator */}
              {isLoading && (
                <div className="flex items-center gap-1.5 py-3 px-2 text-zinc-400 dark:text-zinc-500" aria-label="Thinking">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 dark:bg-emerald-400 animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 dark:bg-emerald-400 animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 dark:bg-emerald-400 animate-bounce"></span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}

          {/* NEW CHAT EMPTY STATE - Centered Minimal Layout */}
          {messages.length === 0 && (
            <div className="relative my-auto py-4 sm:py-6 px-3 flex flex-col items-center justify-center max-w-3xl w-full mx-auto animate-in fade-in duration-300">
              {/* Smaller Rotating Headline */}
              <div className="w-full text-center mb-4 sm:mb-5">
                <h1
                  className={`text-base sm:text-xl font-normal text-zinc-800 dark:text-zinc-100 text-center tracking-normal transition-all duration-300 min-h-[2.2rem] flex items-center justify-center select-none ${
                    isHeadlineFading ? 'opacity-0 -translate-y-1 scale-98' : 'opacity-100 translate-y-0 scale-100'
                  }`}
                >
                  {isAr ? HELP_HEADLINES[headlineIndex].ar : HELP_HEADLINES[headlineIndex].en}
                </h1>
              </div>

              {/* Enlarged Text Area Pill Input (max-w-3xl, spacious & comfortable) */}
              <form onSubmit={handleSubmit} className="w-full max-w-3xl">
                <div className="w-full flex items-center gap-3 bg-white/95 dark:bg-[#1e1e1e]/95 backdrop-blur-md px-5 sm:px-6 py-3.5 sm:py-4 rounded-[30px] border-2 border-emerald-500/40 dark:border-emerald-500/35 shadow-[0_6px_35px_rgba(16,185,129,0.22)] dark:shadow-[0_6px_40px_rgba(16,185,129,0.28)] hover:border-emerald-500/60 focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/20 focus-within:shadow-[0_8px_45px_rgba(16,185,129,0.35)] transition-all">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={isAr ? 'اسأل صحتي' : 'Ask Sehati'}
                    className="flex-1 bg-transparent border-0 text-base sm:text-lg focus:outline-hidden text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 px-1"
                  />

                  {/* Microphone Icon with animated state */}
                  <button
                    type="button"
                    onClick={handleToggleMic}
                    className={`p-2.5 rounded-full transition-all cursor-pointer flex items-center justify-center shrink-0 ${
                      isListening
                        ? 'bg-red-500 text-white animate-pulse shadow-md ring-4 ring-red-400/40'
                        : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-black/5 dark:hover:bg-white/10'
                    }`}
                    title={isListening ? (isAr ? 'اضغط لإيقاف التسجيل' : 'Click to stop') : (isAr ? 'تسجيل صوتي' : 'Voice input')}
                  >
                    {isListening ? <MicOff className="w-4 h-4 animate-bounce" /> : <Mic className="w-4 h-4" />}
                  </button>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={!inputText.trim() || isLoading}
                    className="p-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-35 text-white rounded-full transition-all flex items-center justify-center cursor-pointer shrink-0 shadow-xs"
                    title={isAr ? 'إرسال' : 'Send'}
                  >
                    <Send className={`w-4 h-4 ${isAr ? 'rotate-180' : ''}`} />
                  </button>
                </div>
              </form>

              {/* Questions List ONLY (default when empty, matched when typing) - Clean text buttons without bounded rectangles */}
              <div className="w-full max-w-3xl mt-3 sm:mt-4 animate-in fade-in duration-200">
                <div
                  className={`space-y-2 text-start max-h-56 overflow-y-auto no-scrollbar px-1 relative ${
                    isAr ? '-translate-x-[0.5cm]' : 'translate-x-[0.5cm]'
                  }`}
                >
                  {matchedSuggestions.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelectSuggestion(isAr ? item.promptAr : item.promptEn)}
                      disabled={isLoading}
                      className="w-full text-start py-1.5 text-sm sm:text-[15px] font-normal text-zinc-700 dark:text-zinc-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer block select-none focus:outline-hidden"
                    >
                      {isAr ? item.textAr : item.textEn}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Pinned Bottom Input Form when conversation has messages */}
        {messages.length > 0 && (
          <div className="shrink-0 w-full pt-1 pb-1">
            {/* Live matching suggestion chips above bottom bar as user types */}
            {inputText.trim().length > 0 && (
              <div className="mb-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 max-w-3xl mx-auto">
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 px-1 shrink-0 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  {isAr ? 'مقترحات:' : 'Matches:'}
                </span>
                {matchedSuggestions.slice(0, 3).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectSuggestion(isAr ? item.promptAr : item.promptEn)}
                    className="shrink-0 flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] bg-white/90 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-emerald-500/30 hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer shadow-2xs"
                  >
                    <span className="truncate max-w-[220px]">{isAr ? item.textAr : item.textEn}</span>
                  </button>
                ))}
              </div>
            )}

            <form onSubmit={handleSubmit} className="w-full max-w-3xl mx-auto">
              <div className="w-full flex items-center gap-2 bg-[#f4f4f4] dark:bg-[#262626] p-2.5 sm:p-3 rounded-[26px] border-2 border-emerald-500/30 dark:border-emerald-500/25 shadow-xs focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:shadow-[0_2px_20px_rgba(16,185,129,0.18)] transition-all">
                <textarea
                  ref={bottomTextareaRef}
                  rows={1}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={isAr ? 'اكتب سؤالك لـ صحتي...' : 'Ask Sehati a question...'}
                  className="flex-1 bg-transparent border-0 resize-none text-[15px] sm:text-[16px] focus:outline-hidden text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 px-3 py-1 max-h-28"
                />

                <button
                  type="button"
                  onClick={handleToggleMic}
                  className={`p-2 rounded-full transition-all cursor-pointer flex items-center justify-center shrink-0 ${
                    isListening
                      ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse shadow-md ring-2 ring-red-400/50'
                      : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-black/5 dark:hover:bg-white/10'
                  }`}
                  title={isListening ? (isAr ? 'اضغط لإيقاف التسجيل' : 'Stop recording') : (isAr ? 'تسجيل صوتي' : 'Voice input')}
                >
                  {isListening ? <MicOff className="w-4 h-4 animate-bounce" /> : <Mic className="w-4 h-4" />}
                </button>

                <button
                  type="submit"
                  disabled={!inputText.trim() || isLoading}
                  className="p-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-35 text-white rounded-full transition-all flex items-center justify-center font-bold text-xs cursor-pointer shadow-xs shrink-0"
                  title={isAr ? 'إرسال' : 'Send'}
                >
                  <Send className={`w-4 h-4 ${isAr ? 'rotate-180' : ''}`} />
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Confirmation Modal: "هل تريد حذف المحادثة؟" */}
      {sessionToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl max-w-xs sm:max-w-sm w-full p-5 text-center animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 mx-auto flex items-center justify-center mb-3.5">
              <Trash2 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1.5">
              {isAr ? 'هل تريد حذف المحادثة؟' : 'Delete conversation?'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-5 leading-relaxed">
              {isAr
                ? 'سيتم حذف رسائل هذه المحادثة بشكل نهائي ولا يمكن استرجاعها.'
                : 'This chat history will be permanently deleted and cannot be recovered.'}
            </p>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setSessionToDelete(null)}
                className="flex-1 py-2 px-3 text-xs font-semibold rounded-xl border border-slate-200 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={confirmDeleteSession}
                className="flex-1 py-2 px-3 text-xs font-bold rounded-xl bg-red-600 hover:bg-red-700 text-white transition-colors cursor-pointer shadow-xs"
              >
                {isAr ? 'حذف' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: "مسح كل المحادثات" */}
      {showClearAllConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl max-w-xs sm:max-w-sm w-full p-5 text-center animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center mb-3.5">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1.5">
              {isAr ? 'مسح كل سجل المحادثات؟' : 'Clear all chat history?'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-5 leading-relaxed">
              {isAr
                ? 'سيتم مسح جميع المحادثات السابقة بالكامل.'
                : 'All previous conversations will be permanently deleted.'}
            </p>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setShowClearAllConfirm(false)}
                className="flex-1 py-2 px-3 text-xs font-semibold rounded-xl border border-slate-200 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={confirmClearAll}
                className="flex-1 py-2 px-3 text-xs font-bold rounded-xl bg-red-600 hover:bg-red-700 text-white transition-colors cursor-pointer shadow-xs"
              >
                {isAr ? 'مسح الكل' : 'Clear All'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
