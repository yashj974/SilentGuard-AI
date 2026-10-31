import { createContext, useContext } from 'react';
import type {
  Finding,
  OverviewMetrics,
  ProjectSummary,
  RemediationState,
  ReviewStatus,
  AIExplanation,
  SuggestedFix,
  FindingReviewHistoryItem,
  RepositoryReviewSummary,
} from '../types';

export type WorkspaceUiState = 'demo' | 'loading' | 'empty' | 'error';

export interface SelectedRepoMeta {
  provider: 'github' | 'gitlab' | 'bitbucket';
  repo_full_name: string;
  branch: string;
  repo_id?: string | null;
  default_branch?: string;
  language?: string | null;
  private?: boolean;
}

export interface ScanProgressState {
  status: 'idle' | 'running' | 'completed' | 'failed';
  step: string;
  percent: number;
  message: string;
  error?: string | null;
}

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

  // Real Repository & Scan state
  isDemoData: boolean;
  setIsDemoData: (val: boolean) => void;
  hasRealScans: boolean;
  selectedRepo: SelectedRepoMeta | null;
  overviewData: OverviewMetrics;
  findings: Finding[];
  availableProjects: ProjectSummary[];
  scanProgress: ScanProgressState;
  startRepositoryScan: (provider?: string, repo?: string, branch?: string) => Promise<boolean>;
  changeRepositoryBranch: (provider: string, repo: string, branch: string) => Promise<boolean>;
  refreshWorkspaceSummary: () => Promise<void>;

  // AI Code Review & Inline X-Ray Helpers
  activeScanId: string | null;
  fetchSourceFile: (filePath: string) => Promise<{
    file_path: string;
    content: string;
    line_count: number;
    language: string;
    findings_in_file: Finding[];
  } | null>;
  explainFinding: (findingId: string) => Promise<AIExplanation | null>;
  suggestFix: (findingId: string) => Promise<SuggestedFix | null>;
  updateFindingReview: (findingId: string, status: ReviewStatus, note?: string) => Promise<boolean>;
  applyFindingFix: (findingId: string) => Promise<{ success: boolean; message: string }>;
  askFindingAssistant: (question: string, findingId?: string) => Promise<string>;
  fetchFindingHistory: (findingId: string) => Promise<FindingReviewHistoryItem[]>;
  fetchReviewSummary: () => Promise<RepositoryReviewSummary | null>;
}

export const WorkspaceContext = createContext<WorkspaceContextValue | undefined>(undefined);

export const useWorkspace = (): WorkspaceContextValue => {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return ctx;
};
