import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Copy, Link as LinkIcon, XCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { MagicLink } from './delegates-shared';
import { styles } from './delegates-shared';

interface MagicLinksTableProps {
  t: any;
  magicLinks: MagicLink[];
  handleRevokeLink: (id: string) => void;
}

export function MagicLinksTable(props: MagicLinksTableProps) {
  const { t, magicLinks, handleRevokeLink } = props;
  const { toast } = useToast();

  return (
    <div className={styles.style987_117}>
      <Card className={styles.style988_118}>
        <CardHeader className={styles.style989_119}>
          <CardTitle className={styles.style990_120}>
            <LinkIcon className={styles.style991_121} />
            {t('magicLinksTab.cardTitle')}
          </CardTitle>
          <CardDescription className={styles.style994_122}>
            {t('magicLinksTab.cardDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent className={styles.style998_123}>
          {magicLinks.length > 0 ? (
            <div className={styles.style1000_124}>
              <Table>
                <TableHeader className={styles.style1002_125}>
                  <TableRow>
                    <TableHead className={styles.style1004_126}>{t('magicLinksTab.table.colBeneficiary')}</TableHead>
                    <TableHead className={styles.style1005_127}>{t('magicLinksTab.table.colLink')}</TableHead>
                    <TableHead className={styles.style1006_128}>{t('magicLinksTab.table.colExpiry')}</TableHead>
                    <TableHead className={styles.style1007_129}>{t('magicLinksTab.table.colValidity')}</TableHead>
                    <TableHead className={styles.style1008_130}>{t('magicLinksTab.table.colAction')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {magicLinks.map((link) => {
                    const expired = new Date(link.expiresAt) < new Date();
                    const isActive = link.status === 'active' && !expired;

                    return (
                      <TableRow key={link.id} className={styles.style1017_131}>
                        <TableCell className={styles.style1018_132}>
                          <span className={styles.style1019_133}>{link.delegateName}</span>
                          <span className={styles.style1020_134}>#Link-{link.id.substring(0,6)}</span>
                        </TableCell>

                        <TableCell className={styles.style1023_135}>
                          <div className={styles.style1024_136}>
                            <Badge variant="outline" className={styles.style1025_137}>
                              {link.url}
                            </Badge>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => {
                                navigator.clipboard.writeText(link.url);
                                toast({ title: t('magicLinksTab.actions.copySuccessTitle'), description: t('magicLinksTab.actions.copySuccessDesc') });
                              }}
                              className={styles.style1035_138}
                            >
                              <Copy className={styles.style1037_139} />
                            </Button>
                          </div>
                        </TableCell>

                        <TableCell className={styles.style1042_140}>
                          {new Date(link.expiresAt).toLocaleString('ar-JO')}
                        </TableCell>

                        <TableCell className={styles.style1046_141}>
                          <Badge
                            variant="outline"
                            className={cn(
                              styles.style1050_142,
                              isActive ? styles.style1051_143 : styles.style1051_144
                            )}
                          >
                            {link.status === 'used' ? t('magicLinksTab.status.used') : link.status === 'revoked' ? t('magicLinksTab.status.revoked') : expired ? t('magicLinksTab.status.expired') : t('magicLinksTab.status.active')}
                          </Badge>
                        </TableCell>

                        <TableCell className={styles.style1058_145}>
                          {isActive && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRevokeLink(link.id)}
                              className={styles.style1064_146}
                            >
                              <XCircle className={styles.style1066_147} />
                              {t('magicLinksTab.actions.revoke')}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className={styles.style1078_148}>
              <Info className={styles.style1079_149} />
              <span>{t('magicLinksTab.empty')}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
