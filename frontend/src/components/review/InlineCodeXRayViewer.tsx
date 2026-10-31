import React, { useState, useEffect, useMemo } from 'react';
import {
  Code2,
  Sparkles,
  Wand2,
  Check,
  Copy,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2,
  Bot,
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  HelpCircle,
  FileText,
  ThumbsUp,
  ThumbsDown,
  CheckCircle2,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import type { Finding, ReviewStatus, SuggestedFix, AIExplanation } from '../../types';

interface InlineCodeXRayViewerProps {
  finding: Finding;
  allFindingsInFile?: Finding[];
  activeScanId?: string | null;
  onSelectFinding?: (findingId: string) => void;
  fetchSourceFile?: (filePath: string) => Promise<{
    file_path?: string;
    content: string;
    line_count?: number;
    language?: string;
    findings_in_file?: Finding[];
  } | null>;
  explainFinding?: (findingId: string) => Promise<AIExplanation | null>;
  suggestFix?: (findingId: string) => Promise<SuggestedFix | null>;
  updateFindingReview?: (findingId: string, status: ReviewStatus, note?: string) => Promise<boolean>;
  applyFindingFix?: (findingId: string) => Promise<{ success: boolean; message: string }>;
  onOpenAssistant?: (finding: Finding) => void;
}

export const InlineCodeXRayViewer: React.FC<InlineCodeXRayViewerProps> = ({
  finding,
  allFindingsInFile = [],
  activeScanId,
  onSelectFinding,
  fetchSourceFile,
  explainFinding,
  suggestFix,
  updateFindingReview,
  applyFindingFix,
  onOpenAssistant,
}) => {
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [isLoadingFile, setIsLoadingFile] = useState<boolean>(false);
  const [isFullFileView, setIsFullFileView] = useState<boolean>(false);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState<boolean>(false);
  const [showDiff, setShowDiff] = useState<boolean>(true);
  const [copiedFix, setCopiedFix] = useState<boolean>(false);

  // AI interactive states
  const [aiExplanation, setAiExplanation] = useState<AIExplanation | null>(null);
  const [isLoadingExplanation, setIsLoadingExplanation] = useState<boolean>(false);
  const [suggestedFixData, setSuggestedFixData] = useState<SuggestedFix | null>(null);
  const [isLoadingFix, setIsLoadingFix] = useState<boolean>(false);
  const [isApplyingFix, setIsApplyingFix] = useState<boolean>(false);
  const [applySuccessMessage, setApplySuccessMessage] = useState<string | null>(null);

  // Fetch authentic source file when finding or scan changes
  useEffect(() => {
    let isCancelled = false;
    const loadContent = async () => {
      if (!fetchSourceFile || !finding.filePath) {
        setFileContent(null);
        return;
      }
      setIsLoadingFile(true);
      try {
        const fileObj = await fetchSourceFile(finding.filePath);
        if (!isCancelled && fileObj?.content) {
          setFileContent(fileObj.content);
        } else if (!isCancelled) {
          setFileContent(null);
        }
      } catch {
        if (!isCancelled) setFileContent(null);
      } finally {
        if (!isCancelled) setIsLoadingFile(false);
      }
    };

    loadContent();
    return () => {
      isCancelled = true;
    };
  }, [fetchSourceFile, activeScanId, finding.filePath]);

  // Reset local state when finding changes
  useEffect(() => {
    setAiExplanation(null);
    setSuggestedFixData(null);
    setApplySuccessMessage(null);
    setShowDiff(true);
  }, [finding.id]);

  // Compute parsed lines and window
  const lines = useMemo(() => {
    if (fileContent) {
      return fileContent.split('\n');
    }
    // Fallback to codeSnippet if full file not retrieved yet
    if (finding.codeSnippet) {
      const startLine = Math.max(1, finding.line - finding.codeSnippet.beforeLines.length);
      const res: { num: number; text: string; isTarget: boolean }[] = [];
      finding.codeSnippet.beforeLines.forEach((text, i) => {
        res.push({ num: startLine + i, text, isTarget: false });
      });
      res.push({ num: finding.line, text: finding.codeSnippet.vulnerableLine, isTarget: true });
      finding.codeSnippet.afterLines.forEach((text, i) => {
        res.push({ num: finding.line + 1 + i, text, isTarget: false });
      });
      return res;
    }
    return [{ num: finding.line, text: `// ${finding.filePath}:${finding.line}`, isTarget: true }];
  }, [fileContent, finding]);

  // Windowing for compact context vs full file
  const displayLines = useMemo(() => {
    if (Array.isArray(lines) && typeof lines[0] === 'object') {
      return lines as { num: number; text: string; isTarget: boolean }[];
    }
    const all = (lines as string[]).map((text, idx) => ({
      num: idx + 1,
      text,
      isTarget: idx + 1 === finding.line,
    }));

    if (isFullFileView) {
      return all;
    }

    // Default window: ± 8 lines around finding.line
    const contextRadius = 8;
    const startIdx = Math.max(0, finding.line - 1 - contextRadius);
    const endIdx = Math.min(all.length, finding.line + contextRadius);
    return all.slice(startIdx, endIdx);
  }, [lines, finding.line, isFullFileView]);

  // Findings navigation in file
  const currentFindingIndex = allFindingsInFile.findIndex((f) => f.id === finding.id);
  const totalFindingsInFile = allFindingsInFile.length;

  const handlePrevFinding = () => {
    if (currentFindingIndex > 0 && onSelectFinding) {
      onSelectFinding(allFindingsInFile[currentFindingIndex - 1].id);
    }
  };

  const handleNextFinding = () => {
    if (currentFindingIndex < totalFindingsInFile - 1 && onSelectFinding) {
      onSelectFinding(allFindingsInFile[currentFindingIndex + 1].id);
    }
  };

  // Actions
  const handleExplain = async () => {
    if (!explainFinding) return;
    setIsLoadingExplanation(true);
    try {
      const exp = await explainFinding(finding.id);
      if (exp) setAiExplanation(exp);
    } finally {
      setIsLoadingExplanation(false);
    }
  };

  const handleLoadFix = async () => {
    if (!suggestFix) return;
    setIsLoadingFix(true);
    try {
      const fix = await suggestFix(finding.id);
      if (fix) setSuggestedFixData(fix);
    } finally {
      setIsLoadingFix(false);
    }
  };

  const handleApplyFix = async () => {
    if (!applyFindingFix) return;
    setIsApplyingFix(true);
    try {
      const res = await applyFindingFix(finding.id);
      if (res.success) {
        setApplySuccessMessage(res.message);
        // Refresh file content
        if (fetchSourceFile && finding.filePath) {
          const updated = await fetchSourceFile(finding.filePath);
          if (updated?.content) setFileContent(updated.content);
        }
      }
    } finally {
      setIsApplyingFix(false);
    }
  };

  const handleCopyFix = () => {
    const textToCopy =
      suggestedFixData?.addedLines.join('\n') ||
      finding.remediationDiff?.addedLines.join('\n') ||
      '';
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy);
      setCopiedFix(true);
      setTimeout(() => setCopiedFix(false), 2000);
    }
  };

  // Plain-English answers (prefer AI explanation if generated, else finding properties, else defaults)
  const whatHappened =
    aiExplanation?.what_happened ||
    finding.whatHappened ||
    finding.description ||
    'An unsafe pattern was detected at this location.';

  const whereHappened =
    aiExplanation?.where_happened ||
    finding.whereHappened ||
    `${finding.filePath} at line ${finding.line}`;

  const whyItMatters =
    aiExplanation?.why_it_matters ||
    finding.whyItMatters ||
    'May introduce security risk or unexpected runtime instability if left unmitigated.';

  const potentialImpact =
    aiExplanation?.potential_impact ||
    finding.potentialImpact ||
    'Unauthorized data exposure, integrity violation, or runtime exceptions.';

  const howToFix =
    aiExplanation?.how_to_fix ||
    finding.howToFix ||
    'Replace with parameterized queries, secure validation, or approved architecture patterns.';

  const confidenceEvidence =
    aiExplanation?.confidence_evidence ||
    finding.confidenceEvidence ||
    finding.aiEvidence ||
    'Identified via AST syntax parsing and pattern verification.';

  const activeDiff = suggestedFixData || finding.remediationDiff;

  return (
    <div className="bento-card overflow-hidden border border-white/[0.1] shadow-2xl">
      {/* File Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] bg-black/60 px-5 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/[0.06] text-zinc-300">
            <FileText className="h-4 w-4" />
          </div>
          <span className="font-mono text-xs font-semibold text-white tracking-tight">
            {finding.filePath}
          </span>
          <span className="rounded bg-white/[0.06] px-2 py-0.5 font-mono text-[11px] text-[#FF5722]">
            Line {finding.line}
          </span>
          {isLoadingFile && (
            <span className="flex items-center gap-1 font-mono text-[10px] text-zinc-400">
              <Loader2 className="h-3 w-3 animate-spin text-[#FF5722]" />
              Fetching source file...
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Finding navigation in file */}
          {totalFindingsInFile > 1 && (
            <div className="flex items-center gap-1 rounded-xl border border-white/[0.08] bg-black/40 px-2 py-1 text-xs">
              <span className="font-mono text-[10px] text-zinc-400 px-1">
                Finding {currentFindingIndex + 1} of {totalFindingsInFile}
              </span>
              <button
                onClick={handlePrevFinding}
                disabled={currentFindingIndex <= 0}
                className="rounded p-1 text-zinc-400 hover:text-white disabled:opacity-30"
                title="Previous finding in this file"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={handleNextFinding}
                disabled={currentFindingIndex >= totalFindingsInFile - 1}
                className="rounded p-1 text-zinc-400 hover:text-white disabled:opacity-30"
                title="Next finding in this file"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Toggle Full File View */}
          <button
            onClick={() => setIsFullFileView((prev) => !prev)}
            className="inline-flex items-center gap-1 rounded-xl border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-xs text-zinc-300 hover:text-white hover:bg-white/[0.08] transition-colors"
            title={isFullFileView ? 'Show Compact Context Window' : 'Expand Entire File'}
          >
            {isFullFileView ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
            <span className="text-[11px]">{isFullFileView ? 'Compact' : 'Full File'}</span>
          </button>
        </div>
      </div>

      {/* Code Area with Embedded Inline Review Card */}
      <div className="overflow-x-auto bg-[#0d0e12] font-mono text-xs">
        <table className="w-full border-collapse">
          <tbody>
            {displayLines.map((lineItem) => {
              const isTargetLine = lineItem.isTarget;

              return (
                <React.Fragment key={lineItem.num}>
                  {/* Source Code Line */}
                  <tr
                    className={`transition-colors ${
                      isTargetLine
                        ? 'bg-rose-500/[0.12] border-l-4 border-rose-500'
                        : 'hover:bg-white/[0.02]'
                    }`}
                  >
                    {/* Line number */}
                    <td
                      className={`w-12 select-none py-1 pl-4 pr-3 text-right font-mono text-[11px] ${
                        isTargetLine ? 'font-bold text-rose-400' : 'text-zinc-600'
                      }`}
                    >
                      {lineItem.num}
                    </td>

                    {/* Code text */}
                    <td className="py-1 pr-4 whitespace-pre">
                      <span
                        className={
                          isTargetLine
                            ? 'font-semibold text-rose-200'
                            : 'text-zinc-300'
                        }
                      >
                        {lineItem.text}
                      </span>
                    </td>
                  </tr>

                  {/* EMBEDDED INLINE BOT REVIEW CARD DIRECTLY BENEATH TARGET LINE */}
                  {isTargetLine && (
                    <tr className="bg-black/40">
                      <td colSpan={2} className="p-3 sm:p-5">
                        <div className="rounded-2xl border border-white/[0.12] bg-[#121318] p-5 shadow-2xl space-y-4 animate-bento-in">
                          {/* Bot Header */}
                          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-3.5">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF5722] to-amber-600 text-white shadow-md">
                                <Bot className="h-5 w-5" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-sans text-sm font-bold text-white">
                                    SilentGuard AI Reviewer
                                  </span>
                                  <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 font-mono text-[10px] font-semibold text-emerald-300">
                                    AST Grounded
                                  </span>
                                  {finding.reviewStatus && (
                                    <span className="rounded-full bg-white/[0.08] px-2 py-0.5 font-mono text-[10px] text-zinc-300">
                                      Status: {finding.reviewStatus}
                                    </span>
                                  )}
                                </div>
                                <div className="font-sans text-xs text-zinc-400">
                                  Rule <strong className="text-[#FF5722]">{finding.ruleId}</strong> &bull; Confidence {finding.aiGeneratedConfidence}%
                                </div>
                              </div>
                            </div>

                            {/* Assistant / Action triggers */}
                            <div className="flex items-center gap-2">
                              {onOpenAssistant && (
                                <button
                                  onClick={() => onOpenAssistant(finding)}
                                  className="inline-flex items-center gap-1.5 rounded-xl border border-white/[0.1] bg-white/[0.06] hover:bg-white/[0.12] px-3 py-1.5 text-xs font-semibold text-white transition-all shadow-sm"
                                >
                                  <MessageSquare className="h-3.5 w-3.5 text-[#FF5722]" />
                                  <span>Ask AI</span>
                                </button>
                              )}
                              <button
                                onClick={handleExplain}
                                disabled={isLoadingExplanation}
                                className="inline-flex items-center gap-1.5 rounded-xl bg-[#FF5722]/15 border border-[#FF5722]/30 hover:bg-[#FF5722]/30 px-3 py-1.5 text-xs font-semibold text-[#FF5722] transition-all disabled:opacity-50"
                              >
                                {isLoadingExplanation ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Sparkles className="h-3.5 w-3.5" />
                                )}
                                <span>{aiExplanation ? 'Re-Explain' : 'Explain Issue'}</span>
                              </button>
                            </div>
                          </div>

                          {/* BEGINNER-FRIENDLY 6-QUESTION BREAKDOWN */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 font-sans">
                            {/* Q1: What happened? */}
                            <div className="rounded-xl border border-white/[0.06] bg-black/30 p-3.5 space-y-1">
                              <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-wider text-[#FF5722]">
                                <HelpCircle className="h-3.5 w-3.5" />
                                <span>1. What happened?</span>
                              </div>
                              <p className="text-xs text-zinc-200 leading-relaxed">
                                {whatHappened}
                              </p>
                            </div>

                            {/* Q2: Where did it happen? */}
                            <div className="rounded-xl border border-white/[0.06] bg-black/30 p-3.5 space-y-1">
                              <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-wider text-cyan-400">
                                <Code2 className="h-3.5 w-3.5" />
                                <span>2. Where did it happen?</span>
                              </div>
                              <p className="font-mono text-xs text-zinc-200 leading-relaxed">
                                {whereHappened}
                              </p>
                            </div>

                            {/* Q3: Why does it matter? */}
                            <div className="rounded-xl border border-white/[0.06] bg-black/30 p-3.5 space-y-1">
                              <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-wider text-amber-400">
                                <AlertTriangle className="h-3.5 w-3.5" />
                                <span>3. Why does it matter?</span>
                              </div>
                              <p className="text-xs text-zinc-200 leading-relaxed">
                                {whyItMatters}
                              </p>
                            </div>

                            {/* Q4: What could happen if ignored? */}
                            <div className="rounded-xl border border-white/[0.06] bg-black/30 p-3.5 space-y-1">
                              <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-wider text-rose-400">
                                <ShieldAlert className="h-3.5 w-3.5" />
                                <span>4. What happens if ignored?</span>
                              </div>
                              <p className="text-xs text-zinc-200 leading-relaxed">
                                {potentialImpact}
                              </p>
                            </div>

                            {/* Q5: How can it be fixed? */}
                            <div className="rounded-xl border border-white/[0.06] bg-black/30 p-3.5 space-y-1">
                              <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                                <Wand2 className="h-3.5 w-3.5" />
                                <span>5. How can it be fixed?</span>
                              </div>
                              <p className="text-xs text-zinc-200 leading-relaxed">
                                {howToFix}
                              </p>
                            </div>

                            {/* Q6: Confidence & Evidence */}
                            <div className="rounded-xl border border-white/[0.06] bg-black/30 p-3.5 space-y-1">
                              <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-wider text-teal-400">
                                <ShieldCheck className="h-3.5 w-3.5" />
                                <span>6. Evidence &amp; Confidence</span>
                              </div>
                              <p className="text-xs text-zinc-200 leading-relaxed">
                                {confidenceEvidence}
                              </p>
                            </div>
                          </div>

                          {/* Technical Details Accordion */}
                          <div className="border-t border-white/[0.06] pt-3">
                            <button
                              onClick={() => setShowTechnicalDetails((prev) => !prev)}
                              className="flex items-center gap-2 text-xs font-mono text-zinc-400 hover:text-zinc-200 transition-colors"
                            >
                              <span>Technical Details (CWE, AST Node, Rule Specification)</span>
                              {showTechnicalDetails ? (
                                <ChevronUp className="h-3.5 w-3.5" />
                              ) : (
                                <ChevronDown className="h-3.5 w-3.5" />
                              )}
                            </button>

                            {showTechnicalDetails && (
                              <div className="mt-2.5 rounded-xl border border-white/[0.06] bg-black/40 p-3.5 space-y-2 text-xs font-mono text-zinc-300 animate-bento-in">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  <div>
                                    <span className="text-zinc-500">Rule ID:</span>{' '}
                                    <span className="text-[#FF5722]">{finding.ruleId}</span>
                                  </div>
                                  <div>
                                    <span className="text-zinc-500">CWE Classification:</span>{' '}
                                    <span className="text-white">{finding.cwe || 'N/A'}</span>
                                  </div>
                                  <div>
                                    <span className="text-zinc-500">Severity:</span>{' '}
                                    <span className="text-rose-400 uppercase font-bold">{finding.severity}</span>
                                  </div>
                                  <div>
                                    <span className="text-zinc-500">AST Node Type:</span>{' '}
                                    <span className="text-cyan-300">{finding.astNodeType || 'SyntaxNode'}</span>
                                  </div>
                                </div>
                                {finding.aiEvidence && (
                                  <div className="border-t border-white/[0.06] pt-2 text-[11px] text-zinc-400">
                                    <span className="text-zinc-500">Static Analysis Evidence:</span>{' '}
                                    {finding.aiEvidence}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {/* SUGGESTED FIX DIFF & COMMITTAL PATCH */}
                          {(activeDiff || suggestedFixData) && (
                            <div className="border-t border-white/[0.06] pt-3 space-y-3 font-sans">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <Wand2 className="h-4 w-4 text-emerald-400" />
                                  <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                                    Suggested Change (Diff &amp; Patch)
                                  </span>
                                  {activeDiff?.scoreImpactPts ? (
                                    <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.2 font-mono text-[10px] font-semibold text-emerald-300">
                                      +{activeDiff.scoreImpactPts} Score Pts
                                    </span>
                                  ) : null}
                                </div>

                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => setShowDiff((prev) => !prev)}
                                    className="text-xs text-zinc-400 hover:text-white font-mono"
                                  >
                                    {showDiff ? 'Hide Diff' : 'Show Diff'}
                                  </button>
                                  <button
                                    onClick={handleCopyFix}
                                    className="inline-flex items-center gap-1 rounded-lg border border-white/[0.1] bg-white/[0.04] px-2.5 py-1 text-xs text-zinc-300 hover:text-white transition-all font-mono"
                                    title="Copy replacement lines"
                                  >
                                    {copiedFix ? (
                                      <>
                                        <Check className="h-3 w-3 text-emerald-400" />
                                        <span className="text-emerald-400 text-[11px]">Copied</span>
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="h-3 w-3" />
                                        <span className="text-[11px]">Copy Fix</span>
                                      </>
                                    )}
                                  </button>
                                </div>
                              </div>

                              {showDiff && (
                                <div className="rounded-xl border border-white/[0.08] bg-black/60 p-3 font-mono text-xs space-y-1 overflow-x-auto">
                                  {/* Removed lines (-) */}
                                  {(suggestedFixData?.removedLines || finding.remediationDiff?.removedLines || []).map(
                                    (line, idx) => (
                                      <div key={idx} className="flex items-start text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded">
                                        <span className="select-none w-6 text-rose-500/60 font-bold">-</span>
                                        <span className="whitespace-pre">{line}</span>
                                      </div>
                                    )
                                  )}
                                  {/* Added lines (+) */}
                                  {(suggestedFixData?.addedLines || finding.remediationDiff?.addedLines || []).map(
                                    (line, idx) => (
                                      <div key={idx} className="flex items-start text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded">
                                        <span className="select-none w-6 text-emerald-500/60 font-bold">+</span>
                                        <span className="whitespace-pre">{line}</span>
                                      </div>
                                    )
                                  )}
                                </div>
                              )}

                              {/* Explanation & Validation steps */}
                              {activeDiff?.explanation && (
                                <p className="text-xs text-zinc-300 leading-relaxed font-sans">
                                  {activeDiff.explanation}
                                </p>
                              )}

                              {suggestedFixData?.validationSteps && suggestedFixData.validationSteps.length > 0 && (
                                <div className="rounded-lg bg-black/30 p-2.5 border border-white/[0.04] text-[11px] text-zinc-400 font-sans space-y-1">
                                  <span className="font-mono font-semibold uppercase text-zinc-300 text-[10px]">
                                    Validation Steps:
                                  </span>
                                  <ul className="list-disc list-inside space-y-0.5 text-zinc-300">
                                    {suggestedFixData.validationSteps.map((st, i) => (
                                      <li key={i}>{st}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {/* Apply Success Notification */}
                              {applySuccessMessage && (
                                <div className="flex items-center gap-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 p-3 text-xs text-emerald-300 font-sans">
                                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                                  <span>{applySuccessMessage}</span>
                                </div>
                              )}

                              {/* Action Buttons Toolbar */}
                              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                                <div className="flex items-center gap-2">
                                  {updateFindingReview && (
                                    <>
                                      <button
                                        onClick={() => updateFindingReview(finding.id, 'approved', 'Approved by developer')}
                                        className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 hover:bg-emerald-500/25 px-3 py-1.5 text-xs font-semibold text-emerald-300 transition-all font-sans"
                                      >
                                        <ThumbsUp className="h-3.5 w-3.5" />
                                        <span>Approve</span>
                                      </button>
                                      <button
                                        onClick={() => updateFindingReview(finding.id, 'rejected', 'Rejected by developer')}
                                        className="inline-flex items-center gap-1.5 rounded-xl bg-rose-500/15 border border-rose-500/30 hover:bg-rose-500/25 px-3 py-1.5 text-xs font-semibold text-rose-300 transition-all font-sans"
                                      >
                                        <ThumbsDown className="h-3.5 w-3.5" />
                                        <span>Reject</span>
                                      </button>
                                    </>
                                  )}
                                </div>

                                <div className="flex items-center gap-2">
                                  {!suggestedFixData && (
                                    <button
                                      onClick={handleLoadFix}
                                      disabled={isLoadingFix}
                                      className="inline-flex items-center gap-1.5 rounded-xl border border-white/[0.1] bg-white/[0.04] hover:bg-white/[0.08] px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:text-white transition-all font-sans disabled:opacity-50"
                                    >
                                      {isLoadingFix ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}
                                      <span>Generate Committable Fix</span>
                                    </button>
                                  )}

                                  {applyFindingFix && (
                                    <button
                                      onClick={handleApplyFix}
                                      disabled={isApplyingFix}
                                      className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#FF5722] to-[#ff7043] px-4 py-1.5 text-xs font-semibold text-white shadow-lg hover:brightness-110 transition-all font-sans disabled:opacity-50"
                                    >
                                      {isApplyingFix ? (
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                      ) : (
                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                      )}
                                      <span>Apply Fix to Working Copy</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
