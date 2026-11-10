# ITTHAD CRM — استوديو الاتحاد

لوحة إدارة محتوى قناة الاتحاد السكندري (React + TypeScript + Vite + Firebase).

## تحميل وتشغيل

```bash
npm install
cp .env.example .env.local
# ضع إعدادات Firebase Web App في .env.local
npm run dev
```

لإنشاء نسخة جاهزة للنشر: `npm run build` (المخرج `dist`).

## Firebase — خطوات مطلوبة قبل التشغيل

1. أنشئ مشروع Firebase مستقل خاص بالاستوديو، وسجّل تطبيق Web من Project Settings.
2. انسخ بيانات Firebase Web config إلى `.env.local` محليًا أو متغيرات بيئة الاستضافة المسماة `VITE_FIREBASE_*`.
3. افتح Authentication > Sign-in method وفعّل Email/Password، وأنشئ حساب المدير الأول.
4. أنشئ قاعدة Firestore في وضع Production.
5. انشر قواعد `firestore.rules` و`storage.rules` عبر Firebase CLI، بعد تسجيل الدخول واختيار المشروع الصحيح:
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase use --add
   firebase deploy --only firestore:rules,storage
   ```
   يمكن أيضًا لصق القواعد يدويًا في لوحة Firebase. **لا تستخدم وضع Test في الإنتاج**.
6. داخل Firestore، أضف المستند `staff/UID` (استبدل UID بمعرّف مستخدم المدير من Authentication) بحقول:
   - `role`: string = `admin`
   - `active`: boolean = `true`
   - `email`: string = بريد المدير
   هذا تأسيس يدوي لمرة واحدة من Firebase Console، وليس من المتصفح.
7. أدخل بيانات حساب المدير في صفحة الدخول.

## الوظائف

- تسجيل دخول Firebase Email/Password؛ فحص صلاحيات حسابات الفريق من مستندات `staff`.
- إنشاء وتعديل حالة وحذف مهام المحتوى؛ المزامنة المباشرة مع Firestore.
- مركز المباريات وإنشاء مهام تقديم المباريات.
- ملفات التصميم والفيديو والريلز وجدولة المحتوى وإحصائيات مهام العمل.
- تصدير / استيراد نسخة احتياطية JSON.

## الملاحظات الأمنية

- المستودع حاليًا عام؛ تجنب تخزين بيانات تشغيلية حساسة أو كلمات مرور فيه.
- قواعد Firestore تسمح لأدوار `admin` و`editor` و`designer` بتعديل البيانات، ولدور `reviewer` بتغيير حالة المهمة فقط. إنشاء الحسابات وتعديل الأدوار ليس له واجهة بعد.
- `storage.rules` تمنع الوصول حاليًا إلى Storage حتى يتم بناء مكتبة ملفات وقواعدها.
- لا تضع Service Account JSON أو مفتاحه الخاص في متغيرات `VITE_` أو ملفات العميل. إعدادات Firebase Web App العامة وحدها تصلح للواجهة.
- يحتاج المشروع اختبارات بناء وأمن وقواعد Firestore قبل الاعتماد الفعلي؛ نشر التحديث إلى GitHub لا يعني نشر قواعد Firebase.
- لا يوجد بعد ربط بحسابات Facebook/Instagram أو النشر الآلي أو توليد الصور بالذكاء الاصطناعي.

## الاستضافة

Vercel أو Netlify: Build Command = `npm run build`; Output Directory = `dist`; أضف متغيرات `VITE_FIREBASE_*` في إعدادات البيئة.
