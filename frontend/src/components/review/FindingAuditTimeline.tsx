import React, { useState } from 'react';
import {
  Clock,
  CheckCircle,
  XCircle,
  FileCode,
  ShieldAlert,
  User,
  Send,
} from 'lucide-react';
import type { FindingReviewHistoryItem, ReviewStatus } from '../../types';

interface FindingAuditTimelineProps {
  history: FindingReviewHistoryItem[];
  currentStatus: ReviewStatus;
  onStatusChange: (newStatus: ReviewStatus, note?: string) => Promise<void>;
  isLoading?: boolean;
}

const STATUS_CONFIG: Record<
  ReviewStatus,
  { label: string; bg: string; border: string; text: string; icon: React.ComponentType<{ className?: string }> }
> = {
  open: { label: 'Open', bg: 'bg-zinc-500/10', border: 'border-zinc-500/30', text: 'text-zinc-300', icon: Clock },
  under_review: { label: 'Under Review', bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-300', icon: Clock },
  fix_proposed: { label: 'Fix Proposed', bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-300', icon: FileCode },
  approved: { label: 'Approved', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-300', icon: CheckCircle },
  rejected: { label: 'Rejected', bg: 'bg-rose-500/10', border: 'border-rose-500/30', text: 'text-rose-300', icon: XCircle },
  applied: { label: 'Fix Applied', bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-300', icon: CheckCircle },
  verified_resolved: { label: 'Verified Resolved', bg: 'bg-teal-500/10', border: 'border-teal-500/30', text: 'text-teal-300', icon: CheckCircle },
  reopened: { label: 'Reopened', bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-300', icon: ShieldAlert },
};

export const FindingAuditTimeline: React.FC<FindingAuditTimelineProps> = ({
  history,
  currentStatus,
  onStatusChange,
  isLoading = false,
}) => {
  const [showNoteInput, setShowNoteInput] = useState<boolean>(false);
  const [selectedTargetStatus, setSelectedTargetStatus] = useState<ReviewStatus>('under_review');
  const [noteText, setNoteText] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const statusInfo = STATUS_CONFIG[currentStatus] || STATUS_CONFIG.open;
  const StatusIcon = statusInfo.icon;

  const handleQuickChange = async (target: ReviewStatus) => {
    setSelectedTargetStatus(target);
    setShowNoteInput(true);
  };

  const handleConfirmSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onStatusChange(selectedTargetStatus, noteText.trim() || undefined);
      setNoteText('');
      setShowNoteInput(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Current Status and Transition Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-black/40 p-3.5">
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs uppercase text-zinc-400">Review Status:</span>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-mono text-xs font-semibold border ${statusInfo.bg} ${statusInfo.border} ${statusInfo.text}`}
          >
            <StatusIcon className="h-3.5 w-3.5" />
            {statusInfo.label}
          </span>
        </div>

        {/* Status transition shortcuts */}
        <div className="flex flex-wrap items-center gap-1.5">
          {currentStatus !== 'approved' && (
            <button
              onClick={() => handleQuickChange('approved')}
              disabled={isLoading}
              className="rounded-lg bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 text-xs font-medium text-emerald-300 hover:bg-emerald-500/25 transition-all"
            >
              Approve
            </button>
          )}
          {currentStatus !== 'rejected' && (
            <button
              onClick={() => handleQuickChange('rejected')}
              disabled={isLoading}
              className="rounded-lg bg-rose-500/15 border border-rose-500/30 px-2.5 py-1 text-xs font-medium text-rose-300 hover:bg-rose-500/25 transition-all"
            >
              Reject
            </button>
          )}
          {currentStatus !== 'under_review' && (
            <button
              onClick={() => handleQuickChange('under_review')}
              disabled={isLoading}
              className="rounded-lg bg-blue-500/15 border border-blue-500/30 px-2.5 py-1 text-xs font-medium text-blue-300 hover:bg-blue-500/25 transition-all"
            >
              Under Review
            </button>
          )}
          {currentStatus === 'applied' && (
            <button
              onClick={() => handleQuickChange('verified_resolved')}
              disabled={isLoading}
              className="rounded-lg bg-teal-500/15 border border-teal-500/30 px-2.5 py-1 text-xs font-medium text-teal-300 hover:bg-teal-500/25 transition-all"
            >
              Verify Resolved
            </button>
          )}
          {(currentStatus === 'approved' || currentStatus === 'rejected') && (
            <button
              onClick={() => handleQuickChange('reopened')}
              disabled={isLoading}
              className="rounded-lg bg-zinc-800 border border-white/[0.08] px-2.5 py-1 text-xs font-medium text-zinc-300 hover:text-white transition-all"
            >
              Reopen
            </button>
          )}
        </div>
      </div>

      {/* Note modal/drawer when changing status */}
      {showNoteInput && (
        <div className="rounded-xl border border-[#FF5722]/30 bg-black/60 p-4 space-y-3 animate-bento-in">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-semibold text-zinc-200">
              Confirm Status Change to{' '}
              <strong className="text-[#FF5722]">
                {STATUS_CONFIG[selectedTargetStatus]?.label || selectedTargetStatus}
              </strong>
            </span>
            <button
              onClick={() => setShowNoteInput(false)}
              className="text-xs text-zinc-400 hover:text-white"
            >
              Cancel
            </button>
          </div>
          <input
            type="text"
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Add an optional review note (e.g., 'Validated with team lead', 'False positive')..."
            className="w-full rounded-xl border border-white/[0.1] bg-black/40 px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:border-[#FF5722] focus:outline-none"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowNoteInput(false)}
              className="rounded-xl px-3 py-1.5 text-xs text-zinc-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmSubmit}
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#FF5722] px-3.5 py-1.5 text-xs font-semibold text-white hover:brightness-110 disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" />
              <span>{isSubmitting ? 'Updating...' : 'Confirm Update'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Audit History Timeline */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-400 font-mono">
          <Clock className="h-3.5 w-3.5" />
          <span>Audit &amp; Review History ({history.length})</span>
        </div>

        {history.length === 0 ? (
          <div className="rounded-xl border border-white/[0.06] bg-black/20 p-4 text-center text-xs text-zinc-500">
            No previous review actions recorded for this finding yet.
          </div>
        ) : (
          <div className="relative border-l-2 border-white/[0.08] ml-3 pl-4 space-y-4 pt-1">
            {history.map((item) => (
              <div key={item.id} className="relative group">
                {/* Timeline node */}
                <div className="absolute -left-[23px] top-1.5 h-3 w-3 rounded-full bg-[#FF5722] border-2 border-black" />

                <div className="rounded-xl border border-white/[0.06] bg-black/40 p-3 space-y-1.5 hover:border-white/[0.12] transition-colors">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <User className="h-3.5 w-3.5 text-zinc-400" />
                      <span className="text-xs font-semibold text-white">{item.user_name}</span>
                      <span className="text-[10px] text-zinc-500 font-mono">{item.user_email}</span>
                    </div>
                    <span className="font-mono text-[10px] text-zinc-500">
                      {new Date(item.created_at).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 font-mono text-[11px]">
                    <span className="text-zinc-400">Action:</span>
                    <span className="text-[#FF5722] font-semibold">{item.action}</span>
                    {item.from_status && item.to_status && (
                      <span className="text-zinc-300">
                        ({item.from_status} &rarr; <strong>{item.to_status}</strong>)
                      </span>
                    )}
                  </div>

                  {item.note && (
                    <p className="text-xs text-zinc-300 bg-black/50 rounded-lg p-2 border border-white/[0.04]">
                      &ldquo;{item.note}&rdquo;
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
