import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, Copy, Link as LinkIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Delegate } from './delegates-shared';
import { styles } from './delegates-shared';

interface DelegatesTableProps {
  t: any;
  delegates: Delegate[];
  drivers: any[];
  verifiedSignatures: Record<string, boolean>;
  copiedCode: string | null;
  handleCopy: (code: string) => void;
  handleReconcileAndSign: (id: string) => void;
  handleGenerateMagicLink: (d: Delegate) => void;
  toggleStatus: (id: string, status: 'active' | 'suspended') => void;
}

export function DelegatesTable(props: DelegatesTableProps) {
  const { t, delegates, drivers, verifiedSignatures, copiedCode } = props;

  return (
    <Card className={styles.style799_63}>
      <CardHeader className={styles.style800_64}>
        <CardTitle className={styles.style801_65}>{t('delegatesTab.title')}</CardTitle>
        <CardDescription className={styles.style802_66}>
          {t('delegatesTab.desc')}
        </CardDescription>
      </CardHeader>
      <CardContent className={styles.style806_67}>
        {delegates.length > 0 ? (
          <div className={styles.style808_68}>
            <Table>
              <TableHeader className={styles.style810_69}>
                <TableRow>
                  <TableHead className={styles.style812_70}>{t('delegatesTab.table.colDelegate')}</TableHead>
                  <TableHead className={styles.style813_71}>{t('delegatesTab.table.colCode')}</TableHead>
                  <TableHead className={styles.style814_72}>{t('delegatesTab.table.colTarget')}</TableHead>
                  <TableHead className={styles.style815_73}>{t('delegatesTab.table.colDrivers')}</TableHead>
                  <TableHead className={styles.style816_74}>{t('delegatesTab.table.colOrganic')}</TableHead>
                  <TableHead className={styles.style817_75}>{t('delegatesTab.table.colLinks')}</TableHead>
                  <TableHead className={styles.style818_76}>{t('delegatesTab.table.colStatus')}</TableHead>
                  <TableHead className={styles.style819_77}>{t('delegatesTab.table.colControl')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {delegates.map((del) => {
                  return (
                    <TableRow key={del.id} className={styles.style825_78}>
                      <TableCell className={styles.style826_79}>
                        <div className={styles.style827_80}>
                          <Avatar className={styles.style828_81}>
                            <AvatarFallback className={styles.style829_82}>
                              {del.name.substring(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className={styles.style834_83}>{del.name}</p>
                            <span className={styles.style835_84}>{del.district} {`●`} {del.phone}</span>
                            <div className={styles.style836_85}>
                              <Badge className={styles.style837_86}>
                                {del.subRole === 'captain' ? t('delegatesTab.badges.captain') : t('delegatesTab.badges.independent')}
                              </Badge>
                              {del.subRole === 'captain' && (
                                <Badge className={cn(
                                  styles.style842_87,
                                  del.isFleetActive
                                    ? styles.style844_88
                                    : styles.style845_89
                                )}>
                                  {del.isFleetActive ? t('delegatesTab.badges.activeField') : t('delegatesTab.badges.inactiveField')}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className={styles.style855_90}>
                        <div className={styles.style856_91}>
                          <Badge variant="outline" className={styles.style857_92}>
                            {del.referralCode}
                          </Badge>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => props.handleCopy(del.referralCode)}
                            className={styles.style864_93}
                          >
                            {copiedCode === del.referralCode ? <Check className={styles.style866_94} /> : <Copy className={styles.style866_95} />}
                          </Button>
                        </div>
                      </TableCell>

                      <TableCell className={styles.style871_96}>
                        {del.targetDaily || 10} {t('delegatesTab.badges.targetSuffix')}
                      </TableCell>

                      <TableCell className={styles.style875_97}>
                        <div>
                          <div>{del.referredCount || 0} {t('delegatesTab.badges.driverSuffix')}</div>
                          {(() => {
                            const actualCount = drivers.filter(dr =>
                              dr.referralCode === del.referralCode ||
                              dr.referredByCode === del.referralCode ||
                              dr.usedReferralCode === del.referralCode
                            ).length;

                            const isSigValid = !!verifiedSignatures[del.id];
                            const hasDiscrepancy = actualCount > 0 && actualCount !== del.referredCount;

                            return (
                              <div className={styles.style889_98}>
                                {isSigValid ? (
                                  <Badge variant="outline" className={styles.style891_99}>
                                    {t('delegatesTab.badges.sigValid')}
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className={styles.style895_100}>
                                    {t('delegatesTab.badges.sigInvalid')}
                                  </Badge>
                                )}

                                {hasDiscrepancy ? (
                                  <div className={styles.style901_101}>
                                    <span>{t('delegatesTab.badges.discrepancy', { count: actualCount })}</span>
                                  </div>
                                ) : actualCount > 0 ? (
                                  <div className={styles.style905_102}>
                                    <span>{t('delegatesTab.badges.match', { count: actualCount })}</span>
                                  </div>
                                ) : null}

                                {(!isSigValid || hasDiscrepancy) && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => props.handleReconcileAndSign(del.id)}
                                    className={styles.style915_103}
                                  >
                                    {t('delegatesTab.actions.sign')}
                                  </Button>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      </TableCell>

                      <TableCell className={styles.style926_104}>
                        {t('delegatesTab.badges.organicPrefix')}{del.organicCount || 0}{t('delegatesTab.badges.organicSuffix')}
                      </TableCell>

                      <TableCell className={styles.style930_105}>
                        <Badge variant="outline" className={styles.style931_106}>
                          ⏱️ {del.linkExpiryHours || 24} {t('delegatesTab.badges.hours')}
                        </Badge>
                      </TableCell>

                      <TableCell className={styles.style936_107}>
                        <Badge
                          variant="outline"
                          className={cn(
                            styles.style940_108,
                            del.status === 'active'
                              ? styles.style942_109
                              : styles.style943_110
                          )}
                        >
                          {del.status === 'active' ? t('delegatesTab.badges.statusActive') : t('delegatesTab.badges.statusSuspended')}
                        </Badge>
                      </TableCell>

                      <TableCell className={styles.style950_111}>
                        <div className={styles.style951_112}>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => props.handleGenerateMagicLink(del)}
                            className={styles.style956_113}
                          >
                            <LinkIcon className={styles.style958_114} />
                            {t('delegatesTab.actions.generateLink')}
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => props.toggleStatus(del.id, del.status)}
                            className={styles.style966_115}
                          >
                            {del.status === 'active' ? t('delegatesTab.actions.freeze') : t('delegatesTab.actions.unfreeze')}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <p className={styles.style979_116}>{t('delegatesTab.empty')}</p>
        )}
      </CardContent>
    </Card>
  );
}
