const fs = require('fs');

const riderMapEn = {
  "activeCaptains": "Active captains",
  "denied": "Allow location in browser",
  "driverOnWay": "Driver is on the way",
  "fallback": "GPS unavailable",
  "live": "Your location",
  "locating": "Finding your location...",
  "mapReady": "Map is ready",
  "moveMap": "Move map",
  "offPeak": "This area is quieter now - accepting the ride may take longer",
  "recenter": "Recenter to my location",
  "useMyLocation": "Use my location"
};

const riderMapAr = {
  "activeCaptains": "الكباتن المتاحون",
  "denied": "اسمح للموقع من المتصفح",
  "driverOnWay": "السائق في الطريق إليك",
  "fallback": "GPS غير متاح",
  "live": "موقعك الحالي",
  "locating": "يتم تحديد موقعك...",
  "mapReady": "خريطة الرحلة جاهزة",
  "moveMap": "حرّك الخريطة",
  "offPeak": "المنطقة الحالية خارج أوقات الذروة - قد يستغرق قبول الرحلة وقتا أطول",
  "recenter": "العودة إلى موقعي",
  "useMyLocation": "استخدم موقعي الحالي"
};

const updateFile = (path, newKey, newObj) => {
  const content = JSON.parse(fs.readFileSync(path, 'utf8'));
  content[newKey] = newObj;
  fs.writeFileSync(path, JSON.stringify(content, null, 2), 'utf8');
};

updateFile('d:/freelance/Radar/smart-radar-core/src/messages/en.json', 'riderMap', riderMapEn);
updateFile('d:/freelance/Radar/smart-radar-core/src/messages/ar.json', 'riderMap', riderMapAr);
console.log('done');
