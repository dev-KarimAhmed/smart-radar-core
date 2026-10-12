import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Delegate } from './delegates-shared';
import { styles } from './delegates-shared';

interface CreateTaskFormProps {
  t: any;
  delegates: Delegate[];
  selectedDelegateId: string;
  setSelectedDelegateId: (v: string) => void;
  taskTitle: string;
  setTaskTitle: (v: string) => void;
  taskDescription: string;
  setTaskDescription: (v: string) => void;
  taskDeadline: string;
  setTaskDeadline: (v: string) => void;
  handleAddTask: (e: React.FormEvent) => void;
}

export function CreateTaskForm(props: CreateTaskFormProps) {
  const { t, delegates, handleAddTask } = props;

  return (
    <Card className={styles.style1174_179}>
      <CardHeader>
        <CardTitle className={styles.style1176_180}>
          <Sparkles className={styles.style1177_181} />
          {t('tasksTab.createForm.cardTitle')}
        </CardTitle>
        <CardDescription className={styles.style1180_182}>
          {t('tasksTab.createForm.cardDesc')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleAddTask} className={styles.style1185_183}>
          <div className={styles.style1186_184}>
            <Label className={styles.style1187_185}>{t('tasksTab.createForm.selectLabel')}</Label>
            <Select value={props.selectedDelegateId} onValueChange={props.setSelectedDelegateId}>
              <SelectTrigger className={styles.style1191_186}>
                <SelectValue placeholder={t('tasksTab.createForm.selectPlaceholder')} />
              </SelectTrigger>
              <SelectContent className={styles.customSelectContent}>
                {delegates.filter(d => d.status === 'active').map(d => (
                  <SelectItem key={d.id} value={d.id} className={styles.customSelectItem}>{d.name} ({d.district})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className={styles.style1201_187}>
            <Label className={styles.style1202_188}>{t('tasksTab.createForm.titleLabel')}</Label>
            <Input
              value={props.taskTitle}
              onChange={e => props.setTaskTitle(e.target.value)}
              placeholder={t('tasksTab.createForm.titlePlaceholder')}
              className={styles.style1207_189}
              required
            />
          </div>

          <div className={styles.style1212_190}>
            <Label className={styles.style1213_191}>{t('tasksTab.createForm.descLabel')}</Label>
            <textarea
              value={props.taskDescription}
              onChange={e => props.setTaskDescription(e.target.value)}
              placeholder={t('tasksTab.createForm.descPlaceholder')}
              className={styles.style1218_192}
              required
            />
          </div>

          <div className={styles.style1223_193}>
            <Label className={styles.style1224_194}>{t('tasksTab.createForm.deadlineLabel')}</Label>
            <Input
              type="date"
              value={props.taskDeadline}
              onChange={e => props.setTaskDeadline(e.target.value)}
              className={styles.style1229_195}
              required
            />
          </div>

          <Button type="submit" className={styles.style1234_196}>
            {t('tasksTab.createForm.submit')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
