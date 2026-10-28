import { createContext, useContext } from 'react';
import type { ProjectSummary, RemediationState } from '../types';

export type WorkspaceUiState = 'demo' | 'loading' | 'empty' | 'error';

export interface WorkspaceContextValue {
  selectedProjectKey: string;
  selectedProject: ProjectSummary;
  setSelectedProjectKey: (key: string) => void;
  uiState: WorkspaceUiState;
  setUiState: (state: WorkspaceUiState) => void;
  globalSearch: string;
  setGlobalSearch: (q: string) => void;
  backendStatus: 'checking' | 'online' | 'offline';
  remediationStates: Record<string, RemediationState>;
  approveRemediation: (findingId: string) => void;
  applyRemediation: (findingId: string) => void;
  resetRemediations: () => void;
  appliedScoreBonus: number;
}

export const WorkspaceContext = createContext<WorkspaceContextValue | undefined>(undefined);

export const useWorkspace = (): WorkspaceContextValue => {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return ctx;
};
