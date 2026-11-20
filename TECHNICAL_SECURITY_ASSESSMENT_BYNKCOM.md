# وثيقة متطلبات المعلومات الفنية والصلاحيات لبدء التقييم الأمني
## مشروع بينكم (Bynkcom) — https://bynkcom.com

---

### بيانات المستند الأساسية
| البيان | التفاصيل |
| :--- | :--- |
| **اسم المشروع** | Bynkcom (بينكم) |
| **الموقع الإلكتروني** | [https://bynkcom.com](https://bynkcom.com) |
| **نوع المستند** | Technical Requirements & Security Permissions |
| **التاريخ** | 18-11-2026 |
| **حالة الوثيقة** | مكتملة ومعتمدة من فريق التطوير الهندسي |

---

## 1- التقنيات المستخدمة في تطوير الموقع (Technologies & Tech Stack)

| المعلومات المطلوبة | إجابة فريق التطوير |
| :--- | :--- |
| **Frontend Languages & Technologies** | • **اللغات**: TypeScript 5.8 (Strict Mode), JavaScript (ESNext).<br>• **واجهات وتنسيقات**: HTML5, CSS3, Tailwind CSS v4, Radix UI Primitives, Lucide Icons, Framer Motion / Motion 12.<br>• **تقنيات الويب المتقدمة**: Progressive Web App (PWA) بصيغة دون اتصال أولاً (Offline-First) عبر Service Workers و Web App Manifest.<br>• **قواعد البيانات المحلية**: IndexedDB مُدار بمكتبة Dexie.js 4.4 مع LocalStorage للتخزين المؤقت.<br>• **الخرائط والملاحة الحرة**: MapLibre GL JS 5.24 (رسم متجهات الخرائط Vector Tiles عبر WebGL كرت الشاشة بدون واجهات جوجل المدفوعة)، ومكتبة Uber H3-js 4.4 (الشبكة النسيجية السداسية Resolution 9). |
| **Frontend Framework & Version** | • **Next.js 16.2.9** (App Router Architecture, React Server Components + Client Hydration).<br>• **React 19.2.7** & **React DOM 19.2.7**.<br>• **إدارة الحالة**: TanStack React Query 5.101 مع التخزين المحلي المتزامن (Query Persister).<br>• **دعم اللغات**: `next-intl` 4.13.2 (واجهة ثنائية اللغة: العربية RTL والإنجليزية LTR). |
| **Backend Languages & Technologies** | • **اللغة**: TypeScript 5.8 / Node.js 20+ Runtime.<br>• **واجهات البرمجة**: Next.js Route Handlers (`src/app/api/...`) بهندسة REST API كاملة.<br>• **خادم مخصص**: خادم Express.js 5.2.1 مدمج ومجمع عبر `esbuild` للتشغيل المستقر.<br>• **الخوارزميات والحماية الحافة**: خوارزميات الحساب النسيجي الجغرافي (`geospatial-kernel.ts`)، جدار مكافحة التلاعب وتزوير التوقيت والمواقع (`anti-cheat-kernel.ts`)، والتشفير الرقمي (`crypto`). |
| **Backend Framework & Version** | • Next.js 16.2.9 Route Handlers + Express.js 5.2.1.<br>• Supabase Server Client SDK (`@supabase/supabase-js` v2.108.1).<br>• محرك توليد وثائق الـ PDF السيادية: `pdf-lib` 1.17.1 + `@pdf-lib/fontkit` 1.1.1 لتوليد عقود إلكترونية رسمية متوافقة ثنائية اللغة. |
| **Database Type & Version** | • **قاعدة البيانات**: PostgreSQL 15+ / 16 (مستضافة عبر منصة Supabase Cloud المدارة).<br>• **الملحقات المفعلة (Extensions)**:<br>  - `PostGIS` (العمليات الجغرافية والمكانية).<br>  - `pgcrypto` (التشفير وإدارة التجزئة الرقمية).<br>  - `uuid-ossp` و `pgvector`.<br>• **الاتصال المباشر (Realtime)**: Supabase Realtime (WebSockets CDC لمتابعة العروض وحالة الرحلات آنياً).<br>• **الحماية**: سياسات حماية صفوف البيانات (Row Level Security - RLS) مفعلة على كافة الجداول. |
| **Web Server / Runtime & Version** | • **بيئة التشغيل**: Node.js 20+ LTS (64-bit).<br>• **الخادم العكسي والوسيط**: Nginx 1.24+ (Reverse Proxy & SSL Termination).<br>• **إدارة العمليات واستمرارية الخدمة**: PM2 Process Manager لتشغيل الحزمة المجمعة (`dist/server.cjs`) بدون توقف. |
| **Application Architecture** | • **معمارية الحافة وصفرية التكلفة (SC55 Zero-Cost Edge Processing)**:<br>  - نقل المعالجة الرياضية، والفرز، ومقارنة الأسعار، وكوابح السوق (مؤشر التوازن 15%) لتعمل مباشرة على معالج هاتف العميل (Client-Side).<br>• **هيكلية الخدمات المصغرة (Decoupled Microservices)**:<br>  - طبقة الواجهة والتطبيق: Next.js PWA.<br>  - طبقة البيانات والمصادقة: Supabase Managed Cloud (Auth + RLS Database + Storage).<br>  - طبقة التوجيه الملاحي المستقل: محرك OSRM مستقل ومستضاف محلياً.<br>  - طبقة التسليم الشبكي: شبكة حماية Cloudflare WAF/CDN. |
| **Third-Party Services & Integrations** | • **Cloudflare**: إدارة الـ DNS، التخزين المؤقت CDN، جدار الحماية WAF، والحماية من هجمات DDoS.<br>• **Supabase**: المصادقة، قاعدة البيانات PostgreSQL، التخزين السحابي للوثائق، والبث اللحظي WebSockets.<br>• **خادم OSRM المستقل**: سيرفر ملاحي ذاتي الاستضافة (Self-Hosted Linux VPS) لخريطة شوارع الأردن.<br>• **Resend API**: مزود خدمة البريد الإلكتروني للتحقق وإرسال العقود الموقعة.<br>• **بوابات الشحن الجغرافي اللامركزي**: دعم قنوات الدفع المحلية الأردنية (CliQ، زين كاش، أورنج ماني، إي فواتيركم) عبر التحقق من أرقام الإيصالات بدون تخزين بطاقات مصرفية. |

---

## 2- الكود المصدري وبنية المشروع (Source Code & Structure)

| المعلومات المطلوبة | إجابة فريق التطوير |
| :--- | :--- |
| **Source Code Repository (GitHub / Other)** | • مستودع GitHub خاص (Private Repository):<br>`https://github.com/dev-KarimAhmed/smart-radar-core.git` |
| **Repository Read-only Access** | • **متوفر فوراً**: يمكن إضافة حسابات فريق الفحص الأمني على GitHub كمساهمين بصلاحية قراءة فقط (Read-Only Collaborators) فور تزويدنا بالحسابات. |
| **Main Branch & Project Structure** | • **فرع العمل الرئيسي والنشر**: `feat/test` (وفرع الإنتاج النهائي المستقر `main`).<br>• **هيكلية المشروع الموديلية (Clean Modular Architecture)**:<br>  - `src/app/`: مسارات وتطبيقات Next.js App Router وواجهات الـ REST API في `src/app/api/`.<br>  - `src/features/`: وحدات النظام الوظيفية (`captain/`, `rider/`, `ads/`, `admin/`, `auth/`, `referral/`).<br>  - `src/core/`: النواة المركزية وخوارزميات الأمان (`anti-cheat-kernel.ts`, `geospatial-kernel.ts`).<br>  - `src/server/`: خدمات السيرفر، جدران فحص التوكنات والصلاحيات (`api-auth-guard.ts`).<br>  - `src/shared/`: المكونات المشتركة، واجهات المستخدم، ونظام الإشعارات.<br>  - `supabase/`: ملفات الترحيل والتحديثات الهيكلية لقاعدة البيانات (`migrations/`). |
| **Dependency / Package Management Files** | • **مدير الحزم**: `npm` (Node Package Manager).<br>• **ملفات الحزم**: `package.json` مع ملف التثبيت الصارم `package-lock.json` لمنع ثغرات التبعيات، وملف التهيئة `tsconfig.json`. |
| **Architecture Diagram (If Available)** | • **متاح**: مخطط انسيابي ومعماري يوضح تدفق حركة البيانات بين العميل المتصفح PWA، طبقة حماية Cloudflare WAF، سيرفر التطبيق Next.js/Express، وقاعدة بيانات Supabase، وسيرفر OSRM الملاحي. |
| **Environment Configuration (Without Secrets)** | • يتم الاعتماد على متغيرات البيئة عبر `.env.local` مع حجب تام للأسرار، والمتغيرات تشمل:<br>  - `NODE_ENV` (الوضع التشغيلي)<br>  - `NEXT_PUBLIC_APP_URL` (رابط التطبيق المعتمد)<br>  - `NEXT_PUBLIC_SUPABASE_URL` & `NEXT_PUBLIC_SUPABASE_ANON_KEY`<br>  - `SUPABASE_SERVICE_ROLE_KEY` (سري ومحصور في السيرفر)<br>  - `NEXT_PUBLIC_OSRM_URL` (رابط سيرفر التوجيه الملاحي)<br>  - `RESEND_API_KEY` & `RESEND_FROM_EMAIL` (سري ومحصور في السيرفر)<br>  - `NEXT_PUBLIC_SUPPORT_PHONE` & `NEXT_PUBLIC_SUPPORT_WHATSAPP` |
| **CI/CD Pipeline & Deployment Method** | • **الفحص الآلي الإلزامي قبل الدمج**:<br>  - فحص الأنواع الصارم: `npm run lint` (`tsc --noEmit`).<br>  - فحص الوحدات والأمان: `npm run test:unit` (40 مجموعة اختبار تغطي كامل مسارات الأمان، التشفير، الجلسات، والعقود).<br>  - فحص المعمارية والتصميم: `npm run test:architecture`.<br>• **طريقة النشر (Deployment Method)**: سحب الكود عبر Git، البناء الآلي للحزم (`npm run build`)، وإعادة التحميل السلس المباشر (Zero-downtime reload) عبر PM2. |

---

## 3- الاستضافة وإعدادات Cloudflare (Hosting & Cloudflare Config)

| المعلومات المطلوبة | إجابة فريق التطوير |
| :--- | :--- |
| **Hosting Provider & Hosting Type** | • **التطبيق وسيرفر الواجهة**: خادم افتراضي سحابي مستقل (Cloud VPS) بنظام Linux Ubuntu.<br>• **قاعدة البيانات والتخزين**: سحابة مدارة مخصصة للمؤسسات عبر Supabase Enterprise Cloud Platform.<br>• **خادم التوجيه الملاحي (OSRM)**: خادم VPS مستقل ومحمي بذاكرة مساندة (2GB Swap). |
| **Cloudflare Services Used (Pages / Workers / CDN / Proxy)** | • **Cloudflare Authoritative DNS**: لإدارة وتشفير سجلات النطاق بالكامل.<br>• **Cloudflare CDN & Caching**: لتخزين الملفات الساكنة والأصول وأغلفة الـ PWA.<br>• **Cloudflare Reverse Proxy (Orange Cloud)**: لإخفاء عنوان السيرفر الحقيقي وحجب الهجمات.<br>• **Cloudflare Web Application Firewall (WAF)** و **DDoS Mitigation Layer**. |
| **Cloudflare Plan** | • Free / Pro Plan مع تفعيل كافة مزايا الحماية المتقدمة المتاحة للنطاق. |
| **Production Hosting Architecture** | • العميل يتصل أولاً بشبكة Cloudflare Anycast العالمية.<br>• تتم تصفية حركة المرور ومكافحة هجمات حجب الخدمة ومحاولات الحقن عبر WAF.<br>• يتم توجيه الطلبات النظيفة حصراً عبر HTTPS مشفر إلى السيرفر الأساسي (Origin Server).<br>• يتعامل خادم Nginx مع الطلب ويحوله محلياً لخادم التطبيق Node.js الداخلي (Internal Port).<br>• يتم الاتصال بقاعدة بيانات Supabase عبر قنوات مشفرة باتصال TLS مشدد. |
| **Origin Server / Backend Hosting Details** | • خادم سحابي مستقل (Dedicated Cloud VPS).<br>• منافذ التطبيق الداخلية غير مكشوفة للإنترنت العام، ويقتصر الاتصال على المنفذ المحلي المدار بواسطة Nginx. |
| **Server Specifications & Operating System** | • **نظام التشغيل**: Ubuntu Linux 22.04 / 24.04 LTS (64-bit Enterprise).<br>• **المواصفات**: 2 إلى 4 Cores vCPU، ذاكرة 4GB إلى 8GB RAM، قرص تخزين فائق السرعة NVMe SSD، وذاكرة مساندة 2GB Swap Memory. |
| **Domains, Subdomains & DNS Configuration** | • **النطاق الرئيسي**: `bynkcom.com`<br>• **النطاقات الفرعية**: `www.bynkcom.com`<br>• **إدارة السجلات**: مدارة كلياً عبر Cloudflare DNS مع تفعيل تشفير وتوقيع السجلات الرقمي (DNSSEC). |
| **Cloudflare Proxy & DNS Settings** | • جميع سجلات A و CNAME مفعل عليها وضع البروكسي (Proxied: Orange Cloud Enabled) لضمان إخفاء الـ Origin IP بنسبة 100%.<br>• إعدادات الـ SSL/TLS مضبوطة على وضع التشفير الكامل (Full / Strict). |
| **WAF & DDoS Protection Configuration** | • الحماية من هجمات الحرمان من الخدمة (L3/L4/L7 DDoS Defense) مفعلة بشكل دائم ومؤتمت.<br>• قواعد الـ WAF مفعلة للتصدي لمحاولات الاختراق الشائعة (OWASP Top 10) مثل SQLi و XSS و Command Injection.<br>• ميزة Bot Fight Mode مفعلة لمنع الزواحف والبوتات وأدوات الفحص العشوائية المؤذية. |
| **Rate Limiting & Bot Protection Settings** | • **على مستوى Cloudflare**: تفعيل حدود الطلبات لمسارات المصادقة والتسجيل.<br>• **على مستوى التطبيق الداخلي**: طبقة كوابح برمجية وحساب فترات التبريد (`captain-cancel-cooldown.ts`)، وقفل الجلسات والتكرار لمنع محاولات الإغراق والتخمين. |
| **Origin Server Access Restrictions / Firewall Rules** | • جدار حماية السيرفر (UFW / Security Groups):<br>  - المنافذ العامة محصورة فقط في منفذ 80 و 443 عبر Nginx ومقيدة لاستقبال حركة الـ IP التابعة لـ Cloudflare فقط.<br>  - منفذ SSH محمي بمفاتيح التشفير الرقمية (SSH Keys Only) مع حظر كلمات المرور وحظر دخول الـ Root.<br>  - منافذ قواعد البيانات والسيرفر الداخلي مقفلة ومحصورة في الـ Localhost. |
| **SSL/TLS Configuration** | • تشفير مزدوج ومحكم (End-to-End Encryption):<br>  - شهادة Edge SSL عبر Cloudflare Universal SSL تدعم بروتوكولات TLS 1.2 و TLS 1.3 مع Modern Ciphers.<br>  - شهادة Origin Server صادرة ومجددة عبر Let's Encrypt / Certbot أو Cloudflare Origin CA.<br>  - تفعيل خاصية HSTS (HTTP Strict Transport Security) وإعادة التوجيه الإلزامي التلقائي إلى HTTPS. |
| **Backup & Recovery Configuration** | • **قاعدة البيانات**: نسخ احتياطي آلي يومي (Automated Daily Backups) مع إمكانية استعادة البيانات حتى لحظة زمنية محددة (Point-in-Time Recovery - PITR) عبر Supabase.<br>• **الكود والتهيئة**: موثقة ومحفوظة على GitHub مع استقلالية ملفات التكوين.<br>• **السيرفر**: أخذ لقطات سحابية دورية للنظام (VPS Cloud Snapshots). |

---

## 4- معلومات التطبيق وحسابات المستخدمين (Application & Users)

| المعلومات المطلوبة | إجابة فريق التطوير |
| :--- | :--- |
| **Authentication Method** | • **الراكب والكابتن (Rider & Captain)**: نظام مصادقة آمن ومدار عبر Supabase Auth يدعم التحقق عبر رقم الهاتف ورمز لمرة واحدة (SMS OTP)، والبريد الإلكتروني مع كلمة المرور.<br>• **لوحة الإدارة (Admin Panel)**: مصادقة البريد الإلكتروني وكلمات المرور المعقدة، مع التحقق الأمني من دور الحساب ورتبته في قاعدة البيانات. |
| **User Roles & Permissions** | • نظام إدارة الصلاحيات مبني بنموذج (Role-Based Access Control - RBAC) مقسم للأدوار التالية:<br>  1. `RIDER`: طلب الرحلات، استقبال العروض، التقييم، شحن المحفظة.<br>  2. `CAPTAIN`: دخول صالة المزاد واستقبال الطلبات، تقديم العروض، إدارة بيانات المركبة والمستندات، المحفظة والاشتراكات.<br>  3. `ADVERTISER`: إدارة الحملات الإعلانية وتتبع المشاهدات والميزانية.<br>  4. `DELEGATE`: متابعة الكباتن التابعين وجرد العمولات المستحقة بعد مرور 30 يوماً.<br>  5. `ADMIN`: لوحة تحكم عليا مقسمة قطاعياً بصلاحيات دقيقة (قطاع الكباتن، قطاع الركاب، قطاع الإعلانات، قطاع المالية، قطاع تسعير الساعات، الرقابة العامة). |
| **Authorization Implementation** | • **مبدأ الدفاع في العمق (Defense-in-Depth)**:<br>  1. **قاعدة البيانات**: سياسات حماية صفوف البيانات (PostgreSQL Row Level Security - RLS) مفعلة على 100% من جداول التطبيق، مما يمنع أي مستخدم من قراءة أو تعديل سجلات لا تخصه برمجياً على مستوى محرك قاعدة البيانات.<br>  2. **السيرفر والـ API**: جدران حماية مركزية (`api-auth-guard.ts` و `hasAdminSectorAccess`) للتحقق من هوية صاحب الطلب ورتبته قبل تمرير أي أمر تنفيذي. |
| **Session Management (Cookies / JWT / Other)** | • **إدارة الجلسات**: رموز JWT (JSON Web Tokens) مشفرة وموقعة برمجياً عبر Supabase Auth بصلاحية زمنية محددة (Short-lived Access Tokens) مع رموز تجديد آمنة (Refresh Tokens).<br>• **التخزين**: استخدام ملفات تعريف الارتباط الآمنة ذات الترويسات المشددة (`HttpOnly`, `Secure`, `SameSite=Lax/Strict`).<br>• **قفل الجلسة الفردية للجهاز (`login-session-guard.ts`)**: حظر فتح الحساب على أكثر من جهاز في نفس الوقت؛ تسجيل الدخول من جهاز جديد يبطل الجلسة القديمة فوراً ويمنع سرقة الجلسات. |
| **Password Storage / Hashing Mechanism** | • تجزئة كلمات المرور تتم داخلياً عبر خوارزميات **Argon2id** أو **Bcrypt** المدارة بواسطة محرك Supabase Auth السيادي في جدول النظام المعزول `auth.users`، مع استخدام Salt فريد وعشوائي لكل كلمة مرور ومقاومة هجمات القوة الغاشمة (Brute Force). |
| **API Endpoints / Swagger / OpenAPI Documentation** | • جميع واجهات البرمجة مبنية بنمط RESTful API موحد ضمن المسارات التابعة لـ `src/app/api/`:<br>  - مسارات المصادقة: `/api/auth/login`, `/api/auth/register`, `/api/auth/reset-password`...<br>  - مسارات الكباتن والرحلات: `/api/captain/...`, `/api/trips/...`, `/api/rider/...`<br>  - مسارات الإدارة: `/api/admin/...`<br>• المسارات موثقة ومغطاة باختبارات تكامل دورية (`scripts/run-route-tests.mjs`)، ويمكن تصدير ملف مواصفات OpenAPI / Postman Collection لفريق الفحص الأمني. |
| **API Authentication Mechanism** | • تطلب واجهات البرمجة ترويسة التحقق القياسية: `Authorization: Bearer <JWT_TOKEN>`.<br>• يتم فك وتدقيق الرمز التشفيري في كل استدعاء، والتحقق من صحة المستخدم وتطابق بصمة جلسته وحالته في قاعدة البيانات. |
| **File Upload & Storage Mechanism** | • **المستودع**: حاويات تخزين Supabase Storage (`captain-documents`) المدارة بسياسات أمان مقيدة (Restricted Bucket Policies).<br>• **ضوابط الأمان المفعلة برمجياً**:<br>  - فحص أمني للمسارات (`isValidStorageRelativePath`) لمنع ثغرات التخطي (Directory Traversal).<br>  - التحقق من نوع الملف (MIME-Type Whitelisting) وقصر الرفع على الصور والمستندات الآمنة (`image/jpeg`, `image/png`, `application/pdf`).<br>  - سقف حجم محدد للملفات لمنع استهلاك الموارد وهجمات DoS.<br>  - توليد أسماء عشوائية UUID للملفات لمنع التخمين والوصول المباشر. |
| **External APIs & Third-Party Integrations** | • **Supabase Cloud API**: عمليات قاعدة البيانات والمصادقة والتخزين.<br>• **Self-Hosted OSRM API**: خادم التوجيه الملاحي المستقل لقياس المسافات والزمن.<br>• **Resend Email API**: إرسال الإشعارات وعقود الاشتراك الموقعة.<br>• **محركات الدفع المحلية الأردنية (CliQ, Zain Cash, Orange Money, eFAWATEERcom)**: النظام لا يتصل ببيانات البطاقات الائتمانية البنكية ولا يخزن أرقام بطاقات حساسة (تصفير مخاطر PCI-DSS). |
| **Logging & Error Handling Mechanism** | • **معالجة الأخطاء (Error Handling)**: طبقة اعتراض موحدة تمنع تسريب تفاصيل السيرفر أو تتبع المكدس (Stack Traces) للواجهة، وتقتصر على إرجاع رسائل خطأ دلالية آمنة بصيغة JSON.<br>• **السجلات والتدقيق (Audit & Logging)**:<br>  - سجلات خادم الويب Nginx وسجلات العمليات عبر PM2.<br>  - جداول تدقيق أمني متخصصة في قاعدة البيانات (مثل `password_reset_audit`، وسجلات العمليات المالية `wallet_transactions`، وتوثيق العقود الإلكترونية `captain_electronic_contracts`).<br>  - سجلات مراقبة وتحليل حركة الشبكة عبر Cloudflare Security Dashboard. |

---

## 5- بيئة الاختبار والصلاحيات المطلوبة (Testing Environment & Permissions)

| الصلاحية أو المتطلب | الحالة / التوفر | تفاصيل وملاحظات فريق التطوير |
| :--- | :---: | :--- |
| **Source Code Repository – Read-only Access** | **متوفر** | جاهز للدعوة الفورية لفريق الفحص بصلاحية قراءة فقط (Read-Only) على مستودع GitHub الخاص بمجرد تزويدنا بالحسابات. |
| **Staging / Testing Environment URL** | **متوفر** | رابط بيئة الاختبار المحدثة والمطابقة لبيئة الإنتاج: `https://bynkcom.com` (أو الرابط التجريبي المخصص لفرع `feat/test`). |
| **Test Admin Account** | **متوفر** | حساب مدير نظام تجريبي جاهز للاختبارات الأمنية:<br>• **البريد**: `test-admin@bynkcom.com`<br>• **كلمة المرور**: سيتم تسليمها لفريق الفحص عبر وسيلة اتصال مشفرة. |
| **Test User Account** | **متوفر** | حسابات مستخدمين تجريبية مفعلة وجاهزة للعمل:<br>• **حساب راكب (Rider)**: هاتف `+962790000001` / بريد `test-rider@bynkcom.com`<br>• **حساب كابتن (Captain)**: هاتف `+962790000002` / بريد `test-captain@bynkcom.com` (مع مركبة ومستندات معتمدة). |
| **Test Account with Limited Permissions** | **متوفر** | حسابات إضافية محدودة لاختبار كسر الصلاحيات وتخطي الأدوار (مثل حساب معلن `ADVERTISER` ومندوب `DELEGATE` ومستخدم محظور). |
| **Cloudflare Dashboard – Read-only Access** | **متوفر عند الطلب** | يمكن إضافة البريد الإلكتروني لفريق الفحص كمراجع بصلاحية (Audit / Read Only) في لوحة Cloudflare لمراجعة إعدادات WAF و SSL. |
| **Application & Server Logs – Read-only Access** | **متوفر** | يمكن تصدير مستخرجات السجلات التشغيلية وسجلات الأخطاء لـ Nginx و PM2 و Supabase مع تعتيم أي بيانات شخصية حساسة. |
| **Hosting / Server Configuration – Read-only Access** | **متوفر عبر الوثائق** | كافة ملفات التكوين (Nginx config, PM2 ecosystem, Package files, Build scripts) مدمجة في الكود المصدري ومتاحة للمعاينة الكاملة. |
| **Database Schema / ERD (Without Production Data)** | **متوفر بالكامل** | ملفات الـ SQL Migrations داخل مجلد `supabase/migrations/` تمثل المخطط الهيكلي الكامل للجداول والحقول والسياسات بدون أي بيانات للمستخدمين. |
| **Cloudflare Security Events & Traffic Analytics** | **متوفر** | جاهز للاستعراض المشترك لمتابعة تحليلات المرور وسجلات التصدي لمحاولات الاختراق. |
| **Existing Technical Documentation** | **متوفر ومرفق** | متوفر ملفات التوثيق المعماري، دستور القوانين V2.6-Secured، وثائق الـ Anti-Cheat، ونتائج اختبارات الوحدة (40 Test Suites). |

---

## 6- معلومات إضافية عن تشغيل النظام (Operational & Testing Details)

| المعلومات المطلوبة | إجابة فريق التطوير |
| :--- | :--- |
| **Production & Staging Environment Differences** | • بيئة الاختبار مطابقة معمارياً وبرمجياً لبيئة الإنتاج الحية بنسبة 100% (نفس المحركات: Next.js, Node.js 20, Supabase, Cloudflare, Nginx).<br>• الاختلاف محصور فقط في استخدام بيانات افتراضية وعزل عمليات الدفع والرسائل النصية الحقيقية لتمكين الفحص الآمن. |
| **Application Deployment & Update Procedure** | • التحديثات تدار وفق خط أنابيب منظم ومحكم (Git Flow):<br>  1. اختبار الميزات على فرع التطوير `feat/test`.<br>  2. إجراء الفحوصات الصارمة (`npm run lint`, `npm run test:unit`, `npm run verify`).<br>  3. البناء والتجميع الآلي للسيرفر (`npm run build`).<br>  4. إعادة تشغيل العملية بنظام التبديل السلس دون أي انقطاع للخدمة (Zero-Downtime Reload عبر PM2). |
| **Monitoring & Alerting Tools** | • **مستوى الشبكة والأمان**: Cloudflare Analytics & Security Alerts (تنبيهات فورية عند رصد هجمات DDoS أو ترافيك شاذ).<br>• **مستوى السيرفر والتطبيق**: PM2 Process Monitor لمتابعة استهلاك الذاكرة والمعالج والأعطال.<br>• **مستوى قاعدة البيانات**: Supabase Platform Metrics لمراقبة أداء الاستعلامات والاتصالات اللحظية Realtime.<br>• **سجلات الخادم**: Nginx Real-time Access & Error Logging. |
| **Previous Server Outages or Availability Issues (If Known)** | • لا توجد أي انقطاعات ناتجة عن ثغرات أمنية أو اختراقات سابقة.<br>• نسبة الجاهزية والاستقرار التشغيلي تتجاوز 99.9%، وتقتصر التوقفات السابقة على فترات صيانة مجدولة لترقية الحزم البرمجية وتحديث السيرفر. |
| **Known Technical Limitations** | • **السقوط الملاحي الآمن (OSRM Fallback)**: في حال تباطؤ خادم التوجيه OSRM لأكثر من 1500ms، ينتقل النظام تلقائياً وبصفر توقف لمحرك الهرسين الرياضي المدمج (Haversine Formula) على هاتف المستخدم بضرب المسافة في معامل شوارع المملكة (1.3).<br>• **سياسة تطهير الرحلات (72-Hour Data Purge)**: تحذف سجلات الرحلات المنتهية تلقائياً من خادم التشغيل بعد مرور 72 ساعة حتمية لحماية الخصوصية وترشيد استهلاك التخزين وفق الدستور المعماري.<br>• **قفل الجلسة الأحادية (Single Session Lock)**: لا يسمح النظام بفتح حسابين متزامنين لنفس المستخدم على أجهزة مختلفة لمنع التلاعب وسرقة الجلسات. |
| **Technical Contact During Testing** | • **الجهة المسؤولة**: الفريق التقني والتطويري لمشروع Bynkcom (Smart Radar Core Team).<br>• **البريد الإلكتروني المعتمد**: `devkarimahmed@gmail.com`<br>• **قناة الاتصال والمتابعة الفورية**: متوفر هاتفياً وعبر الواتساب للتنسيق اللحظي والمستمر على مدار 24 ساعة طوال فترة التقييم الأمني. |
