export interface CaptainSectorAd {
  id: string;
  title: string;
  titleEn?: string;
  description: string;
  descriptionEn?: string;
  bannerUrl: string;
  imageUrl: string;
  image: string;
  fallbackImageUrl?: string;
  buttonText: string;
  buttonTextEn?: string;
  ctaText: string;
  ctaTextEn?: string;
  badgeText: string;
  badgeTextEn?: string;
  for_driver: boolean;
  forDriver: boolean;
  adType: 'CAPTAIN_PROFESSIONAL';
  isCaptainSectorAd: boolean;
  whatsapp?: string;
  phone?: string;
  content: {
    title: string;
    titleEn?: string;
    description: string;
    descriptionEn?: string;
    media: {
      url: string;
      type: 'image';
    };
  };
  action: {
    buttonText: string;
    buttonTextEn?: string;
  };
}
