import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { useDelegatesData } from './use-delegates-data';
import { useDelegateCreationActions } from './use-delegate-creation-actions';
import { useDelegateTaskSettlementActions } from './use-delegate-task-settlement-actions';

export function useDelegatesState() {
  const t = useTranslations('adminTab.delegatesManagement');
  const { toast } = useToast();
  const { user } = useAuth();

  const {
    delegates,
    setDelegates,
    verifiedSignatures,
    magicLinks,
    tasks,
    drivers,
    loading
  } = useDelegatesData();

  const [activeSubTab, setActiveSubTab] = useState<'delegates' | 'magic-links' | 'tasks' | 'performance'>('delegates');
  const [isAdding, setIsAdding] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Form states (Delegate)
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [district, setDistrict] = useState('وادي السير');
  const [targetDaily, setTargetDaily] = useState('10');
  const [linkExpiryHours, setLinkExpiryHours] = useState('24');
  const [referralCountInit, setReferralCountInit] = useState('0');
  const [subRole, setSubRole] = useState<'independent' | 'captain'>('independent');
  const [isFleetActive, setIsFleetActive] = useState(false);

  // Form states (Task)
  const [selectedDelegateId, setSelectedDelegateId] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskDeadline, setTaskDeadline] = useState('');

  const creationActions = useDelegateCreationActions({
    t,
    toast,
    setCopiedCode,
    name,
    setName,
    phone,
    setPhone,
    district,
    targetDaily,
    setTargetDaily,
    linkExpiryHours,
    referralCountInit,
    setReferralCountInit,
    subRole,
    isFleetActive,
    setIsAdding
  });

  const settlementActions = useDelegateTaskSettlementActions({
    t,
    toast,
    user,
    delegates,
    setDelegates,
    selectedDelegateId,
    taskTitle,
    setTaskTitle,
    taskDescription,
    setTaskDescription,
    taskDeadline,
    setTaskDeadline
  });

  return {
    t,
    delegates,
    verifiedSignatures,
    magicLinks,
    tasks,
    drivers,
    loading,
    activeSubTab,
    setActiveSubTab,
    isAdding,
    setIsAdding,
    copiedCode,
    
    // Delegate Form
    name, setName,
    phone, setPhone,
    district, setDistrict,
    targetDaily, setTargetDaily,
    linkExpiryHours, setLinkExpiryHours,
    referralCountInit, setReferralCountInit,
    subRole, setSubRole,
    isFleetActive, setIsFleetActive,
    handleAddDelegate: creationActions.handleAddDelegate,
    
    // Task Form
    selectedDelegateId, setSelectedDelegateId,
    taskTitle, setTaskTitle,
    taskDescription, setTaskDescription,
    taskDeadline, setTaskDeadline,
    handleAddTask: settlementActions.handleAddTask,

    // Actions
    handleCopy: creationActions.handleCopy,
    handleGenerateMagicLink: creationActions.handleGenerateMagicLink,
    handleRevokeLink: creationActions.handleRevokeLink,
    handleCloseTask: settlementActions.handleCloseTask,
    toggleStatus: settlementActions.toggleStatus,
    processPayout: settlementActions.processPayout,
    handleReconcileAndSign: settlementActions.handleReconcileAndSign
  };
}
