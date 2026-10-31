import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { DEMO_PROJECTS, DEMO_OVERVIEW_DATA } from '../data/demoData';
import type {
  Finding,
  OverviewMetrics,
  ProjectSummary,
  RemediationState,
  AIExplanation,
  SuggestedFix,
  ReviewStatus,
  FindingReviewHistoryItem,
  RepositoryReviewSummary,
} from '../types';
import {
  WorkspaceContext,
  type WorkspaceUiState,
  type SelectedRepoMeta,
  type ScanProgressState,
} from './useWorkspace';
import { useAuth } from './useAuth';

const INITIAL_REMEDIATION_STATES: Record<string, RemediationState> = {
  'find-101': 'proposed',
  'find-102': 'proposed',
  'find-103': 'proposed',
  'find-104': 'manual_only',
};

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token } = useAuth();

  const [selectedProjectKey, setSelectedProjectKey] = useState<string>('core-platform');
  const [uiState, setUiState] = useState<WorkspaceUiState>('demo');
  const [globalSearch, setGlobalSearch] = useState<string>('');
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [remediationStates, setRemediationStates] = useState<Record<string, RemediationState>>(
    INITIAL_REMEDIATION_STATES
  );

  // Real Repository & Scan State
  const [isDemoData, setIsDemoData] = useState<boolean>(true);
  const [hasRealScans, setHasRealScans] = useState<boolean>(false);
  const [selectedRepo, setSelectedRepo] = useState<SelectedRepoMeta | null>(null);
  const [activeScanId, setActiveScanId] = useState<string | null>(null);
  const [realProject, setRealProject] = useState<ProjectSummary | null>(null);
  const [overviewData, setOverviewData] = useState<OverviewMetrics>(DEMO_OVERVIEW_DATA);
  const [findings, setFindings] = useState<Finding[]>(DEMO_OVERVIEW_DATA.highestPriorityFindings);

  const [scanProgress, setScanProgress] = useState<ScanProgressState>({
    status: 'idle',
    step: 'Idle',
    percent: 0,
    message: '',
    error: null,
  });

  // Health check
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

  // Fetch unified workspace summary from backend
  const refreshWorkspaceSummary = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/workspace/summary', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.status === 'success') {
        if (data.selected_repo) {
          setSelectedRepo(data.selected_repo);
        }

        if (data.has_scans && data.active_project && data.overview) {
          setHasRealScans(true);
          setRealProject(data.active_project);
          setOverviewData(data.overview);
          setFindings(data.findings || []);
          setIsDemoData(false);
          setSelectedProjectKey(data.active_project.key);
          const scanId = data.overview.recentScans?.[0]?.id || data.scans?.[0]?.id || null;
          setActiveScanId(scanId);
        } else {
          setHasRealScans(false);
          if (data.selected_repo) {
            // Synthesize empty/pending project for selected repository
            const pendingProject: ProjectSummary = {
              key: data.selected_repo.repo_full_name,
              name: data.selected_repo.repo_full_name.split('/')[1] || data.selected_repo.repo_full_name,
              repo: data.selected_repo.repo_full_name,
              branch: data.selected_repo.branch,
              latestCommit: 'HEAD',
              debtScore: 100,
              grade: 'A',
              findingsCount: 0,
              lastScan: 'Pending First Scan',
              aiRatio: 0,
              totalLoc: 0,
              languages: data.selected_repo.language
                ? [{ name: data.selected_repo.language, percentage: 100, loc: 0, color: '#FF5722' }]
                : [],
              connectionStatus: 'connected',
              connectionNote: `Connected to ${data.selected_repo.provider.toUpperCase()} • Ready for code scan`,
              categories: {
                security: { score: 100, grade: 'A', issuesCount: 0, trend: 'stable', changeDelta: 0 },
                reliability: { score: 100, grade: 'A', issuesCount: 0, trend: 'stable', changeDelta: 0 },
                maintainability: { score: 100, grade: 'A', issuesCount: 0, trend: 'stable', changeDelta: 0 },
                architectural: { score: 100, grade: 'A', issuesCount: 0, trend: 'stable', changeDelta: 0 },
              },
            };
            setRealProject(pendingProject);
          }
        }
      }
    } catch {
      // Retain existing state
    }
  }, [token]);

  useEffect(() => {
    void refreshWorkspaceSummary();
  }, [refreshWorkspaceSummary]);

  // Execute actual repository scan
  const startRepositoryScan = async (
    targetProvider?: string,
    targetRepo?: string,
    targetBranch?: string
  ): Promise<boolean> => {
    if (!token) return false;
    const prov = targetProvider || selectedRepo?.provider || 'github';
    const repo =
      targetRepo ||
      selectedRepo?.repo_full_name ||
      (selectedProjectKey.includes('/') ? selectedProjectKey : null);
    const branch = targetBranch || selectedRepo?.branch || 'main';

    if (!repo) {
      setScanProgress({
        status: 'failed',
        step: 'No Repository',
        percent: 0,
        message: 'No repository selected. Please choose a target repository in Integrations.',
        error: 'No repository selected.',
      });
      return false;
    }

    setScanProgress({
      status: 'running',
      step: 'Fetching repository',
      percent: 25,
      message: `Fetching tree and files for ${repo} on branch ${branch}...`,
      error: null,
    });

    try {
      const res = await fetch('/api/repositories/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          provider: prov,
          repo_full_name: repo,
          branch,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const errMsg = data.detail || `Scan failed for ${repo}.`;
        setScanProgress({
          status: 'failed',
          step: 'Failed',
          percent: 0,
          message: errMsg,
          error: errMsg,
        });
        return false;
      }

      setScanProgress({
        status: 'completed',
        step: 'Completed',
        percent: 100,
        message: `Analysis completed: ${data.files_scanned} files inspected, ${data.findings_count} findings detected.`,
        error: null,
      });

      // Reload real results
      await refreshWorkspaceSummary();
      return true;
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Network failure during scan execution.';
      setScanProgress({
        status: 'failed',
        step: 'Failed',
        percent: 0,
        message: errMsg,
        error: errMsg,
      });
      return false;
    }
  };

  // Change selected branch
  const changeRepositoryBranch = async (
    prov: string,
    repoFullName: string,
    branch: string
  ): Promise<boolean> => {
    if (!token) return false;
    try {
      const res = await fetch(`/api/integrations/${prov}/select`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          repo_full_name: repoFullName,
          branch,
        }),
      });
      if (res.ok) {
        setSelectedRepo((prev) =>
          prev ? { ...prev, repo_full_name: repoFullName, branch } : null
        );
        if (realProject && realProject.repo === repoFullName) {
          setRealProject({ ...realProject, branch });
        }
        await refreshWorkspaceSummary();
        return true;
      }
    } catch {
      // Fallback
    }
    return false;
  };

  // Switch project handler
  const handleSelectProjectKey = (key: string) => {
    setSelectedProjectKey(key);
    if (key.includes('/')) {
      // Real repository selected
      setIsDemoData(!hasRealScans);
    } else {
      // Demo project selected
      setIsDemoData(true);
      setOverviewData(DEMO_OVERVIEW_DATA);
      setFindings(DEMO_OVERVIEW_DATA.highestPriorityFindings);
    }
  };

  // Available projects list
  const availableProjects = useMemo<ProjectSummary[]>(() => {
    const list: ProjectSummary[] = [];
    if (realProject) {
      list.push(realProject);
    }
    list.push(...DEMO_PROJECTS);
    return list;
  }, [realProject]);

  // Determine active selected project
  const selectedProject = useMemo<ProjectSummary>(() => {
    if (realProject && (selectedProjectKey === realProject.key || (!isDemoData && hasRealScans))) {
      return realProject;
    }
    return (
      DEMO_PROJECTS.find((p) => p.key === selectedProjectKey) ||
      realProject ||
      DEMO_PROJECTS[0]
    );
  }, [realProject, selectedProjectKey, isDemoData, hasRealScans]);

  const approveRemediation = (findingId: string) => {
    setRemediationStates((prev) => ({
      ...prev,
      [findingId]: 'approved',
    }));
    if (token) {
      void fetch(`/api/findings/${findingId}/remediation`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: 'approved' }),
      }).catch(() => {});
    }
  };

  const applyRemediation = (findingId: string) => {
    setRemediationStates((prev) => ({
      ...prev,
      [findingId]: 'verified_applied',
    }));
    if (token) {
      void fetch(`/api/findings/${findingId}/remediation`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: 'verified_applied' }),
      }).catch(() => {});
    }
  };

  const resetRemediations = () => {
    setRemediationStates(INITIAL_REMEDIATION_STATES);
  };

  // Fetch source file from scan
  const fetchSourceFile = useCallback(
    async (filePath: string) => {
      if (!token || !activeScanId) {
        const targetFinding = findings.find((f) => f.filePath === filePath);
        const snip = targetFinding?.codeSnippet;
        const lines: string[] = [];
        if (snip) {
          lines.push(...snip.beforeLines);
          lines.push(snip.vulnerableLine);
          lines.push(...snip.afterLines);
        } else {
          lines.push(`// ${filePath}`, '// Monitored by SilentGuard AI', 'function execute() { return true; }');
        }
        return {
          file_path: filePath,
          content: lines.join('\n'),
          line_count: lines.length,
          language: filePath.endsWith('.py') ? 'python' : 'javascript',
          findings_in_file: findings.filter((f) => f.filePath === filePath),
        };
      }

      try {
        const res = await fetch(`/api/scans/${activeScanId}/file?path=${encodeURIComponent(filePath)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          return data;
        }
      } catch {
        // fallback
      }
      return null;
    },
    [token, activeScanId, findings]
  );

  // Generate AI Explanation
  const explainFinding = useCallback(
    async (findingId: string): Promise<AIExplanation | null> => {
      if (!token) {
        const f = findings.find((it) => it.id === findingId);
        return {
          provider: 'SilentGuard Rule-Based Intelligence Engine',
          what_happened: f?.whatHappened || f?.title || 'Detected security issue',
          where_happened: f?.whereHappened || `${f?.filePath}:${f?.line}`,
          why_it_matters: f?.whyItMatters || f?.description || 'Can compromise application posture',
          potential_impact: f?.potentialImpact || 'Increased technical debt and risk',
          how_to_fix: f?.howToFix || f?.remediationDiff?.explanation || 'Apply the recommended code diff',
          beginner_explanation: f?.beginnerExplanation || f?.description || 'Review this issue to prevent bugs.',
          technical_explanation: f?.technicalExplanation || f?.description || 'Identified via AST heuristics.',
          validation_steps: f?.validationSteps || ['Run project test suite', 'Verify linter passes'],
          side_effects: 'Ensure downstream dependencies remain backwards-compatible.',
          confidence_evidence: f?.confidenceEvidence || '92% detection confidence',
        };
      }

      try {
        const res = await fetch(`/api/findings/${findingId}/explain`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          return data.explanation;
        }
      } catch {
        // fallback
      }
      return null;
    },
    [token, findings]
  );

  // Generate Suggested Fix & Unified Diff
  const suggestFix = useCallback(
    async (findingId: string): Promise<SuggestedFix | null> => {
      const f = findings.find((it) => it.id === findingId);
      if (!token) {
        const rem = f?.remediationDiff;
        return {
          findingId,
          ruleId: f?.ruleId || 'RULE-GENERAL',
          filePath: f?.filePath || 'file.ts',
          line: f?.line || 1,
          removedLines: rem?.removedLines || ['- original line'],
          addedLines: rem?.addedLines || ['+ suggested line'],
          diffUnified: `--- a/${f?.filePath}\n+++ b/${f?.filePath}\n@@ -${f?.line},1 +${f?.line},1 @@\n- ${rem?.removedLines?.[0] || 'old'}\n+ ${rem?.addedLines?.[0] || 'new'}`,
          explanation: rem?.explanation || 'Apply verified AST remediation patch.',
          sideEffects: 'Minimal; run regression test suite.',
          validationSteps: ['Run automated test suite', 'Verify zero lint warnings'],
          scoreImpactPts: rem?.scoreImpactPts || 6,
          testSuiteResult: rem?.testSuiteResult || 'Passed syntax verification',
        };
      }

      try {
        const res = await fetch(`/api/findings/${findingId}/suggest-fix`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          return data.suggested_fix;
        }
      } catch {
        // fallback
      }
      return null;
    },
    [token, findings]
  );

  // Update Review Status Workflow
  const updateFindingReview = useCallback(
    async (findingId: string, status: ReviewStatus, note?: string): Promise<boolean> => {
      setFindings((prev) =>
        prev.map((f) => (f.id === findingId ? { ...f, reviewStatus: status } : f))
      );

      if (!token) return true;

      try {
        const res = await fetch(`/api/findings/${findingId}/review`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status, note }),
        });
        return res.ok;
      } catch {
        return false;
      }
    },
    [token]
  );

  // Apply Finding Fix
  const applyFindingFix = useCallback(
    async (findingId: string): Promise<{ success: boolean; message: string }> => {
      setFindings((prev) =>
        prev.map((f) => (f.id === findingId ? { ...f, reviewStatus: 'applied' } : f))
      );
      setRemediationStates((prev) => ({ ...prev, [findingId]: 'verified_applied' }));

      if (!token) {
        return { success: true, message: 'Patch applied to demo session.' };
      }

      try {
        const res = await fetch(`/api/findings/${findingId}/apply-fix`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          return { success: true, message: data.message || 'Patch applied to working copy.' };
        }
      } catch (err) {
        return { success: false, message: err instanceof Error ? err.message : 'Failed to apply patch.' };
      }
      return { success: false, message: 'Could not apply patch.' };
    },
    [token]
  );

  // Ask AI Assistant Chat
  const askFindingAssistant = useCallback(
    async (question: string, findingId?: string): Promise<string> => {
      if (!token) {
        return `### SilentGuard AI Assistant (Demo Mode)\n\nYou asked: "${question}"\n\nThis finding in \`${findings[0]?.filePath || 'source code'}\` represents a detected code risk. In real repository scans, SilentGuard connects directly to live AST evidence and Gemini code intelligence to provide actionable, safe remediation instructions.`;
      }

      try {
        const res = await fetch('/api/findings/ai-chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            question,
            finding_id: findingId,
            scan_id: activeScanId,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          return data.answer;
        }
      } catch {
        // fallback
      }
      return 'I was unable to reach the AI assistant service at this moment. Please check your connection.';
    },
    [token, activeScanId, findings]
  );

  // Fetch Finding Review History
  const fetchFindingHistory = useCallback(
    async (findingId: string): Promise<FindingReviewHistoryItem[]> => {
      if (!token) {
        return [
          {
            id: 'rev_demo_1',
            finding_id: findingId,
            action: 'status_change',
            from_status: 'open',
            to_status: 'under_review',
            user_name: 'Lead Reviewer',
            user_email: 'reviewer@silentguard.ai',
            note: 'Initial triage complete',
            created_at: new Date().toISOString(),
          },
        ];
      }

      try {
        const res = await fetch(`/api/findings/${findingId}/history`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          return data.history || [];
        }
      } catch {
        // fallback
      }
      return [];
    },
    [token]
  );

  // Fetch Repository Review Summary
  const fetchReviewSummary = useCallback(async (): Promise<RepositoryReviewSummary | null> => {
    if (!token || !activeScanId) {
      return null;
    }

    try {
      const res = await fetch(`/api/scans/${activeScanId}/review-summary`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        return data;
      }
    } catch {
      // fallback
    }
    return null;
  }, [token, activeScanId]);

  const appliedScoreBonus = findings.reduce((acc, f) => {
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
        setSelectedProjectKey: handleSelectProjectKey,
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

        // Real repository & scan attributes
        isDemoData,
        setIsDemoData,
        hasRealScans,
        selectedRepo,
        overviewData,
        findings,
        availableProjects,
        scanProgress,
        startRepositoryScan,
        changeRepositoryBranch,
        refreshWorkspaceSummary,

        // AI Review & Inline X-Ray Helpers
        activeScanId,
        fetchSourceFile,
        explainFinding,
        suggestFix,
        updateFindingReview,
        applyFindingFix,
        askFindingAssistant,
        fetchFindingHistory,
        fetchReviewSummary,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};
