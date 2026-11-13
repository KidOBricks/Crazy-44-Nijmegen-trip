import {
  CheckCircle2,
  Database,
  PlayCircle,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  clearFirebaseConfig,
  getAppMode,
  getSavedFirebaseConfig,
  saveFirebaseConfig,
  setAppMode,
} from '../services/firebase';
import {
  createDemoRepository,
  generateToken,
} from '../services/gameRepository';
import type { FirebaseConfig } from '../types/game';
import { buildAdminUrl, buildTeamUrl } from '../utils/urlBuilder';

export function LandingPage() {
  const navigate = useNavigate();
  const savedConfig = getSavedFirebaseConfig();
  const currentMode = getAppMode();

  const [apiKey, setApiKey] = useState(savedConfig?.apiKey || '');
  const [authDomain, setAuthDomain] = useState(savedConfig?.authDomain || '');
  const [projectId, setProjectId] = useState(savedConfig?.projectId || '');
  const [storageBucket, setStorageBucket] = useState(
    savedConfig?.storageBucket || '',
  );
  const [messagingSenderId, setMessagingSenderId] = useState(
    savedConfig?.messagingSenderId || '',
  );
  const [appId, setAppId] = useState(savedConfig?.appId || '');
  const [rawPaste, setRawPaste] = useState('');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleParseSnippet = (text: string) => {
    setRawPaste(text);
    const extract = (key: string) => {
      const m = text.match(new RegExp(`${key}\\s*:\\s*["']([^"']+)["']`));
      return m?.[1] || '';
    };
    const k = extract('apiKey');
    const ad = extract('authDomain');
    const pid = extract('projectId');
    const sb = extract('storageBucket');
    const ms = extract('messagingSenderId');
    const aid = extract('appId');
    if (k) setApiKey(k);
    if (ad) setAuthDomain(ad);
    if (pid) setProjectId(pid);
    if (sb) setStorageBucket(sb);
    if (ms) setMessagingSenderId(ms);
    if (aid) setAppId(aid);
  };

  const handleSaveFirebase = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!apiKey.trim() || !projectId.trim() || !appId.trim()) {
      setErrorMsg('Please fill in at least apiKey, projectId, and appId.');
      return;
    }

    const cfg: FirebaseConfig = {
      apiKey: apiKey.trim(),
      authDomain: authDomain.trim() || `${projectId.trim()}.firebaseapp.com`,
      projectId: projectId.trim(),
      storageBucket:
        storageBucket.trim() || `${projectId.trim()}.firebasestorage.app`,
      messagingSenderId: messagingSenderId.trim(),
      appId: appId.trim(),
    };

    saveFirebaseConfig(cfg);
    setAppMode('firebase');
    setStatusMsg('Firebase config saved! Opening your Admin panel...');
    const token = generateToken(16);
    window.setTimeout(() => {
      navigate(`/admin?token=${token}`);
    }, 300);
  };

  const handleLaunchDemo = async () => {
    setAppMode('demo');
    const demoRepo = createDemoRepository();
    const game = await demoRepo.ensureInitialized('demo-admin');
    navigate(`/admin?token=${game.adminToken}`);
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand-lockup">
            <span className="brand-mark">44</span>
            <div>
              <div className="brand-title">Crazy 44</div>
              <div className="brand-subtitle">
                Scavenger Hunt Platform
              </div>
            </div>
          </div>

          <span className="badge badge-purple">
            {savedConfig && currentMode === 'firebase'
              ? 'Firebase Connected'
              : 'Setup / Demo Ready'}
          </span>
        </div>
      </header>

      <main className="narrow-container stack-lg">
        <div className="card stack-md">
          <h1>Welcome to Crazy 44</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
            Participants: open the custom team link or QR code shared by your
            organizers. Organizers: connect your Firebase project below to launch
            a live game across all phones, or try Local Demo mode right away.
          </p>

          <div className="row-wrap">
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleLaunchDemo}
            >
              <PlayCircle size={17} />
              Launch Local Demo (Multi-Tab Preview)
            </button>

            <a
              href={buildTeamUrl('team-1', 'demo-t1')}
              target="_blank"
              rel="noreferrer"
              className="btn btn-secondary"
              onClick={() => setAppMode('demo')}
            >
              <Users size={16} />
              Open Demo Team 1 Tab
            </a>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Demo Admin URL: <code>{buildAdminUrl('demo-admin')}</code>
          </p>
        </div>

        <form className="card stack-md" onSubmit={handleSaveFirebase}>
          <div className="row-between">
            <div className="row-wrap">
              <Database size={20} color="#4B1D8C" />
              <h3>Connect Firebase (Live Multi-Phone Game)</h3>
            </div>
            {savedConfig && (
              <button
                type="button"
                className="btn btn-sm btn-outline"
                onClick={() => {
                  clearFirebaseConfig();
                  setAppMode('demo');
                  setStatusMsg('Cleared saved Firebase config.');
                }}
              >
                Reset Keys
              </button>
            )}
          </div>

          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Paste your <code>firebaseConfig</code> snippet from Firebase Console
            → Project Settings → Web App, or fill the fields manually. Shared
            team links will carry this config automatically!
          </p>

          {errorMsg && (
            <div className="badge badge-rejected" style={{ padding: '10px' }}>
              {errorMsg}
            </div>
          )}

          {statusMsg && (
            <div className="badge badge-approved" style={{ padding: '10px' }}>
              <CheckCircle2 size={14} />
              {statusMsg}
            </div>
          )}

          <label className="field">
            <span className="field-label">Quick Paste Firebase Config Snippet</span>
            <textarea
              className="textarea"
              placeholder={'const firebaseConfig = {\n  apiKey: "...",\n  projectId: "...",\n  ...\n};'}
              value={rawPaste}
              onChange={(e) => handleParseSnippet(e.target.value)}
            />
          </label>

          <div className="grid-2">
            <label className="field">
              <span className="field-label">apiKey</span>
              <input
                type="text"
                className="input"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
            </label>
            <label className="field">
              <span className="field-label">projectId</span>
              <input
                type="text"
                className="input"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
              />
            </label>
            <label className="field">
              <span className="field-label">storageBucket</span>
              <input
                type="text"
                className="input"
                value={storageBucket}
                onChange={(e) => setStorageBucket(e.target.value)}
              />
            </label>
            <label className="field">
              <span className="field-label">appId</span>
              <input
                type="text"
                className="input"
                value={appId}
                onChange={(e) => setAppId(e.target.value)}
              />
            </label>
          </div>

          <button type="submit" className="btn btn-primary">
            <ShieldCheck size={17} />
            Save Firebase Config & Open Admin Panel
          </button>
        </form>
      </main>
    </div>
  );
}
