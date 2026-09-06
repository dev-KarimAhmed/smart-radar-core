# استضافة Valhalla ذاتية — مصر + الأردن (مجاني ١٠٠٪)

**اختياري.** التطبيق شغال حالياً على السيرفرات العامة المجانية (Valhalla ثم OSRM) من غير أي
تسطيب. المجلد ده بيشغّل نسختك الخاصة على سيرفرك عشان تتخلص من احتمال وقوع السيرفر
المجتمعي أو تحديد معدل الطلبات عليه — البرمجيات والخرائط كلها مجانية ومفتوحة المصدر.

## المتطلبات

- سيرفر عليه Docker (مش الماك المحلي — الركاب لازم يوصلوله).
- ~4 جيجا رام و~5 جيجا مساحة. أول بناء بياخد 15–40 دقيقة؛ إعادة التشغيل بعدها ثواني.

## التشغيل

```bash
cd infra/valhalla
docker compose up -d
docker logs -f radar-valhalla   # استنى لحد "Successfully built the tile graph" وبدء الخدمة
```

## الاختبار

```bash
# مصر: التحرير -> الأهرامات
curl 'http://localhost:8002/route?json={"locations":[{"lat":30.0444,"lon":31.2357},{"lat":29.9773,"lon":31.1325}],"costing":"auto","directions_options":{"units":"kilometers"}}'

# الأردن: وسط عمّان -> الصويفية
curl 'http://localhost:8002/route?json={"locations":[{"lat":31.9539,"lon":35.9106},{"lat":31.9553,"lon":35.8560}],"costing":"auto","directions_options":{"units":"kilometers"}}'
```

## ربط التطبيق

للإنتاج لازم HTTPS (صفحة HTTPS مش هتقبل fetch على HTTP) — حط النسخة ورا نطاق فرعي
بشهادة (Caddy بيطلعها تلقائياً، أو الـ reverse proxy الحالي عندك)، وبعدين:

```
NEXT_PUBLIC_VALHALLA_URL="https://route.your-domain.com"
```

مفيش أي تعديل كود مطلوب — `src/lib/road-route.ts` بيقرأ المتغير ده جاهز، والسيرفرات
العامة فاضلة كاحتياطي تلقائي لو نسختك وقعت.

## تحديث الخرائط

Geofabrik بتحدّث الخرائط يومياً. للتحديث: غيّر `force_rebuild` لـ `True` في
`docker-compose.yml`، أعد التشغيل مرة واحدة، ورجّعه `False`.
