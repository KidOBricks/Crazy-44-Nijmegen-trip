import { Award, BarChart3, CheckCircle2, Trophy, Users, X } from 'lucide-react';
import { useState } from 'react';
import type {
  Category,
  Submission,
  Task,
  Team,
  TeamScoreSummary,
} from '../../types/game';
import { buildEndGameAnalytics } from '../../utils/scoring';
import { MediaPreview } from '../MediaPreview';

interface EndGameDashboardProps {
  teams: Team[];
  tasks: Task[];
  categories: Category[];
  submissions: Submission[];
}

export function EndGameDashboard({
  teams,
  tasks,
  categories,
  submissions,
}: EndGameDashboardProps) {
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const analytics = buildEndGameAnalytics(
    teams,
    tasks,
    categories,
    submissions,
  );
  const maxScore = Math.max(
    1,
    ...analytics.rankedTeams.map((t) => Math.max(0, t.totalScore)),
  );

  const selectedTeamSummary: TeamScoreSummary | undefined =
    analytics.rankedTeams.find((r) => r.team.id === selectedTeamId);

  const selectedTask = tasks.find((t) => t.id === selectedTaskId);

  // Timeline SVG bounds
  const allPoints = analytics.timeline.flatMap((s) => s.points);
  const minTime =
    allPoints.length > 0
      ? Math.min(...allPoints.map((p) => p.timestamp))
      : 0;
  const maxTime =
    allPoints.length > 0
      ? Math.max(...allPoints.map((p) => p.timestamp))
      : 1;
  const timeSpan = Math.max(1, maxTime - minTime);

  return (
    <div className="stack-lg">
      {/* Podium */}
      <div className="card stack-md">
        <div className="row-between">
          <div className="row-wrap">
            <Trophy size={22} color="#4B1D8C" />
            <h3>Final Standings & Podium</h3>
          </div>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Click any team to inspect their full score breakdown & media reel
          </span>
        </div>

        {analytics.rankedTeams.length === 0 ? (
          <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
            No teams created yet.
          </p>
        ) : (
          <div className="podium-grid">
            {analytics.rankedTeams.map((summary, idx) => (
              <button
                key={summary.team.id}
                type="button"
                className="card card-interactive stack-sm"
                onClick={() => setSelectedTeamId(summary.team.id)}
                style={{
                  textAlign: 'left',
                  borderTop: `5px solid ${summary.team.color}`,
                  background: idx === 0 ? 'var(--purple-50)' : '#ffffff',
                }}
              >
                <div className="row-between">
                  <span className="badge badge-purple">#{idx + 1} Place</span>
                  <span
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontWeight: 800,
                      fontSize: '24px',
                      color: 'var(--purple-900)',
                    }}
                  >
                    {summary.totalScore} pts
                  </span>
                </div>
                <strong
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '16px',
                  }}
                >
                  Team {summary.team.number}: {summary.team.name}
                </strong>
                <span
                  style={{ fontSize: '12px', color: 'var(--text-secondary)' }}
                >
                  {summary.approvedCount} tasks • +{summary.bonusPoints} bonus •{' '}
                  {summary.adjustments >= 0
                    ? `+${summary.adjustments}`
                    : summary.adjustments}{' '}
                  adj
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Horizontal Score Bar Chart */}
        {analytics.rankedTeams.length > 0 && (
          <div className="stack-sm" style={{ marginTop: '6px' }}>
            <strong style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Total Points Comparison
            </strong>
            {analytics.rankedTeams.map((summary) => {
              const pct = Math.max(
                4,
                Math.round((Math.max(0, summary.totalScore) / maxScore) * 100),
              );
              return (
                <div key={summary.team.id} className="stack-sm" style={{ gap: '4px' }}>
                  <div className="row-between" style={{ fontSize: '13px' }}>
                    <span>
                      Team {summary.team.number}: {summary.team.name}
                    </span>
                    <strong>{summary.totalScore} pts</strong>
                  </div>
                  <div className="progress-track" style={{ height: '14px' }}>
                    <div
                      style={{
                        width: `${pct}%`,
                        height: '100%',
                        background: summary.team.color,
                        borderRadius: 'var(--radius-full)',
                        transition: 'width 0.3s ease',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Category Breakdown & Completion Timeline */}
      <div className="grid-2">
        <div className="card stack-md">
          <div className="row-wrap">
            <BarChart3 size={18} color="#4B1D8C" />
            <h4>Category Breakdown</h4>
          </div>

          {analytics.categoryBreakdowns.map(({ category, teamStats }) => (
            <div key={category.id} className="stack-sm" style={{ gap: '6px' }}>
              <strong style={{ fontSize: '13px' }}>{category.name}</strong>
              {analytics.rankedTeams.map(({ team }) => {
                const stat = teamStats[team.id];
                const total = Math.max(1, stat?.totalInCategory ?? 1);
                const pct = Math.round(((stat?.completed ?? 0) / total) * 100);
                return (
                  <div
                    key={team.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '88px 1fr 64px',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '12px',
                    }}
                  >
                    <span
                      style={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      T{team.number} {team.name}
                    </span>
                    <div className="progress-track">
                      <div
                        style={{
                          width: `${pct}%`,
                          height: '100%',
                          background: team.color,
                        }}
                      />
                    </div>
                    <span style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>
                      {stat?.completed ?? 0}/{stat?.totalInCategory ?? 0} (
                      {stat?.points ?? 0}p)
                    </span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        <div className="card stack-md">
          <div className="row-wrap">
            <Award size={18} color="#4B1D8C" />
            <h4>Score Progression Timeline</h4>
          </div>

          {allPoints.length === 0 ? (
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Approved submissions over time will appear as a line chart here.
            </p>
          ) : (
            <div className="stack-sm">
              <svg
                viewBox="0 0 420 190"
                style={{
                  width: '100%',
                  height: 'auto',
                  background: 'var(--bg-surface)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                {/* Grid lines */}
                {[0.25, 0.5, 0.75].map((ratio) => (
                  <line
                    key={ratio}
                    x1={24}
                    x2={400}
                    y1={170 - ratio * 145}
                    y2={170 - ratio * 145}
                    stroke="#E9E2F5"
                    strokeDasharray="4 4"
                  />
                ))}

                {analytics.timeline.map((series) => {
                  if (series.points.length === 0) return null;
                  const coords = series.points.map((pt) => {
                    const x =
                      24 + ((pt.timestamp - minTime) / timeSpan) * 376;
                    const y =
                      170 -
                      (Math.max(0, pt.cumulativeScore) / maxScore) * 145;
                    return { x, y, pt };
                  });
                  const pathD = coords
                    .map(
                      (c, idx) =>
                        `${idx === 0 ? 'M' : 'L'} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`,
                    )
                    .join(' ');

                  return (
                    <g key={series.team.id}>
                      <path
                        d={pathD}
                        fill="none"
                        stroke={series.team.color}
                        strokeWidth={3}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      {coords.map((c, idx) => (
                        <circle
                          key={idx}
                          cx={c.x}
                          cy={c.y}
                          r={4}
                          fill={series.team.color}
                          stroke="#ffffff"
                          strokeWidth={1.5}
                        />
                      ))}
                    </g>
                  );
                })}
              </svg>

              <div className="row-wrap">
                {analytics.timeline.map(({ team }) => (
                  <span
                    key={team.id}
                    className="badge"
                    style={{
                      background: '#ffffff',
                      border: `1px solid ${team.color}`,
                      color: 'var(--text-primary)',
                    }}
                  >
                    <span
                      style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        background: team.color,
                        display: 'inline-block',
                      }}
                    />
                    Team {team.number}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Clickable Task Comparison List */}
      <div className="card stack-md">
        <div className="row-between">
          <div className="row-wrap">
            <Users size={18} color="#4B1D8C" />
            <h4>Compare Submissions by Task</h4>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Click any task to compare every team&rsquo;s upload side-by-side
          </span>
        </div>

        <div className="grid-auto">
          {[...tasks]
            .sort((a, b) => a.number - b.number)
            .map((task) => {
              const subsForTask = Object.values(
                analytics.submissionsByTaskId[task.id] ?? {},
              );
              return (
                <button
                  key={task.id}
                  type="button"
                  className="card-tinted card-interactive row-between"
                  onClick={() => setSelectedTaskId(task.id)}
                  style={{ textAlign: 'left', padding: '12px 14px' }}
                >
                  <div className="row-wrap" style={{ flex: 1 }}>
                    <span className="task-number-pill">#{task.number}</span>
                    <span style={{ fontWeight: 600, fontSize: '14px' }}>
                      {task.title}
                    </span>
                  </div>
                  <span className="badge badge-purple">
                    {subsForTask.length} uploads
                  </span>
                </button>
              );
            })}
        </div>
      </div>

      {/* Team Drill-Down Modal */}
      {selectedTeamSummary && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          onClick={() => setSelectedTeamId(null)}
        >
          <div
            className="modal-panel modal-panel-wide"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div className="row-wrap">
                <span
                  className="badge"
                  style={{
                    background: selectedTeamSummary.team.color,
                    color: '#ffffff',
                  }}
                >
                  Team {selectedTeamSummary.team.number}
                </span>
                <h3>{selectedTeamSummary.team.name}</h3>
              </div>
              <button
                type="button"
                className="icon-btn"
                aria-label="Close team breakdown"
                onClick={() => setSelectedTeamId(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid-2">
              <div className="card-tinted stack-sm">
                <strong>Score Breakdown</strong>
                <div className="row-between" style={{ fontSize: '14px' }}>
                  <span>Base Task Points</span>
                  <strong>{selectedTeamSummary.basePoints}</strong>
                </div>
                <div className="row-between" style={{ fontSize: '14px' }}>
                  <span>Creativity Bonus Points</span>
                  <strong>+{selectedTeamSummary.bonusPoints}</strong>
                </div>
                <div className="row-between" style={{ fontSize: '14px' }}>
                  <span>Penalties / Adjustments</span>
                  <strong>
                    {selectedTeamSummary.adjustments >= 0
                      ? `+${selectedTeamSummary.adjustments}`
                      : selectedTeamSummary.adjustments}
                  </strong>
                </div>
                <hr style={{ border: 'none', borderTop: '1px solid var(--border-subtle)', width: '100%' }} />
                <div className="row-between" style={{ fontSize: '16px' }}>
                  <strong>Total Score</strong>
                  <strong style={{ color: 'var(--purple-800)' }}>
                    {selectedTeamSummary.totalScore} pts
                  </strong>
                </div>
              </div>

              <div className="card-tinted stack-sm">
                <strong>Adjustments Log</strong>
                {(selectedTeamSummary.team.adjustments ?? []).length === 0 ? (
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                    No penalties or manual adjustments.
                  </p>
                ) : (
                  selectedTeamSummary.team.adjustments.map((adj) => (
                    <div
                      key={adj.id}
                      className="row-between"
                      style={{ fontSize: '13px' }}
                    >
                      <span>{adj.reason}</span>
                      <strong>
                        {adj.delta >= 0 ? `+${adj.delta}` : adj.delta}
                      </strong>
                    </div>
                  ))
                )}
              </div>
            </div>

            <h4>
              Submission Reel (
              {(analytics.submissionsByTeamId[selectedTeamSummary.team.id] ?? []).length})
            </h4>
            <div className="grid-auto">
              {(analytics.submissionsByTeamId[selectedTeamSummary.team.id] ?? []).map(
                (sub) => (
                  <div key={sub.id} className="card stack-sm">
                    <div className="row-between">
                      <strong>
                        #{sub.taskNumber} {sub.taskTitle}
                      </strong>
                      {sub.status === 'approved' ? (
                        <span className="badge badge-approved">
                          <CheckCircle2 size={12} />+{sub.awardedPoints} pt
                        </span>
                      ) : (
                        <span className="badge badge-neutral">{sub.status}</span>
                      )}
                    </div>
                    <MediaPreview
                      url={sub.mediaUrl}
                      type={sub.mediaType}
                      alt={sub.taskTitle}
                      compact
                    />
                  </div>
                ),
              )}
            </div>
          </div>
        </div>
      )}

      {/* Task Side-by-Side Comparison Modal */}
      {selectedTask && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          onClick={() => setSelectedTaskId(null)}
        >
          <div
            className="modal-panel modal-panel-wide"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div className="row-wrap">
                <span className="task-number-pill">#{selectedTask.number}</span>
                <h3>{selectedTask.title}</h3>
              </div>
              <button
                type="button"
                className="icon-btn"
                aria-label="Close task comparison"
                onClick={() => setSelectedTaskId(null)}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
              {selectedTask.description}
            </p>

            <div className="grid-2">
              {analytics.rankedTeams.map(({ team }) => {
                const sub =
                  analytics.submissionsByTaskId[selectedTask.id]?.[team.id];
                return (
                  <div
                    key={team.id}
                    className="card stack-sm"
                    style={{ borderTop: `4px solid ${team.color}` }}
                  >
                    <div className="row-between">
                      <strong>
                        Team {team.number}: {team.name}
                      </strong>
                      {sub ? (
                        <span
                          className={`badge ${
                            sub.status === 'approved'
                              ? 'badge-approved'
                              : sub.status === 'rejected'
                                ? 'badge-rejected'
                                : 'badge-pending'
                          }`}
                        >
                          {sub.status === 'approved'
                            ? `+${sub.awardedPoints} pts`
                            : sub.status}
                        </span>
                      ) : (
                        <span className="badge badge-neutral">No Upload</span>
                      )}
                    </div>

                    {sub ? (
                      <MediaPreview
                        url={sub.mediaUrl}
                        type={sub.mediaType}
                        alt={`Team ${team.number}`}
                        compact
                      />
                    ) : (
                      <div
                        style={{
                          padding: '28px 12px',
                          textAlign: 'center',
                          fontSize: '13px',
                          color: 'var(--text-muted)',
                          background: 'var(--bg-surface)',
                          borderRadius: 'var(--radius-md)',
                        }}
                      >
                        Not submitted
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
