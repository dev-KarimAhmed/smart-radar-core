import { readAdAudience } from './ad-audience';

export const PLACEHOLDER_BANNER_URL =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#0B0F19"/><stop offset="1" stop-color="#074C49"/></linearGradient><pattern id="p" width="72" height="72" patternUnits="userSpaceOnUse"><path d="M0 72L72 0M-18 18L18-18M54 90L90 54" stroke="#14F5D5" stroke-opacity=".22" stroke-width="2"/></pattern></defs><rect width="1200" height="800" fill="url(#g)"/><rect width="1200" height="800" fill="url(#p)"/><circle cx="965" cy="145" r="190" fill="#14F5D5" fill-opacity=".16"/><circle cx="210" cy="710" r="250" fill="#14B8A6" fill-opacity=".14"/></svg>',
  );

export function firstString(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return undefined;
}

export function firstMediaObject(...values: unknown[]): Record<string, any> | undefined {
  for (const value of values) {
    if (Array.isArray(value)) {
      const found = value.find((item) => item && typeof item === 'object' && !Array.isArray(item));
      if (found) return found as Record<string, any>;
    }

    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return value as Record<string, any>;
    }
  }

  return undefined;
}

export function isVideoType(mediaType: string | undefined) {
  const type = String(mediaType || '').toLowerCase();
  return (
    type.includes('video') ||
    type.includes('mp4') ||
    type.includes('webm') ||
    type.includes('ogg') ||
    type.includes('mov') ||
    type.includes('m4v')
  );
}

export function isVideoUrl(url: string | undefined) {
  const value = String(url || '').toLowerCase().split('?')[0];
  return (
    /\.(mp4|webm|ogg|mov|m4v)$/i.test(value) ||
    value.includes('/video/') ||
    value.includes('/videos/') ||
    value.includes('video_') ||
    value.includes('video-') ||
    value.includes('ad-videos')
  );
}

export function isVideoMedia(url: string | undefined, mediaType: string | undefined) {
  return Boolean(url) && (isVideoType(mediaType) || isVideoUrl(url));
}

export function isImageMedia(url: string | undefined, mediaType: string | undefined) {
  const type = String(mediaType || '').toLowerCase();
  const value = String(url || '').toLowerCase().split('?')[0];
  return (
    type.includes('image') ||
    /\.(jpg|jpeg|png|webp|gif|avif|svg)$/i.test(value) ||
    value.startsWith('data:image/') ||
    (!isVideoMedia(url, mediaType) && Boolean(url))
  );
}

export function mapAdCampaignRow(row: Record<string, any>) {
  const title = firstString(row.title, row.title_ar, row.name_ar, row.name, row.content?.title);
  const description = firstString(row.description, row.description_ar, row.content?.description);
  const primaryMedia = firstMediaObject(
    row.media,
    row.asset,
    row.creative,
    row.content?.media,
    row.content?.asset,
    row.content?.creative,
    row.assets,
    row.content?.assets
  );
  const mediaType = firstString(
    row.mediaType,
    row.media_type,
    row.contentType,
    row.content_type,
    row.mimeType,
    row.mime_type,
    row.adFormat,
    row.ad_format,
    row.format,
    row.type,
    row.kind,
    primaryMedia?.mediaType,
    primaryMedia?.media_type,
    primaryMedia?.contentType,
    primaryMedia?.content_type,
    primaryMedia?.mimeType,
    primaryMedia?.mime_type,
    primaryMedia?.format,
    primaryMedia?.type,
    primaryMedia?.kind,
    row.content?.mediaType,
    row.content?.media_type,
    row.content?.contentType,
    row.content?.content_type,
    row.content?.mimeType,
    row.content?.mime_type,
    row.content?.adFormat,
    row.content?.ad_format,
    row.content?.format,
    row.content?.type
  );
  const mediaUrl = firstString(
    row.mediaUrl,
    row.media_url,
    row.fileUrl,
    row.file_url,
    row.assetUrl,
    row.asset_url,
    row.creativeUrl,
    row.creative_url,
    primaryMedia?.url,
    primaryMedia?.src,
    primaryMedia?.href,
    primaryMedia?.mediaUrl,
    primaryMedia?.media_url,
    primaryMedia?.fileUrl,
    primaryMedia?.file_url,
    primaryMedia?.assetUrl,
    primaryMedia?.asset_url,
    primaryMedia?.creativeUrl,
    primaryMedia?.creative_url,
    row.content?.mediaUrl,
    row.content?.media_url,
    row.content?.fileUrl,
    row.content?.file_url,
    row.content?.assetUrl,
    row.content?.asset_url,
    row.content?.creativeUrl,
    row.content?.creative_url
  );
  const videoUrl =
    firstString(
      row.videoUrl,
      row.video_url,
      row.video,
      row.videoSrc,
      row.video_src,
      primaryMedia?.videoUrl,
      primaryMedia?.video_url,
      primaryMedia?.video,
      primaryMedia?.videoSrc,
      primaryMedia?.video_src,
      row.content?.videoUrl,
      row.content?.video_url,
      row.content?.video,
      row.content?.videoSrc,
      row.content?.video_src
    ) || (isVideoMedia(mediaUrl, mediaType) ? mediaUrl : undefined);
  const posterUrl = firstString(
    row.posterUrl,
    row.poster_url,
    row.bannerUrl,
    row.banner_url,
    row.image_url,
    row.imageUrl,
    row.image,
    row.adImage,
    row.ad_image,
    row.thumbnailUrl,
    row.thumbnail_url,
    row.coverUrl,
    row.cover_url,
    primaryMedia?.posterUrl,
    primaryMedia?.poster_url,
    primaryMedia?.bannerUrl,
    primaryMedia?.banner_url,
    primaryMedia?.imageUrl,
    primaryMedia?.image_url,
    primaryMedia?.image,
    primaryMedia?.thumbnailUrl,
    primaryMedia?.thumbnail_url,
    primaryMedia?.coverUrl,
    primaryMedia?.cover_url,
    row.content?.posterUrl,
    row.content?.poster_url,
    row.content?.bannerUrl,
    row.content?.banner_url,
    row.content?.imageUrl,
    row.content?.image_url,
    row.content?.image,
    row.content?.adImage,
    row.content?.ad_image,
    row.content?.thumbnailUrl,
    row.content?.thumbnail_url,
    row.content?.coverUrl,
    row.content?.cover_url,
    isImageMedia(mediaUrl, mediaType) ? mediaUrl : undefined
  );
  const whatsapp = firstString(
    row.whatsapp,
    row.whatsapp_link,
    row.whatsapp_number,
    row.contact_whatsapp
  );
  const phone = firstString(row.phone, row.phone_link, row.phone_number, row.contact_phone);
  const geoLoc = firstString(row.geoLoc, row.geo_url, row.map_url, row.location_url);
  const targetScale = firstString(row.targetScale, row.target_scale);
  const targetLocationName = firstString(
    row.targetLocationName,
    row.target_location_name,
    row.target_district,
    row.target_governorate
  );

  return {
    ...row,
    id: String(row.id),
    title,
    description,
    mediaType,
    mediaUrl,
    videoUrl,
    posterUrl,
    bannerUrl: posterUrl,
    whatsapp,
    phone,
    geoLoc,
    targetScale,
    targetLocationName,
    adType: row.adType || row.ad_type,
    forDriver: readAdAudience(row) === 'captain',
    buttonText: firstString(row.buttonText, row.button_text, row.cta_text),
    content: {
      ...(row.content || {}),
      title,
      description,
      mediaType,
      mediaUrl,
      videoUrl,
      posterUrl,
    },
  };
}

export function getAdMedia(
  ad: any,
  fallbackImageGetter?: (ad: any) => string | undefined
): { kind: 'image' | 'video'; url?: string; posterUrl?: string } {
  const primaryMedia = firstMediaObject(
    ad?.media,
    ad?.asset,
    ad?.creative,
    ad?.content?.media,
    ad?.content?.asset,
    ad?.content?.creative,
    ad?.assets,
    ad?.content?.assets
  );
  const mediaType = firstString(
    ad?.mediaType,
    ad?.media_type,
    ad?.contentType,
    ad?.content_type,
    ad?.mimeType,
    ad?.mime_type,
    ad?.adFormat,
    ad?.ad_format,
    ad?.format,
    ad?.type,
    ad?.kind,
    primaryMedia?.mediaType,
    primaryMedia?.media_type,
    primaryMedia?.contentType,
    primaryMedia?.content_type,
    primaryMedia?.mimeType,
    primaryMedia?.mime_type,
    primaryMedia?.format,
    primaryMedia?.type,
    primaryMedia?.kind,
    ad?.content?.mediaType,
    ad?.content?.media_type,
    ad?.content?.contentType,
    ad?.content?.content_type,
    ad?.content?.mimeType,
    ad?.content?.mime_type,
    ad?.content?.adFormat,
    ad?.content?.ad_format,
    ad?.content?.format,
    ad?.content?.type
  );
  const videoUrl = firstString(
    ad?.videoUrl,
    ad?.video_url,
    ad?.video,
    ad?.videoSrc,
    ad?.video_src,
    primaryMedia?.videoUrl,
    primaryMedia?.video_url,
    primaryMedia?.video,
    primaryMedia?.videoSrc,
    primaryMedia?.video_src,
    ad?.content?.videoUrl,
    ad?.content?.video_url,
    ad?.content?.video,
    ad?.content?.videoSrc,
    ad?.content?.video_src
  );
  const mediaUrl = firstString(
    ad?.mediaUrl,
    ad?.media_url,
    ad?.fileUrl,
    ad?.file_url,
    ad?.assetUrl,
    ad?.asset_url,
    ad?.creativeUrl,
    ad?.creative_url,
    primaryMedia?.url,
    primaryMedia?.src,
    primaryMedia?.href,
    primaryMedia?.mediaUrl,
    primaryMedia?.media_url,
    primaryMedia?.fileUrl,
    primaryMedia?.file_url,
    primaryMedia?.assetUrl,
    primaryMedia?.asset_url,
    primaryMedia?.creativeUrl,
    primaryMedia?.creative_url,
    ad?.content?.mediaUrl,
    ad?.content?.media_url,
    ad?.content?.fileUrl,
    ad?.content?.file_url,
    ad?.content?.assetUrl,
    ad?.content?.asset_url,
    ad?.content?.creativeUrl,
    ad?.content?.creative_url
  );
  const posterUrl = firstString(
    ad?.posterUrl,
    ad?.poster_url,
    ad?.bannerUrl,
    ad?.banner_url,
    primaryMedia?.posterUrl,
    primaryMedia?.poster_url,
    primaryMedia?.bannerUrl,
    primaryMedia?.banner_url,
    ad?.content?.posterUrl,
    ad?.content?.poster_url,
    ad?.content?.bannerUrl,
    ad?.content?.banner_url
  );
  const imageUrl = firstString(
    ad?.imageUrl,
    ad?.image_url,
    ad?.image,
    ad?.adImage,
    ad?.ad_image,
    ad?.thumbnailUrl,
    ad?.thumbnail_url,
    ad?.coverUrl,
    ad?.cover_url,
    primaryMedia?.imageUrl,
    primaryMedia?.image_url,
    primaryMedia?.image,
    primaryMedia?.thumbnailUrl,
    primaryMedia?.thumbnail_url,
    primaryMedia?.coverUrl,
    primaryMedia?.cover_url,
    ad?.content?.imageUrl,
    ad?.content?.image_url,
    ad?.content?.image,
    ad?.content?.adImage,
    ad?.content?.ad_image,
    ad?.content?.thumbnailUrl,
    ad?.content?.thumbnail_url,
    ad?.content?.coverUrl,
    ad?.content?.cover_url,
    posterUrl,
    fallbackImageGetter ? fallbackImageGetter(ad) : undefined
  );

  if (videoUrl) return { kind: 'video', url: videoUrl, posterUrl: imageUrl || posterUrl };
  if (isVideoMedia(mediaUrl, mediaType)) return { kind: 'video', url: mediaUrl, posterUrl: imageUrl || posterUrl };
  if (imageUrl) return { kind: 'image', url: imageUrl };
  if (isImageMedia(mediaUrl, mediaType)) return { kind: 'image', url: mediaUrl };

  const finalFallback = fallbackImageGetter ? fallbackImageGetter(ad) : undefined;
  return { kind: 'image', url: finalFallback || PLACEHOLDER_BANNER_URL };
}
