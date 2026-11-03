# خطوات نشر مشروع "صحتي" (Sehati) على Vercel 🚀

تم بالفعل تجهيز المشروع ليعمل مباشرة على Vercel كـ Full-Stack (واجهة React + خادم Express كـ Serverless Function).

---

## 1. رفع المشروع على GitHub
إذا لم تكن قد رفعت الكود على GitHub بعد:
```bash
git init
git add .
git commit -m "Prepare Sehati for Vercel deployment"
git branch -M main
git remote add origin https://github.com/<USERNAME>/<REPO_NAME>.git
git push -u origin main
```

---

## 2. النشر على Vercel
1. ادخل على [vercel.com](https://vercel.com) وسجّل الدخول بحسابك.
2. اضغط على زر **Add New...** ثم اختر **Project**.
3. اختر الـ Repository الخاص بمشروع "صحتي" واضغط **Import**.
4. ستجد الإعدادات التالية تم ضبطها تلقائياً بفضل `vercel.json`:
   - **Framework Preset:** Vite
   - **Build Command:** `vite build`
   - **Output Directory:** `dist`

---

## 3. إضافة مفتاح الذكاء الاصطناعي (Environment Variables) 🔑
قبل الضغط على **Deploy**:
1. افتح قسم **Environment Variables**.
2. أضف المتغير التالي:
   - **Key:** `GEMINI_API_KEY`
   - **Value:** مفتاح الـ API الخاص بك من [Google AI Studio](https://aistudio.google.com/app/apikey).
3. اضغط **Add**.

---

## 4. البدء بالنشر (Deploy)
1. اضغط على زر **Deploy**.
2. انتظر ثوانٍ معدودة حتى تكتمل عملية البناء.
3. مبروك! 🎉 ستحصل على رابط مباشر يعمل بكفاءة 100% مثل: `https://sehati-app.vercel.app`.

---

## كيف يعمل المشروع على Vercel؟
- ملف `vercel.json` يقوم بتوجيه جميع طلبات الـ API والمحادثة (`/chat`, `/api/*`) إلى `api/index.ts` والتي تعمل كـ Vercel Serverless Function.
- باقي الملفات والواجهة يتم تقديمها كملفات Static فائقة السرعة من خلال CDN الخاص بـ Vercel.
