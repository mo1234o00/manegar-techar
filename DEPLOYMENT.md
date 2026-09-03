# تعليمات النشر على Vercel

## الخطوة 1: إعداد قاعدة البيانات

### خيار 1: استخدام PostgreSQL (موصى به للإنتاج)
1. سجل حساب على [Supabase](https://supabase.com) أو [Neon](https://neon.tech)
2. أنشئ قاعدة بيانات PostgreSQL جديدة
3. احصل على connection string

### خيار 2: استخدام SQLite (للاختبار فقط)
- SQLite مناسب للاختبار لكن غير موصى به للإنتاج

## الخطوة 2: تحديث ملف Prisma Schema

عدل `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"  // غير من sqlite إلى postgresql
  url      = env("DATABASE_URL")
}
```

## الخطوة 3: إنشاء ملف .env على Vercel

في إعدادات Vercel Project، أضف المتغيرات التالية:

```
DATABASE_URL=postgresql://user:password@host:port/database
```

## الخطوة 4: ربط المشروع بـ Vercel

1. سجل حساب على [Vercel](https://vercel.com)
2. اضغط "Add New Project"
3. استيراد المشروع من GitHub
4. Vercel سيكتشف تلقائياً أنه مشروع Next.js

## الخطوة 5: إعدادات البناء

Vercel سيستخدم الإعدادات التالية تلقائياً:

- **Build Command:** `npm run build`
- **Output Directory:** `.next`
- **Install Command:** `npm install`

## الخطوة 6: تشغيل الترحيلات (Migrations)

بعد النشر الأول، ستحتاج إلى تشغيل الترحيلات:

```bash
npx prisma migrate deploy
```

يمكنك إضافة هذا كـ postinstall script في package.json:

```json
{
  "scripts": {
    "postinstall": "prisma generate"
  }
}
```

## الخطوة 7: إنشاء مستخدم Admin الأول

بعد النشر، افتح الرابط التالي في المتصفح:

```
https://your-domain.vercel.app/api/init-admin
```

هذا سيقوم بإنشاء مستخدم admin:
- اسم المستخدم: `admin`
- كلمة المرور: `admin123`

**مهم:** غيّر كلمة المرور فوراً بعد تسجيل الدخول الأول!

## ملاحظات مهمة

1. **الأمان:** 
   - استخدم كلمات مرور قوية
   - غيّر كلمة مرور admin فوراً
   - استخدم HTTPS فقط

2. **قاعدة البيانات:**
   - استخدم PostgreSQL للإنتاج
   - قم بعمل نسخ احتياطية دورية
   - راقب استخدام قاعدة البيانات

3. **التحديثات:**
   - عند تحديث الكود، Vercel سيعيد نشره تلقائياً
   - تأكد من تشغيل الترحيلات الجديدة

## نشر على منصات أخرى

### Netlify
1. استخدم نفس الخطوات
2. أضف متغيرات البيئة في Netlify Dashboard
3. Build Command: `npm run build`
4. Publish Directory: `.next`

### Railway
1. أنشئ مشروع جديد على Railway
2. أضف قاعدة بيانات PostgreSQL
3. اربط المشروع بـ GitHub
4. Railway سينشر تلقائياً

## استكشاف الأخطاء

### خطأ في قاعدة البيانات
- تأكد من صحة DATABASE_URL
- تأكد من تشغيل الترحيلات

### خطأ في البناء
- تأكد من إصدارات Node.js (استخدم 18 أو أحدث)
- تأكد من تثبيت جميع الاعتمادات

### مشاكل في المصادقة
- تأكد من أن localStorage يعمل على HTTPS
- تأكد من إعدادات CORS صحيحة
