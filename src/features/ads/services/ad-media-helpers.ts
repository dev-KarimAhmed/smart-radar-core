import { getAdImage } from './ad-card-helpers';

export const PLACEHOLDER_BANNER_URL =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#0B0F19"/><stop offset="1" stop-color="#074C49"/></linearGradient><pattern id="p" width="72" height="72" patternUnits="userSpaceOnUse"><path d="M0 72L72 0M-18 18L18-18M54 90L90 54" stroke="#14F5D5" stroke-opacity=".22" stroke-width="2"/></pattern></defs><rect width="1200" height="800" fill="url(#g)"/><rect width="1200" height="800" fill="url(#p)"/><circle cx="965" cy="145" r="190" fill="#14F5D5" fill-opacity=".16"/><circle cx="210" cy="710" r="250" fill="#14B8A6" fill-opacity=".14"/></svg>',
  );

export function getAdMedia(ad: any): { kind: 'image' | 'video'; url?: string; posterUrl?: string } {
  const primaryMedia = firstMediaObject(
    ad?.media,
    ad?.asset,
    ad?.creative,
    ad?.content?.media,
    ad?.content?.asset,
    ad?.content?.creative,
    ad?.assets,
    ad?.content?.assets,
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
    ad?.content?.type,
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
    ad?.content?.video_src,
  );
  const mediaUrl = firstString(
    ad?.mediaUrl,
    ad?.media_url,
    ad?.url,
    ad?.src,
    ad?.mediaUri,
    ad?.media_uri,
    primaryMedia?.url,
    primaryMedia?.src,
    primaryMedia?.mediaUrl,
    primaryMedia?.media_url,
    ad?.content?.mediaUrl,
    ad?.content?.media_url,
    ad?.content?.url,
    ad?.content?.src,
    ad?.content?.mediaUri,
    ad?.content?.media_uri,
  );
  const imageUrl = firstString(
    ad?.imageUrl,
    ad?.image_url,
    ad?.image,
    ad?.bannerUrl,
    ad?.banner_url,
    ad?.posterUrl,
    ad?.poster_url,
    primaryMedia?.imageUrl,
    primaryMedia?.image_url,
    primaryMedia?.image,
    primaryMedia?.bannerUrl,
    primaryMedia?.banner_url,
    primaryMedia?.posterUrl,
    primaryMedia?.poster_url,
    ad?.content?.imageUrl,
    ad?.content?.image_url,
    ad?.content?.image,
    ad?.content?.bannerUrl,
    ad?.content?.banner_url,
    ad?.content?.posterUrl,
    ad?.content?.poster_url,
  );
  const posterUrl = firstString(
    ad?.posterUrl,
    ad?.poster_url,
    primaryMedia?.posterUrl,
    primaryMedia?.poster_url,
    ad?.content?.posterUrl,
    ad?.content?.poster_url,
  );

  if (videoUrl) return { kind: 'video', url: videoUrl, posterUrl: imageUrl || posterUrl };
  if (isVideoMedia(mediaUrl, mediaType)) return { kind: 'video', url: mediaUrl, posterUrl: imageUrl || posterUrl };
  if (imageUrl) return { kind: 'image', url: imageUrl };
  if (isImageMedia(mediaUrl, mediaType)) return { kind: 'image', url: mediaUrl };

  return { kind: 'image', url: getAdImage(ad) || PLACEHOLDER_BANNER_URL };
}

export function isVideoMedia(url: string | undefined, mediaType: string | undefined): boolean {
  return Boolean(url) && (isVideoType(mediaType) || isVideoUrl(url));
}

export function isVideoType(mediaType: string | undefined): boolean {
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

export function isVideoUrl(url: string | undefined): boolean {
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

export function isImageMedia(url: string | undefined, mediaType: string | undefined): boolean {
  const type = String(mediaType || '').toLowerCase();
  const value = String(url || '').toLowerCase().split('?')[0];
  return (
    type.includes('image') ||
    /\.(jpg|jpeg|png|webp|gif|avif|svg)$/i.test(value) ||
    value.startsWith('data:image/') ||
    (!isVideoMedia(url, mediaType) && Boolean(url))
  );
}

export function firstString(...values: unknown[]): string | undefined {
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

