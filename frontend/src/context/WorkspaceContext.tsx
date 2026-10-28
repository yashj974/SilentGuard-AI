import React, { useState, useEffect } from 'react';
import { DEMO_PROJECTS, DEMO_OVERVIEW_DATA } from '../data/demoData';
import type { RemediationState } from '../types';
import { WorkspaceContext } from './useWorkspace';
import type { WorkspaceUiState } from './useWorkspace';

const INITIAL_REMEDIATION_STATES: Record<string, RemediationState> = {
  'find-101': 'proposed',
  'find-102': 'proposed',
  'find-103': 'proposed',
  'find-104': 'manual_only',
};

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedProjectKey, setSelectedProjectKey] = useState<string>('core-platform');
  const [uiState, setUiState] = useState<WorkspaceUiState>('demo');
  const [globalSearch, setGlobalSearch] = useState<string>('');
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [remediationStates, setRemediationStates] = useState<Record<string, RemediationState>>(
    INITIAL_REMEDIATION_STATES
  );

  useEffect(() => {
    let isMounted = true;
    const checkBackend = async () => {
      try {
        const response = await fetch('/api/health');
        if (response.ok) {
          if (isMounted) setBackendStatus('online');
        } else {
          if (isMounted) setBackendStatus('offline');
        }
      } catch {
        if (isMounted) setBackendStatus('offline');
      }
    };

    checkBackend();
    const interval = setInterval(checkBackend, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const selectedProject =
    DEMO_PROJECTS.find((p) => p.key === selectedProjectKey) || DEMO_PROJECTS[0];

  const approveRemediation = (findingId: string) => {
    setRemediationStates((prev) => ({
      ...prev,
      [findingId]: 'approved',
    }));
  };

  const applyRemediation = (findingId: string) => {
    setRemediationStates((prev) => ({
      ...prev,
      [findingId]: 'verified_applied',
    }));
  };

  const resetRemediations = () => {
    setRemediationStates(INITIAL_REMEDIATION_STATES);
  };

  const appliedScoreBonus = DEMO_OVERVIEW_DATA.highestPriorityFindings.reduce((acc, f) => {
    if (remediationStates[f.id] === 'verified_applied' && f.remediationDiff) {
      return acc + f.remediationDiff.scoreImpactPts;
    }
    return acc;
  }, 0);

  return (
    <WorkspaceContext.Provider
      value={{
        selectedProjectKey,
        selectedProject,
        setSelectedProjectKey,
        uiState,
        setUiState,
        globalSearch,
        setGlobalSearch,
        backendStatus,
        remediationStates,
        approveRemediation,
        applyRemediation,
        resetRemediations,
        appliedScoreBonus,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};
