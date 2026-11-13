import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  Clock,
  Hourglass,
  ListChecks,
  ShieldAlert,
  Trophy,
} from 'lucide-react';
import { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { CountdownTimer } from '../components/CountdownTimer';
import { RulesModal } from '../components/RulesModal';
import { TaskDetailModal } from '../components/team/TaskDetailModal';
import { useGameData } from '../hooks/useGameData';
import type { Submission, Task } from '../types/game';
import {
  buildEndGameAnalytics,
  computeTeamScore,
  partitionTasksForTeam,
} from '../utils/scoring';
import { hydrateFirebaseConfigFromQuery } from '../utils/urlBuilder';

type TeamTab = 'todo' | 'completed';

export function TeamPage() {
  const { teamId = '' } = useParams();
  const [searchParams] = useSearchParams();
  hydrateFirebaseConfigFromQuery(window.location.hash.split('?')[1] || '');

  const urlToken = searchParams.get('t') || '';
  const { repo, snapshot, loading, error, mode } = useGameData();

  const [activeTab, setActiveTab] = useState<TeamTab>('todo');
  const [catFilter, setCatFilter] = useState<string>('all');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [rulesOpen, setRulesOpen] = useState(false);

  if (loading) {
    return (
      <div className="narrow-container">
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <h3>Loading your team...</h3>
        </div>
      </div>
    );
  }

  if (error || !snapshot) {
    return (
      <div className="narrow-container">
        <div className="card stack-md">
          <h3>Could not connect to Crazy 44</h3>
          <p style={{ color: 'var(--rejected-text)', fontSize: '14px' }}>
            {error || 'Game data unavailable.'}
          </p>
          <Link to="/" className="btn btn-primary">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const { game, categories, tasks, teams, submissions } = snapshot;
  const team = teams.find(
    (t) => t.id === teamId && t.accessToken === urlToken,
  );

  if (!team) {
    return (
      <div className="narrow-container">
        <div className="card stack-md" style={{ textAlign: 'center', padding: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <ShieldAlert size={36} color="#DC2626" />
          </div>
          <h2>Invalid Team Link</h2>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            Ask your organizer for your team&rsquo;s official Crazy 44 link or
            QR code.
          </p>
        </div>
      </div>
    );
  }

  const sortedCategories = [...categories].sort((a, b) => a.order - b.order);
  const categoryNameById = new Map(sortedCategories.map((c) => [c.id, c.name]));

  const teamSubs = submissions.filter((s) => s.teamId === team.id);
  const subsByTaskId: Record<string, Submission> = {};
  for (const s of teamSubs) subsByTaskId[s.taskId] = s;

  const { todoTasks, completedTasks } = partitionTasksForTeam(
    tasks,
    subsByTaskId,
  );
  const teamScore = computeTeamScore(team, submissions);

  const visibleTodo =
    catFilter === 'all'
      ? todoTasks
      : todoTasks.filter((t) => t.categoryId === catFilter);

  const visibleCompleted =
    catFilter === 'all'
      ? completedTasks
      : completedTasks.filter((t) => t.categoryId === catFilter);

  const analytics =
    game.status === 'ended'
      ? buildEndGameAnalytics(teams, tasks, categories, submissions)
      : null;

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand-lockup">
            <span
              className="brand-mark"
              style={{ background: team.color || '#4B1D8C' }}
            >
              T{team.number}
            </span>
            <div>
              <div className="brand-title">{team.name}</div>
              <div className="brand-subtitle">
                Crazy 44 • {completedTasks.length}/{tasks.length} submitted
              </div>
            </div>
          </div>

          <div className="row-wrap">
            <CountdownTimer status={game.status} endsAt={game.endsAt} />
            <button
              type="button"
              className="btn btn-sm btn-outline"
              onClick={() => setRulesOpen(true)}
            >
              <BookOpen size={15} />
              Rules
            </button>
          </div>
        </div>
      </header>

      <main className="narrow-container">
        {/* PRE-GAME WAITING LOBBY */}
        {game.status === 'setup' && (
          <div className="card stack-md" style={{ textAlign: 'center', padding: '32px 22px' }}>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <span
                className="badge"
                style={{
                  background: team.color,
                  color: '#ffffff',
                  fontSize: '14px',
                  padding: '6px 14px',
                }}
              >
                Team {team.number}: {team.name}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '6px' }}>
              <Hourglass size={38} color="#4B1D8C" />
            </div>

            <h2>Waiting for Game Start</h2>
            <p style={{ fontSize: '15px', color: 'var(--text-secondary)' }}>
              Your team link is ready! As soon as the organizers start the game,
              all tasks will unlock right here automatically.
            </p>

            <div style={{ marginTop: '8px' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setRulesOpen(true)}
              >
                <BookOpen size={16} />
                Read Rules & Strategy While Waiting
              </button>
            </div>
          </div>
        )}

        {/* LIVE GAME */}
        {game.status === 'active' && (
          <div className="stack-md">
            <div className="card-tinted row-between" style={{ padding: '12px 16px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600 }}>
                Your Confirmed Score
              </span>
              <span className="badge badge-purple" style={{ fontSize: '14px' }}>
                {teamScore.totalScore} pts ({teamScore.approvedCount} approved)
              </span>
            </div>

            <nav className="tabs-bar" aria-label="Team task tabs">
              <button
                type="button"
                className={`tab-btn ${activeTab === 'todo' ? 'active' : ''}`}
                onClick={() => setActiveTab('todo')}
              >
                <ListChecks size={17} />
                Tasks ({todoTasks.length})
              </button>
              <button
                type="button"
                className={`tab-btn ${activeTab === 'completed' ? 'active' : ''}`}
                onClick={() => setActiveTab('completed')}
              >
                <CheckCircle2 size={17} />
                Completed Tasks ({completedTasks.length})
              </button>
            </nav>

            <div className="chip-row">
              <button
                type="button"
                className={`chip ${catFilter === 'all' ? 'active' : ''}`}
                onClick={() => setCatFilter('all')}
              >
                All Categories
              </button>
              {sortedCategories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={`chip ${catFilter === c.id ? 'active' : ''}`}
                  onClick={() => setCatFilter(c.id)}
                >
                  {c.name}
                </button>
              ))}
            </div>

            {activeTab === 'todo' && (
              <div className="stack-sm">
                {visibleTodo.length === 0 ? (
                  <div className="card-tinted" style={{ textAlign: 'center', padding: '28px' }}>
                    <h4>No tasks left in this view!</h4>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '6px' }}>
                      Check your Completed Tasks tab to view pending and
                      approved submissions.
                    </p>
                  </div>
                ) : (
                  visibleTodo.map((task) => {
                    const sub = subsByTaskId[task.id];
                    const isRejected = sub?.status === 'rejected';
                    return (
                      <button
                        key={task.id}
                        type="button"
                        className="card card-interactive stack-sm"
                        onClick={() => setSelectedTask(task)}
                        style={{
                          textAlign: 'left',
                          width: '100%',
                          borderColor: isRejected
                            ? 'var(--rejected-border)'
                            : undefined,
                          background: isRejected
                            ? '#fffafa'
                            : '#ffffff',
                        }}
                      >
                        {isRejected && (
                          <div
                            className="badge badge-rejected"
                            style={{ alignSelf: 'flex-start' }}
                          >
                            <AlertCircle size={12} />
                            Redo Needed
                            {sub.adminNote ? ` — ${sub.adminNote}` : ''}
                          </div>
                        )}

                        <div className="row-between" style={{ width: '100%' }}>
                          <div className="row-wrap">
                            <span className="task-number-pill">#{task.number}</span>
                            <strong
                              style={{
                                fontFamily: 'var(--font-display)',
                                fontSize: '16px',
                              }}
                            >
                              {task.title}
                            </strong>
                          </div>
                          <span className="badge badge-purple">
                            {task.points} {task.points === 1 ? 'pt' : 'pts'}
                          </span>
                        </div>

                        <span
                          style={{
                            fontSize: '12px',
                            color: 'var(--text-muted)',
                            fontWeight: 600,
                          }}
                        >
                          {categoryNameById.get(task.categoryId) || 'Challenge'}
                        </span>

                        <p
                          style={{
                            fontSize: '14px',
                            color: 'var(--text-secondary)',
                          }}
                        >
                          {task.description}
                        </p>
                      </button>
                    );
                  })
                )}
              </div>
            )}

            {activeTab === 'completed' && (
              <div className="stack-sm">
                {visibleCompleted.length === 0 ? (
                  <div className="card-tinted" style={{ textAlign: 'center', padding: '28px' }}>
                    <h4>No completed tasks yet</h4>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '6px' }}>
                      Pick a challenge from the Tasks tab and upload a photo or
                      video!
                    </p>
                  </div>
                ) : (
                  visibleCompleted.map((task) => {
                    const sub = subsByTaskId[task.id];
                    return (
                      <button
                        key={task.id}
                        type="button"
                        className="card card-interactive stack-sm"
                        onClick={() => setSelectedTask(task)}
                        style={{ textAlign: 'left', width: '100%' }}
                      >
                        <div className="row-between" style={{ width: '100%' }}>
                          <div className="row-wrap">
                            <span className="task-number-pill">#{task.number}</span>
                            <strong
                              style={{
                                fontFamily: 'var(--font-display)',
                                fontSize: '16px',
                              }}
                            >
                              {task.title}
                            </strong>
                          </div>

                          {sub?.status === 'approved' ? (
                            <span className="badge badge-approved">
                              <CheckCircle2 size={12} />+{sub.awardedPoints} pts
                            </span>
                          ) : (
                            <span className="badge badge-pending">
                              <Clock size={12} />
                              Pending (Tap to Re-upload)
                            </span>
                          )}
                        </div>

                        {sub?.mediaType === 'image' && (
                          <img
                            src={sub.mediaUrl}
                            alt={task.title}
                            style={{
                              width: '100%',
                              height: '150px',
                              objectFit: 'cover',
                              borderRadius: 'var(--radius-sm)',
                            }}
                          />
                        )}

                        {sub?.mediaType === 'video' && (
                          <span style={{ fontSize: '13px', color: 'var(--purple-800)', fontWeight: 600 }}>
                            Video uploaded — tap to preview or re-upload
                          </span>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>
        )}

        {/* POST-GAME FINAL SCORES */}
        {game.status === 'ended' && analytics && (
          <div className="stack-lg">
            <div className="card stack-md" style={{ textAlign: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <Trophy size={38} color="#4B1D8C" />
              </div>
              <h2>Final Crazy 44 Results</h2>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                Submissions are locked. Here is how every squad finished!
              </p>

              <div className="stack-sm" style={{ textAlign: 'left' }}>
                {analytics.rankedTeams.map((summary, idx) => (
                  <div
                    key={summary.team.id}
                    className="card-tinted row-between"
                    style={{
                      borderLeft: `5px solid ${summary.team.color}`,
                      background:
                        summary.team.id === team.id
                          ? 'var(--purple-100)'
                          : 'var(--bg-surface)',
                    }}
                  >
                    <div className="row-wrap">
                      <span className="badge badge-purple">#{idx + 1}</span>
                      <strong>
                        Team {summary.team.number}: {summary.team.name}
                        {summary.team.id === team.id ? ' (You)' : ''}
                      </strong>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <strong
                        style={{
                          fontFamily: 'var(--font-display)',
                          fontSize: '18px',
                          color: 'var(--purple-900)',
                        }}
                      >
                        {summary.totalScore} pts
                      </strong>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {summary.approvedCount} tasks
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      <TaskDetailModal
        task={selectedTask}
        categoryName={
          selectedTask
            ? categoryNameById.get(selectedTask.categoryId) || 'Challenge'
            : ''
        }
        team={team}
        game={game}
        submission={selectedTask ? subsByTaskId[selectedTask.id] : undefined}
        repo={repo}
        useDemoMode={mode === 'demo'}
        onClose={() => setSelectedTask(null)}
        onUploaded={() => setActiveTab('completed')}
      />

      <RulesModal
        open={rulesOpen}
        rulesText={game.rulesText}
        onClose={() => setRulesOpen(false)}
      />
    </div>
  );
}
