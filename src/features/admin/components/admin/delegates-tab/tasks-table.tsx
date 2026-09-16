import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ClipboardList } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DelegateTask } from './delegates-shared';
import { styles } from './delegates-shared';

interface TasksTableProps {
  t: any;
  tasks: DelegateTask[];
  handleCloseTask: (id: string) => void;
}

export function TasksTable(props: TasksTableProps) {
  const { t, tasks, handleCloseTask } = props;

  return (
    <Card className={styles.style1092_151}>
      <CardHeader className={styles.style1093_152}>
        <CardTitle className={styles.style1094_153}>
          <ClipboardList className={styles.style1095_154} />
          {t('tasksTab.cardTitle')}
        </CardTitle>
      </CardHeader>
      <CardContent className={styles.style1099_155}>
        {tasks.length > 0 ? (
          <div className={styles.style1101_156}>
            <Table>
              <TableHeader className={styles.style1103_157}>
                <TableRow>
                  <TableHead className={styles.style1105_158}>{t('tasksTab.table.colTask')}</TableHead>
                  <TableHead className={styles.style1106_159}>{t('tasksTab.table.colDesc')}</TableHead>
                  <TableHead className={styles.style1107_160}>{t('tasksTab.table.colDeadline')}</TableHead>
                  <TableHead className={styles.style1108_161}>{t('tasksTab.table.colStatus')}</TableHead>
                  <TableHead className={styles.style1109_162}>{t('tasksTab.table.colAction')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.map((task) => {
                  return (
                    <TableRow key={task.id} className={styles.style1115_163}>
                      <TableCell className={styles.style1116_164}>
                        <span className={styles.style1117_165}>{task.title}</span>
                        <span className={styles.style1118_166}>{t('tasksTab.cell.delegatePrefix')}{task.delegateName}</span>
                      </TableCell>

                      <TableCell className={styles.style1121_167}>
                        {task.description}
                      </TableCell>

                      <TableCell className={styles.style1125_168}>
                        {task.deadline}
                      </TableCell>

                      <TableCell className={styles.style1129_169}>
                        <Badge
                          variant="outline"
                          className={cn(
                            styles.style1133_170,
                            task.status === 'pending' ? styles.style1134_171 :
                            task.status === 'acknowledged' ? styles.style1135_172 :
                            task.status === 'completed' ? styles.style1136_173 :
                            styles.style1137_174
                          )}
                        >
                          {task.status === 'pending' ? t('tasksTab.status.pending') :
                           task.status === 'acknowledged' ? t('tasksTab.status.acknowledged') :
                           task.status === 'completed' ? t('tasksTab.status.completed') : t('tasksTab.status.closed')}
                        </Badge>
                      </TableCell>

                      <TableCell className={styles.style1146_175}>
                        {task.status !== 'closed' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCloseTask(task.id)}
                            className={styles.style1152_176}
                          >
                            {t('tasksTab.actions.close')}
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
          <div className={styles.style1165_177}>
            <ClipboardList className={styles.style1166_178} />
            <span>{t('tasksTab.empty')}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
