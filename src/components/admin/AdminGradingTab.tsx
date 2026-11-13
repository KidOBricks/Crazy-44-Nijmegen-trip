import {
  AlertTriangle,
  Award,
  CheckCircle2,
  Clock,
  Sparkles,
  XCircle,
} from 'lucide-react';
import { useState } from 'react';
import type { GameRepository } from '../../services/gameRepository';
import { generateToken } from '../../services/gameRepository';
import type { Submission, Task, Team } from '../../types/game';
import { sortSubmissionsForAdmin } from '../../utils/scoring';
import { MediaPreview } from '../MediaPreview';

interface AdminGradingTabProps {
  repo: GameRepository;
  submissions: Submission[];
  tasks: Task[];
  teams: Team[];
}

export function AdminGradingTab({
  repo,
  submissions,
  tasks,
  teams,
}: AdminGradingTabProps) {
  const [teamFilter, setTeamFilter] = useState<string>('all');
  const [noteBySubId, setNoteBySubId] = useState<Record<string, string>>({});
  const [customPtsBySubId, setCustomPtsBySubId] = useState<
    Record<string, string>
  >({});
  const [editingGradeId, setEditingGradeId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  // Team penalty / adjustment controls
  const [showAdjustments, setShowAdjustments] = useState(false);
  const [adjTeamId, setAdjTeamId] = useState<string>(teams[0]?.id || '');
  const [adjDelta, setAdjDelta] = useState<string>('-5');
  const [adjReason, setAdjReason] = useState<string>('');
  const [adjBusy, setAdjBusy] = useState(false);

  const taskMap = new Map(tasks.map((t) => [t.id, t]));
  const sortedTeams = [...teams].sort((a, b) => a.number - b.number);

  const filtered =
    teamFilter === 'all'
      ? submissions
      : submissions.filter((s) => s.teamId === teamFilter);

  const { graded, unmarked } = sortSubmissionsForAdmin(filtered);

  const getBasePoints = (sub: Submission) =>
    taskMap.get(sub.taskId)?.points ?? sub.basePoints ?? 1;

  const handleGrade = async (
    sub: Submission,
    status: 'approved' | 'rejected',
    bonus = 0,
    manualOverride?: number,
  ) => {
    setBusyId(sub.id);
    try {
      const base = getBasePoints(sub);
      const awarded =
        status === 'rejected'
          ? 0
          : manualOverride !== undefined
            ? Math.max(0, manualOverride)
            : base + bonus;

      await repo.gradeSubmission(sub.id, {
        status,
        basePoints: base,
        bonusPoints: status === 'approved' ? bonus : 0,
        awardedPoints: awarded,
        adminNote: (noteBySubId[sub.id] ?? sub.adminNote ?? '').trim(),
        gradedAt: Date.now(),
      });
      setEditingGradeId(null);
    } finally {
      setBusyId(null);
    }
  };

  const handleApplyAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetId = adjTeamId || sortedTeams[0]?.id;
    if (!targetId) return;
    const delta = Number(adjDelta);
    if (Number.isNaN(delta) || delta === 0) return;

    setAdjBusy(true);
    try {
      await repo.addTeamAdjustment(targetId, {
        id: `adj-${generateToken(6)}`,
        delta,
        reason: adjReason.trim() || (delta < 0 ? 'Rule penalty' : 'Bonus adjustment'),
        createdAt: Date.now(),
      });
      setAdjReason('');
    } finally {
      setAdjBusy(false);
    }
  };

  const renderSubmissionCard = (sub: Submission, isGradedSection: boolean) => {
    const basePts = getBasePoints(sub);
    const isEditing = !isGradedSection || editingGradeId === sub.id;
    const customVal = customPtsBySubId[sub.id] ?? String(basePts);

    return (
      <div
        key={sub.id}
        id={`sub-${sub.id}`}
        className="card stack-md"
        style={{
          borderLeft: `5px solid ${sub.teamColor || '#4B1D8C'}`,
        }}
      >
        <div className="row-between">
          <div className="row-wrap">
            <span
              className="badge"
              style={{
                background: sub.teamColor || '#4B1D8C',
                color: '#ffffff',
              }}
            >
              Team {sub.teamNumber}: {sub.teamName}
            </span>
            <span className="badge badge-purple">
              #{sub.taskNumber} {sub.taskTitle}
            </span>
          </div>

          {sub.status === 'unmarked' && (
            <span className="badge badge-pending">
              <Clock size={12} />
              Unmarked
            </span>
          )}
          {sub.status === 'approved' && (
            <span className="badge badge-approved">
              <CheckCircle2 size={12} />
              Approved (+{sub.awardedPoints} pts
              {sub.bonusPoints > 0 ? ` incl. +${sub.bonusPoints} bonus` : ''})
            </span>
          )}
          {sub.status === 'rejected' && (
            <span className="badge badge-rejected">
              <XCircle size={12} />
              Rejected (0 pts)
            </span>
          )}
        </div>

        <MediaPreview
          url={sub.mediaUrl}
          type={sub.mediaType}
          alt={`Team ${sub.teamNumber} submission for #${sub.taskNumber}`}
          compact={isGradedSection && !isEditing}
        />

        <div
          className="row-between"
          style={{ fontSize: '12px', color: 'var(--text-muted)' }}
        >
          <span>
            Uploaded {new Date(sub.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          <span>Task base value: {basePts} pt</span>
        </div>

        {sub.adminNote && !isEditing && (
          <div
            style={{
              fontSize: '13px',
              padding: '8px 12px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <strong>Note:</strong> {sub.adminNote}
          </div>
        )}

        {isGradedSection && !isEditing ? (
          <div className="row-between">
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {sub.gradedAt
                ? `Graded at ${new Date(sub.gradedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                : ''}
            </span>
            <button
              type="button"
              className="btn btn-sm btn-outline"
              onClick={() => setEditingGradeId(sub.id)}
            >
              Change Grade
            </button>
          </div>
        ) : (
          <div className="stack-sm">
            <input
              type="text"
              className="input"
              placeholder="Optional feedback note (e.g., Missing a teammate!)"
              value={noteBySubId[sub.id] ?? sub.adminNote ?? ''}
              onChange={(e) =>
                setNoteBySubId({ ...noteBySubId, [sub.id]: e.target.value })
              }
            />

            <div className="row-wrap">
              <button
                type="button"
                className="btn btn-success"
                disabled={busyId === sub.id}
                onClick={() => handleGrade(sub, 'approved', 0)}
              >
                <CheckCircle2 size={16} />
                Approve ({basePts} pt{basePts === 1 ? '' : 's'})
              </button>

              <button
                type="button"
                className="btn btn-primary"
                disabled={busyId === sub.id}
                onClick={() => handleGrade(sub, 'approved', 1)}
              >
                <Sparkles size={16} />
                +1 Bonus ({basePts + 1} pts)
              </button>

              <button
                type="button"
                className="btn btn-danger-outline"
                disabled={busyId === sub.id}
                onClick={() => handleGrade(sub, 'rejected', 0)}
              >
                <XCircle size={16} />
                Reject (Redo)
              </button>
            </div>

            <div className="row-wrap" style={{ marginTop: '4px' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                Manual points:
              </span>
              <input
                type="number"
                min={0}
                max={100}
                className="input"
                style={{ width: '90px', minHeight: '36px' }}
                value={customVal}
                onChange={(e) =>
                  setCustomPtsBySubId({
                    ...customPtsBySubId,
                    [sub.id]: e.target.value,
                  })
                }
              />
              <button
                type="button"
                className="btn btn-sm btn-secondary"
                disabled={busyId === sub.id}
                onClick={() =>
                  handleGrade(sub, 'approved', 0, Number(customVal) || 0)
                }
              >
                <Award size={14} />
                Assign Points
              </button>
              {isGradedSection && (
                <button
                  type="button"
                  className="btn btn-sm btn-outline"
                  onClick={() => setEditingGradeId(null)}
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="stack-lg">
      {/* Filter & Penalty Header */}
      <div className="card-tinted stack-sm">
        <div className="row-between">
          <div>
            <h3>Grading Queue</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Graded uploads appear at the top; unmarked uploads appear at the
              bottom.
            </p>
          </div>
          <div className="row-wrap">
            <span className="badge badge-approved">{graded.length} Graded</span>
            <span className="badge badge-pending">
              {unmarked.length} Unmarked
            </span>
            <button
              type="button"
              className="btn btn-sm btn-outline"
              onClick={() => setShowAdjustments((v) => !v)}
            >
              <AlertTriangle size={14} />
              Team Penalties / Adjustments
            </button>
          </div>
        </div>

        <div className="chip-row" style={{ marginBottom: 0 }}>
          <button
            type="button"
            className={`chip ${teamFilter === 'all' ? 'active' : ''}`}
            onClick={() => setTeamFilter('all')}
          >
            All Teams ({submissions.length})
          </button>
          {sortedTeams.map((t) => {
            const count = submissions.filter((s) => s.teamId === t.id).length;
            return (
              <button
                key={t.id}
                type="button"
                className={`chip ${teamFilter === t.id ? 'active' : ''}`}
                onClick={() => setTeamFilter(t.id)}
              >
                Team {t.number}: {t.name} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Team Penalties & Adjustments Panel */}
      {showAdjustments && (
        <form className="card stack-md" onSubmit={handleApplyAdjustment}>
          <div className="row-between">
            <h4>Apply Team Penalty or Bonus Adjustment</h4>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              e.g. -5 for rule violations or late arrival
            </span>
          </div>

          {sortedTeams.length === 0 ? (
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Create teams in the Teams & Game tab first.
            </p>
          ) : (
            <div className="grid-2">
              <label className="field">
                <span className="field-label">Team</span>
                <select
                  className="select"
                  value={adjTeamId || sortedTeams[0]?.id || ''}
                  onChange={(e) => setAdjTeamId(e.target.value)}
                >
                  {sortedTeams.map((t) => (
                    <option key={t.id} value={t.id}>
                      Team {t.number}: {t.name} (Current adj:{' '}
                      {t.penaltyPoints >= 0
                        ? `+${t.penaltyPoints}`
                        : t.penaltyPoints}
                      )
                    </option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span className="field-label">Point Adjustment</span>
                <input
                  type="number"
                  className="input"
                  value={adjDelta}
                  onChange={(e) => setAdjDelta(e.target.value)}
                />
              </label>
            </div>
          )}

          <div className="row-wrap">
            <input
              type="text"
              className="input"
              style={{ flex: 1, minWidth: '200px' }}
              placeholder="Reason (e.g., Arrived late to meetup)"
              value={adjReason}
              onChange={(e) => setAdjReason(e.target.value)}
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={adjBusy || sortedTeams.length === 0}
            >
              {adjBusy ? 'Applying...' : 'Apply Adjustment'}
            </button>
          </div>
        </form>
      )}

      {/* GRADED SECTION AT THE TOP */}
      <section className="stack-sm">
        <div className="row-between">
          <h3>Graded / Marked ({graded.length})</h3>
        </div>
        {graded.length === 0 ? (
          <div
            className="card-tinted"
            style={{ fontSize: '14px', color: 'var(--text-muted)' }}
          >
            No submissions graded yet. Review unmarked submissions below.
          </div>
        ) : (
          <div className="grid-auto">
            {graded.map((sub) => renderSubmissionCard(sub, true))}
          </div>
        )}
      </section>

      {/* UNMARKED SECTION AT THE BOTTOM */}
      <section className="stack-sm">
        <div className="row-between">
          <h3>Unmarked Uploads ({unmarked.length})</h3>
        </div>
        {unmarked.length === 0 ? (
          <div
            className="card-tinted"
            style={{ fontSize: '14px', color: 'var(--text-muted)' }}
          >
            All caught up! New team uploads will appear here and trigger an
            alert at the top.
          </div>
        ) : (
          <div className="grid-auto">
            {unmarked.map((sub) => renderSubmissionCard(sub, false))}
          </div>
        )}
      </section>
    </div>
  );
}
