'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Link as LinkIcon, ClipboardList, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDelegatesState } from './delegates-tab/use-delegates-state';
import { styles } from './delegates-tab/delegates-shared';

import { AddDelegateForm } from './delegates-tab/add-delegate-form';
import { DelegatesTable } from './delegates-tab/delegates-table';
import { MagicLinksTable } from './delegates-tab/magic-links-table';
import { TasksTable } from './delegates-tab/tasks-table';
import { CreateTaskForm } from './delegates-tab/create-task-form';
import { PerformanceStats } from './delegates-tab/performance-stats';

export function DelegatesManagementTab() {
  const state = useDelegatesState();
  const { t, activeSubTab, setActiveSubTab, isAdding, setIsAdding } = state;

  return (
    <div className={styles.style588_1} dir="rtl">
      {/* Header Panel */}
      <div className={styles.style591_2}>
        <div>
          <h2 className={styles.style593_3}>
            <Users className={styles.style594_4} />
            {t('header.title')}
          </h2>
          <p className={styles.style597_5}>
            {t('header.desc')}
          </p>
        </div>
        <div className={styles.style601_6}>
          <Button
            onClick={() => setIsAdding(!isAdding)}
            className={styles.style604_7}
          >
            {isAdding ? t('header.closeBtn') : t('header.addBtn')}
          </Button>
        </div>
      </div>

      {/* Sub-navigation Controls */}
      <div className={styles.style612_8}>
        <Button
          variant={activeSubTab === 'delegates' ? 'default' : 'ghost'}
          onClick={() => setActiveSubTab('delegates')}
          className={cn(
            styles.style617_9,
            activeSubTab === 'delegates' ? styles.style618_10 : styles.style618_11
          )}
        >
          <Users className={styles.style621_12} />
          {t('tabs.delegates')}
        </Button>

        <Button
          variant={activeSubTab === 'magic-links' ? 'default' : 'ghost'}
          onClick={() => setActiveSubTab('magic-links')}
          className={cn(
            styles.style629_13,
            activeSubTab === 'magic-links' ? styles.style630_14 : styles.style630_15
          )}
        >
          <LinkIcon className={styles.style633_16} />
          {t('tabs.magicLinks')}
          {state.magicLinks.filter(l => l.status === 'active').length > 0 && (
            <Badge className={styles.style636_17}>{state.magicLinks.filter(l => l.status === 'active').length}</Badge>
          )}
        </Button>

        <Button
          variant={activeSubTab === 'tasks' ? 'default' : 'ghost'}
          onClick={() => setActiveSubTab('tasks')}
          className={cn(
            styles.style644_18,
            activeSubTab === 'tasks' ? styles.style645_19 : styles.style645_20
          )}
        >
          <ClipboardList className={styles.style648_21} />
          {t('tabs.tasks')}
          {state.tasks.filter(t => t.status === 'pending').length > 0 && (
            <Badge className={styles.style651_22}>{state.tasks.filter(t => t.status === 'pending').length}</Badge>
          )}
        </Button>

        <Button
          variant={activeSubTab === 'performance' ? 'default' : 'ghost'}
          onClick={() => setActiveSubTab('performance')}
          className={cn(
            styles.style659_23,
            activeSubTab === 'performance' ? styles.style660_24 : styles.style660_25
          )}
        >
          <TrendingUp className={styles.style663_26} />
          {t('tabs.performance')}
        </Button>
      </div>

      {/* Add New Delegate Panel */}
      {isAdding && (
        <AddDelegateForm {...state} />
      )}

      {/* Main Container based on Sub-tabs */}
      {activeSubTab === 'delegates' && (
        <DelegatesTable {...state} />
      )}

      {/* Magic Links Sub-tab */}
      {activeSubTab === 'magic-links' && (
        <MagicLinksTable {...state} />
      )}

      {/* Tasks sub-tab */}
      {activeSubTab === 'tasks' && (
        <div className={styles.style1090_150}>
          <TasksTable {...state} />
          <CreateTaskForm {...state} />
        </div>
      )}

      {/* Analytics Performance Tab */}
      {activeSubTab === 'performance' && (
        <PerformanceStats {...state} />
      )}
    </div>
  );
}
