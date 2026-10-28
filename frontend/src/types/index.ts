export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type DebtCategory = 'security' | 'reliability' | 'maintainability' | 'architectural';
export type ScanStatus = 'passed' | 'warning' | 'failed' | 'in_progress';
export type SignalType = 'confirmed_ast' | 'heuristic_signal';
export type RemediationState = 'proposed' | 'approved' | 'verified_applied' | 'manual_only';

export interface Finding {
  id: string;
  projectKey?: string;
  ruleId: string;
  title: string;
  cwe?: string;
  category: DebtCategory;
  severity: Severity;
  filePath: string;
  line: number;
  aiGeneratedConfidence: number; // 0-100%
  signalType?: SignalType;
  aiEvidence?: string;
  astNodeType?: string;
  codeSnippet?: {
    beforeLines: string[];
    vulnerableLine: string;
    afterLines: string[];
  };
  remediationDiff?: {
    removedLines: string[];
    addedLines: string[];
    explanation: string;
    testSuiteResult: string;
    scoreImpactPts: number;
  };
  description: string;
  verifiedFixAvailable: boolean;
  status: 'open' | 'triaged' | 'resolved' | 'suppressed';
  lifecycle?: 'newly_detected' | 'recurring' | 'open' | 'resolved';
  detectedAt: string;
}

export interface ModuleDependency {
  fromModuleId: string;
  toModuleId: string;
  relationship: 'imports' | 'rpc_call' | 'shared_schema' | 'event_stream';
  couplingWeight: number; // 0-100
  description: string;
}

export interface RiskModule {
  id: string;
  projectKey?: string;
  path: string;
  language: string;
  riskScore: number; // 0-100
  aiCodeRatio: number; // 0-100%
  findingsCount: number;
  fragilityIndex: number;
  linesOfCode: number;
  fanIn?: number;
  fanOut?: number;
  blastRadiusEndpoints?: string[];
  regressionReason?: string;
}

export interface ScanRecord {
  id: string;
  projectKey: string;
  branch: string;
  commitHash: string;
  commitMessage: string;
  triggeredBy: string;
  timestamp: string;
  durationMs: number;
  status: ScanStatus;
  debtScore: number;
  findingsDelta: number; // e.g., +3 or -5
  verifiedFixCount: number;
}

export interface SilentDebtFingerprintItem {
  id: string;
  projectKey?: string;
  patternName: string;
  category: DebtCategory;
  frequency: number;
  severity: Severity;
  description: string;
  mitigationStrategy: string;
  evidenceNote?: string;
  affectedModules?: string[];
}

export interface FragilityMetrics {
  score: number; // 0-100
  level: 'Low' | 'Moderate' | 'High' | 'Severe';
  blastRadius: string;
  dependencyCoupling: number; // 0-100%
  aiRegressionRisk: number; // 0-100%
  untestedBranchesCount: number;
}

export interface DebtBudget {
  allocatedBudget: number; // e.g. 50 hours or points
  consumedBudget: number;
  remainingBudget: number;
  sprintName: string;
  burnRatePercentage: number;
  status: 'within_budget' | 'near_breach' | 'breached';
}

export interface CategoryScore {
  score: number; // 0-100 (100 = best / least debt)
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  issuesCount: number;
  trend: 'improving' | 'stable' | 'degrading';
  changeDelta: number;
}

export interface ProjectSummary {
  key: string;
  name: string;
  repo: string;
  branch: string;
  latestCommit: string;
  debtScore: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  findingsCount: number;
  lastScan: string;
  aiRatio: number;
  totalLoc: number;
  languages: { name: string; percentage: number; loc: number; color: string }[];
  connectionStatus: 'demo_sample' | 'connected' | 'disconnected';
  connectionNote: string;
  categories: {
    security: CategoryScore;
    reliability: CategoryScore;
    maintainability: CategoryScore;
    architectural: CategoryScore;
  };
}

export interface OverviewMetrics {
  silentDebtScore: number; // 0-100
  debtGrade: 'A' | 'B' | 'C' | 'D' | 'F';
  isHealthy: boolean;
  categories: {
    security: CategoryScore;
    reliability: CategoryScore;
    maintainability: CategoryScore;
    architectural: CategoryScore;
  };
  debtBudget: DebtBudget;
  fragility: FragilityMetrics;
  fingerprints: SilentDebtFingerprintItem[];
  riskTrend: {
    period: string;
    security: number;
    reliability: number;
    maintainability: number;
    architectural: number;
    compositeDebt: number;
  }[];
  highestRiskModules: RiskModule[];
  moduleDependencies?: ModuleDependency[];
  recentScans: ScanRecord[];
  highestPriorityFindings: Finding[];
}
