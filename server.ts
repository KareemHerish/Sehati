/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Health Information Navigator - Express & Gemini Server
 */

import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isProd = process.env.NODE_ENV === 'production';
const PORT = 3000;

const app = express();
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Initialize Google Gemini Client following @google/genai guidelines
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

const MODEL = 'gemini-3.8-flash';

const SYSTEM_PROMPT = `
أنت "صحتي" (Sehati) — مرشد تثقيفي صحي ذكي بالعامية المصرية الودودة أو الإنجليزية.

🛑 القواعد الجوهرية للرد (حاسمة وصارمة جداً):
1. أجب فقط وحصراً على السؤال المحدد الذي طرحه المستخدم:
   - ممنوع منعاً باتاً الإجابة على أي أسئلة أو نقاط لم يسألها المستخدم في رسالته إطلاقاً.
   - ممنوع افتراض سيناريوهات أو أسئلة إضافية من عندك (مثل: "لو معاه ألم صدر..." أو "لو الحالة طارئة...").
   - ممنوع ذكر أرقام الطوارئ (123) أو إرشادات الإسعاف إلا إذا كان سؤال المستخدم تحديداً عن حالة إسعافية أو طارئة.
   - تجنب المقدمات الطويلة والإنشاء. ادخل في صلب الجواب مباشرة.
2. الاختصار الشديد والوضوح:
   - اجعل إجابتك موجزة، واضحة، وفي نقاط محددة وسريعة دون أي حشو أو إطالة.
3. الأمان الطبي:
   - لا تقدم تشخيصاً طبياً للمستخدم ("أنت مصاب بـ..."). اذكر أسباباً عامة شائعة فقط.
   - لا تصف أي أدوية أو جرعات أو علاجات دوائية لأي حالة.
4. تذكر سياق المحادثة:
   - افهم رسائل الحوار السابقة وأجب على أسئلة المتابعة بدقة في سياقها.
`.trim();

const EMERGENCY = (
  "🚨 دي حالة طوارئ محتملة! يُرجى الاتصال بالإسعاف فوراً على 123 (أو رقم الطوارئ في بلدك).\n\n" +
  "⚠️ إرشادات أمان فورية (معلومات إسعافية فقط - بدون علاج دوائي):\n" +
  "• اطلب المساعدة فوراً وتجنب قيادة السيارة بنفسك.\n" +
  "• اجلس أو استلقِ في وضع مريح وتنفس بهدوء.\n" +
  "• لا تتناول أي أدوية دون إشراف مباشر من المسعفين أو الطبيب.\n\n" +
  "Emergency Alert! Call 123 (or local emergency) immediately. Stay seated, do not drive, and seek urgent clinical care."
);

const REFUSAL = (
  "⚠️ فلتر الأمان: لا أستطيع تشخيص الأمراض أو تحديد أي جرعات أو أدوية علاجية.\n\n" +
  "دور 'صحتي' يقتصر على تقديم معلومات وتوعية صحية عامة وإرشادات إسعافات أولية غير دوائية فقط.\n" +
  "لتشخيص حالتك أو وصف العلاج المناسب، يُرجى استشارة الطبيب المعالج أو الصيدلي حفاظاً على سلامتك.\n\n" +
  "Safety Filter: I cannot diagnose conditions or prescribe medications/dosages. I provide health information only. Please consult a licensed physician."
);

const FALLBACK = "حصلت مشكلة مؤقتة. جرّب تاني. / Something went wrong. Please try again.";

// Red flags matching clinical variants + Egyptian Arabic dialect
const RED_FLAGS = [
  "ألم في الصدر", "الم في الصدر", "الم صدري", "وجع في صدري", "وجع شديد في صدري", "وجع في الصدر", "ألم شديد في الصدر", "صدري بيوجعني", "أزمة قلبية", "جلطة",
  "ضيق في التنفس", "ضيق تنفس", "صعوبة في التنفس", "مش قادر اتنفس", "مش عارف اتنفس", "لا أستطيع التنفس", "مخنوق", "نفسي مقطوع",
  "فقدت الوعي", "اغمى عليا", "أغمى عليا", "إغماء", "غيبوبة", "نزيف شديد", "نزيف حاد", "نزيف جامد",
  "عايز انتحر", "عايز اموت نفسي", "أفكر في إنهاء حياتي", "انتحار", "أذية نفسي",
  "chest pain", "can't breathe", "cannot breathe", "shortness of breath",
  "unconscious", "passed out", "severe bleeding", "heavy bleeding",
  "stroke", "heart attack", "suicide", "harm myself"
];

// Regex for clinical acute chest pain patterns
const RED_FLAG_REGEX = [
  /(وجع|ألم|الم|كتمة|عاصر|ضغط|نغز شديد).{0,20}(صدر|صدري)/i,
  /(chest\s*(pain|pressure|tightness))/i,
  /(cannot|can't)\s*breathe/i
];

// Dose patterns (regex)
const DOSE = [
  /جرعة/i,
  /ك[ا]?م حبة/i,
  /ك[ا]?م قرص/i,
  /ك[ا]?م كبسولة/i,
  /ك[ا]?م مل/i,
  /ك[ا]?م مللي/i,
  /ك[ا]?م ملغ/i,
  /ك[ا]?م ملجم/i,
  /ك[ا]?م نقطة/i,
  /جرعة دواء/i,
  /اخد علاج ايه/i,
  /\bdose\b/i,
  /\bdosage\b/i,
  /how many (pills|tablets|mg|capsules|drops)/i,
  /how much (medicine|paracetamol|ibuprofen|panadol)/i
];

// Diagnosis patterns (regex)
const DIAG = [
  /هل (أنا )?مصاب/i,
  /شخص(ني|لي)/i,
  /شخص مرضي/i,
  /عندي ايه/i,
  /عندي إيه/i,
  /انا عندي ايه/i,
  /ماذا أعاني/i,
  /مرضي ايه/i,
  /diagnose me/i,
  /do i have/i,
  /what disease do i have/i
];

export interface SafetyCheckResult {
  status: 'safe' | 'red_flag' | 'refused';
  reply: string | null;
  triggerType?: string;
  matchedPattern?: string;
}

export function safetyFilter(text: string): SafetyCheckResult {
  const t = (text || '').toLowerCase().trim();

  // 1. Red Flag Emergency Check (Strings)
  for (const flag of RED_FLAGS) {
    if (t.includes(flag.toLowerCase())) {
      return {
        status: 'red_flag',
        reply: EMERGENCY,
        triggerType: 'Emergency Red Flag',
        matchedPattern: flag,
      };
    }
  }

  // Red Flag Emergency Check (Regex)
  for (const pattern of RED_FLAG_REGEX) {
    if (pattern.test(t)) {
      return {
        status: 'red_flag',
        reply: EMERGENCY,
        triggerType: 'Emergency Red Flag',
        matchedPattern: pattern.source,
      };
    }
  }

  // 2. Dosage Check
  for (const pattern of DOSE) {
    if (pattern.test(t)) {
      return {
        status: 'refused',
        reply: REFUSAL,
        triggerType: 'Medication Dosage Query',
        matchedPattern: pattern.source,
      };
    }
  }

  // 3. Diagnosis Check
  for (const pattern of DIAG) {
    if (pattern.test(t)) {
      return {
        status: 'refused',
        reply: REFUSAL,
        triggerType: 'Clinical Diagnosis Query',
        matchedPattern: pattern.source,
      };
    }
  }

  return { status: 'safe', reply: null };
}

// Emergency Directory Data
const EMERGENCY_CONTACTS = [
  {
    country: 'مصر (Egypt)',
    code: 'EG',
    ambulance: '123',
    police: '122',
    fire: '180',
    hotline: '137 (طوارئ الصحة)',
    poisonControl: '02-23640248 (مركز السموم بالقصر العيني)',
  },
  {
    country: 'المملكة العربية السعودية (Saudi Arabia)',
    code: 'SA',
    ambulance: '997',
    police: '999',
    fire: '998',
    hotline: '937 (مركز الصحة)',
  },
  {
    country: 'الإمارات العربية المتحدة (UAE)',
    code: 'AE',
    ambulance: '998',
    police: '999',
    fire: '997',
    hotline: '800-342',
  },
  {
    country: 'الأردن (Jordan)',
    code: 'JO',
    ambulance: '911',
    police: '911',
    fire: '911',
    hotline: '111',
  },
  {
    country: 'الولايات المتحدة وكندا (US & Canada)',
    code: 'US',
    ambulance: '911',
    police: '911',
    fire: '911',
    hotline: '988 (Suicide & Crisis Lifeline)',
  },
  {
    country: 'المملكة المتحدة (United Kingdom)',
    code: 'UK',
    ambulance: '999',
    police: '999',
    fire: '999',
    hotline: '111 (NHS non-emergency)',
  },
  {
    country: 'الاتحاد الأوروبي (European Union)',
    code: 'EU',
    ambulance: '112',
    police: '112',
    fire: '112',
    hotline: '116 123',
  },
];

// Comprehensive safe educational knowledge base answering medical and health queries
// Strictly adheres to Zero Diagnosis, Zero Medication Prescription, Information Only.
function getEducationalKnowledgeFallback(query: string): string {
  const q = query.toLowerCase();

  // First Aid - Burns
  if (q.includes('حرق') || q.includes('حروق') || q.includes('مية سخنة') || q.includes('لسعة') || q.includes('burn')) {
    return (
      "إليك خطوات الإسعافات الأولية السليمة للحروق السطحية البسيطة (معلومات وإرشادات سلامة غير دوائية):\n\n" +
      "1. التبريد الفوري: ضع المنطقة المصابة فوراً تحت ماء فاتر جارٍ (وليس مثلجاً) لمدة 15 إلى 20 دقيقة لتخفيف الحرارة وتسكين الأنسجة.\n" +
      "2. نزع الملحقات: انزع الخواتم أو الأساور أو الملابس المحيطة برفق قبل حدوث أي تورم، بشرط ألا تكون ملتصقة بمكان الحرق.\n" +
      "3. التغطية النظيفة: غطّ الحرق بضمادة شاش نظيفة ومعقمة وغير لاصقة دون شد أو ضغط.\n" +
      "⛔ تحذير أمان صارم: تجنب تماماً وضع معجون الأسنان، الثلج، الزبدة، الدقيق، أو البن على الحرق لأنها تسبب تلوثاً بكتيرياً خطيراً.\n\n" +
      "⚠️ تنبيه فلتر الأمان: لا أستطيع وصف مراهم أو مضادات حيوية أو أدوية علاجية. إذا كان الحرق عميقاً، أو يغطي مساحة واسعة، أو ظهرت فقاعات مائية، أو كان لدى طفل، يجب التوجه فوراً لقسم الطوارئ أو الاتصال بالإسعاف (123)."
    );
  }

  // First Aid - Bleeding / Wounds
  if (q.includes('نزيف') || q.includes('جرح') || q.includes('جروح') || q.includes('دم') || q.includes('bleed') || q.includes('cut') || q.includes('wound')) {
    return (
      "خطوات الإسعاف الأولي للجروح والنزيف (إرشادات سلامة أولية غير دوائية):\n\n" +
      "1. الضغط المباشر: اضغط بثبات وقوة على مكان الجرح باستخدام قماش أو شاش نظيف ومعقم لوقف تدفق الدم.\n" +
      "2. رفع العضو المصاب: إذا كان الجرح في الذراع أو الساق، ارفعها لمستوى أعلى من القلب للمساعدة في تقليل تدفق الدم.\n" +
      "3. التنظيف اللطيف: بعد توقف النزيف، اغسل حواف الجرح بلطف بالماء الفاتر والصابون غير المعطر دون فرك الأنسجة.\n" +
      "⛔ تحذير أمان: لا تضع أي مساحيق كيميائية أو بن داخل الجرح.\n\n" +
      "🚨 تنبيه طوارئ: لا أصف أي أدوية أو مراهم. إذا كان الجرح غائراً، أو كان الدم ينبض بقوة ولا يتوقف بعد 10 دقائق من الضغط، توجه فوراً لأقرب طوارئ أو اطلب الإسعاف (123)."
    );
  }

  // First Aid - Choking
  if (q.includes('اختناق') || q.includes('غصة') || q.includes('شرقان') || q.includes('شرقة') || q.includes('بلع') || q.includes('chok')) {
    return (
      "إرشادات إسعافية فورية لحالات الاختناق والغصة (لشخص بالغ واعي):\n\n" +
      "1. تشجيع السعال: إذا كان المصاب قادراً على التنفس وإصدار صوت، شجعه على السعال بقوة لطرد الجسم العالق.\n" +
      "2. 5 ضربات على الظهر: امل الشخص للأمام قليلاً واضربه 5 ضربات متتالية بكعب يدك بين لوحي الكتف.\n" +
      "3. مناورة هيمليك (ضغطات البطن): قف خلف المصاب، لف ذراعيك حول خصره، ضع قبضة يدك فوق السرة مباشرة، واضغط بقوة للداخل ولأعلى بحركات سريعة.\n\n" +
      "🚨 اتصل بالإسعاف (123) فوراً دون أي تردد إذا كان الشخص عاجزاً عن التنفس أو تحول لون شفتيه للزرقة."
    );
  }

  // First Aid - Fractures / Sprains
  if (q.includes('كسر') || q.includes('اتكسر') || q.includes('ملخ') || q.includes('التواء') || q.includes('fracture') || q.includes('sprain')) {
    return (
      "إرشادات الإسعافات الأولية للاشتباه في الكسور والالتواءات:\n\n" +
      "1. تثبيت العضو: لا تحاول تعديل شكل العظم أو تحريك الطرف المصاب أبداً.\n" +
      "2. كمادات باردة: ضع كمادات باردة ملفوفة بقماش حول المنطقة لتخفيف التورم (تجنب وضع الثلج مباشرة على الجلد).\n" +
      "3. الراحة التامة: اجعل المصاب في وضع مريح وثابت وتجنب تحميل أي وزن على الطرف.\n\n" +
      "⚠️ تنبيه: التشخيص الدقيق يتطلب فحصاً سريرياً وأشعة سينية (X-Ray). توجه فوراً للمستشفى لتقييم الكسر وعلاجه طبياً."
    );
  }

  // Chronic - Diabetes
  if (q.includes('سكري') || q.includes('سكر') || q.includes('انسولين') || q.includes('تراكمي') || q.includes('diabetes')) {
    return (
      "السكري حالة صحية مزمنة تؤثر على كيفية معالجة الجسم للسكر (الجلوكوز) في الدم.\n\n" +
      "• النوع الأول: اضطراب مناعي يتوقف فيه البنكرياس عن إنتاج الأنسولين.\n" +
      "• النوع الثاني: لا تستجيب فيه خلايا الجسم للأنسولين بكفاءة كافية (مقاومة الأنسولين)، وهو الأكثر انتشاراً.\n" +
      "• إرشادات نمط الحياة الآمنة: التركيز على الخضروات والألياف، تقليل السكريات المكررة والنشويات، ممارسة المشي 30 دقيقة يومياً، وشرب الماء الكافي.\n" +
      "• مراقبة السكر: احرص على قياس السكر بانتظام وسجل القراءات لمناقشتها مع طبيبك.\n\n" +
      "⚠️ تنبيه فلتر الأمان: لا أستطيع وصف أو تغيير أي جرعات أو أدوية (أنسولين أو أقراص). تعديل الخطة العلاجية هو اختصاص حصري لطبيب الغدد أو السكري المتابع لحالتك."
    );
  }

  // Chronic - Hypertension
  if (q.includes('ضغط') || q.includes('hypertension') || q.includes('blood pressure')) {
    return (
      "ارتفاع ضغط الدم حالة مزمنة شائعة تتطلب متابعة مستمرة للحفاظ على صحة الشرايين والقلب.\n\n" +
      "• إرشادات نمط الحياة التوعوية:\n" +
      "  - تقليل الملح: الحد من الأغذية المعلبة والمخللات (أقل من ملعقة صغيرة ملح يومياً).\n" +
      "  - النشاط البدني: رياضة هوائية خفيفة كالمشي المنتظم.\n" +
      "  - إدارة الإجهاد: النوم الجيد 7-8 ساعات وتجنب التدخين والمنبهات العالية.\n" +
      "• المتابعة: قياس الضغط في وضعية جلوس مريحة وتدوين القياسات.\n\n" +
      "⚠️ تنبيه الأمان: ممنوع إعطاء أو تعديل أدوية الضغط بدون استشارة الطبيب المعالج. إذا كان الضغط أعلى من 180/120 ومصحوباً بصداع شديد أو زغللة في العين أو ألم بالصدر فهذه طوارئ تتطلب المستشفى فوراً."
    );
  }

  // Chronic - Asthma & Respiratory
  if (q.includes('ربو') || q.includes('حساسية صدر') || q.includes('صدر') || q.includes('بلغم') || q.includes('asthma') || q.includes('cough')) {
    return (
      "معلومات تثقيفية لصحة الجهاز التنفسي والحساسية:\n\n" +
      "• المحفزات الشائعة: الغبار، حبوب اللقاح، الدخان، العطور النفاذة، وتغيرات الطقس المفاجئة.\n" +
      "• خطوات السلامة: تجنب مهيجات الهواء، التهوية الجيدة للغرف، واستخدام مرطبات الجو عند الحاجة.\n" +
      "• التهدئة الطبيعية: شرب السوائل الدافئة كالينسون والماء الدافئ مع العسل للبالغين.\n\n" +
      "🚨 تنبيه هام: لا أستطيع وصف بخاخات أو أدوية موسعة للشعب. في حال وجود صفير حاد أو صعوبة شديدة في التنفس أو زرقة في الشفاه، توجه فوراً لأقرب قسم طوارئ أو اتصل بـ 123."
    );
  }

  // Concerning - Heart & Palpitations
  if (q.includes('قلب') || q.includes('خفقان') || q.includes('نبض') || q.includes('heart') || q.includes('cardio') || q.includes('palpitation')) {
    return (
      "معلومات عامة حول صحة القلب ونبضاته:\n\n" +
      "• الخفقان العابر: قد يحدث نتيجة الإكثار من الكافيين، التوتر النفسي، قلة النوم، أو الجفاف والأنيميا.\n" +
      "• نصائح عامة: أخذ قسط من الراحة، التنفس العميق والبطيء، والحد من شرب القهوة ومشروبات الطاقة.\n\n" +
      "🚨 تنبيه طوارئ: أي ألم أو ضغط أو كتمة في منطقة الصدر، خاصة إذا امتدت للكتف أو الذراع الأيسر أو الفك، أو صاحبتها دوخة أو عرق بارد، تستدعي فوراً الاتصال بالإسعاف (123) والذهاب لأقرب طوارئ دون قيادة السيارة بنفسك."
    );
  }

  // Concerning - Headache
  if (q.includes('صداع') || q.includes('راسي') || q.includes('دماغي') || q.includes('شقيقة') || q.includes('headache') || q.includes('migraine')) {
    return (
      "معلومات توعوية حول أنواع وأسباب الصداع الشائعة:\n\n" +
      "• الصداع التوتري: الأكثر شيوعاً، ناتج عن الإجهاد، قلة النوم، أو الجلوس الطويل أمام الشاشات.\n" +
      "• الصداع النصفي: يصاحبه نبض في أحد جانبي الرأس مع حساسية للضوء والصوت.\n" +
      "• تدابير الراحة المنزلية: شرب كمية وافرة من الماء، الجلوس في غرفة معتمة وهادئة، وعمل كمادات باردة أو دافئة على الجبهة.\n\n" +
      "⚠️ تنبيه الأمان: لا أستطيع تشخيص سبب الصداع أو وصف أدوية أو مسكنات. إذا كان الصداع مفاجئاً وشديداً كالصاعقة، أو صاحبه تيبس بالرقبة أو صعوبة بالكلام أو ضعف بالأطراف، يجب الذهاب للطوارئ فوراً."
    );
  }

  // Concerning - Digestive & Stomach issues
  if (q.includes('مغص') || q.includes('بطن') || q.includes('معدة') || q.includes('قولون') || q.includes('ترجيع') || q.includes('قيء') || q.includes('اسهال') || q.includes('إسهال') || q.includes('امساك') || q.includes('حموضة') || q.includes('stomach') || q.includes('digest')) {
    return (
      "إرشادات توعوية عامة لصحة الجهاز الهضمي والاضطرابات المعوية:\n\n" +
      "• الأسباب الشائعة: عسر الهضم، حساسية طعام، فيروسات المعدة، القولون العصبي، أو تناول أطعمة دسمة وحارة.\n" +
      "• إرشادات السلامة العامة:\n" +
      "  - تعويض السوائل: شرب الماء بانتظام ومحاليل الجفاف في حال الإسهال أو القيء لتجنب الجفاف.\n" +
      "  - أطعمة خفيفة: أرز مسلوق، توست، موز، وشوربة خفيفة قليلة الدسم.\n" +
      "  - تجنب: المقليات، المشروبات الغازية، البهارات الحارة، والكافيين.\n\n" +
      "⚠️ تنبيه فلتر الأمان: لا أصف أي مضادات حيوية أو أدوية معوية. استشر الطبيب فوراً إذا كان الألم حاداً جداً ومفاجئاً، أو مصحوباً بحرارة عالية، أو قيء مستمر يعيق شرب السوائل، أو نزف."
    );
  }

  // Concerning - Fever / Cold / Flu
  if (q.includes('سخونية') || q.includes('حرارة') || q.includes('برد') || q.includes('انفلونزا') || q.includes('إنفلونزا') || q.includes('زكام') || q.includes('fever') || q.includes('cold') || q.includes('flu')) {
    return (
      "معلومات توعوية عامة حول ارتفاع درجة الحرارة وأعراض البرد:\n\n" +
      "• الطبيعة الفسيولوجية: الحمى استجابة طبيعية للجهاز المناعي لمكافحة العدوى الفيروسية أو البكتيرية.\n" +
      "• تدابير الراحة المنزلية غير الدوائية:\n" +
      "  - كمادات ماء فاتر (ليست مثلجة) على الرقبة وتحت الإبطين والجبين.\n" +
      "  - شرب كميات كافية من السوائل الدافئة والماء لمنع الجفاف.\n" +
      "  - ارتداء ملابس خفيفة والراحة التامة في مكان جيد التهوية.\n\n" +
      "⚠️ لا أستطيع وصف أي مضادات حيوية أو خافضات حرارة أو جرعات. استشر الطبيب إذا استمرت الحرارة لأكثر من 3 أيام، أو تجاوزت 39.5 درجة، أو كان المريض رضيعاً أقل من 3 أشهر."
    );
  }

  // Concerning - Dizziness & Fatigue
  if (q.includes('دوخة') || q.includes('دوار') || q.includes('ارهاق') || q.includes('إرهاق') || q.includes('تعب') || q.includes('خمول') || q.includes('dizzy') || q.includes('fatigue')) {
    return (
      "معلومات توعوية حول الشعور بالدوخة والإرهاق:\n\n" +
      "• الأسباب المحتملة الشائعة: الجفاف، قلة النوم، هبوط ضغط الدم الوضعي، الأنيميا، أو انخفاض سكر الدم.\n" +
      "• إرشادات السلامة الفورية: الجلوس أو الاستلقاء فوراً لتجنب السقوط، رفع الساقين قليلاً، وشرب كوب ماء.\n\n" +
      "⚠️ تنبيه فلتر الأمان: لا أستطيع تشخيص سبب الدوخة أو وصف علاجات. يجب مراجعة الطبيب إذا كانت الدوخة متكررة، أو مصحوبة بطنين مستمر أو ثقل في الكلام أو صعوبة بالمشي."
    );
  }

  // General Comprehensive Clinical Education Fallback
  return (
    "أهلاً بك في 'صحتي' — مرشدك التثقيفي الصحي الذكي.\n\n" +
    "معلومات عامة وإرشادات سلامة حول استفسارك:\n" +
    "• الحفاظ على توازن الجسم: شرب كميات كافية من الماء يومياً، الحصول على نوم هادئ وكافٍ (7-8 ساعات)، والحرص على التغذية المتوازنة.\n" +
    "• الملاحظة الواعية: راقب تطور الأعراض ومدتها ومحفزاتها لتدوينها ومشاركتها مع طبيبك المختص.\n" +
    "• الراحة النفسية والجسدية: تجنب الإجهاد والتوتر الزائد لأنه ينعكس مباشرة على وظائف الجسم.\n\n" +
    "🛡️ التزاماً بفلتر الأمان الطبي الصارم:\n" +
    "• أقدم معلومات وتوعية صحية عامة فقط (Information & Education Only).\n" +
    "• ممنوع تماماً التشخيص السريري أو تأكيد الإصابة بأي مرض.\n" +
    "• ممنوع تماماً وصف أو اقتراح أي أدوية، جرعات علاجية، أو مراهم لأي حالة.\n\n" +
    "👨‍⚕️ لتشخيص حالتك أو تحديد العلاج المناسب، يُرجى استشارة الطبيب المعالج أو الصيدلي المرخص. في حالات الطوارئ الحادة، اتصل فوراً بالإسعاف (123)."
  );
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Request timed out after ${ms}ms`)), ms)
    ),
  ]);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableError(err: any): boolean {
  const msg = (err?.message || String(err)).toLowerCase();
  const code = err?.status || err?.code || err?.error?.code;
  return (
    code === 503 ||
    code === 429 ||
    code === 500 ||
    msg.includes('503') ||
    msg.includes('high demand') ||
    msg.includes('unavailable') ||
    msg.includes('429') ||
    msg.includes('resource_exhausted') ||
    msg.includes('overloaded') ||
    msg.includes('rate limit')
  );
}

function formatMultiTurnContents(
  history: Array<{ role: 'user' | 'model' | 'assistant'; text: string }>,
  currentMessage: string
): Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> {
  const turns: Array<{ role: 'user' | 'model'; text: string }> = [];

  if (Array.isArray(history)) {
    for (const h of history) {
      if (h && typeof h.text === 'string' && h.text.trim()) {
        const role: 'user' | 'model' = h.role === 'model' || h.role === 'assistant' ? 'model' : 'user';
        if (turns.length > 0 && turns[turns.length - 1].role === role) {
          // Merge consecutive turns of identical role to guarantee strict turn alternation
          turns[turns.length - 1].text += `\n\n${h.text.trim()}`;
        } else {
          turns.push({ role, text: h.text.trim() });
        }
      }
    }
  }

  // Ensure history sequence begins with user
  while (turns.length > 0 && turns[0].role !== 'user') {
    turns.shift();
  }

  // Append current user message
  const cleanCurrent = currentMessage.trim();
  if (turns.length > 0 && turns[turns.length - 1].role === 'user') {
    turns[turns.length - 1].text += `\n\n${cleanCurrent}`;
  } else {
    turns.push({ role: 'user', text: cleanCurrent });
  }

  return turns.map((t) => ({
    role: t.role,
    parts: [{ text: t.text }],
  }));
}

const exhaustedModels = new Set<string>();

async function generateWithRetry(
  message: string,
  customSystemInstruction: string = SYSTEM_PROMPT,
  history: Array<{ role: 'user' | 'model' | 'assistant'; text: string }> = []
): Promise<{ replyText: string; usedModel: string }> {
  // gemini-3.1-flash-lite has higher free-tier quota and lowest latency (<2s)
  const candidateModels = ['gemini-3.1-flash-lite', 'gemini-3.8-flash'];
  const TIMEOUT_MS = 10000;

  // Build clean, alternating multi-turn contents
  const contents = formatMultiTurnContents(history, message);

  for (const modelName of candidateModels) {
    if (exhaustedModels.has(modelName)) {
      continue; // Skip models that have already exceeded daily quota limits
    }

    let attempts = 0;
    const maxAttempts = 2; // Retry transient network/503 issues once

    while (attempts < maxAttempts) {
      attempts++;
      try {
        const config: Record<string, any> = {
          systemInstruction: customSystemInstruction,
          maxOutputTokens: 500,
        };

        // gemini-3.8-flash supports ThinkingLevel.LOW for low-latency reasoning
        if (modelName === 'gemini-3.8-flash') {
          config.thinkingConfig = {
            thinkingLevel: ThinkingLevel.LOW,
          };
        }

        const response = await withTimeout(
          ai.models.generateContent({
            model: modelName,
            contents,
            config,
          }),
          TIMEOUT_MS
        );

        if (response.text && response.text.trim()) {
          return {
            replyText: response.text.trim(),
            usedModel: modelName,
          };
        }
      } catch (err: any) {
        const errMsg = (err?.message || String(err)).toLowerCase();
        const isQuota =
          errMsg.includes('quota') ||
          errMsg.includes('resource_exhausted') ||
          errMsg.includes('limit exceeded') ||
          err?.status === 429 ||
          err?.code === 429;

        if (isQuota) {
          exhaustedModels.add(modelName);
          console.warn(`Model ${modelName} reached quota limit; switching to candidate fallback.`);
          break; // Do not retry daily quota errors
        }

        console.warn(`Model ${modelName} attempt ${attempts} warning:`, err?.message || err);
        if (isRetryableError(err) && attempts < maxAttempts) {
          await sleep(200 * attempts);
          continue;
        }
        break; // Try next candidate model
      }
    }
  }

  // Gracefully serve safe clinical guidance via educational knowledge engine when models are overloaded
  const educationalReply = getEducationalKnowledgeFallback(message);
  return {
    replyText: educationalReply,
    usedModel: 'صحتي - المحرك التثقيفي الطبي',
  };
}

// Chat endpoint (matches POST /chat and /api/chat with multi-turn history)
async function handleChat(req: Request, res: Response) {
  const startTime = Date.now();
  const message = req.body?.message || req.body?.text || '';
  const history = Array.isArray(req.body?.history) ? req.body.history : [];
  const simpleMode = !!req.body?.simpleMode;
  const lang = req.body?.lang || 'ar';

  if (!message || typeof message !== 'string') {
    res.status(400).json({
      status: 'error',
      reply: 'يرجى تقديم رسالة صالحة. / Please provide a valid message.',
      seconds: 0,
    });
    return;
  }

  // Safety filter test first (exact pattern from main.py)
  const filterResult = safetyFilter(message);
  if (filterResult.reply) {
    const elapsedSeconds = Number(((Date.now() - startTime) / 1000).toFixed(2));
    res.json({
      status: filterResult.status,
      reply: filterResult.reply,
      seconds: elapsedSeconds,
      triggerType: filterResult.triggerType,
      matchedPattern: filterResult.matchedPattern,
    });
    return;
  }

  const isEnglishQuery = /[a-zA-Z]/.test(message) && !/[\u0600-\u06FF]/.test(message);

  let dynamicSystemInstruction = SYSTEM_PROMPT;
  if (lang === 'en' || (isEnglishQuery && !/بالعربي|عربي|arabic/i.test(message))) {
    dynamicSystemInstruction += `\n\n[Language: English. Answer ONLY the specific question asked. Be very concise, direct, and brief. Never answer unasked questions. Do not provide medications or diagnoses.]`;
  } else {
    dynamicSystemInstruction += `\n\n[اللغة: أجب بالعامية المصرية الودودة بإيجاز شديد. جاوب فقط وحصراً على ما سأله المستخدم تحديداً دون أي استباق أو إجابة على أسئلة لم يطرحها إطلاقاً.]`;
  }

  // Pass to Google Gemini / Guidance Engine with multi-turn history & enforced safety instructions
  try {
    const promptToSend = simpleMode
      ? `${message}\n(أجب بلغة عامية مبسطة جداً ومختصرة ومفهومة، وركّز فقط على السؤال دون أي حشو، مع الالتزام بفلتر الأمان).`
      : message;

    const { replyText, usedModel } = await generateWithRetry(promptToSend, dynamicSystemInstruction, history);
    const elapsedSeconds = Number(((Date.now() - startTime) / 1000).toFixed(2));

    res.json({
      status: 'answered',
      model: usedModel,
      reply: replyText,
      seconds: elapsedSeconds,
    });
  } catch (error: any) {
    console.info('Chat processing handled via educational safety engine:', error?.message || error);
    const fallbackReply = getEducationalKnowledgeFallback(message);
    const elapsedSeconds = Number(((Date.now() - startTime) / 1000).toFixed(2));
    res.json({
      status: 'answered',
      model: 'صحتي - المحرك التثقيفي الطبي',
      reply: fallbackReply,
      seconds: elapsedSeconds,
    });
  }
}

app.post('/chat', handleChat);
app.post('/api/chat', handleChat);

// Audio transcription endpoint using Gemini audio recognition
app.post('/api/transcribe', async (req: Request, res: Response) => {
  try {
    const { audio, mimeType } = req.body;
    if (!audio || typeof audio !== 'string') {
      res.status(400).json({ error: 'No audio data provided' });
      return;
    }

    const cleanMime = (mimeType || 'audio/webm').split(';')[0];
    const candidateModels = ['gemini-3.5-transcribe', 'gemini-3.8-flash', 'gemini-3.1-flash-lite'];

    for (const model of candidateModels) {
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const result = await withTimeout(
            ai.models.generateContent({
              model,
              contents: [
                {
                  inlineData: {
                    mimeType: cleanMime,
                    data: audio,
                  },
                },
                {
                  text: 'Transcribe this spoken Egyptian Arabic or English audio accurately into plain text. Return ONLY the transcribed text, nothing else. Do not add quotes, markdown, or commentary.',
                },
              ],
            }),
            12000
          );

          const transcript = result.text ? result.text.trim() : '';
          if (transcript) {
            res.json({ transcript });
            return;
          }
        } catch (e: any) {
          if (isRetryableError(e) && attempt === 1) {
            await sleep(500);
            continue;
          }
          break;
        }
      }
    }

    res.status(500).json({ error: 'Transcription unavailable' });
  } catch (err: any) {
    console.error('Server transcription error:', err);
    res.status(500).json({ error: 'Failed to transcribe audio' });
  }
});

// Testing filter endpoint for debugging and interactive test bench (like test_api.py)
app.post('/api/test-filter', (req: Request, res: Response) => {
  const startTime = Date.now();
  const message = req.body?.message || '';
  const result = safetyFilter(message);
  const elapsedSeconds = Number(((Date.now() - startTime) / 1000).toFixed(3));

  res.json({
    status: result.status,
    reply: result.reply,
    triggerType: result.triggerType || 'None (Safe to pass to LLM)',
    matchedPattern: result.matchedPattern || null,
    seconds: elapsedSeconds,
  });
});

// Safety rules catalog
app.get('/api/safety-rules', (_req: Request, res: Response) => {
  res.json({
    redFlags: RED_FLAGS,
    doseRegexCount: DOSE.length,
    diagRegexCount: DIAG.length,
    systemPrompt: SYSTEM_PROMPT,
    emergencyMessage: EMERGENCY,
    refusalMessage: REFUSAL,
  });
});

// Emergency contacts
app.get('/api/emergency-contacts', (_req: Request, res: Response) => {
  res.json(EMERGENCY_CONTACTS);
});

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'Health Information Navigator',
    model: MODEL,
    timestamp: new Date().toISOString(),
  });
});

// Mount Vite or static server
async function startServer() {
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Health Information Navigator running on http://0.0.0.0:${PORT}`);
  });
}

// Export express app for serverless platforms like Vercel
export default app;

// Only start the standalone HTTP listener if not running as a Vercel serverless function
if (!process.env.VERCEL) {
  startServer().catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}

