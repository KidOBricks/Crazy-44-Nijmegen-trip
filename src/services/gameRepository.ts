import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import {
  buildSeedTasks,
  DEFAULT_RULES_TEXT,
  SEED_CATEGORIES,
} from '../data/seedCrazy35';
import type {
  Category,
  GameState,
  Submission,
  Task,
  Team,
  TeamAdjustment,
} from '../types/game';
import { getFirebaseHandles } from './firebase';

export interface GameSnapshot {
  game: GameState;
  categories: Category[];
  tasks: Task[];
  teams: Team[];
  submissions: Submission[];
}

export interface GameRepository {
  subscribe(
    onData: (snapshot: GameSnapshot) => void,
    onError: (err: Error) => void,
  ): () => void;
  ensureInitialized(adminToken?: string): Promise<GameState>;
  seedDefaultTasks(): Promise<void>;
  updateGame(patch: Partial<GameState>): Promise<void>;
  saveCategory(category: Category): Promise<void>;
  deleteCategory(categoryId: string): Promise<void>;
  saveTask(task: Task): Promise<void>;
  deleteTask(taskId: string): Promise<void>;
  saveTeam(team: Team): Promise<void>;
  deleteTeam(teamId: string): Promise<void>;
  addTeamAdjustment(teamId: string, adjustment: TeamAdjustment): Promise<void>;
  submitProof(submission: Submission): Promise<void>;
  gradeSubmission(
    submissionId: string,
    patch: Pick<
      Submission,
      'status' | 'basePoints' | 'bonusPoints' | 'awardedPoints' | 'adminNote' | 'gradedAt'
    >,
  ): Promise<void>;
  resetAllData(keepAdminToken?: string): Promise<void>;
}

export function generateToken(length = 12): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const values = new Uint32Array(length);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(values);
    for (let i = 0; i < length; i++) {
      result += chars[values[i] % chars.length];
    }
    return result;
  }
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

export function createDefaultGameState(adminToken?: string): GameState {
  return {
    title: 'Crazy 44',
    status: 'setup',
    adminToken: adminToken || generateToken(16),
    durationMinutes: 150,
    startedAt: null,
    endsAt: null,
    endedAt: null,
    ntfyTopic: '',
    rulesText: DEFAULT_RULES_TEXT,
    updatedAt: Date.now(),
  };
}

// ---------------------------------------------------------------------------
// Firebase Firestore Repository
// ---------------------------------------------------------------------------

export function createFirebaseRepository(): GameRepository {
  const handles = getFirebaseHandles();
  if (!handles) {
    throw new Error('Firebase is not configured.');
  }
  const { db } = handles;
  const gameDocRef = doc(db, 'games', 'default');

  return {
    subscribe(onData, onError) {
      let current: GameSnapshot = {
        game: createDefaultGameState('pending'),
        categories: [],
        tasks: [],
        teams: [],
        submissions: [],
      };
      let loadedGame = false;

      const emit = () => {
        if (loadedGame) onData({ ...current });
      };

      const unsubGame = onSnapshot(
        gameDocRef,
        (snap) => {
          if (snap.exists()) {
            current = { ...current, game: snap.data() as GameState };
          }
          loadedGame = true;
          emit();
        },
        (err) => onError(err),
      );

      const unsubCats = onSnapshot(
        query(collection(db, 'categories'), orderBy('order', 'asc')),
        (snap) => {
          current = {
            ...current,
            categories: snap.docs.map((d) => d.data() as Category),
          };
          emit();
        },
        (err) => onError(err),
      );

      const unsubTasks = onSnapshot(
        query(collection(db, 'tasks'), orderBy('number', 'asc')),
        (snap) => {
          current = {
            ...current,
            tasks: snap.docs.map((d) => d.data() as Task),
          };
          emit();
        },
        (err) => onError(err),
      );

      const unsubTeams = onSnapshot(
        query(collection(db, 'teams'), orderBy('number', 'asc')),
        (snap) => {
          current = {
            ...current,
            teams: snap.docs.map((d) => d.data() as Team),
          };
          emit();
        },
        (err) => onError(err),
      );

      const unsubSubs = onSnapshot(
        collection(db, 'submissions'),
        (snap) => {
          current = {
            ...current,
            submissions: snap.docs.map((d) => d.data() as Submission),
          };
          emit();
        },
        (err) => onError(err),
      );

      return () => {
        unsubGame();
        unsubCats();
        unsubTasks();
        unsubTeams();
        unsubSubs();
      };
    },

    async ensureInitialized(adminToken?: string) {
      const snap = await getDoc(gameDocRef);
      if (snap.exists()) {
        return snap.data() as GameState;
      }
      const initial = createDefaultGameState(adminToken);
      const batch = writeBatch(db);
      batch.set(gameDocRef, initial);
      for (const cat of SEED_CATEGORIES) {
        batch.set(doc(db, 'categories', cat.id), cat);
      }
      for (const task of buildSeedTasks()) {
        batch.set(doc(db, 'tasks', task.id), task);
      }
      await batch.commit();
      return initial;
    },

    async seedDefaultTasks() {
      const batch = writeBatch(db);
      for (const cat of SEED_CATEGORIES) {
        batch.set(doc(db, 'categories', cat.id), cat, { merge: true });
      }
      for (const task of buildSeedTasks()) {
        batch.set(doc(db, 'tasks', task.id), task, { merge: true });
      }
      await batch.commit();
    },

    async updateGame(patch) {
      await setDoc(
        gameDocRef,
        { ...patch, updatedAt: Date.now() },
        { merge: true },
      );
    },

    async saveCategory(category) {
      await setDoc(doc(db, 'categories', category.id), category);
    },

    async deleteCategory(categoryId) {
      await deleteDoc(doc(db, 'categories', categoryId));
    },

    async saveTask(task) {
      await setDoc(doc(db, 'tasks', task.id), task);
    },

    async deleteTask(taskId) {
      await deleteDoc(doc(db, 'tasks', taskId));
    },

    async saveTeam(team) {
      await setDoc(doc(db, 'teams', team.id), team);
    },

    async deleteTeam(teamId) {
      await deleteDoc(doc(db, 'teams', teamId));
    },

    async addTeamAdjustment(teamId, adjustment) {
      const teamRef = doc(db, 'teams', teamId);
      const snap = await getDoc(teamRef);
      if (!snap.exists()) return;
      const team = snap.data() as Team;
      const adjustments = [...(team.adjustments ?? []), adjustment];
      const penaltyPoints = adjustments.reduce((sum, a) => sum + a.delta, 0);
      await updateDoc(teamRef, { adjustments, penaltyPoints });
    },

    async submitProof(submission) {
      await setDoc(doc(db, 'submissions', submission.id), submission);
    },

    async gradeSubmission(submissionId, patch) {
      await updateDoc(doc(db, 'submissions', submissionId), patch);
    },

    async resetAllData(keepAdminToken?: string) {
      const [catsSnap, tasksSnap, teamsSnap, subsSnap] = await Promise.all([
        getDocs(collection(db, 'categories')),
        getDocs(collection(db, 'tasks')),
        getDocs(collection(db, 'teams')),
        getDocs(collection(db, 'submissions')),
      ]);

      const batch = writeBatch(db);
      catsSnap.forEach((d) => batch.delete(d.ref));
      tasksSnap.forEach((d) => batch.delete(d.ref));
      teamsSnap.forEach((d) => batch.delete(d.ref));
      subsSnap.forEach((d) => batch.delete(d.ref));

      const freshGame = createDefaultGameState(keepAdminToken);
      batch.set(gameDocRef, freshGame);
      for (const cat of SEED_CATEGORIES) {
        batch.set(doc(db, 'categories', cat.id), cat);
      }
      for (const task of buildSeedTasks()) {
        batch.set(doc(db, 'tasks', task.id), task);
      }
      await batch.commit();
    },
  };
}

// ---------------------------------------------------------------------------
// Local Demo Repository (multi-tab sync via localStorage + BroadcastChannel)
// ---------------------------------------------------------------------------

const DEMO_STORAGE_KEY = 'crazy44_demo_snapshot_v1';
const DEMO_CHANNEL_NAME = 'crazy44_demo_sync';

function buildDefaultDemoTeams(now = Date.now()): Team[] {
  return [
    {
      id: 'team-1',
      number: 1,
      name: 'Purple Panthers',
      color: '#4B1D8C',
      accessToken: 'demo-t1',
      penaltyPoints: 0,
      adjustments: [],
      createdAt: now,
    },
    {
      id: 'team-2',
      number: 2,
      name: 'Waal Walkers',
      color: '#0D9488',
      accessToken: 'demo-t2',
      penaltyPoints: 0,
      adjustments: [],
      createdAt: now,
    },
    {
      id: 'team-3',
      number: 3,
      name: 'Stevens Squad',
      color: '#D97706',
      accessToken: 'demo-t3',
      penaltyPoints: 0,
      adjustments: [],
      createdAt: now,
    },
    {
      id: 'team-4',
      number: 4,
      name: 'Grote Markt Crew',
      color: '#E11D48',
      accessToken: 'demo-t4',
      penaltyPoints: 0,
      adjustments: [],
      createdAt: now,
    },
  ];
}

function readDemoSnapshot(): GameSnapshot {
  try {
    const raw = localStorage.getItem(DEMO_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw) as GameSnapshot;
    }
  } catch {
    // ignore corrupt JSON
  }
  const initial: GameSnapshot = {
    game: createDefaultGameState('demo-admin'),
    categories: SEED_CATEGORIES,
    tasks: buildSeedTasks(),
    teams: buildDefaultDemoTeams(),
    submissions: [],
  };
  localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(initial));
  return initial;
}

export function createDemoRepository(): GameRepository {
  const listeners = new Set<(snap: GameSnapshot) => void>();
  let channel: BroadcastChannel | null = null;
  if (typeof BroadcastChannel !== 'undefined') {
    channel = new BroadcastChannel(DEMO_CHANNEL_NAME);
  }

  const writeAndBroadcast = (snap: GameSnapshot) => {
    localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(snap));
    listeners.forEach((cb) => cb(snap));
    channel?.postMessage('sync');
  };

  return {
    subscribe(onData) {
      listeners.add(onData);
      onData(readDemoSnapshot());

      const onStorage = (e: StorageEvent) => {
        if (e.key === DEMO_STORAGE_KEY) {
          onData(readDemoSnapshot());
        }
      };
      const onBroadcast = () => {
        onData(readDemoSnapshot());
      };

      window.addEventListener('storage', onStorage);
      channel?.addEventListener('message', onBroadcast);

      return () => {
        listeners.delete(onData);
        window.removeEventListener('storage', onStorage);
        channel?.removeEventListener('message', onBroadcast);
      };
    },

    async ensureInitialized() {
      return readDemoSnapshot().game;
    },

    async seedDefaultTasks() {
      const snap = readDemoSnapshot();
      writeAndBroadcast({
        ...snap,
        categories: SEED_CATEGORIES,
        tasks: buildSeedTasks(),
      });
    },

    async updateGame(patch) {
      const snap = readDemoSnapshot();
      writeAndBroadcast({
        ...snap,
        game: { ...snap.game, ...patch, updatedAt: Date.now() },
      });
    },

    async saveCategory(category) {
      const snap = readDemoSnapshot();
      const exists = snap.categories.some((c) => c.id === category.id);
      const categories = exists
        ? snap.categories.map((c) => (c.id === category.id ? category : c))
        : [...snap.categories, category];
      categories.sort((a, b) => a.order - b.order);
      writeAndBroadcast({ ...snap, categories });
    },

    async deleteCategory(categoryId) {
      const snap = readDemoSnapshot();
      writeAndBroadcast({
        ...snap,
        categories: snap.categories.filter((c) => c.id !== categoryId),
      });
    },

    async saveTask(task) {
      const snap = readDemoSnapshot();
      const exists = snap.tasks.some((t) => t.id === task.id);
      const tasks = exists
        ? snap.tasks.map((t) => (t.id === task.id ? task : t))
        : [...snap.tasks, task];
      tasks.sort((a, b) => a.number - b.number);
      writeAndBroadcast({ ...snap, tasks });
    },

    async deleteTask(taskId) {
      const snap = readDemoSnapshot();
      writeAndBroadcast({
        ...snap,
        tasks: snap.tasks.filter((t) => t.id !== taskId),
      });
    },

    async saveTeam(team) {
      const snap = readDemoSnapshot();
      const exists = snap.teams.some((t) => t.id === team.id);
      const teams = exists
        ? snap.teams.map((t) => (t.id === team.id ? team : t))
        : [...snap.teams, team];
      teams.sort((a, b) => a.number - b.number);
      writeAndBroadcast({ ...snap, teams });
    },

    async deleteTeam(teamId) {
      const snap = readDemoSnapshot();
      writeAndBroadcast({
        ...snap,
        teams: snap.teams.filter((t) => t.id !== teamId),
      });
    },

    async addTeamAdjustment(teamId, adjustment) {
      const snap = readDemoSnapshot();
      const teams = snap.teams.map((t) => {
        if (t.id !== teamId) return t;
        const adjustments = [...(t.adjustments ?? []), adjustment];
        const penaltyPoints = adjustments.reduce((sum, a) => sum + a.delta, 0);
        return { ...t, adjustments, penaltyPoints };
      });
      writeAndBroadcast({ ...snap, teams });
    },

    async submitProof(submission) {
      const snap = readDemoSnapshot();
      const exists = snap.submissions.some((s) => s.id === submission.id);
      const submissions = exists
        ? snap.submissions.map((s) => (s.id === submission.id ? submission : s))
        : [...snap.submissions, submission];
      writeAndBroadcast({ ...snap, submissions });
    },

    async gradeSubmission(submissionId, patch) {
      const snap = readDemoSnapshot();
      const submissions = snap.submissions.map((s) =>
        s.id === submissionId ? { ...s, ...patch } : s,
      );
      writeAndBroadcast({ ...snap, submissions });
    },

    async resetAllData(keepAdminToken?: string) {
      const initial: GameSnapshot = {
        game: createDefaultGameState(keepAdminToken || 'demo-admin'),
        categories: SEED_CATEGORIES,
        tasks: buildSeedTasks(),
        teams: buildDefaultDemoTeams(),
        submissions: [],
      };
      writeAndBroadcast(initial);
    },
  };
}
