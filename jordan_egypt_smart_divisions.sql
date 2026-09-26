-- أضف هذا الكود في محرر الـ SQL (SQL Editor) في Supabase

BEGIN;

-- 1. إدخال المحافظات (بشرط عدم وجودها مسبقاً بناءً على الاسم)
INSERT INTO governorates (country_id, name_ar, name_en)
SELECT 1, 'عمان', 'عمان'
WHERE NOT EXISTS (SELECT 1 FROM governorates WHERE name_ar = 'عمان');

INSERT INTO governorates (country_id, name_ar, name_en)
SELECT 1, 'اربد', 'اربد'
WHERE NOT EXISTS (SELECT 1 FROM governorates WHERE name_ar = 'اربد');

INSERT INTO governorates (country_id, name_ar, name_en)
SELECT 1, 'البلقاء', 'البلقاء'
WHERE NOT EXISTS (SELECT 1 FROM governorates WHERE name_ar = 'البلقاء');

INSERT INTO governorates (country_id, name_ar, name_en)
SELECT 1, 'الكرك', 'الكرك'
WHERE NOT EXISTS (SELECT 1 FROM governorates WHERE name_ar = 'الكرك');

INSERT INTO governorates (country_id, name_ar, name_en)
SELECT 1, 'معان', 'معان'
WHERE NOT EXISTS (SELECT 1 FROM governorates WHERE name_ar = 'معان');

INSERT INTO governorates (country_id, name_ar, name_en)
SELECT 1, 'الزرقاء', 'الزرقاء'
WHERE NOT EXISTS (SELECT 1 FROM governorates WHERE name_ar = 'الزرقاء');

INSERT INTO governorates (country_id, name_ar, name_en)
SELECT 1, 'المفرق', 'المفرق'
WHERE NOT EXISTS (SELECT 1 FROM governorates WHERE name_ar = 'المفرق');

INSERT INTO governorates (country_id, name_ar, name_en)
SELECT 1, 'الطفيلة', 'الطفيلة'
WHERE NOT EXISTS (SELECT 1 FROM governorates WHERE name_ar = 'الطفيلة');

INSERT INTO governorates (country_id, name_ar, name_en)
SELECT 1, 'مادبا', 'مادبا'
WHERE NOT EXISTS (SELECT 1 FROM governorates WHERE name_ar = 'مادبا');

INSERT INTO governorates (country_id, name_ar, name_en)
SELECT 1, 'جرش', 'جرش'
WHERE NOT EXISTS (SELECT 1 FROM governorates WHERE name_ar = 'جرش');

INSERT INTO governorates (country_id, name_ar, name_en)
SELECT 1, 'عجلون', 'عجلون'
WHERE NOT EXISTS (SELECT 1 FROM governorates WHERE name_ar = 'عجلون');

INSERT INTO governorates (country_id, name_ar, name_en)
SELECT 1, 'العقبة', 'العقبة'
WHERE NOT EXISTS (SELECT 1 FROM governorates WHERE name_ar = 'العقبة');

INSERT INTO governorates (country_id, name_ar, name_en)
SELECT 2, 'القاهرة', 'Cairo'
WHERE NOT EXISTS (SELECT 1 FROM governorates WHERE name_ar = 'القاهرة');

INSERT INTO governorates (country_id, name_ar, name_en)
SELECT 2, 'الإسكندرية', 'Alexandria'
WHERE NOT EXISTS (SELECT 1 FROM governorates WHERE name_ar = 'الإسكندرية');

INSERT INTO governorates (country_id, name_ar, name_en)
SELECT 2, 'الجيزة', 'Giza'
WHERE NOT EXISTS (SELECT 1 FROM governorates WHERE name_ar = 'الجيزة');

INSERT INTO governorates (country_id, name_ar, name_en)
SELECT 2, 'القليوبية', 'Qalyubia'
WHERE NOT EXISTS (SELECT 1 FROM governorates WHERE name_ar = 'القليوبية');

INSERT INTO governorates (country_id, name_ar, name_en)
SELECT 2, 'الدقهلية', 'Dakahlia'
WHERE NOT EXISTS (SELECT 1 FROM governorates WHERE name_ar = 'الدقهلية');

INSERT INTO governorates (country_id, name_ar, name_en)
SELECT 2, 'الشرقية', 'Al Sharqia'
WHERE NOT EXISTS (SELECT 1 FROM governorates WHERE name_ar = 'الشرقية');

INSERT INTO governorates (country_id, name_ar, name_en)
SELECT 2, 'المنوفية', 'Monufia'
WHERE NOT EXISTS (SELECT 1 FROM governorates WHERE name_ar = 'المنوفية');

INSERT INTO governorates (country_id, name_ar, name_en)
SELECT 2, 'الغربية', 'Gharbia'
WHERE NOT EXISTS (SELECT 1 FROM governorates WHERE name_ar = 'الغربية');

INSERT INTO governorates (country_id, name_ar, name_en)
SELECT 2, 'كفر الشيخ', 'Kafr El Sheikh'
WHERE NOT EXISTS (SELECT 1 FROM governorates WHERE name_ar = 'كفر الشيخ');

INSERT INTO governorates (country_id, name_ar, name_en)
SELECT 2, 'البحيرة', 'Beheira'
WHERE NOT EXISTS (SELECT 1 FROM governorates WHERE name_ar = 'البحيرة');

INSERT INTO governorates (country_id, name_ar, name_en)
SELECT 2, 'دمياط', 'Damietta'
WHERE NOT EXISTS (SELECT 1 FROM governorates WHERE name_ar = 'دمياط');

INSERT INTO governorates (country_id, name_ar, name_en)
SELECT 2, 'بورسعيد', 'Port Said'
WHERE NOT EXISTS (SELECT 1 FROM governorates WHERE name_ar = 'بورسعيد');

INSERT INTO governorates (country_id, name_ar, name_en)
SELECT 2, 'الإسماعيلية', 'Ismailia'
WHERE NOT EXISTS (SELECT 1 FROM governorates WHERE name_ar = 'الإسماعيلية');

INSERT INTO governorates (country_id, name_ar, name_en)
SELECT 2, 'السويس', 'Suez'
WHERE NOT EXISTS (SELECT 1 FROM governorates WHERE name_ar = 'السويس');

INSERT INTO governorates (country_id, name_ar, name_en)
SELECT 2, 'شمال سيناء', 'North Sinai'
WHERE NOT EXISTS (SELECT 1 FROM governorates WHERE name_ar = 'شمال سيناء');

INSERT INTO governorates (country_id, name_ar, name_en)
SELECT 2, 'جنوب سيناء', 'South Sinai'
WHERE NOT EXISTS (SELECT 1 FROM governorates WHERE name_ar = 'جنوب سيناء');

INSERT INTO governorates (country_id, name_ar, name_en)
SELECT 2, 'مطروح', 'Matrouh'
WHERE NOT EXISTS (SELECT 1 FROM governorates WHERE name_ar = 'مطروح');

INSERT INTO governorates (country_id, name_ar, name_en)
SELECT 2, 'الفيوم', 'Faiyum'
WHERE NOT EXISTS (SELECT 1 FROM governorates WHERE name_ar = 'الفيوم');

INSERT INTO governorates (country_id, name_ar, name_en)
SELECT 2, 'بني سويف', 'Beni Suef'
WHERE NOT EXISTS (SELECT 1 FROM governorates WHERE name_ar = 'بني سويف');

INSERT INTO governorates (country_id, name_ar, name_en)
SELECT 2, 'المنيا', 'Minya'
WHERE NOT EXISTS (SELECT 1 FROM governorates WHERE name_ar = 'المنيا');

INSERT INTO governorates (country_id, name_ar, name_en)
SELECT 2, 'أسيوط', 'Asyut'
WHERE NOT EXISTS (SELECT 1 FROM governorates WHERE name_ar = 'أسيوط');

INSERT INTO governorates (country_id, name_ar, name_en)
SELECT 2, 'سوهاج', 'Sohag'
WHERE NOT EXISTS (SELECT 1 FROM governorates WHERE name_ar = 'سوهاج');

INSERT INTO governorates (country_id, name_ar, name_en)
SELECT 2, 'قنا', 'Qena'
WHERE NOT EXISTS (SELECT 1 FROM governorates WHERE name_ar = 'قنا');

INSERT INTO governorates (country_id, name_ar, name_en)
SELECT 2, 'الأقصر', 'Luxor'
WHERE NOT EXISTS (SELECT 1 FROM governorates WHERE name_ar = 'الأقصر');

INSERT INTO governorates (country_id, name_ar, name_en)
SELECT 2, 'أسوان', 'Aswan'
WHERE NOT EXISTS (SELECT 1 FROM governorates WHERE name_ar = 'أسوان');

INSERT INTO governorates (country_id, name_ar, name_en)
SELECT 2, 'الوادي الجديد', 'New Valley'
WHERE NOT EXISTS (SELECT 1 FROM governorates WHERE name_ar = 'الوادي الجديد');

INSERT INTO governorates (country_id, name_ar, name_en)
SELECT 2, 'البحر الأحمر', 'Red Sea'
WHERE NOT EXISTS (SELECT 1 FROM governorates WHERE name_ar = 'البحر الأحمر');

-- 2. إدخال الألوية (وربطها ديناميكياً برقم المحافظة الحالي أو الجديد)
INSERT INTO districts (governorate_id, name_ar, name_en)
SELECT (SELECT id FROM governorates WHERE name_ar = 'عمان' LIMIT 1), 'لواء قصبة عمان', 'لواء قصبة عمان'
WHERE NOT EXISTS (SELECT 1 FROM districts WHERE name_ar = 'لواء قصبة عمان' AND governorate_id = (SELECT id FROM governorates WHERE name_ar = 'عمان' LIMIT 1));

INSERT INTO districts (governorate_id, name_ar, name_en)
SELECT (SELECT id FROM governorates WHERE name_ar = 'عمان' LIMIT 1), 'لواء الجامعة', 'لواء الجامعة'
WHERE NOT EXISTS (SELECT 1 FROM districts WHERE name_ar = 'لواء الجامعة' AND governorate_id = (SELECT id FROM governorates WHERE name_ar = 'عمان' LIMIT 1));

INSERT INTO districts (governorate_id, name_ar, name_en)
SELECT (SELECT id FROM governorates WHERE name_ar = 'عمان' LIMIT 1), 'لواء الموقر', 'لواء الموقر'
WHERE NOT EXISTS (SELECT 1 FROM districts WHERE name_ar = 'لواء الموقر' AND governorate_id = (SELECT id FROM governorates WHERE name_ar = 'عمان' LIMIT 1));

INSERT INTO districts (governorate_id, name_ar, name_en)
SELECT (SELECT id FROM governorates WHERE name_ar = 'عمان' LIMIT 1), 'لواء القويسمة', 'لواء القويسمة'
WHERE NOT EXISTS (SELECT 1 FROM districts WHERE name_ar = 'لواء القويسمة' AND governorate_id = (SELECT id FROM governorates WHERE name_ar = 'عمان' LIMIT 1));

INSERT INTO districts (governorate_id, name_ar, name_en)
SELECT (SELECT id FROM governorates WHERE name_ar = 'عمان' LIMIT 1), 'لواء سحاب', 'لواء سحاب'
WHERE NOT EXISTS (SELECT 1 FROM districts WHERE name_ar = 'لواء سحاب' AND governorate_id = (SELECT id FROM governorates WHERE name_ar = 'عمان' LIMIT 1));

INSERT INTO districts (governorate_id, name_ar, name_en)
SELECT (SELECT id FROM governorates WHERE name_ar = 'عمان' LIMIT 1), 'لواء الجيزة', 'لواء الجيزة'
WHERE NOT EXISTS (SELECT 1 FROM districts WHERE name_ar = 'لواء الجيزة' AND governorate_id = (SELECT id FROM governorates WHERE name_ar = 'عمان' LIMIT 1));

INSERT INTO districts (governorate_id, name_ar, name_en)
SELECT (SELECT id FROM governorates WHERE name_ar = 'عمان' LIMIT 1), 'لواء ماركا', 'لواء ماركا'
WHERE NOT EXISTS (SELECT 1 FROM districts WHERE name_ar = 'لواء ماركا' AND governorate_id = (SELECT id FROM governorates WHERE name_ar = 'عمان' LIMIT 1));

INSERT INTO districts (governorate_id, name_ar, name_en)
SELECT (SELECT id FROM governorates WHERE name_ar = 'عمان' LIMIT 1), 'لواء ناعور', 'لواء ناعور'
WHERE NOT EXISTS (SELECT 1 FROM districts WHERE name_ar = 'لواء ناعور' AND governorate_id = (SELECT id FROM governorates WHERE name_ar = 'عمان' LIMIT 1));

INSERT INTO districts (governorate_id, name_ar, name_en)
SELECT (SELECT id FROM governorates WHERE name_ar = 'عمان' LIMIT 1), 'لواء وادي السير', 'لواء وادي السير'
WHERE NOT EXISTS (SELECT 1 FROM districts WHERE name_ar = 'لواء وادي السير' AND governorate_id = (SELECT id FROM governorates WHERE name_ar = 'عمان' LIMIT 1));

INSERT INTO districts (governorate_id, name_ar, name_en)
SELECT (SELECT id FROM governorates WHERE name_ar = 'عمان' LIMIT 1), 'الواء', 'الواء'
WHERE NOT EXISTS (SELECT 1 FROM districts WHERE name_ar = 'الواء' AND governorate_id = (SELECT id FROM governorates WHERE name_ar = 'عمان' LIMIT 1));

INSERT INTO districts (governorate_id, name_ar, name_en)
SELECT (SELECT id FROM governorates WHERE name_ar = 'عمان' LIMIT 1), 'قضاء رجم الشامي', 'قضاء رجم الشامي'
WHERE NOT EXISTS (SELECT 1 FROM districts WHERE name_ar = 'قضاء رجم الشامي' AND governorate_id = (SELECT id FROM governorates WHERE name_ar = 'عمان' LIMIT 1));

INSERT INTO districts (governorate_id, name_ar, name_en)
SELECT (SELECT id FROM governorates WHERE name_ar = 'عمان' LIMIT 1), 'قضاءام الرصاص', 'قضاءام الرصاص'
WHERE NOT EXISTS (SELECT 1 FROM districts WHERE name_ar = 'قضاءام الرصاص' AND governorate_id = (SELECT id FROM governorates WHERE name_ar = 'عمان' LIMIT 1));

INSERT INTO districts (governorate_id, name_ar, name_en)
SELECT (SELECT id FROM governorates WHERE name_ar = 'عمان' LIMIT 1), 'قضاء ام البساتين', 'قضاء ام البساتين'
WHERE NOT EXISTS (SELECT 1 FROM districts WHERE name_ar = 'قضاء ام البساتين' AND governorate_id = (SELECT id FROM governorates WHERE name_ar = 'عمان' LIMIT 1));

INSERT INTO districts (governorate_id, name_ar, name_en)
SELECT (SELECT id FROM governorates WHERE name_ar = 'عمان' LIMIT 1), 'قضاء حسبان', 'قضاء حسبان'
WHERE NOT EXISTS (SELECT 1 FROM districts WHERE name_ar = 'قضاء حسبان' AND governorate_id = (SELECT id FROM governorates WHERE name_ar = 'عمان' LIMIT 1));

INSERT INTO districts (governorate_id, name_ar, name_en)
SELECT (SELECT id FROM governorates WHERE name_ar = 'عمان' LIMIT 1), 'الواء', 'الواء'
WHERE NOT EXISTS (SELECT 1 FROM districts WHERE name_ar = 'الواء' AND governorate_id = (SELECT id FROM governorates WHERE name_ar = 'عمان' LIMIT 1));

INSERT INTO districts (governorate_id, name_ar, name_en)
SELECT (SELECT id FROM governorates WHERE name_ar = 'عمان' LIMIT 1), 'الواء', 'الواء'
WHERE NOT EXISTS (SELECT 1 FROM districts WHERE name_ar = 'الواء' AND governorate_id = (SELECT id FROM governorates WHERE name_ar = 'عمان' LIMIT 1));

INSERT INTO districts (governorate_id, name_ar, name_en)
SELECT (SELECT id FROM governorates WHERE name_ar = 'اربد' LIMIT 1), 'لواء قصبة اربد', 'لواء قصبة اربد'
WHERE NOT EXISTS (SELECT 1 FROM districts WHERE name_ar = 'لواء قصبة اربد' AND governorate_id = (SELECT id FROM governorates WHERE name_ar = 'اربد' LIMIT 1));

INSERT INTO districts (governorate_id, name_ar, name_en)
SELECT (SELECT id FROM governorates WHERE name_ar = 'اربد' LIMIT 1), 'لواء الكورة', 'لواء الكورة'
WHERE NOT EXISTS (SELECT 1 FROM districts WHERE name_ar = 'لواء الكورة' AND governorate_id = (SELECT id FROM governorates WHERE name_ar = 'اربد' LIMIT 1));

INSERT INTO districts (governorate_id, name_ar, name_en)
SELECT (SELECT id FROM governorates WHERE name_ar = 'اربد' LIMIT 1), 'لواء الرمثا', 'لواء الرمثا'
WHERE NOT EXISTS (SELECT 1 FROM districts WHERE name_ar = 'لواء الرمثا' AND governorate_id = (SELECT id FROM governorates WHERE name_ar = 'اربد' LIMIT 1));

INSERT INTO districts (governorate_id, name_ar, name_en)
SELECT (SELECT id FROM governorates WHERE name_ar = 'اربد' LIMIT 1), 'لواء الطيبة', 'لواء الطيبة'
WHERE NOT EXISTS (SELECT 1 FROM districts WHERE name_ar = 'لواء الطيبة' AND governorate_id = (SELECT id FROM governorates WHERE name_ar = 'اربد' LIMIT 1));

INSERT INTO districts (governorate_id, name_ar, name_en)
SELECT (SELECT id FROM governorates WHERE name_ar = 'اربد' LIMIT 1), 'لواء المزار /ش', 'لواء المزار /ش'
WHERE NOT EXISTS (SELECT 1 FROM districts WHERE name_ar = 'لواء المزار /ش' AND governorate_id = (SELECT id FROM governorates WHERE name_ar = 'اربد' LIMIT 1));

INSERT INTO districts (governorate_id, name_ar, name_en)
SELECT (SELECT id FROM governorates WHERE name_ar = 'اربد' LIMIT 1), 'لواء الوسيطة', 'لواء الوسيطة'
WHERE NOT EXISTS (SELECT 1 FROM districts WHERE name_ar = 'لواء الوسيطة' AND governorate_id = (SELECT id FROM governorates WHERE name_ar = 'اربد' LIMIT 1));

INSERT INTO districts (governorate_id, name_ar, name_en)
SELECT (SELECT id FROM governorates WHERE name_ar = 'اربد' LIMIT 1), 'لواء بني كنانة', 'لواء بني كنانة'
WHERE NOT EXISTS (SELECT 1 FROM districts WHERE name_ar = 'لواء بني كنانة' AND governorate_id = (SELECT id FROM governorates WHERE name_ar = 'اربد' LIMIT 1));

INSERT INTO districts (governorate_id, name_ar, name_en)
SELECT (SELECT id FROM governorates WHERE name_ar = 'اربد' LIMIT 1), 'لواء بني عبيد', 'لواء بني عبيد'
WHERE NOT EXISTS (SELECT 1 FROM districts WHERE name_ar = 'لواء بني عبيد' AND governorate_id = (SELECT id FROM governorates WHERE name_ar = 'اربد' LIMIT 1));

INSERT INTO districts (governorate_id, name_ar, name_en)
SELECT (SELECT id FROM governorates WHERE name_ar = 'اربد' LIMIT 1), 'لواء الاغوار /ش', 'لواء الاغوار /ش'
WHERE NOT EXISTS (SELECT 1 FROM districts WHERE name_ar = 'لواء الاغوار /ش' AND governorate_id = (SELECT id FROM governorates WHERE name_ar = 'اربد' LIMIT 1));

INSERT INTO districts (governorate_id, name_ar, name_en)
SELECT (SELECT id FROM governorates WHERE name_ar = 'البلقاء' LIMIT 1), 'لواء قصبة المركز', 'لواء قصبة المركز'
WHERE NOT EXISTS (SELECT 1 FROM districts WHERE name_ar = 'لواء قصبة المركز' AND governorate_id = (SELECT id FROM governorates WHERE name_ar = 'البلقاء' LIMIT 1));

INSERT INTO districts (governorate_id, name_ar, name_en)
SELECT (SELECT id FROM governorates WHERE name_ar = 'البلقاء' LIMIT 1), 'لواء دير علا', 'لواء دير علا'
WHERE NOT EXISTS (SELECT 1 FROM districts WHERE name_ar = 'لواء دير علا' AND governorate_id = (SELECT id FROM governorates WHERE name_ar = 'البلقاء' LIMIT 1));

INSERT INTO districts (governorate_id, name_ar, name_en)
SELECT (SELECT id FROM governorates WHERE name_ar = 'البلقاء' LIMIT 1), 'لواء عين الباشا', 'لواء عين الباشا'
WHERE NOT EXISTS (SELECT 1 FROM districts WHERE name_ar = 'لواء عين الباشا' AND governorate_id = (SELECT id FROM governorates WHERE name_ar = 'البلقاء' LIMIT 1));

INSERT INTO districts (governorate_id, name_ar, name_en)
SELECT (SELECT id FROM governorates WHERE name_ar = 'البلقاء' LIMIT 1), 'لواء الشونة /ج', 'لواء الشونة /ج'
WHERE NOT EXISTS (SELECT 1 FROM districts WHERE name_ar = 'لواء الشونة /ج' AND governorate_id = (SELECT id FROM governorates WHERE name_ar = 'البلقاء' LIMIT 1));

INSERT INTO districts (governorate_id, name_ar, name_en)
SELECT (SELECT id FROM governorates WHERE name_ar = 'البلقاء' LIMIT 1), 'لواء ماحص / الفحيص', 'لواء ماحص / الفحيص'
WHERE NOT EXISTS (SELECT 1 FROM districts WHERE name_ar = 'لواء ماحص / الفحيص' AND governorate_id = (SELECT id FROM governorates WHERE name_ar = 'البلقاء' LIMIT 1));

INSERT INTO districts (governorate_id, name_ar, name_en)
SELECT (SELECT id FROM governorates WHERE name_ar = 'البلقاء' LIMIT 1), 'قضاء عيرا / يرقا', 'قضاء عيرا / يرقا'
WHERE NOT EXISTS (SELECT 1 FROM districts WHERE name_ar = 'قضاء عيرا / يرقا' AND governorate_id = (SELECT id FROM governorates WHERE name_ar = 'البلقاء' LIMIT 1));

INSERT INTO districts (governorate_id, name_ar, name_en)
SELECT (SELECT id FROM governorates WHERE name_ar = 'البلقاء' LIMIT 1), 'قضاء زي', 'قضاء زي'
WHERE NOT EXISTS (SELECT 1 FROM districts WHERE name_ar = 'قضاء زي' AND governorate_id = (SELECT id FROM governorates WHERE name_ar = 'البلقاء' LIMIT 1));

INSERT INTO districts (governorate_id, name_ar, name_en)
SELECT (SELECT id FROM governorates WHERE name_ar = 'البلقاء' LIMIT 1), 'قضاء العارضة', 'قضاء العارضة'
WHERE NOT EXISTS (SELECT 1 FROM districts WHERE name_ar = 'قضاء العارضة' AND governorate_id = (SELECT id FROM governorates WHERE name_ar = 'البلقاء' LIMIT 1));

INSERT INTO districts (governorate_id, name_ar, name_en)
SELECT (SELECT id FROM governorates WHERE name_ar = 'الكرك' LIMIT 1), 'لواء قصبة الكرك', 'لواء قصبة الكرك'
WHERE NOT EXISTS (SELECT 1 FROM districts WHERE name_ar = 'لواء قصبة الكرك' AND governorate_id = (SELECT id FROM governorates WHERE name_ar = 'الكرك' LIMIT 1));

INSERT INTO districts (governorate_id, name_ar, name_en)
SELECT (SELECT id FROM governorates WHERE name_ar = 'الكرك' LIMIT 1), 'لواء المزار / ج', 'لواء المزار / ج'
WHERE NOT EXISTS (SELECT 1 FROM districts WHERE name_ar = 'لواء المزار / ج' AND governorate_id = (SELECT id FROM governorates WHERE name_ar = 'الكرك' LIMIT 1));

INSERT INTO districts (governorate_id, name_ar, name_en)
SELECT (SELECT id FROM governorates WHERE name_ar = 'الكرك' LIMIT 1), 'لواء القصر', 'لواء القصر'
WHERE NOT EXISTS (SELECT 1 FROM districts WHERE name_ar = 'لواء القصر' AND governorate_id = (SELECT id FROM governorates WHERE name_ar = 'الكرك' LIMIT 1));

INSERT INTO districts (governorate_id, name_ar, name_en)
SELECT (SELECT id FROM governorates WHERE name_ar = 'الكرك' LIMIT 1), 'لواء الاغوار / ج', 'لواء الاغوار / ج'
WHERE NOT EXISTS (SELECT 1 FROM districts WHERE name_ar = 'لواء الاغوار / ج' AND governorate_id = (SELECT id FROM governorates WHERE name_ar = 'الكرك' LIMIT 1));

INSERT INTO districts (governorate_id, name_ar, name_en)
SELECT (SELECT id FROM governorates WHERE name_ar = 'الكرك' LIMIT 1), 'لواء عي', 'لواء عي'
WHERE NOT EXISTS (SELECT 1 FROM districts WHERE name_ar = 'لواء عي' AND governorate_id = (SELECT id FROM governorates WHERE name_ar = 'الكرك' LIMIT 1));

INSERT INTO districts (governorate_id, name_ar, name_en)
SELECT (SELECT id FROM governorates WHERE name_ar = 'الكرك' LIMIT 1), 'لواء القطرانة', 'لواء القطرانة'
WHERE NOT EXISTS (SELECT 1 FROM districts WHERE name_ar = 'لواء القطرانة' AND governorate_id = (SELECT id FROM governorates WHERE name_ar = 'الكرك' LIMIT 1));

INSERT INTO districts (governorate_id, name_ar, name_en)
SELECT (SELECT id FROM governorates WHERE name_ar = 'الكرك' LIMIT 1), 'قضاء مؤاب', 'قضاء مؤاب'
WHERE NOT EXISTS (SELECT 1 FROM districts WHERE name_ar = 'قضاء مؤاب' AND governorate_id = (SELECT id FROM governorates WHERE name_ar = 'الكرك' LIMIT 1));

INSERT INTO districts (governorate_id, name_ar, name_en)
SELECT (SELECT id FROM governorates WHERE name_ar = 'الكرك' LIMIT 1), 'قضاء الموجب', 'قضاء الموجب'
WHERE NOT EXISTS (SELECT 1 FROM districts WHERE name_ar = 'قضاء الموجب' AND governorate_id = (SELECT id FROM governorates WHERE name_ar = 'الكرك' LIMIT 1));

INSERT INTO districts (governorate_id, name_ar, name_en)
SELECT (SELECT id FROM governorates WHERE name_ar = 'الكرك' LIMIT 1), 'قضاء غور المزرعة', 'قضاء غور المزرعة'
WHERE NOT EXISTS (SELECT 1 FROM districts WHERE name_ar = 'قضاء غور المزرعة' AND governorate_id = (SELECT id FROM governorates WHERE name_ar = 'الكرك' LIMIT 1));

INSERT INTO districts (governorate_id, name_ar, name_en)
SELECT (SELECT id FROM governorates WHERE name_ar = 'معان' LIMIT 1), 'لواء قصبة معان', 'لواء قصبة معان'
WHERE NOT EXISTS (SELECT 1 FROM districts WHERE name_ar = 'لواء قصبة معان' AND governorate_id = (SELECT id FROM governorates WHERE name_ar = 'معان' LIMIT 1));

INSERT INTO districts (governorate_id, name_ar, name_en)
SELECT (SELECT id FROM governorates WHERE name_ar = 'معان' LIMIT 1), 'لواء البتراء', 'لواء البتراء'
WHERE NOT EXISTS (SELECT 1 FROM districts WHERE name_ar = 'لواء البتراء' AND governorate_id = (SELECT id FROM governorates WHERE name_ar = 'معان' LIMIT 1));

INSERT INTO districts (governorate_id, name_ar, name_en)
SELECT (SELECT id FROM governorates WHERE name_ar = 'معان' LIMIT 1), 'لواء الشوبك', 'لواء الشوبك'
WHERE NOT EXISTS (SELECT 1 FROM districts WHERE name_ar = 'لواء الشوبك' AND governorate_id = (SELECT id FROM governorates WHERE name_ar = 'معان' LIMIT 1));

INSERT INTO districts (governorate_id, name_ar, name_en)
SELECT (SELECT id FROM governorates WHERE name_ar = 'معان' LIMIT 1), 'لواء الحسينية', 'لواء الحسينية'
WHERE NOT EXISTS (SELECT 1 FROM districts WHERE name_ar = 'لواء الحسينية' AND governorate_id = (SELECT id FROM governorates WHERE name_ar = 'معان' LIMIT 1));

INSERT INTO districts (governorate_id, name_ar, name_en)
SELECT (SELECT id FROM governorates WHERE name_ar = 'معان' LIMIT 1), 'قضاء الجفر', 'قضاء الجفر'
WHERE NOT EXISTS (SELECT 1 FROM districts WHERE name_ar = 'قضاء الجفر' AND governorate_id = (SELECT id FROM governorates WHERE name_ar = 'معان' LIMIT 1));

INSERT INTO districts (governorate_id, name_ar, name_en)
SELECT (SELECT id FROM governorates WHERE name_ar = 'معان' LIMIT 1), 'قضاء مريغة', 'قضاء مريغة'
WHERE NOT EXISTS (SELECT 1 FROM districts WHERE name_ar = 'قضاء مريغة' AND governorate_id = (SELECT id FROM governorates WHERE name_ar = 'معان' LIMIT 1));

INSERT INTO districts (governorate_id, name_ar, name_en)
SELECT (SELECT id FROM governorates WHERE name_ar = 'معان' LIMIT 1), 'قضاء ايل', 'قضاء ايل'
WHERE NOT EXISTS (SELECT 1 FROM districts WHERE name_ar = 'قضاء ايل' AND governorate_id = (SELECT id FROM governorates WHERE name_ar = 'معان' LIMIT 1));

INSERT INTO districts (governorate_id, name_ar, name_en)
SELECT (SELECT id FROM governorates WHERE name_ar = 'معان' LIMIT 1), 'قضاء اذرح', 'قضاء اذرح'
WHERE NOT EXISTS (SELECT 1 FROM districts WHERE name_ar = 'قضاء اذرح' AND governorate_id = (SELECT id FROM governorates WHERE name_ar = 'معان' LIMIT 1));

INSERT INTO districts (governorate_id, name_ar, name_en)
SELECT (SELECT id FROM governorates WHERE name_ar = 'الزرقاء' LIMIT 1), 'لواء قصبة الزرقاء', 'لواء قصبة الزرقاء'
WHERE NOT EXISTS (SELECT 1 FROM districts WHERE name_ar = 'لواء قصبة الزرقاء' AND governorate_id = (SELECT id FROM governorates WHERE name_ar = 'الزرقاء' LIMIT 1));

INSERT INTO districts (governorate_id, name_ar, name_en)
SELECT (SELECT id FROM governorates WHERE name_ar = 'الزرقاء' LIMIT 1), 'لواءالهاشمية', 'لواءالهاشمية'
WHERE NOT EXISTS (SELECT 1 FROM districts WHERE name_ar = 'لواءالهاشمية' AND governorate_id = (SELECT id FROM governorates WHERE name_ar = 'الزرقاء' LIMIT 1));

INSERT INTO districts (governorate_id, name_ar, name_en)
SELECT (SELECT id FROM governorates WHERE name_ar = 'الزرقاء' LIMIT 1), 'لواء الرصيفة', 'لواء الرصيفة'
WHERE NOT EXISTS (SELECT 1 FROM districts WHERE name_ar = 'لواء الرصيفة' AND governorate_id = (SELECT id FROM governorates WHERE name_ar = 'الزرقاء' LIMIT 1));

INSERT INTO districts (governorate_id, name_ar, name_en)
SELECT (SELECT id FROM governorates WHERE name_ar = 'الزرقاء' LIMIT 1), 'قضاء بيرين', 'قضاء بيرين'
WHERE NOT EXISTS (SELECT 1 FROM districts WHERE name_ar = 'قضاء بيرين' AND governorate_id = (SELECT id FROM governorates WHERE name_ar = 'الزرقاء' LIMIT 1));

INSERT INTO districts (governorate_id, name_ar, name_en)
SELECT (SELECT id FROM governorates WHERE name_ar = 'الزرقاء' LIMIT 1), 'قضاء الضليل', 'قضاء الضليل'
WHERE NOT EXISTS (SELECT 1 FROM districts WHERE name_ar = 'قضاء الضليل' AND governorate_id = (SELECT id FROM governorates WHERE name_ar = 'الزرقاء' LIMIT 1));

INSERT INTO districts (governorate_id, name_ar, name_en)
SELECT (SELECT id FROM governorates WHERE name_ar = 'الزرقاء' LIMIT 1), 'لواء الازرق', 'لواء الازرق'
WHERE NOT EXISTS (SELECT 1 FROM districts WHERE name_ar = 'لواء الازرق' AND governorate_id = (SELECT id FROM governorates WHERE name_ar = 'الزرقاء' LIMIT 1));

INSERT INTO districts (governorate_id, name_ar, name_en)
SELECT (SELECT id FROM governorates WHERE name_ar = 'المفرق' LIMIT 1), 'لواء قصبة المفرق', 'لواء قصبة المفرق'
WHERE NOT EXISTS (SELECT 1 FROM districts WHERE name_ar = 'لواء قصبة المفرق' AND governorate_id = (SELECT id FROM governorates WHERE name_ar = 'المفرق' LIMIT 1));

INSERT INTO districts (governorate_id, name_ar, name_en)
SELECT (SELECT id FROM governorates WHERE name_ar = 'المفرق' LIMIT 1), 'لواء بلعما', 'لواء بلعما'
WHERE NOT EXISTS (SELECT 1 FROM districts WHERE name_ar = 'لواء بلعما' AND governorate_id = (SELECT id FROM governorates WHERE name_ar = 'المفرق' LIMIT 1));

INSERT INTO districts (governorate_id, name_ar, name_en)
SELECT (SELECT id FROM governorates WHERE name_ar = 'المفرق' LIMIT 1), 'لواء البادية /ش', 'لواء البادية /ش'
WHERE NOT EXISTS (SELECT 1 FROM districts WHERE name_ar = 'لواء البادية /ش' AND governorate_id = (SELECT id FROM governorates WHERE name_ar = 'المفرق' LIMIT 1));

INSERT INTO districts (governorate_id, name_ar, name_en)
SELECT (SELECT id FROM governorates WHERE name_ar = 'المفرق' LIMIT 1), 'لواء الرويشد', 'لواء الرويشد'
WHERE NOT EXISTS (SELECT 1 FROM districts WHERE name_ar = 'لواء الرويشد' AND governorate_id = (SELECT id FROM governorates WHERE name_ar = 'المفرق' LIMIT 1));

INSERT INTO districts (governorate_id, name_ar, name_en)
SELECT (SELECT id FROM governorates WHERE name_ar = 'المفرق' LIMIT 1), 'قضاء سما السرحان', 'قضاء سما السرحان'
WHERE NOT EXISTS (SELECT 1 FROM districts WHERE name_ar = 'قضاء سما السرحان' AND governorate_id = (SELECT id FROM governorates WHERE name_ar = 'المفرق' LIMIT 1));

INSERT INTO districts (governorate_id, name_ar, name_en)
SELECT (SELECT id FROM governorates WHERE name_ar = 'المفرق' LIMIT 1), 'قضاء حوشا', 'قضاء حوشا'
WHERE NOT EXISTS (SELECT 1 FROM districts WHERE name_ar = 'قضاء حوشا' AND governorate_id = (SELECT id FROM governorates WHERE name_ar = 'المفرق' LIMIT 1));

INSERT INTO districts (governorate_id, name_ar, name_en)
SELECT (SELECT id FROM governorates WHERE name_ar = 'المفرق' LIMIT 1), 'قضاء الخالدية', 'قضاء الخالدية'
WHERE NOT EXISTS (SELECT 1 FROM districts WHERE name_ar = 'قضاء الخالدية' AND governorate_id = (SELECT id FROM governorates WHERE name_ar = 'المفرق' LIMIT 1));

INSERT INTO districts (governorate_id, name_ar, name_en)
SELECT (SELECT id FROM governorates WHERE name_ar = 'المفرق' LIMIT 1), 'قضاء رحاب', 'قضاء رحاب'
WHERE NOT EXISTS (SELECT 1 FROM districts WHERE name_ar = 'قضاء رحاب' AND governorate_id = (SELECT id FROM governorates WHERE name_ar = 'المفرق' LIMIT 1));

INSERT INTO districts (governorate_id, name_ar, name_en)
SELECT (SELECT id FROM governorates WHERE name_ar = 'المفرق' LIMIT 1), 'قضاء المنشية', 'قضاء المنشية'
WHERE NOT EXISTS (SELECT 1 FROM districts WHERE name_ar = 'قضاء المنشية' AND governorate_id = (SELECT id FROM governorates WHERE name_ar = 'المفرق' LIMIT 1));

INSERT INTO districts (governorate_id, name_ar, name_en)
SELECT (SELECT id FROM governorates WHERE name_ar = 'المفرق' LIMIT 1), 'قضاء صبحا', 'قضاء صبحا'
WHERE NOT EXISTS (SELECT 1 FROM districts WHERE name_ar = 'قضاء صبحا' AND governorate_id = (SELECT id FROM governorates WHERE name_ar = 'المفرق' LIMIT 1));

INSERT INTO districts (governorate_id, name_ar, name_en)
SELECT (SELECT id FROM governorates WHERE name_ar = 'المفرق' LIMIT 1), 'قضاء ام الجمال', 'قضاء ام الجمال'
WHERE NOT EXISTS (SELECT 1 FROM districts WHERE name_ar = 'قضاء ام الجمال' AND governorate_id = (SELECT id FROM governorates WHERE name_ar = 'المفرق' LIMIT 1));

INSERT INTO districts (governorate_id, name_ar, name_en)
SELECT (SELECT id FROM governorates WHERE name_ar = 'المفرق' LIMIT 1), 'قضاء دير الكهف', 'قضاء دير الكهف'
WHERE NOT EXISTS (SELECT 1 FROM districts WHERE name_ar = 'قضاء دير الكهف' AND governorate_id = (SELECT id FROM governorates WHERE name_ar = 'المفرق' LIMIT 1));

INSERT INTO districts (governorate_id, name_ar, name_en)
SELECT (SELECT id FROM governorates WHERE name_ar = 'المفرق' LIMIT 1), 'قضاء ام القطين', 'قضاء ام القطين'
WHERE NOT EXISTS (SELECT 1 FROM districts WHERE name_ar = 'قضاء ام القطين' AND governorate_id = (SELECT id FROM governorates WHERE name_ar = 'المفرق' LIMIT 1));

INSERT INTO districts (governorate_id, name_ar, name_en)
SELECT (SELECT id FROM governorates WHERE name_ar = 'الطفيلة' LIMIT 1), 'لواء قصبة الطفيلة', 'لواء قصبة الطفيلة'
WHERE NOT EXISTS (SELECT 1 FROM districts WHERE name_ar = 'لواء قصبة الطفيلة' AND governorate_id = (SELECT id FROM governorates WHERE name_ar = 'الطفيلة' LIMIT 1));

INSERT INTO districts (governorate_id, name_ar, name_en)
SELECT (SELECT id FROM governorates WHERE name_ar = 'الطفيلة' LIMIT 1), 'لواء الحسا', 'لواء الحسا'
WHERE NOT EXISTS (SELECT 1 FROM districts WHERE name_ar = 'لواء الحسا' AND governorate_id = (SELECT id FROM governorates WHERE name_ar = 'الطفيلة' LIMIT 1));

INSERT INTO districts (governorate_id, name_ar, name_en)
SELECT (SELECT id FROM governorates WHERE name_ar = 'الطفيلة' LIMIT 1), 'لواء بصيرا', 'لواء بصيرا'
WHERE NOT EXISTS (SELECT 1 FROM districts WHERE name_ar = 'لواء بصيرا' AND governorate_id = (SELECT id FROM governorates WHERE name_ar = 'الطفيلة' LIMIT 1));

INSERT INTO districts (governorate_id, name_ar, name_en)
SELECT (SELECT id FROM governorates WHERE name_ar = 'مادبا' LIMIT 1), 'لواء قصبة مادبا', 'لواء قصبة مادبا'
WHERE NOT EXISTS (SELECT 1 FROM districts WHERE name_ar = 'لواء قصبة مادبا' AND governorate_id = (SELECT id FROM governorates WHERE name_ar = 'مادبا' LIMIT 1));

INSERT INTO districts (governorate_id, name_ar, name_en)
SELECT (SELECT id FROM governorates WHERE name_ar = 'مادبا' LIMIT 1), 'لواء ذيبان', 'لواء ذيبان'
WHERE NOT EXISTS (SELECT 1 FROM districts WHERE name_ar = 'لواء ذيبان' AND governorate_id = (SELECT id FROM governorates WHERE name_ar = 'مادبا' LIMIT 1));

INSERT INTO districts (governorate_id, name_ar, name_en)
SELECT (SELECT id FROM governorates WHERE name_ar = 'مادبا' LIMIT 1), 'قضاء جرينة', 'قضاء جرينة'
WHERE NOT EXISTS (SELECT 1 FROM districts WHERE name_ar = 'قضاء جرينة' AND governorate_id = (SELECT id FROM governorates WHERE name_ar = 'مادبا' LIMIT 1));

INSERT INTO districts (governorate_id, name_ar, name_en)
SELECT (SELECT id FROM governorates WHERE name_ar = 'مادبا' LIMIT 1), 'قضاء ماعين', 'قضاء ماعين'
WHERE NOT EXISTS (SELECT 1 FROM districts WHERE name_ar = 'قضاء ماعين' AND governorate_id = (SELECT id FROM governorates WHERE name_ar = 'مادبا' LIMIT 1));

INSERT INTO districts (governorate_id, name_ar, name_en)
SELECT (SELECT id FROM governorates WHERE name_ar = 'مادبا' LIMIT 1), 'قضاء الفيصلية', 'قضاء الفيصلية'
WHERE NOT EXISTS (SELECT 1 FROM districts WHERE name_ar = 'قضاء الفيصلية' AND governorate_id = (SELECT id FROM governorates WHERE name_ar = 'مادبا' LIMIT 1));

INSERT INTO districts (governorate_id, name_ar, name_en)
SELECT (SELECT id FROM governorates WHERE name_ar = 'مادبا' LIMIT 1), 'قضاء العريض', 'قضاء العريض'
WHERE NOT EXISTS (SELECT 1 FROM districts WHERE name_ar = 'قضاء العريض' AND governorate_id = (SELECT id FROM governorates WHERE name_ar = 'مادبا' LIMIT 1));

INSERT INTO districts (governorate_id, name_ar, name_en)
SELECT (SELECT id FROM governorates WHERE name_ar = 'مادبا' LIMIT 1), 'قضاء مليح', 'قضاء مليح'
WHERE NOT EXISTS (SELECT 1 FROM districts WHERE name_ar = 'قضاء مليح' AND governorate_id = (SELECT id FROM governorates WHERE name_ar = 'مادبا' LIMIT 1));

INSERT INTO districts (governorate_id, name_ar, name_en)
SELECT (SELECT id FROM governorates WHERE name_ar = 'جرش' LIMIT 1), 'لواء القصبة', 'لواء القصبة'
WHERE NOT EXISTS (SELECT 1 FROM districts WHERE name_ar = 'لواء القصبة' AND governorate_id = (SELECT id FROM governorates WHERE name_ar = 'جرش' LIMIT 1));

INSERT INTO districts (governorate_id, name_ar, name_en)
SELECT (SELECT id FROM governorates WHERE name_ar = 'جرش' LIMIT 1), 'قضاء المسطبة', 'قضاء المسطبة'
WHERE NOT EXISTS (SELECT 1 FROM districts WHERE name_ar = 'قضاء المسطبة' AND governorate_id = (SELECT id FROM governorates WHERE name_ar = 'جرش' LIMIT 1));

INSERT INTO districts (governorate_id, name_ar, name_en)
SELECT (SELECT id FROM governorates WHERE name_ar = 'جرش' LIMIT 1), 'قضاء برما', 'قضاء برما'
WHERE NOT EXISTS (SELECT 1 FROM districts WHERE name_ar = 'قضاء برما' AND governorate_id = (SELECT id FROM governorates WHERE name_ar = 'جرش' LIMIT 1));

INSERT INTO districts (governorate_id, name_ar, name_en)
SELECT (SELECT id FROM governorates WHERE name_ar = 'عجلون' LIMIT 1), 'لواء قصبة عجلون', 'لواء قصبة عجلون'
WHERE NOT EXISTS (SELECT 1 FROM districts WHERE name_ar = 'لواء قصبة عجلون' AND governorate_id = (SELECT id FROM governorates WHERE name_ar = 'عجلون' LIMIT 1));

INSERT INTO districts (governorate_id, name_ar, name_en)
SELECT (SELECT id FROM governorates WHERE name_ar = 'عجلون' LIMIT 1), 'لواء كفرنجة', 'لواء كفرنجة'
WHERE NOT EXISTS (SELECT 1 FROM districts WHERE name_ar = 'لواء كفرنجة' AND governorate_id = (SELECT id FROM governorates WHERE name_ar = 'عجلون' LIMIT 1));

INSERT INTO districts (governorate_id, name_ar, name_en)
SELECT (SELECT id FROM governorates WHERE name_ar = 'عجلون' LIMIT 1), 'قضاء صخرة', 'قضاء صخرة'
WHERE NOT EXISTS (SELECT 1 FROM districts WHERE name_ar = 'قضاء صخرة' AND governorate_id = (SELECT id FROM governorates WHERE name_ar = 'عجلون' LIMIT 1));

INSERT INTO districts (governorate_id, name_ar, name_en)
SELECT (SELECT id FROM governorates WHERE name_ar = 'عجلون' LIMIT 1), 'قضاء عرجان', 'قضاء عرجان'
WHERE NOT EXISTS (SELECT 1 FROM districts WHERE name_ar = 'قضاء عرجان' AND governorate_id = (SELECT id FROM governorates WHERE name_ar = 'عجلون' LIMIT 1));

INSERT INTO districts (governorate_id, name_ar, name_en)
SELECT (SELECT id FROM governorates WHERE name_ar = 'العقبة' LIMIT 1), 'لواء قصبة العقبة', 'لواء قصبة العقبة'
WHERE NOT EXISTS (SELECT 1 FROM districts WHERE name_ar = 'لواء قصبة العقبة' AND governorate_id = (SELECT id FROM governorates WHERE name_ar = 'العقبة' LIMIT 1));

INSERT INTO districts (governorate_id, name_ar, name_en)
SELECT (SELECT id FROM governorates WHERE name_ar = 'العقبة' LIMIT 1), 'لواء القويرة', 'لواء القويرة'
WHERE NOT EXISTS (SELECT 1 FROM districts WHERE name_ar = 'لواء القويرة' AND governorate_id = (SELECT id FROM governorates WHERE name_ar = 'العقبة' LIMIT 1));

INSERT INTO districts (governorate_id, name_ar, name_en)
SELECT (SELECT id FROM governorates WHERE name_ar = 'العقبة' LIMIT 1), 'قضاء وادي عربه', 'قضاء وادي عربه'
WHERE NOT EXISTS (SELECT 1 FROM districts WHERE name_ar = 'قضاء وادي عربه' AND governorate_id = (SELECT id FROM governorates WHERE name_ar = 'العقبة' LIMIT 1));

INSERT INTO districts (governorate_id, name_ar, name_en)
SELECT (SELECT id FROM governorates WHERE name_ar = 'العقبة' LIMIT 1), 'قضاءالديسة', 'قضاءالديسة'
WHERE NOT EXISTS (SELECT 1 FROM districts WHERE name_ar = 'قضاءالديسة' AND governorate_id = (SELECT id FROM governorates WHERE name_ar = 'العقبة' LIMIT 1));

INSERT INTO districts (governorate_id, name_ar, name_en)
SELECT (SELECT id FROM governorates WHERE name_ar = 'القاهرة' LIMIT 1), 'مركز القاهرة', 'Cairo Center'
WHERE NOT EXISTS (SELECT 1 FROM districts WHERE name_ar = 'مركز القاهرة' AND governorate_id = (SELECT id FROM governorates WHERE name_ar = 'القاهرة' LIMIT 1));

INSERT INTO districts (governorate_id, name_ar, name_en)
SELECT (SELECT id FROM governorates WHERE name_ar = 'الإسكندرية' LIMIT 1), 'مركز الإسكندرية', 'Alexandria Center'
WHERE NOT EXISTS (SELECT 1 FROM districts WHERE name_ar = 'مركز الإسكندرية' AND governorate_id = (SELECT id FROM governorates WHERE name_ar = 'الإسكندرية' LIMIT 1));

INSERT INTO districts (governorate_id, name_ar, name_en)
SELECT (SELECT id FROM governorates WHERE name_ar = 'الجيزة' LIMIT 1), 'مركز الجيزة', 'Giza Center'
WHERE NOT EXISTS (SELECT 1 FROM districts WHERE name_ar = 'مركز الجيزة' AND governorate_id = (SELECT id FROM governorates WHERE name_ar = 'الجيزة' LIMIT 1));

INSERT INTO districts (governorate_id, name_ar, name_en)
SELECT (SELECT id FROM governorates WHERE name_ar = 'القليوبية' LIMIT 1), 'مركز القليوبية', 'Qalyubia Center'
WHERE NOT EXISTS (SELECT 1 FROM districts WHERE name_ar = 'مركز القليوبية' AND governorate_id = (SELECT id FROM governorates WHERE name_ar = 'القليوبية' LIMIT 1));

INSERT INTO districts (governorate_id, name_ar, name_en)
SELECT (SELECT id FROM governorates WHERE name_ar = 'الدقهلية' LIMIT 1), 'مركز الدقهلية', 'Dakahlia Center'
WHERE NOT EXISTS (SELECT 1 FROM districts WHERE name_ar = 'مركز الدقهلية' AND governorate_id = (SELECT id FROM governorates WHERE name_ar = 'الدقهلية' LIMIT 1));

INSERT INTO districts (governorate_id, name_ar, name_en)
SELECT (SELECT id FROM governorates WHERE name_ar = 'الشرقية' LIMIT 1), 'مركز الشرقية', 'Al Sharqia Center'
WHERE NOT EXISTS (SELECT 1 FROM districts WHERE name_ar = 'مركز الشرقية' AND governorate_id = (SELECT id FROM governorates WHERE name_ar = 'الشرقية' LIMIT 1));

INSERT INTO districts (governorate_id, name_ar, name_en)
SELECT (SELECT id FROM governorates WHERE name_ar = 'المنوفية' LIMIT 1), 'مركز المنوفية', 'Monufia Center'
WHERE NOT EXISTS (SELECT 1 FROM districts WHERE name_ar = 'مركز المنوفية' AND governorate_id = (SELECT id FROM governorates WHERE name_ar = 'المنوفية' LIMIT 1));

INSERT INTO districts (governorate_id, name_ar, name_en)
SELECT (SELECT id FROM governorates WHERE name_ar = 'الغربية' LIMIT 1), 'مركز الغربية', 'Gharbia Center'
WHERE NOT EXISTS (SELECT 1 FROM districts WHERE name_ar = 'مركز الغربية' AND governorate_id = (SELECT id FROM governorates WHERE name_ar = 'الغربية' LIMIT 1));

INSERT INTO districts (governorate_id, name_ar, name_en)
SELECT (SELECT id FROM governorates WHERE name_ar = 'كفر الشيخ' LIMIT 1), 'مركز كفر الشيخ', 'Kafr El Sheikh Center'
WHERE NOT EXISTS (SELECT 1 FROM districts WHERE name_ar = 'مركز كفر الشيخ' AND governorate_id = (SELECT id FROM governorates WHERE name_ar = 'كفر الشيخ' LIMIT 1));

INSERT INTO districts (governorate_id, name_ar, name_en)
SELECT (SELECT id FROM governorates WHERE name_ar = 'البحيرة' LIMIT 1), 'مركز البحيرة', 'Beheira Center'
WHERE NOT EXISTS (SELECT 1 FROM districts WHERE name_ar = 'مركز البحيرة' AND governorate_id = (SELECT id FROM governorates WHERE name_ar = 'البحيرة' LIMIT 1));

INSERT INTO districts (governorate_id, name_ar, name_en)
SELECT (SELECT id FROM governorates WHERE name_ar = 'دمياط' LIMIT 1), 'مركز دمياط', 'Damietta Center'
WHERE NOT EXISTS (SELECT 1 FROM districts WHERE name_ar = 'مركز دمياط' AND governorate_id = (SELECT id FROM governorates WHERE name_ar = 'دمياط' LIMIT 1));

INSERT INTO districts (governorate_id, name_ar, name_en)
SELECT (SELECT id FROM governorates WHERE name_ar = 'بورسعيد' LIMIT 1), 'مركز بورسعيد', 'Port Said Center'
WHERE NOT EXISTS (SELECT 1 FROM districts WHERE name_ar = 'مركز بورسعيد' AND governorate_id = (SELECT id FROM governorates WHERE name_ar = 'بورسعيد' LIMIT 1));

INSERT INTO districts (governorate_id, name_ar, name_en)
SELECT (SELECT id FROM governorates WHERE name_ar = 'الإسماعيلية' LIMIT 1), 'مركز الإسماعيلية', 'Ismailia Center'
WHERE NOT EXISTS (SELECT 1 FROM districts WHERE name_ar = 'مركز الإسماعيلية' AND governorate_id = (SELECT id FROM governorates WHERE name_ar = 'الإسماعيلية' LIMIT 1));

INSERT INTO districts (governorate_id, name_ar, name_en)
SELECT (SELECT id FROM governorates WHERE name_ar = 'السويس' LIMIT 1), 'مركز السويس', 'Suez Center'
WHERE NOT EXISTS (SELECT 1 FROM districts WHERE name_ar = 'مركز السويس' AND governorate_id = (SELECT id FROM governorates WHERE name_ar = 'السويس' LIMIT 1));

INSERT INTO districts (governorate_id, name_ar, name_en)
SELECT (SELECT id FROM governorates WHERE name_ar = 'شمال سيناء' LIMIT 1), 'مركز شمال سيناء', 'North Sinai Center'
WHERE NOT EXISTS (SELECT 1 FROM districts WHERE name_ar = 'مركز شمال سيناء' AND governorate_id = (SELECT id FROM governorates WHERE name_ar = 'شمال سيناء' LIMIT 1));

INSERT INTO districts (governorate_id, name_ar, name_en)
SELECT (SELECT id FROM governorates WHERE name_ar = 'جنوب سيناء' LIMIT 1), 'مركز جنوب سيناء', 'South Sinai Center'
WHERE NOT EXISTS (SELECT 1 FROM districts WHERE name_ar = 'مركز جنوب سيناء' AND governorate_id = (SELECT id FROM governorates WHERE name_ar = 'جنوب سيناء' LIMIT 1));

INSERT INTO districts (governorate_id, name_ar, name_en)
SELECT (SELECT id FROM governorates WHERE name_ar = 'مطروح' LIMIT 1), 'مركز مطروح', 'Matrouh Center'
WHERE NOT EXISTS (SELECT 1 FROM districts WHERE name_ar = 'مركز مطروح' AND governorate_id = (SELECT id FROM governorates WHERE name_ar = 'مطروح' LIMIT 1));

INSERT INTO districts (governorate_id, name_ar, name_en)
SELECT (SELECT id FROM governorates WHERE name_ar = 'الفيوم' LIMIT 1), 'مركز الفيوم', 'Faiyum Center'
WHERE NOT EXISTS (SELECT 1 FROM districts WHERE name_ar = 'مركز الفيوم' AND governorate_id = (SELECT id FROM governorates WHERE name_ar = 'الفيوم' LIMIT 1));

INSERT INTO districts (governorate_id, name_ar, name_en)
SELECT (SELECT id FROM governorates WHERE name_ar = 'بني سويف' LIMIT 1), 'مركز بني سويف', 'Beni Suef Center'
WHERE NOT EXISTS (SELECT 1 FROM districts WHERE name_ar = 'مركز بني سويف' AND governorate_id = (SELECT id FROM governorates WHERE name_ar = 'بني سويف' LIMIT 1));

INSERT INTO districts (governorate_id, name_ar, name_en)
SELECT (SELECT id FROM governorates WHERE name_ar = 'المنيا' LIMIT 1), 'مركز المنيا', 'Minya Center'
WHERE NOT EXISTS (SELECT 1 FROM districts WHERE name_ar = 'مركز المنيا' AND governorate_id = (SELECT id FROM governorates WHERE name_ar = 'المنيا' LIMIT 1));

INSERT INTO districts (governorate_id, name_ar, name_en)
SELECT (SELECT id FROM governorates WHERE name_ar = 'أسيوط' LIMIT 1), 'مركز أسيوط', 'Asyut Center'
WHERE NOT EXISTS (SELECT 1 FROM districts WHERE name_ar = 'مركز أسيوط' AND governorate_id = (SELECT id FROM governorates WHERE name_ar = 'أسيوط' LIMIT 1));

INSERT INTO districts (governorate_id, name_ar, name_en)
SELECT (SELECT id FROM governorates WHERE name_ar = 'سوهاج' LIMIT 1), 'مركز سوهاج', 'Sohag Center'
WHERE NOT EXISTS (SELECT 1 FROM districts WHERE name_ar = 'مركز سوهاج' AND governorate_id = (SELECT id FROM governorates WHERE name_ar = 'سوهاج' LIMIT 1));

INSERT INTO districts (governorate_id, name_ar, name_en)
SELECT (SELECT id FROM governorates WHERE name_ar = 'قنا' LIMIT 1), 'مركز قنا', 'Qena Center'
WHERE NOT EXISTS (SELECT 1 FROM districts WHERE name_ar = 'مركز قنا' AND governorate_id = (SELECT id FROM governorates WHERE name_ar = 'قنا' LIMIT 1));

INSERT INTO districts (governorate_id, name_ar, name_en)
SELECT (SELECT id FROM governorates WHERE name_ar = 'الأقصر' LIMIT 1), 'مركز الأقصر', 'Luxor Center'
WHERE NOT EXISTS (SELECT 1 FROM districts WHERE name_ar = 'مركز الأقصر' AND governorate_id = (SELECT id FROM governorates WHERE name_ar = 'الأقصر' LIMIT 1));

INSERT INTO districts (governorate_id, name_ar, name_en)
SELECT (SELECT id FROM governorates WHERE name_ar = 'أسوان' LIMIT 1), 'مركز أسوان', 'Aswan Center'
WHERE NOT EXISTS (SELECT 1 FROM districts WHERE name_ar = 'مركز أسوان' AND governorate_id = (SELECT id FROM governorates WHERE name_ar = 'أسوان' LIMIT 1));

INSERT INTO districts (governorate_id, name_ar, name_en)
SELECT (SELECT id FROM governorates WHERE name_ar = 'الوادي الجديد' LIMIT 1), 'مركز الوادي الجديد', 'New Valley Center'
WHERE NOT EXISTS (SELECT 1 FROM districts WHERE name_ar = 'مركز الوادي الجديد' AND governorate_id = (SELECT id FROM governorates WHERE name_ar = 'الوادي الجديد' LIMIT 1));

INSERT INTO districts (governorate_id, name_ar, name_en)
SELECT (SELECT id FROM governorates WHERE name_ar = 'البحر الأحمر' LIMIT 1), 'مركز البحر الأحمر', 'Red Sea Center'
WHERE NOT EXISTS (SELECT 1 FROM districts WHERE name_ar = 'مركز البحر الأحمر' AND governorate_id = (SELECT id FROM governorates WHERE name_ar = 'البحر الأحمر' LIMIT 1));

COMMIT;
