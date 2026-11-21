import type { LucideIcon } from 'lucide-react';
import {
  MapPin,
  Tv,
  CheckSquare,
  TrendingUp,
  BadgeDollarSign,
  Star,
  Heart,
  SlidersHorizontal,
  CreditCard,
  Database,
  Users,
  Crosshair,
  Filter,
  Award,
} from 'lucide-react';

export interface AdPackageFeatureItem {
  id: number;
  titleAr: string;
  titleEn: string;
  descAr: string;
  descEn: string;
  icon: LucideIcon;
}

export const CAPTAIN_AD_PACKAGE_FEATURES: AdPackageFeatureItem[] = [
  {
    id: 1,
    titleAr: 'الظهور الإعلاني المكاني',
    titleEn: 'Spatial Ad Visibility',
    descAr: 'بث محلي ذكي يغطي نطاق تواجدك الجغرافي وخلايا H3 المحيطة',
    descEn: 'Smart local broadcast covering your geo presence and nearby H3 cells',
    icon: MapPin,
  },
  {
    id: 2,
    titleAr: 'قناة نشر وتعديل الإعلانات الذاتي',
    titleEn: 'Self-Service Ad Publishing & Editing',
    descAr: 'لوحة متكاملة لرفع، تعديل، وتبديل صور ونصوص إعلاناتك ذاتياً',
    descEn: 'Integrated portal to upload, edit, and toggle your ad assets',
    icon: Tv,
  },
  {
    id: 3,
    titleAr: 'إدارة القبول والرفض المستقل',
    titleEn: 'Independent Acceptance & Rejection',
    descAr: 'حرية كاملة لقبول أو رفض التواصل والطلبات بصفر قيود إجبارية',
    descEn: 'Full autonomy to accept or decline offers with zero forced constraints',
    icon: CheckSquare,
  },
  {
    id: 4,
    titleAr: 'مؤشرات السوق الاسترشادية',
    titleEn: 'Market Guidance Benchmarks',
    descAr: 'متابعة حية لمؤشرات توازن السوق ومتوسطات الأسعار العادلة',
    descEn: 'Live visibility into market equilibrium benchmarks and fair pricing',
    icon: TrendingUp,
  },
  {
    id: 5,
    titleAr: 'التسعير والعروض المستقلة',
    titleEn: 'Independent Pricing & Offers',
    descAr: 'صلاحية تقديم عروض أسعار مستقلة ومنافسة تعكس جودة خدمتك',
    descEn: 'Ability to quote independent competitive offers reflecting your service quality',
    icon: BadgeDollarSign,
  },
  {
    id: 6,
    titleAr: 'تقييم الإعلان والخدمة',
    titleEn: 'Ad & Service Quality Rating',
    descAr: 'حصد تقييمات موثوقة من العملاء لتعزيز سمعتك ومصداقية عروضك',
    descEn: 'Earn trusted customer feedback to boost reputation and credibility',
    icon: Star,
  },
  {
    id: 7,
    titleAr: 'الاشتراك قوائم الكباتن المفضلين',
    titleEn: 'Favorite Captains List Inclusion',
    descAr: 'إمكانية إضافتك لقوائم المفضلة لدى الركاب والعملاء المتكررين',
    descEn: 'Eligibility for passengers to save your profile into their favorites',
    icon: Heart,
  },
  {
    id: 8,
    titleAr: 'التقييم المتبادل وحدود الظهور',
    titleEn: 'Mutual Rating & Visibility Safeguards',
    descAr: 'حماية متكافئة لتقييم الطرفين وضمان أولوية الظهور للحسابات الملتزمة',
    descEn: 'Equitable dual ratings safeguarding top visibility for compliant accounts',
    icon: SlidersHorizontal,
  },
  {
    id: 9,
    titleAr: 'ظهور البطاقة الإعلانية والتعريفية',
    titleEn: 'Promotional & Profile Card Display',
    descAr: 'بطاقة رقمية أنيقة ومفصلة تبرز هويتك، مركبتك، وخدماتك للركاب',
    descEn: 'Sleek profile & promo card presenting your vehicle and services',
    icon: CreditCard,
  },
  {
    id: 10,
    titleAr: 'الذاكرة الإحصائية وسجل الأداء',
    titleEn: 'Statistical Memory & Performance Log',
    descAr: 'أرشيف رقمي تحليلي لمرات المشاهدة، التفاعل، ومعدلات النجاح',
    descEn: 'Analytical log tracking views, engagement counts, and conversion metrics',
    icon: Database,
  },
  {
    id: 11,
    titleAr: 'خدمة الوصول للعملاء',
    titleEn: 'Customer Reach & Direct Channels',
    descAr: 'تسهيل التواصل الفوري المباشر مع العملاء المهتمين بخدماتك',
    descEn: 'Direct instant communication pathways with interested local clients',
    icon: Users,
  },
  {
    id: 12,
    titleAr: 'التحقق من الاحداثيات',
    titleEn: 'Coordinates & GPS Verification',
    descAr: 'مطابقة جغرافية دقيقة بنسبة خطأ صفرية لمنع التلاعب المكاني',
    descEn: 'Precise geospatial verification safeguarding authentic local matching',
    icon: Crosshair,
  },
  {
    id: 13,
    titleAr: 'بيانات الطلب وتصفية الفرص والطلبات',
    titleEn: 'Order Details & Opportunity Filtering',
    descAr: 'رؤية تفاصيل الطلبات وتصفية الفرص المناسبة لمسارك واهتماماتك',
    descEn: 'Granular ride requests insight with custom opportunity filtering',
    icon: Filter,
  },
  {
    id: 14,
    titleAr: 'الاشتراك في جدول الرتب',
    titleEn: 'Tier & Rank System Participation',
    descAr: 'ترقيات الرتب (برونزي، فضي، ذهبي، بلاتيني) وامتيازات السبق الملاحي',
    descEn: 'Tier progression (Bronze, Silver, Gold, Platinum) with dispatch lead',
    icon: Award,
  },
];
