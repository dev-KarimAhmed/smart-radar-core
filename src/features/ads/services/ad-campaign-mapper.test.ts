import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mapAdCampaignRow } from './ad-campaign-mapper';

test('mapAdCampaignRow maps basic text and contact information correctly', () => {
  const row = {
    id: 'campaign-123',
    title: 'عرض الصيانة الشاملة',
    description: 'خصم 25% على كافة أعمال الصيانة الدورية',
    whatsapp: '962791112233',
    phone: '0791112233',
    geoLoc: 'https://maps.example.com',
    targetScale: 'District',
    targetLocationName: 'جامعة العلوم التطبيقية',
    adType: 'CAPTAIN_PROFESSIONAL',
  };

  const mapped = mapAdCampaignRow(row);

  assert.equal(mapped.id, 'campaign-123');
  assert.equal(mapped.title, 'عرض الصيانة الشاملة');
  assert.equal(mapped.description, 'خصم 25% على كافة أعمال الصيانة الدورية');
  assert.equal(mapped.whatsapp, '962791112233');
  assert.equal(mapped.phone, '0791112233');
  assert.equal(mapped.geoLoc, 'https://maps.example.com');
  assert.equal(mapped.targetScale, 'District');
  assert.equal(mapped.targetLocationName, 'جامعة العلوم التطبيقية');
  assert.equal(mapped.adType, 'CAPTAIN_PROFESSIONAL');
});

test('mapAdCampaignRow extracts nested media and resolves image/video correctly', () => {
  const imageRow = {
    id: 'ad-img',
    content: {
      title: 'إعلان مصور',
      description: 'وصف الإعلان',
      media: {
        url: 'https://images.example.com/banner.png',
        type: 'image',
      },
    },
  };

  const mappedImg = mapAdCampaignRow(imageRow);
  assert.equal(mappedImg.title, 'إعلان مصور');
  assert.equal(mappedImg.description, 'وصف الإعلان');
  assert.ok(mappedImg.posterUrl?.includes('banner.png'));

  const videoRow = {
    id: 'ad-video',
    mediaUrl: 'https://media.example.com/video.mp4',
    mediaType: 'video/mp4',
  };

  const mappedVideo = mapAdCampaignRow(videoRow);
  assert.equal(mappedVideo.videoUrl, 'https://media.example.com/video.mp4');
});
