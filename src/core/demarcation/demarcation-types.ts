// 📐 [RAD-SSOT-105] كتالوج ترسيم الحدود البرمجية وفصل القطاعات السيادية (Sovereign Demarcation & Sectors Catalog)

export type SovereignRegionId = 'REGION_1_GATEWAY' | 'REGION_2_SSOT_CORES' | 'REGION_3_ORCHESTRATION_UI';

export type SovereignSectorId = 
  | 'SECTOR_RIDER' 
  | 'SECTOR_DRIVER' 
  | 'SECTOR_ADMIN' 
  | 'SECTOR_ADVERTISER' 
  | 'SECTOR_CORES' 
  | 'SECTOR_UTILITIES'
  | 'SECTOR_DELEGATE'
  | 'SECTOR_COMMON';

export interface ISovereignRegion {
  id: SovereignRegionId;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  paths: string[];
  permissions: string[];
  prohibitions: string[];
}

export interface ISovereignSector {
  id: SovereignSectorId;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  frontend: {
    components: string[];
    hooks: string[];
    assetsAndStyles?: string[];
  };
  backend: {
    cores: string[];
    cloudFunctions?: string[];
    databaseCollections: string[];
    apiEndpoints?: string[];
  };
}
