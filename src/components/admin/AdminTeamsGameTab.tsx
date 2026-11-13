import {
  Check,
  Copy,
  Flag,
  Play,
  Plus,
  QrCode,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import { useState } from 'react';
import type { GameRepository } from '../../services/gameRepository';
import { generateToken } from '../../services/gameRepository';
import type {
  Category,
  GameState,
  Submission,
  Task,
  Team,
} from '../../types/game';
import { computeTeamScore } from '../../utils/scoring';
import { buildTeamUrl } from '../../utils/urlBuilder';
import { QrCodeModal } from '../QrCodeModal';
import { EndGameDashboard } from './EndGameDashboard';

interface AdminTeamsGameTabProps {
  repo: GameRepository;
  game: GameState;
  teams: Team[];
  tasks: Task[];
  categories: Category[];
  submissions: Submission[];
}

const TEAM_COLOR_PRESETS = [
  '#4B1D8C', // Deep Purple
  '#0D9488', // Teal
  '#D97706', // Amber
  '#E11D48', // Crimson
  '#2563EB', // Cobalt
  '#16A34A', // Emerald
  '#9333EA', // Violet
  '#EA580C', // Orange
];

export function AdminTeamsGameTab({
  repo,
  game,
  teams,
  tasks,
  categories,
  submissions,
}: AdminTeamsGameTabProps) {
  const sortedTeams = [...teams].sort((a, b) => a.number - b.number);
  const nextNumber =
    sortedTeams.length > 0
      ? Math.max(...sortedTeams.map((t) => t.number)) + 1
      : 1;

  const [teamNumber, setTeamNumber] = useState<number>(Math.min(4, nextNumber));
  const [teamName, setTeamName] = useState<string>('');
  const [teamColor, setTeamColor] = useState<string>(
    TEAM_COLOR_PRESETS[(nextNumber - 1) % TEAM_COLOR_PRESETS.length],
  );
  const [creating, setCreating] = useState(false);

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [qrTarget, setQrTarget] = useState<{
    title: string;
    subtitle: string;
    url: string;
  } | null>(null);
  const [showPreviewAnalytics, setShowPreviewAnalytics] = useState(false);
  const [confirmEnd, setConfirmEnd] = useState(false);

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim()) return;
    setCreating(true);
    try {
      const id = `team-${generateToken(6)}`;
      const num = Math.max(1, Number(teamNumber) || 1);
      await repo.saveTeam({
        id,
        number: num,
        name: teamName.trim(),
        color: teamColor,
        accessToken: generateToken(10),
        penaltyPoints: 0,
        adjustments: [],
        createdAt: Date.now(),
      });
      const upcoming = num + 1;
      setTeamNumber(upcoming);
      setTeamName('');
      setTeamColor(
        TEAM_COLOR_PRESETS[(upcoming - 1) % TEAM_COLOR_PRESETS.length],
      );
    } finally {
      setCreating(false);
    }
  };

  const handleStartGame = async () => {
    const now = Date.now();
    const durationMs = (game.durationMinutes || 150) * 60 * 1000;
    await repo.updateGame({
      status: 'active',
      startedAt: now,
      endsAt: now + durationMs,
      endedAt: null,
    });
  };

  const handleEndGame = async () => {
    await repo.updateGame({
      status: 'ended',
      endedAt: Date.now(),
    });
    setConfirmEnd(false);
  };

  const handleReopenGame = async () => {
    const now = Date.now();
    const remainingMs =
      game.endsAt && game.endsAt > now
        ? game.endsAt - now
        : (game.durationMinutes || 150) * 60 * 1000;
    await repo.updateGame({
      status: 'active',
      endsAt: now + remainingMs,
      endedAt: null,
    });
  };

  const handleCopyUrl = async (team: Team) => {
    const url = buildTeamUrl(team.id, team.accessToken);
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(team.id);
      window.setTimeout(() => setCopiedId(null), 1800);
    } catch {
      setQrTarget({
        title: `Team ${team.number}: ${team.name}`,
        subtitle: 'Copy or scan this link to share with the team',
        url,
      });
    }
  };

  return (
    <div className="stack-lg">
      {/* Game Lifecycle Control */}
      <div className="card stack-md">
        <div className="row-between">
          <div>
            <h3>Game Control</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              {game.status === 'setup' &&
                'Teams are in the waiting lobby. Tasks unlock as soon as you Start Game.'}
              {game.status === 'active' &&
                'Game is LIVE! Teams can browse tasks and submit photo/video proof.'}
              {game.status === 'ended' &&
                'Game has ended. All submissions are locked and final scores are visible.'}
            </p>
          </div>

          <div className="row-wrap">
            {game.status === 'setup' && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleStartGame}
              >
                <Play size={16} />
                Start Game
              </button>
            )}

            {game.status === 'active' && !confirmEnd && (
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => setConfirmEnd(true)}
              >
                <Flag size={16} />
                End Game
              </button>
            )}

            {game.status === 'active' && confirmEnd && (
              <div className="row-wrap">
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleEndGame}
                >
                  Confirm End Game
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setConfirmEnd(false)}
                >
                  Cancel
                </button>
              </div>
            )}

            {game.status === 'ended' && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleReopenGame}
              >
                <RotateCcw size={16} />
                Resume Game
              </button>
            )}
          </div>
        </div>

        <div className="row-between">
          <label className="row-wrap" style={{ fontSize: '13px' }}>
            <span style={{ fontWeight: 600 }}>Timer duration (minutes):</span>
            <input
              type="number"
              min={15}
              max={720}
              className="input"
              style={{ width: '96px', minHeight: '36px' }}
              value={game.durationMinutes}
              onChange={(e) => {
                const mins = Math.max(15, Number(e.target.value) || 150);
                const patch: Partial<GameState> = { durationMinutes: mins };
                if (game.status === 'active' && game.startedAt) {
                  patch.endsAt = game.startedAt + mins * 60 * 1000;
                }
                repo.updateGame(patch);
              }}
            />
          </label>

          {game.status !== 'ended' && (
            <button
              type="button"
              className="btn btn-sm btn-outline"
              onClick={() => setShowPreviewAnalytics((v) => !v)}
            >
              {showPreviewAnalytics
                ? 'Hide Live Scoreboard Preview'
                : 'Preview Scoreboard & Charts'}
            </button>
          )}
        </div>
      </div>

      {/* End Game Visualizations */}
      {(game.status === 'ended' || showPreviewAnalytics) && (
        <EndGameDashboard
          teams={teams}
          tasks={tasks}
          categories={categories}
          submissions={submissions}
        />
      )}

      {/* Create Team Form */}
      <form className="card stack-md" onSubmit={handleCreateTeam}>
        <h3>Create Team</h3>

        <div className="grid-2">
          <div className="field">
            <span className="field-label">Team Number (1, 2, 3, 4...)</span>
            <div className="row-wrap">
              {[1, 2, 3, 4].map((n) => (
                <button
                  key={n}
                  type="button"
                  className={`chip ${teamNumber === n ? 'active' : ''}`}
                  onClick={() => setTeamNumber(n)}
                >
                  #{n}
                </button>
              ))}
              <input
                type="number"
                min={1}
                max={20}
                className="input"
                style={{ width: '74px', minHeight: '36px' }}
                value={teamNumber}
                onChange={(e) => setTeamNumber(Number(e.target.value) || 1)}
              />
            </div>
          </div>

          <label className="field">
            <span className="field-label">Team Name</span>
            <input
              type="text"
              className="input"
              placeholder="e.g., Purple Panthers"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              required
            />
          </label>
        </div>

        <div className="field">
          <span className="field-label">Team Color</span>
          <div className="color-swatch-row">
            {TEAM_COLOR_PRESETS.map((hex) => (
              <button
                key={hex}
                type="button"
                aria-label={`Select color ${hex}`}
                className={`color-swatch ${
                  teamColor.toLowerCase() === hex.toLowerCase() ? 'selected' : ''
                }`}
                style={{ backgroundColor: hex }}
                onClick={() => setTeamColor(hex)}
              />
            ))}
            <label
              className="row-wrap"
              style={{
                fontSize: '12px',
                color: 'var(--text-secondary)',
                marginLeft: '4px',
              }}
            >
              <span>Custom wheel:</span>
              <input
                type="color"
                value={teamColor}
                onChange={(e) => setTeamColor(e.target.value)}
                style={{
                  width: '36px',
                  height: '36px',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                }}
              />
            </label>
          </div>
        </div>

        <div>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={creating}
          >
            <Plus size={16} />
            {creating ? 'Creating...' : 'Create Team & Generate Link'}
          </button>
        </div>
      </form>

      {/* Team List */}
      <section className="stack-sm">
        <h3>Teams ({sortedTeams.length})</h3>
        {sortedTeams.length === 0 ? (
          <div
            className="card-tinted"
            style={{ fontSize: '14px', color: 'var(--text-muted)' }}
          >
            No teams created yet. Create Teams 1–4 above to generate custom
            shareable links!
          </div>
        ) : (
          <div className="grid-auto">
            {sortedTeams.map((team) => {
              const score = computeTeamScore(team, submissions);
              const url = buildTeamUrl(team.id, team.accessToken);
              return (
                <div
                  key={team.id}
                  className="card stack-md"
                  style={{ borderTop: `5px solid ${team.color}` }}
                >
                  <div className="row-between">
                    <div className="row-wrap">
                      <span
                        className="badge"
                        style={{ background: team.color, color: '#ffffff' }}
                      >
                        Team {team.number}
                      </span>
                      <strong
                        style={{
                          fontFamily: 'var(--font-display)',
                          fontSize: '17px',
                        }}
                      >
                        {team.name}
                      </strong>
                    </div>

                    <button
                      type="button"
                      className="icon-btn"
                      aria-label={`Delete Team ${team.number}`}
                      onClick={() => repo.deleteTeam(team.id)}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  <div
                    className="row-between"
                    style={{ fontSize: '13px', color: 'var(--text-secondary)' }}
                  >
                    <span>
                      <strong>{score.totalScore} pts</strong> ({score.approvedCount}{' '}
                      approved, {score.pendingCount} pending)
                    </span>
                  </div>

                  <div className="row-wrap">
                    <button
                      type="button"
                      className="btn btn-sm btn-primary"
                      style={{ flex: 1 }}
                      onClick={() => handleCopyUrl(team)}
                    >
                      {copiedId === team.id ? (
                        <Check size={14} />
                      ) : (
                        <Copy size={14} />
                      )}
                      {copiedId === team.id ? 'Copied!' : 'Copy Team Link'}
                    </button>

                    <button
                      type="button"
                      className="btn btn-sm btn-secondary"
                      onClick={() =>
                        setQrTarget({
                          title: `Team ${team.number}: ${team.name}`,
                          subtitle:
                            'Scan with a phone camera to open this team’s Crazy 44 page',
                          url,
                        })
                      }
                    >
                      <QrCode size={15} />
                      QR
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <QrCodeModal
        open={Boolean(qrTarget)}
        title={qrTarget?.title || ''}
        subtitle={qrTarget?.subtitle}
        url={qrTarget?.url || ''}
        onClose={() => setQrTarget(null)}
      />
    </div>
  );
}
