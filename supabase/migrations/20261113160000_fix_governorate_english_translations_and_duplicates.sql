-- Migration: 20261113160000_fix_governorate_english_translations_and_duplicates.sql
-- Description: Fixes corrupted English translations (Arabic text placed in name_en)
-- and cleans up duplicate governorate rows and dummy district records in public.districts and public.governorates.

BEGIN;

-- 1. Correct English names for Jordan Governorates (country_id = 1)
UPDATE public.governorates SET name_ar = 'عمّان', name_en = 'Amman' WHERE country_id = 1 AND (name_ar IN ('عمان', 'عمّان') OR name_en IN ('عمان', 'عمّان', 'Amman'));
UPDATE public.governorates SET name_ar = 'إربد', name_en = 'Irbid' WHERE country_id = 1 AND (name_ar IN ('اربد', 'إربد') OR name_en IN ('اربد', 'إربد', 'Irbid'));
UPDATE public.governorates SET name_ar = 'الزرقاء', name_en = 'Zarqa' WHERE country_id = 1 AND (name_ar IN ('الزرقاء', 'الزرقا') OR name_en IN ('الزرقاء', 'الزرقا', 'Zarqa'));
UPDATE public.governorates SET name_ar = 'البلقاء', name_en = 'Balqa' WHERE country_id = 1 AND (name_ar IN ('البلقاء', 'البلقا') OR name_en IN ('البلقاء', 'البلقا', 'Balqa'));
UPDATE public.governorates SET name_ar = 'العقبة', name_en = 'Aqaba' WHERE country_id = 1 AND (name_ar IN ('العقبة', 'العقبه') OR name_en IN ('العقبة', 'العقبه', 'Aqaba'));
UPDATE public.governorates SET name_ar = 'مادبا', name_en = 'Madaba' WHERE country_id = 1 AND (name_ar IN ('مادبا', 'مأدبا') OR name_en IN ('مادبا', 'مأدبا', 'Madaba'));
UPDATE public.governorates SET name_ar = 'الكرك', name_en = 'Karak' WHERE country_id = 1 AND (name_ar = 'الكرك' OR name_en IN ('الكرك', 'Karak'));
UPDATE public.governorates SET name_ar = 'معان', name_en = 'Ma''an' WHERE country_id = 1 AND (name_ar = 'معان' OR name_en IN ('معان', 'Ma''an', 'Maan'));
UPDATE public.governorates SET name_ar = 'الطفيلة', name_en = 'Tafilah' WHERE country_id = 1 AND (name_ar IN ('الطفيلة', 'الطفيله') OR name_en IN ('الطفيلة', 'الطفيله', 'Tafilah'));
UPDATE public.governorates SET name_ar = 'عجلون', name_en = 'Ajloun' WHERE country_id = 1 AND (name_ar = 'عجلون' OR name_en IN ('عجلون', 'Ajloun'));
UPDATE public.governorates SET name_ar = 'جرش', name_en = 'Jerash' WHERE country_id = 1 AND (name_ar = 'جرش' OR name_en IN ('جرش', 'Jerash'));
UPDATE public.governorates SET name_ar = 'المفرق', name_en = 'Mafraq' WHERE country_id = 1 AND (name_ar = 'المفرق' OR name_en IN ('المفرق', 'Mafraq'));

-- 2. Safely merge duplicate rows for each governorate (keep lowest ID)
DO $$
DECLARE
  rec RECORD;
  target_id INT;
BEGIN
  FOR rec IN
    SELECT country_id, name_en, MIN(id) AS keep_id, ARRAY_AGG(id ORDER BY id ASC) AS all_ids
    FROM public.governorates
    GROUP BY country_id, name_en
    HAVING COUNT(*) > 1
  LOOP
    target_id := rec.keep_id;

    -- Re-link districts referencing duplicate governorate rows
    UPDATE public.districts
    SET governorate_id = target_id
    WHERE governorate_id = ANY(rec.all_ids) AND governorate_id <> target_id;

    -- Re-link user profiles referencing duplicate governorate rows
    UPDATE public.profiles
    SET governorate_id = target_id
    WHERE governorate_id = ANY(rec.all_ids) AND governorate_id <> target_id;

    -- Delete duplicates
    DELETE FROM public.governorates
    WHERE id = ANY(rec.all_ids) AND id <> target_id;
  END LOOP;
END $$;

-- 3. Delete corrupted/dummy rows (like 'الواء')
DELETE FROM public.districts WHERE name_ar = 'الواء' OR name_en = 'الواء' OR length(trim(name_ar)) < 2;

-- 4. Fix Ma'an Districts English translations
UPDATE public.districts SET name_en = 'Ma''an Qasabah District' WHERE name_ar IN ('لواء قصبة معان', 'قصبة معان');
UPDATE public.districts SET name_en = 'Petra District' WHERE name_ar IN ('لواء البتراء', 'لواء البترا', 'البتراء', 'البترا');
UPDATE public.districts SET name_en = 'Shobak District' WHERE name_ar IN ('لواء الشوبك', 'الشوبك');
UPDATE public.districts SET name_en = 'Al Husseiniya District' WHERE name_ar IN ('لواء الحسينية', 'لواء الحسينيه', 'الحسينية');
UPDATE public.districts SET name_en = 'Al Jafr Sub-district' WHERE name_ar IN ('قضاء الجفر', 'الجفر');
UPDATE public.districts SET name_en = 'Mureigha Sub-district' WHERE name_ar IN ('قضاء مريغة', 'قضاء مريغه', 'مريغة');
UPDATE public.districts SET name_en = 'Ayl Sub-district' WHERE name_ar IN ('قضاء ايل', 'قضاء إيل', 'ايل');
UPDATE public.districts SET name_en = 'Udhruh Sub-district' WHERE name_ar IN ('قضاء اذرح', 'قضاء أذرح', 'اذرح');

-- 5. Fix Amman Districts English translations
UPDATE public.districts SET name_en = 'Amman Qasabah District' WHERE name_ar IN ('لواء قصبة عمان', 'قصبة عمان', 'قصبة عمّان');
UPDATE public.districts SET name_en = 'University District' WHERE name_ar IN ('لواء الجامعة', 'الجامعة');
UPDATE public.districts SET name_en = 'Al Muwaqqar District' WHERE name_ar IN ('لواء الموقر', 'الموقر');
UPDATE public.districts SET name_en = 'Al Qweismeh District' WHERE name_ar IN ('لواء القويسمة', 'القويسمة');
UPDATE public.districts SET name_en = 'Sahab District' WHERE name_ar IN ('لواء سحاب', 'سحاب');
UPDATE public.districts SET name_en = 'Al Jizah District' WHERE name_ar IN ('لواء الجيزة', 'الجيزة');
UPDATE public.districts SET name_en = 'Marka District' WHERE name_ar IN ('لواء ماركا', 'ماركا');
UPDATE public.districts SET name_en = 'Naour District' WHERE name_ar IN ('لواء ناعور', 'ناعور');
UPDATE public.districts SET name_en = 'Wadi Al Seer District' WHERE name_ar IN ('لواء وادي السير', 'وادي السير');
UPDATE public.districts SET name_en = 'Rujm Al Shami Sub-district' WHERE name_ar IN ('قضاء رجم الشامي', 'رجم الشامي');
UPDATE public.districts SET name_en = 'Umm Al Rasas Sub-district' WHERE name_ar IN ('قضاءام الرصاص', 'قضاء ام الرصاص', 'ام الرصاص');
UPDATE public.districts SET name_en = 'Umm Al Basatin Sub-district' WHERE name_ar IN ('قضاء ام البساتين', 'ام البساتين');
UPDATE public.districts SET name_en = 'Hisban Sub-district' WHERE name_ar IN ('قضاء حسبان', 'حسبان');

-- 6. Fix Irbid Districts English translations
UPDATE public.districts SET name_en = 'Irbid Qasabah District' WHERE name_ar IN ('لواء قصبة اربد', 'لواء قصبة إربد', 'قصبة اربد', 'قصبة إربد');
UPDATE public.districts SET name_en = 'Koura District' WHERE name_ar IN ('لواء الكورة', 'لواء الكوره', 'الكورة');
UPDATE public.districts SET name_en = 'Ramtha District' WHERE name_ar IN ('لواء الرمثا', 'الرمثا');
UPDATE public.districts SET name_en = 'Taybeh District' WHERE name_ar IN ('لواء الطيبة', 'لواء الطيبه', 'الطيبة');
UPDATE public.districts SET name_en = 'Northern Mazar District' WHERE name_ar IN ('لواء المزار /ش', 'لواء المزار الشمالي', 'المزار الشمالي');
UPDATE public.districts SET name_en = 'Wasatiyah District' WHERE name_ar IN ('لواء الوسيطة', 'لواء الوسطية', 'الوسطية');
UPDATE public.districts SET name_en = 'Bani Kinanah District' WHERE name_ar IN ('لواء بني كنانة', 'لواء بني كنانه', 'بني كنانة');
UPDATE public.districts SET name_en = 'Bani Obeid District' WHERE name_ar IN ('لواء بني عبيد', 'بني عبيد');
UPDATE public.districts SET name_en = 'Northern Ghor District' WHERE name_ar IN ('لواء الاغوار /ش', 'لواء الأغوار الشمالية', 'الأغوار الشمالية');

-- 7. Fix Balqa Districts English translations
UPDATE public.districts SET name_en = 'Salt Qasabah District' WHERE name_ar IN ('لواء قصبة المركز', 'لواء قصبة السلط', 'قصبة السلط');
UPDATE public.districts SET name_en = 'Deir Alla District' WHERE name_ar IN ('لواء دير علا', 'دير علا');
UPDATE public.districts SET name_en = 'Ain Al Basha District' WHERE name_ar IN ('لواء عين الباشا', 'عين الباشا');
UPDATE public.districts SET name_en = 'Southern Shuna District' WHERE name_ar IN ('لواء الشونة /ج', 'لواء الشونة الجنوبية', 'الشونة الجنوبية');
UPDATE public.districts SET name_en = 'Mahis and Fuheis District' WHERE name_ar IN ('لواء ماحص / الفحيص', 'لواء ماحص والفحيص', 'ماحص والفحيص');
UPDATE public.districts SET name_en = 'Ira and Yarqa Sub-district' WHERE name_ar IN ('قضاء عيرا / يرقا', 'قضاء عيرا ويرقا', 'عيرا ويرقا');
UPDATE public.districts SET name_en = 'Zai Sub-district' WHERE name_ar IN ('قضاء زي', 'زي');
UPDATE public.districts SET name_en = 'Al Arda Sub-district' WHERE name_ar IN ('قضاء العارضة', 'العارضة');

-- 8. Fix Karak Districts English translations
UPDATE public.districts SET name_en = 'Karak Qasabah District' WHERE name_ar IN ('لواء قصبة الكرك', 'قصبة الكرك');
UPDATE public.districts SET name_en = 'Southern Mazar District' WHERE name_ar IN ('لواء المزار / ج', 'لواء المزار الجنوبي', 'المزار الجنوبي');
UPDATE public.districts SET name_en = 'Al Qasr District' WHERE name_ar IN ('لواء القصر', 'القصر');
UPDATE public.districts SET name_en = 'Southern Ghor District' WHERE name_ar IN ('لواء الاغوار / ج', 'لواء الأغوار الجنوبية', 'الأغوار الجنوبية');
UPDATE public.districts SET name_en = 'Ayy District' WHERE name_ar IN ('لواء عي', 'عي');
UPDATE public.districts SET name_en = 'Qatraneh District' WHERE name_ar IN ('لواء القطرانة', 'لواء القطرانه', 'القطرانة');
UPDATE public.districts SET name_en = 'Moab Sub-district' WHERE name_ar IN ('قضاء مؤاب', 'مؤاب');
UPDATE public.districts SET name_en = 'Al Mujib Sub-district' WHERE name_ar IN ('قضاء الموجب', 'الموجب');
UPDATE public.districts SET name_en = 'Ghor Al Mazra''a Sub-district' WHERE name_ar IN ('قضاء غور المزرعة', 'غور المزرعة');

-- 9. Fix Zarqa Districts English translations
UPDATE public.districts SET name_en = 'Zarqa Qasabah District' WHERE name_ar IN ('لواء قصبة الزرقاء', 'قصبة الزرقاء');
UPDATE public.districts SET name_en = 'Hashemiyah District' WHERE name_ar IN ('لواءالهاشمية', 'لواء الهاشمية', 'الهاشمية');
UPDATE public.districts SET name_en = 'Russeifa District' WHERE name_ar IN ('لواء الرصيفة', 'لواء الرصيفه', 'الرصيفة');
UPDATE public.districts SET name_en = 'Berein Sub-district' WHERE name_ar IN ('قضاء بيرين', 'بيرين');
UPDATE public.districts SET name_en = 'Al Dhulail Sub-district' WHERE name_ar IN ('قضاء الضليل', 'الضليل');
UPDATE public.districts SET name_en = 'Azraq District' WHERE name_ar IN ('لواء الازرق', 'لواء الأزرق', 'الازرق');

-- 10. Fix Mafraq Districts English translations
UPDATE public.districts SET name_en = 'Mafraq Qasabah District' WHERE name_ar IN ('لواء قصبة المفرق', 'قصبة المفرق');
UPDATE public.districts SET name_en = 'Balama District' WHERE name_ar IN ('لواء بلعما', 'بلعما');
UPDATE public.districts SET name_en = 'Northern Badia District' WHERE name_ar IN ('لواء البادية /ش', 'لواء البادية الشمالية', 'البادية الشمالية');
UPDATE public.districts SET name_en = 'Ruwaished District' WHERE name_ar IN ('لواء الرويشد', 'الرويشد');
UPDATE public.districts SET name_en = 'Sama Al Sarhan Sub-district' WHERE name_ar IN ('قضاء سما السرحان', 'سما السرحان');
UPDATE public.districts SET name_en = 'Hawsha Sub-district' WHERE name_ar IN ('قضاء حوشا', 'حوشا');
UPDATE public.districts SET name_en = 'Al Khalidiya Sub-district' WHERE name_ar IN ('قضاء الخالدية', 'الخالدية');
UPDATE public.districts SET name_en = 'Rihab Sub-district' WHERE name_ar IN ('قضاء رحاب', 'رحاب');
UPDATE public.districts SET name_en = 'Al Manshiyya Sub-district' WHERE name_ar IN ('قضاء المنشية', 'المنشية');
UPDATE public.districts SET name_en = 'Sabha Sub-district' WHERE name_ar IN ('قضاء صبحا', 'صبحا');
UPDATE public.districts SET name_en = 'Umm Al Jimal Sub-district' WHERE name_ar IN ('قضاء ام الجمال', 'ام الجمال');
UPDATE public.districts SET name_en = 'Deir Al Kahf Sub-district' WHERE name_ar IN ('قضاء دير الكهف', 'دير الكهف');
UPDATE public.districts SET name_en = 'Umm Al Quttain Sub-district' WHERE name_ar IN ('قضاء ام القطين', 'ام القطين');

-- 11. Fix Tafilah Districts English translations
UPDATE public.districts SET name_en = 'Tafilah Qasabah District' WHERE name_ar IN ('لواء قصبة الطفيلة', 'قصبة الطفيلة');
UPDATE public.districts SET name_en = 'Hasa District' WHERE name_ar IN ('لواء الحسا', 'الحسا');
UPDATE public.districts SET name_en = 'Busaira District' WHERE name_ar IN ('لواء بصيرا', 'بصيرا');

-- 12. Fix Madaba Districts English translations
UPDATE public.districts SET name_en = 'Madaba Qasabah District' WHERE name_ar IN ('لواء قصبة مادبا', 'قصبة مادبا');
UPDATE public.districts SET name_en = 'Dhiban District' WHERE name_ar IN ('لواء ذيبان', 'ذيبان');
UPDATE public.districts SET name_en = 'Jrainah Sub-district' WHERE name_ar IN ('قضاء جرينة', 'جرينة');
UPDATE public.districts SET name_en = 'Ma''in Sub-district' WHERE name_ar IN ('قضاء ماعين', 'ماعين');
UPDATE public.districts SET name_en = 'Al Faisaliyah Sub-district' WHERE name_ar IN ('قضاء الفيصلية', 'الفيصلية');
UPDATE public.districts SET name_en = 'Al Urayd Sub-district' WHERE name_ar IN ('قضاء العريض', 'العريض');
UPDATE public.districts SET name_en = 'Mlaih Sub-district' WHERE name_ar IN ('قضاء مليح', 'مليح');

-- 13. Fix Jerash Districts English translations
UPDATE public.districts SET name_en = 'Jerash Qasabah District' WHERE name_ar IN ('لواء القصبة', 'لواء قصبة جرش', 'قصبة جرش');
UPDATE public.districts SET name_en = 'Al Mastaba Sub-district' WHERE name_ar IN ('قضاء المسطبة', 'قضاء المصطبة', 'المسطبة');
UPDATE public.districts SET name_en = 'Burma Sub-district' WHERE name_ar IN ('قضاء برما', 'برما');

-- 14. Fix Ajloun Districts English translations
UPDATE public.districts SET name_en = 'Ajloun Qasabah District' WHERE name_ar IN ('لواء قصبة عجلون', 'قصبة عجلون');
UPDATE public.districts SET name_en = 'Kufranjah District' WHERE name_ar IN ('لواء كفرنجة', 'كفرنجة');
UPDATE public.districts SET name_en = 'Sakhra Sub-district' WHERE name_ar IN ('قضاء صخرة', 'صخرة');
UPDATE public.districts SET name_en = 'Arjan Sub-district' WHERE name_ar IN ('قضاء عرجان', 'عرجان');

-- 15. Fix Aqaba Districts English translations
UPDATE public.districts SET name_en = 'Aqaba Qasabah District' WHERE name_ar IN ('لواء قصبة العقبة', 'قصبة العقبة');
UPDATE public.districts SET name_en = 'Quweira District' WHERE name_ar IN ('لواء القويرة', 'القويرة');
UPDATE public.districts SET name_en = 'Wadi Araba Sub-district' WHERE name_ar IN ('قضاء وادي عربه', 'قضاء وادي عربة', 'وادي عربة');
UPDATE public.districts SET name_en = 'Disah Sub-district' WHERE name_ar IN ('قضاءالديسة', 'قضاء الديسة', 'الديسة');

COMMIT;
