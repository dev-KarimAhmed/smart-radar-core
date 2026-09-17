import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { UserPlus } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { styles } from './delegates-shared';
import { useTranslations } from "next-intl";

interface AddDelegateFormProps {
  t: any;
  name: string; setName: (v: string) => void;
  phone: string; setPhone: (v: string) => void;
  district: string; setDistrict: (v: string) => void;
  targetDaily: string; setTargetDaily: (v: string) => void;
  linkExpiryHours: string; setLinkExpiryHours: (v: string) => void;
  referralCountInit: string; setReferralCountInit: (v: string) => void;
  subRole: 'independent' | 'captain'; setSubRole: (v: 'independent' | 'captain') => void;
  isFleetActive: boolean; setIsFleetActive: (v: boolean) => void;
  handleAddDelegate: (e: React.FormEvent) => void;
  setIsAdding: (v: boolean) => void;
}

export function AddDelegateForm(props: AddDelegateFormProps) {
  const tAuto = useTranslations('auto');
  const { t } = props;

  return (
    <Card className={styles.style670_27}>
      <CardHeader className={styles.style671_28}>
        <CardTitle className={styles.style672_29}>
          <UserPlus className={styles.style673_30} />
          {t('addForm.title')}
        </CardTitle>
        <CardDescription className={styles.style676_31}>
          {t('addForm.desc')}
        </CardDescription>
      </CardHeader>
      <form onSubmit={props.handleAddDelegate} className={styles.style680_32}>
        <div className={styles.style681_33}>
          <div className={styles.style682_34}>
            <Label htmlFor="del-name" className={styles.style683_35}>{t('addForm.nameLabel')}</Label>
            <Input
              id="del-name"
              value={props.name}
              onChange={e => props.setName(e.target.value)}
              placeholder={t('addForm.namePlaceholder')}
              className={styles.style689_36}
              required
            />
          </div>

          <div className={styles.style694_37}>
            <Label htmlFor="del-phone" className={styles.style695_38}>{t('addForm.phoneLabel')}</Label>
            <Input
              id="del-phone"
              value={props.phone}
              onChange={e => props.setPhone(e.target.value)}
              placeholder={t('addForm.phonePlaceholder')}
              className={styles.style701_39}
              required
            />
          </div>

          <div className={styles.style706_40}>
            <Label htmlFor="del-region" className={styles.style707_41}>{t('addForm.regionLabel')}</Label>
            <Select value={props.district} onValueChange={props.setDistrict}>
              <SelectTrigger id="del-region" className={styles.style712_42}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className={styles.customSelectContent}>
                <SelectItem value={tAuto('key_161b5e38')} className={styles.customSelectItem}>{t('addForm.regions.wadiSeer')}</SelectItem>
                <SelectItem value={tAuto('key_1aacb23c')} className={styles.customSelectItem}>{t('addForm.regions.univ')}</SelectItem>
                <SelectItem value={tAuto('key_a0c2bd48')} className={styles.customSelectItem}>{t('addForm.regions.kasaba')}</SelectItem>
                <SelectItem value={tAuto('key_757dba02')} className={styles.customSelectItem}>{t('addForm.regions.karrada')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className={styles.style721_43}>
            <Label htmlFor="del-target" className={styles.style722_44}>{t('addForm.targetLabel')}</Label>
            <Input
              id="del-target"
              type="number"
              value={props.targetDaily}
              onChange={e => props.setTargetDaily(e.target.value)}
              placeholder={t('addForm.targetPlaceholder')}
              className={styles.style729_45}
              required
            />
          </div>

          <div className={styles.style734_46}>
            <Label htmlFor="del-expiry" className={styles.style735_47}>{t('addForm.expiryLabel')}</Label>
            <Select value={props.linkExpiryHours} onValueChange={props.setLinkExpiryHours}>
              <SelectTrigger id="del-expiry" className={styles.style740_48}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className={styles.customSelectContent}>
                <SelectItem value="24" className={styles.customSelectItem}>{t('addForm.expirations.24')}</SelectItem>
                <SelectItem value="48" className={styles.customSelectItem}>{t('addForm.expirations.48')}</SelectItem>
                <SelectItem value="72" className={styles.customSelectItem}>{t('addForm.expirations.72')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className={styles.style748_49}>
            <Label htmlFor="del-count" className={styles.style749_50}>{t('addForm.preCountLabel')}</Label>
            <Input
              id="del-count"
              type="number"
              value={props.referralCountInit}
              onChange={e => props.setReferralCountInit(e.target.value)}
              className={styles.style755_51}
            />
          </div>

          <div className={styles.style759_52}>
            <Label htmlFor="del-subrole" className={styles.style760_53}>{t('addForm.subRoleLabel')}</Label>
            <Select value={props.subRole} onValueChange={(value) => props.setSubRole(value as 'independent' | 'captain')}>
              <SelectTrigger id="del-subrole" className={styles.style765_54}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className={styles.customSelectContent}>
                <SelectItem value="independent" className={styles.customSelectItem}>{t('addForm.subRoles.independent')}</SelectItem>
                <SelectItem value="captain" className={styles.customSelectItem}>{t('addForm.subRoles.captain')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {props.subRole === 'captain' && (
            <div className={styles.style773_55}>
              <Label htmlFor="del-fleet-active" className={styles.style774_56}>{t('addForm.fleetActiveLabel')}</Label>
              <div className={styles.style775_57}>
                <input
                  type="checkbox"
                  id="del-fleet-active"
                  checked={props.isFleetActive}
                  onChange={e => props.setIsFleetActive(e.target.checked)}
                  className={styles.style781_58}
                />
                <span className={styles.style783_59}>{t('addForm.fleetActiveCheck')}</span>
              </div>
            </div>
          )}
        </div>

        <div className={styles.style789_60}>
          <Button type="button" variant="ghost" onClick={() => props.setIsAdding(false)} className={styles.style790_61}>{t('addForm.cancel')}</Button>
          <Button type="submit" className={styles.style791_62}>{t('addForm.submit')}</Button>
        </div>
      </form>
    </Card>
  );
}
