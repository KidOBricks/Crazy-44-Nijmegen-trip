import {
  Bell,
  BookOpen,
  ClipboardCheck,
  Copy,
  ListChecks,
  Settings,
  ShieldAlert,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AdminGradingTab } from '../components/admin/AdminGradingTab';
import { AdminTasksTab } from '../components/admin/AdminTasksTab';
import { AdminTeamsGameTab } from '../components/admin/AdminTeamsGameTab';
import { CountdownTimer } from '../components/CountdownTimer';
import { RulesModal } from '../components/RulesModal';
import { useGameData } from '../hooks/useGameData';
import {
  playNotificationChime,
  requestBrowserNotifications,
  showBrowserNotification,
} from '../services/notifications';
import type { Submission } from '../types/game';
import { buildAdminUrl, hydrateFirebaseConfigFromQuery } from '../utils/urlBuilder';

type AdminTab = 'tasks' | 'grading' | 'teams';

export function AdminPage() {
  const [searchParams] = useSearchParams();
  hydrateFirebaseConfigFromQuery(window.location.hash.split('?')[1] || '');

  const urlToken = searchParams.get('token') || '';
  const { repo, snapshot, loading, error, mode } = useGameData(urlToken);

  const [activeTab, setActiveTab] = useState<AdminTab>('tasks');
  const [rulesOpen, setRulesOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [liveAlert, setLiveAlert] = useState<Submission | null>(null);
  const [notifPermission, setNotifPermission] = useState<string>(() =>
    typeof window !== 'undefined' && 'Notification' in window
      ? Notification.permission
      : 'unsupported',
  );
  const [ntfyInput, setNtfyInput] = useState('');
  const [cloudNameInput, setCloudNameInput] = useState('');
  const [uploadPresetInput, setUploadPresetInput] = useState('');
  const [rulesInput, setRulesInput] = useState('');
  const [copiedAdmin, setCopiedAdmin] = useState(false);

  const seenSubmissionsRef = useRef<Map<string, number>>(new Map());
  const initializedFeedRef = useRef(false);

  const liveSubmissions = snapshot?.submissions;

  // Real-time submission alert detector
  useEffect(() => {
    if (!liveSubmissions) return;

    if (!initializedFeedRef.current) {
      for (const sub of liveSubmissions) {
        seenSubmissionsRef.current.set(sub.id, sub.submittedAt);
      }
      initializedFeedRef.current = true;
      return;
    }

    let newestArrival: Submission | null = null;
    for (const sub of liveSubmissions) {
      const prevTime = seenSubmissionsRef.current.get(sub.id) ?? 0;
      if (sub.status === 'unmarked' && sub.submittedAt > prevTime) {
        if (!newestArrival || sub.submittedAt > newestArrival.submittedAt) {
          newestArrival = sub;
        }
      }
      seenSubmissionsRef.current.set(sub.id, sub.submittedAt);
    }

    if (newestArrival) {
      queueMicrotask(() => setLiveAlert(newestArrival));
      playNotificationChime();
      showBrowserNotification(
        `Team ${newestArrival.teamNumber} (${newestArrival.teamName})`,
        `Uploaded #${newestArrival.taskNumber}: ${newestArrival.taskTitle}`,
      );
    }
  }, [liveSubmissions]);

  if (loading) {
    return (
      <div className="narrow-container">
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <h3>Loading Crazy 44 Admin...</h3>
        </div>
      </div>
    );
  }

  if (error || !snapshot) {
    return (
      <div className="narrow-container">
        <div className="card stack-md">
          <h3>Could not load Admin Panel</h3>
          <p style={{ color: 'var(--rejected-text)', fontSize: '14px' }}>
            {error || 'Database unavailable.'}
          </p>
          <Link to="/" className="btn btn-primary">
            Back to Setup
          </Link>
        </div>
      </div>
    );
  }

  const { game, categories, tasks, teams, submissions } = snapshot;
  const isAuthorized =
    Boolean(urlToken) && urlToken === game.adminToken;

  if (!isAuthorized) {
    return (
      <div className="narrow-container">
        <div className="card stack-md" style={{ textAlign: 'center', padding: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <ShieldAlert size={36} color="#DC2626" />
          </div>
          <h2>Admin Link Required</h2>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            This Admin URL is missing or has an invalid secret token. Open the
            exact Admin link you bookmarked during setup.
          </p>
          <div>
            <Link to="/" className="btn btn-primary">
              Go to Home / Setup
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const unmarkedCount = submissions.filter((s) => s.status === 'unmarked').length;

  const handleJumpToSubmission = (sub: Submission) => {
    setActiveTab('grading');
    setLiveAlert(null);
    window.setTimeout(() => {
      const el = document.getElementById(`sub-${sub.id}`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 80);
  };

  const handleCopyAdminUrl = async () => {
    const url = buildAdminUrl(game.adminToken);
    try {
      await navigator.clipboard.writeText(url);
      setCopiedAdmin(true);
      window.setTimeout(() => setCopiedAdmin(false), 1800);
    } catch {
      // ignore
    }
  };

  const handleEnableBrowserNotifs = async () => {
    const res = await requestBrowserNotifications();
    setNotifPermission(res);
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    await repo.updateGame({
      ntfyTopic: ntfyInput.trim(),
      rulesText: rulesInput.trim(),
    });
    setSettingsOpen(false);
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand-lockup">
            <span className="brand-mark">44</span>
            <div>
              <div className="brand-title">Crazy 44 Admin</div>
              <div className="brand-subtitle">
                {mode === 'demo' ? 'Local Demo Mode' : 'Live Firebase Sync'} •{' '}
                {game.status.toUpperCase()}
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
            <button
              type="button"
              className="btn btn-sm btn-secondary"
              onClick={() => {
                setNtfyInput(game.ntfyTopic || '');
                setRulesInput(game.rulesText || '');
                setSettingsOpen(true);
              }}
            >
              <Settings size={15} />
              Settings
            </button>
          </div>
        </div>
      </header>

      <main className="main-container">
        {/* Sticky Top Live Submission Notification */}
        {liveAlert && (
          <div className="live-alert-banner" role="status">
            <div className="row-wrap">
              <Bell size={20} />
              <div>
                <strong style={{ display: 'block', fontSize: '14px' }}>
                  New Upload: Team {liveAlert.teamNumber} ({liveAlert.teamName})
                </strong>
                <span style={{ fontSize: '13px', opacity: 0.92 }}>
                  Completed #{liveAlert.taskNumber} — {liveAlert.taskTitle}
                </span>
              </div>
            </div>

            <div className="row-wrap">
              <button
                type="button"
                className="btn btn-sm"
                style={{ background: '#ffffff', color: 'var(--purple-900)' }}
                onClick={() => handleJumpToSubmission(liveAlert)}
              >
                Review Upload
              </button>
              <button
                type="button"
                className="icon-btn"
                aria-label="Dismiss notification"
                onClick={() => setLiveAlert(null)}
                style={{
                  background: 'rgba(255,255,255,0.16)',
                  borderColor: 'rgba(255,255,255,0.25)',
                  color: '#ffffff',
                }}
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Primary Admin Tabs */}
        <nav className="tabs-bar" aria-label="Admin sections">
          <button
            type="button"
            className={`tab-btn ${activeTab === 'tasks' ? 'active' : ''}`}
            onClick={() => setActiveTab('tasks')}
          >
            <ListChecks size={17} />
            Tasks ({tasks.length})
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'grading' ? 'active' : ''}`}
            onClick={() => setActiveTab('grading')}
          >
            <ClipboardCheck size={17} />
            Grading
            {unmarkedCount > 0 && (
              <span
                className="badge"
                style={{
                  background: '#DC2626',
                  color: '#ffffff',
                  padding: '2px 7px',
                }}
              >
                {unmarkedCount}
              </span>
            )}
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'teams' ? 'active' : ''}`}
            onClick={() => setActiveTab('teams')}
          >
            <Users size={17} />
            Teams & Game ({teams.length})
          </button>
        </nav>

        {activeTab === 'tasks' && (
          <AdminTasksTab
            repo={repo}
            categories={categories}
            tasks={tasks}
            useDemoMode={mode === 'demo'}
            cloudinary={{
              cloudName: game.cloudinaryCloudName,
              uploadPreset: game.cloudinaryUploadPreset,
            }}
          />
        )}

        {activeTab === 'grading' && (
          <AdminGradingTab
            repo={repo}
            submissions={submissions}
            tasks={tasks}
            teams={teams}
          />
        )}

        {activeTab === 'teams' && (
          <AdminTeamsGameTab
            repo={repo}
            game={game}
            teams={teams}
            tasks={tasks}
            categories={categories}
            submissions={submissions}
          />
        )}
      </main>

      <RulesModal
        open={rulesOpen}
        rulesText={game.rulesText}
        onClose={() => setRulesOpen(false)}
      />

      {/* Admin Settings Modal */}
      {settingsOpen && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          onClick={() => setSettingsOpen(false)}
        >
          <form
            className="modal-panel"
            onSubmit={handleSaveSettings}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>Admin Settings & Notifications</h3>
              <button
                type="button"
                className="icon-btn"
                aria-label="Close settings"
                onClick={() => setSettingsOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="card-tinted stack-sm">
              <strong style={{ fontSize: '13px' }}>
                Secret Admin URL (bookmark this on organizer phones)
              </strong>
              <button
                type="button"
                className="btn btn-sm btn-secondary"
                onClick={handleCopyAdminUrl}
              >
                <Copy size={14} />
                {copiedAdmin ? 'Admin URL Copied!' : 'Copy Secret Admin URL'}
              </button>
            </div>

            <div className="card-tinted stack-sm">
              <strong style={{ fontSize: '13px' }}>
                Browser Alerts (while Admin tab is open)
              </strong>
              <div className="row-between">
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  Permission: <strong>{notifPermission}</strong>
                </span>
                <button
                  type="button"
                  className="btn btn-sm btn-outline"
                  onClick={handleEnableBrowserNotifs}
                >
                  <Bell size={14} />
                  Enable Browser Alerts
                </button>
              </div>
            </div>

            <label className="field">
              <span className="field-label">
                Locked-Screen Phone Push via ntfy.sh (Optional & Free)
              </span>
              <input
                type="text"
                className="input"
                placeholder="e.g., crazy44-nijmegen-admin-9821"
                value={ntfyInput}
                onChange={(e) => setNtfyInput(e.target.value)}
              />
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Install the free <strong>ntfy</strong> app on your phone and
                subscribe to this same topic name to get lock-screen push alerts
                even when your browser is closed.
              </span>
            </label>

            <div className="card-tinted stack-sm">
              <strong style={{ fontSize: '13px' }}>
                Free Video & HD Photo Uploads via Cloudinary (No Card Required)
              </strong>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Photos already work free out-of-the-box without Firebase Blaze.
                To also enable <strong>video uploads</strong> free, create a
                free Cloudinary account → Settings → Upload → Add Unsigned
                Upload Preset, then enter:
              </span>
              <div className="grid-2">
                <label className="field">
                  <span className="field-label">Cloud Name</span>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g., dxyz123abc"
                    value={cloudNameInput}
                    onChange={(e) => setCloudNameInput(e.target.value)}
                  />
                </label>
                <label className="field">
                  <span className="field-label">Unsigned Upload Preset</span>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g., crazy44_unsigned"
                    value={uploadPresetInput}
                    onChange={(e) => setUploadPresetInput(e.target.value)}
                  />
                </label>
              </div>
            </div>

            <label className="field">
              <span className="field-label">Rules & Scoring Text</span>
              <textarea
                className="textarea"
                style={{ minHeight: '130px' }}
                value={rulesInput}
                onChange={(e) => setRulesInput(e.target.value)}
              />
            </label>

            <div className="row-between">
              <button
                type="button"
                className="btn btn-sm btn-outline"
                onClick={() => repo.seedDefaultTasks()}
              >
                <Sparkles size={14} />
                Restore 35 Starter Tasks
              </button>

              <div className="row-wrap">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setSettingsOpen(false)}
                >
                  Close
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Settings
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
