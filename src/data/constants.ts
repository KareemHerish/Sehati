/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { EmergencyContact, TriageLevel } from '../types';

export const RED_FLAGS_LIST = [
  { ar: 'وجع شديد في الصدر', en: 'Severe chest pain' },
  { ar: 'مش قادر اتنفس / خنقة', en: 'Trouble breathing' },
  { ar: 'إغماء وفقدان وعي', en: 'Passing out' },
  { ar: 'نزيف جامد مش بيقف', en: 'Heavy bleeding' },
  { ar: 'تفكير في الموت أو إيذاء النفس', en: 'Suicide or self-harm thoughts' },
  { ar: 'شلل في الوش أو ثقل لسان (جلطة)', en: 'Face droop / Slurred speech' }
];

export const REFUSAL_CATEGORIES = [
  {
    categoryAr: 'جرعات الأدوية',
    categoryEn: 'Medication Dosing',
    descAr: 'ممنوع الذكاء الاصطناعي يقولك تاخد كام حبة أو كام مل، لازم صيدلي أو دكتور.',
    descEn: 'AI cannot calculate pill counts or dosages. Ask a doctor or pharmacist.',
    examples: ['كام حبة بنادول؟', 'جرعة المضاد للطفل', 'How many mg of paracetamol?']
  },
  {
    categoryAr: 'التشخيص الطبي',
    categoryEn: 'Medical Diagnosis',
    descAr: 'التشخيص محتاج كشف وتحاليل، الذكاء الاصطناعي مش بيكشف.',
    descEn: 'Diagnosis requires laboratory tests and physical examination.',
    examples: ['شخصني عندي سكر؟', 'راسي وجعاني عندي ايه؟', 'Diagnose me: do I have COVID?']
  }
];

export const PRESET_QUERIES = [
  {
    id: 'chest_pain',
    type: 'red_flag',
    labelAr: '🚨 وجع في صدري',
    labelEn: '🚨 Chest Pain',
    promptAr: 'حاسس بوجع جامد وضغط في صدري مسمّع في دراعي الشمال',
    promptEn: 'Severe crushing chest pain radiating to my left arm',
  },
  {
    id: 'cant_breathe',
    type: 'red_flag',
    labelAr: '🚨 مش قادر اتنفس',
    labelEn: '🚨 Trouble Breathing',
    promptAr: 'مش قادر اتنفس ومخنوق خالص',
    promptEn: 'I cannot breathe and feel suffocated',
  },
  {
    id: 'paracetamol_dose',
    type: 'refused',
    labelAr: '🟡 كام حبة بنادول؟',
    labelEn: '🟡 Pill Dose',
    promptAr: 'اخد كام قرص بنادول أو باراسيتامول في اليوم للصداع؟',
    promptEn: 'What is the dosage of paracetamol pills per day?',
  },
  {
    id: 'diagnose_me',
    type: 'refused',
    labelAr: '🟡 شخصني: عندي سكر؟',
    labelEn: '🟡 Diagnose Me',
    promptAr: 'شخصني: هل عندي سكر عشان بعطش كتير وبدخل الحمام كتير؟',
    promptEn: 'Diagnose me: do I have diabetes because I am thirsty?',
  },
  {
    id: 'diabetes_edu',
    type: 'safe',
    labelAr: '🟢 إيه هو السكر؟',
    labelEn: '🟢 What is Diabetes?',
    promptAr: 'إيه هو مرض السكر وإيه الفرق بين النوع الأول والتاني وإزاي احمي نفسي؟',
    promptEn: 'What is diabetes, what is the difference between Type 1 and 2, and how to prevent it?',
  },
  {
    id: 'hypertension_edu',
    type: 'safe',
    labelAr: '🟢 الضغط العالي',
    labelEn: '🟢 High Blood Pressure',
    promptAr: 'إيه أعراض الضغط العالي وإمتى اروح لدكتور فوراً؟',
    promptEn: 'What are the symptoms of high blood pressure and when should I see a doctor?',
  },
  {
    id: 'heart_health',
    type: 'safe',
    labelAr: '🟢 نصايح لصحة القلب',
    labelEn: '🟢 Heart Health',
    promptAr: 'إزاي أحافظ على صحة قلبي وشراييني بنصايح سهلة؟',
    promptEn: 'Simple lifestyle tips to keep my heart healthy',
  }
];

export const EMERGENCY_CONTACTS: EmergencyContact[] = [
  {
    country: 'مصر',
    code: 'EG',
    ambulance: '123',
    police: '122',
    fire: '180',
    hotline: '137 (طوارئ الصحة)',
    poisonControl: '02-23640248 (مركز السموم)'
  },
  {
    country: 'السعودية',
    code: 'SA',
    ambulance: '997',
    police: '999',
    fire: '998',
    hotline: '937'
  },
  {
    country: 'الإمارات',
    code: 'AE',
    ambulance: '998',
    police: '999',
    fire: '997',
    hotline: '800-342'
  },
  {
    country: 'الأردن',
    code: 'JO',
    ambulance: '911',
    police: '911',
    fire: '911',
    hotline: '111'
  },
  {
    country: 'الكويت',
    code: 'KW',
    ambulance: '112',
    police: '112',
    fire: '112',
    hotline: '151'
  },
  {
    country: 'أمريكا وكندا',
    code: 'US',
    ambulance: '911',
    police: '911',
    fire: '911',
    hotline: '988'
  },
  {
    country: 'بريطانيا',
    code: 'UK',
    ambulance: '999',
    police: '999',
    fire: '999',
    hotline: '111'
  },
  {
    country: 'أوروبا',
    code: 'EU',
    ambulance: '112',
    police: '112',
    fire: '112'
  }
];

export const TRIAGE_LEVELS: TriageLevel[] = [
  {
    level: 1,
    titleAr: 'طوارئ فورية 🚨',
    titleEn: 'Immediate Emergency 🚨',
    color: 'text-red-700 dark:text-red-400',
    bgLight: 'bg-red-50 dark:bg-red-950/40',
    border: 'border-red-200 dark:border-red-800',
    actionAr: 'اتصل بالإسعاف (123) فوراً. متسوقش عربيتك بنفسك.',
    actionEn: 'Call Emergency (123 / 911) now. Do not drive yourself.',
    examplesAr: [
      'وجع عاصر أو ضغط في الصدر مع عرق ودوخة',
      'خنقة شديدة ومش قادر تاخد نفسك',
      'إغماء مفاجئ أو تشنجات',
      'شلل في الوش أو ثقل في اللسان (جلطة)',
      'نزيف جامد مش راضي يقف'
    ],
    examplesEn: [
      'Crushing chest pain radiating to arm or jaw',
      'Severe breathlessness, unable to speak',
      'Sudden loss of consciousness',
      'Stroke signs: Facial droop, slurred speech',
      'Heavy uncontrolled bleeding'
    ]
  },
  {
    level: 2,
    titleAr: 'روح لدكتور النهارده ⚠️',
    titleEn: 'See a Doctor Today ⚠️',
    color: 'text-amber-700 dark:text-amber-400',
    bgLight: 'bg-amber-50 dark:bg-amber-950/40',
    border: 'border-amber-200 dark:border-amber-800',
    actionAr: 'احجز مع دكتور أو روح عيادة طوارئ خلال 24 ساعة.',
    actionEn: 'Book a doctor visit or visit urgent care within 24h.',
    examplesAr: [
      'سخونية عالية بقالها أكتر من 3 أيام مش بتنزل',
      'وجع بطن شديد مستمر مع ترجيع مستمر',
      'التهاب زور جامد ومش عارف تبلع ريقك',
      'جرح غويط محتاج خياطة'
    ],
    examplesEn: [
      'High fever > 3 days not responding to meds',
      'Severe abdominal pain with continuous vomiting',
      'Severe throat pain and inability to swallow',
      'Deep cut requiring stitches'
    ]
  },
  {
    level: 3,
    titleAr: 'عناية في البيت 🟢',
    titleEn: 'Home Care & Routine 🟢',
    color: 'text-teal-700 dark:text-teal-400',
    bgLight: 'bg-teal-50 dark:bg-teal-950/40',
    border: 'border-teal-200 dark:border-teal-800',
    actionAr: 'ارتاح، اشرب سوايل دافية، ومتابعة عادية مع دكتورك.',
    actionEn: 'Rest at home, drink fluids, and routine checkups.',
    examplesAr: [
      'دور برد عادي ورشح وعطس',
      'كحة خفيفة من غير ضيق نفس',
      'متابعة روتينية للضغط أو السكر',
      'نصايح أكل ورياضة'
    ],
    examplesEn: [
      'Common cold (runny nose, sneezing)',
      'Mild cough without breathlessness',
      'Routine chronic disease follow-up',
      'General nutrition & exercise advice'
    ]
  }
];

export const VITAL_SIGNS_REFERENCE = [
  {
    parameterAr: 'ضغط الدم',
    parameterEn: 'Blood Pressure',
    normal: 'أقل من 120 / 80',
    normalEn: '< 120 / 80',
    warning: '120-139 / 80-89 (ما قبل الارتفاع)',
    emergency: 'أعلى من 180 / 120 (خطر جداً!)'
  },
  {
    parameterAr: 'السكر الصائم',
    parameterEn: 'Fasting Blood Sugar',
    normal: '70 - 99 ملغ/دل',
    normalEn: '70 - 99 mg/dL',
    warning: '100 - 125 (مرحلة ما قبل السكر)',
    emergency: 'أقل من 55 أو أكتر من 300'
  },
  {
    parameterAr: 'نبضات القلب',
    parameterEn: 'Heart Rate',
    normal: '60 - 100 في الدقيقة',
    normalEn: '60 - 100 bpm',
    warning: 'أقل من 50 أو أكتر من 100',
    emergency: 'أكتر من 140 مع دوخة أو وجع صدر'
  },
  {
    parameterAr: 'درجة الحرارة',
    parameterEn: 'Body Temperature',
    normal: '36.5° - 37.5° م',
    normalEn: '36.5° - 37.5° C',
    warning: '38° - 39.5° م (سخونية)',
    emergency: 'أعلى من 40° م فوراً'
  },
  {
    parameterAr: 'نسبة الأكسجين (SpO2)',
    parameterEn: 'Oxygen (SpO2)',
    normal: '95% - 100%',
    normalEn: '95% - 100%',
    warning: '91% - 94% (قليلة)',
    emergency: '90% أو أقل (طوارئ فوراً!)'
  }
];
