'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Link as LinkIcon, ClipboardList, TrendingUp, Plus } from 'lucide-react';
import { useDelegatesState } from './delegates-tab/use-delegates-state';

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
    <div className="space-y-5 text-right font-sans" dir="rtl">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/10 pb-4">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-400" />
            {t('header.title')}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {t('header.desc')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            onClick={() => setIsAdding(!isAdding)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs h-10 px-4 rounded-xl flex items-center gap-1.5 shadow-lg shadow-emerald-600/20"
          >
            <Plus className="h-4 w-4" />
            {isAdding ? t('header.closeBtn') : t('header.addBtn')}
          </Button>
        </div>
      </div>

      {/* Sub-navigation Controls */}
      <div className="flex flex-wrap gap-2 border-b border-white/5 pb-3">
        <Button
          type="button"
          variant={activeSubTab === 'delegates' ? 'default' : 'ghost'}
          onClick={() => setActiveSubTab('delegates')}
          className={`text-xs px-4 py-2 font-black rounded-xl h-10 transition-all ${
            activeSubTab === 'delegates'
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4 ml-1.5 shrink-0" />
          {t('tabs.delegates')}
        </Button>

        <Button
          type="button"
          variant={activeSubTab === 'magic-links' ? 'default' : 'ghost'}
          onClick={() => setActiveSubTab('magic-links')}
          className={`text-xs px-4 py-2 font-black rounded-xl h-10 transition-all ${
            activeSubTab === 'magic-links'
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <LinkIcon className="w-4 h-4 ml-1.5 shrink-0" />
          {t('tabs.magicLinks')}
          {state.magicLinks.filter(l => l.status === 'active').length > 0 && (
            <Badge className="mr-1.5 bg-amber-500 text-black text-[9px] font-black rounded-full px-1.5">
              {state.magicLinks.filter(l => l.status === 'active').length}
            </Badge>
          )}
        </Button>

        <Button
          type="button"
          variant={activeSubTab === 'tasks' ? 'default' : 'ghost'}
          onClick={() => setActiveSubTab('tasks')}
          className={`text-xs px-4 py-2 font-black rounded-xl h-10 transition-all ${
            activeSubTab === 'tasks'
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <ClipboardList className="w-4 h-4 ml-1.5 shrink-0" />
          {t('tabs.tasks')}
          {state.tasks.filter(t => t.status === 'pending').length > 0 && (
            <Badge className="mr-1.5 bg-red-500 text-white text-[9px] font-black rounded-full px-1.5">
              {state.tasks.filter(t => t.status === 'pending').length}
            </Badge>
          )}
        </Button>

        <Button
          type="button"
          variant={activeSubTab === 'performance' ? 'default' : 'ghost'}
          onClick={() => setActiveSubTab('performance')}
          className={`text-xs px-4 py-2 font-black rounded-xl h-10 transition-all ${
            activeSubTab === 'performance'
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <TrendingUp className="w-4 h-4 ml-1.5 shrink-0" />
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
        <div className="grid md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <TasksTable {...state} />
          </div>
          <div>
            <CreateTaskForm {...state} />
          </div>
        </div>
      )}

      {/* Analytics Performance Tab */}
      {activeSubTab === 'performance' && (
        <PerformanceStats {...state} />
      )}
    </div>
  );
}
