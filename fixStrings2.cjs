const fs = require('fs');

const offerGalleryEn = {
  "rankPlatinum": "Platinum",
  "rankGold": "Gold",
  "rankSilver": "Silver",
  "rankBronze": "Bronze",
  "adTitle": "Rider Benefit Offer",
  "adDesc": "A simple local offer to help you after choosing a low-priced ride.",
  "adBtn": "Get Offer",
  "adDesc2": "Quick local offer for direct contact.",
  "preferredCaptain": "Preferred Captain",
  "independent": "Independent",
  "offeredPrice": "Offered Price",
  "byMeter": "By Meter",
  "currency": "JOD",
  "distanceFromYou": "Distance from you:",
  "km": "km",
  "arrivesIn": "Arrives in:",
  "minutes": "mins",
  "minute": "min",
  "priceBurnedWarning": "This price is below the market average. Ensure service quality and vehicle condition before accepting.",
  "riderBenefit": "Rider Benefit",
  "vehicleFile": "Vehicle Profile",
  "estimatedDuration": "Estimated Trip Duration",
  "selectOffer": "Select this offer",
  "captainsOffers": "Captains' Offers",
  "offersCountText": "{count} nearby captains sent you an offer.",
  "cancelRequest": "Cancel Request"
};

const offerGalleryAr = {
  "rankPlatinum": "بلاتيني",
  "rankGold": "ذهبي",
  "rankSilver": "فضي",
  "rankBronze": "برونزي",
  "adTitle": "عرض منفعة للراكب",
  "adDesc": "عرض محلي بسيط يساعدك بعد اختيار عرض منخفض السعر.",
  "adBtn": "احصل على العرض",
  "adDesc2": "عرض محلي سريع للتواصل المباشر.",
  "preferredCaptain": "الكابتن المفضل",
  "independent": "مستقل",
  "offeredPrice": "السعر المعروض",
  "byMeter": "حسب العداد",
  "currency": "د.أ",
  "distanceFromYou": "البعد عنك:",
  "km": "كم",
  "arrivesIn": "يصلك خلال:",
  "minutes": "دقائق",
  "minute": "دقيقة",
  "priceBurnedWarning": "هذا السعر أقل من متوسط السوق. تأكد من جودة الخدمة وحالة المركبة قبل القبول.",
  "riderBenefit": "منفعة راكب",
  "vehicleFile": "ملف المركبة",
  "estimatedDuration": "مدة الرحلة المتوقعة",
  "selectOffer": "اختر هذا العرض",
  "captainsOffers": "عروض السائقون",
  "offersCountText": "{count} سائق قريب أرسل لك عرضاً.",
  "cancelRequest": "إلغاء الطلب"
};

const updateFile = (path, newKey, newObj) => {
  const content = JSON.parse(fs.readFileSync(path, 'utf8'));
  content[newKey] = newObj;
  fs.writeFileSync(path, JSON.stringify(content, null, 2), 'utf8');
};

updateFile('d:/freelance/Radar/smart-radar-core/src/messages/en.json', 'offerGallery', offerGalleryEn);
updateFile('d:/freelance/Radar/smart-radar-core/src/messages/ar.json', 'offerGallery', offerGalleryAr);
console.log('done');
