#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline/promises';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const useShell = process.platform === 'win32';

function run(cmd, args, { capture = false, allowFail = false } = {}) {
  const res = spawnSync(cmd, args, {
    cwd: repoRoot,
    shell: useShell,
    encoding: 'utf8',
    stdio: capture ? ['inherit', 'pipe', 'pipe'] : 'inherit',
  });

  if (res.status !== 0 && !allowFail) {
    const errText = capture ? (res.stderr || res.stdout || '').trim() : '';
    throw new Error(
      `Command failed: ${cmd} ${args.join(' ')}${errText ? `\n${errText}` : ''}`,
    );
  }
  return res;
}

function fb(args, opts = {}) {
  return run('npx', ['-y', 'firebase-tools', ...args], opts);
}

function randomHex(len = 4) {
  return crypto.randomBytes(Math.ceil(len / 2)).toString('hex').slice(0, len);
}

function randomToken(length = 16) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = crypto.randomBytes(length);
  let out = '';
  for (let i = 0; i < length; i++) {
    out += chars[bytes[i] % chars.length];
  }
  return out;
}

async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log('\n=== Crazy 44 Firebase Automated Setup ===\n');

  // 1. Check Firebase login
  console.log('1) Checking Firebase CLI authentication...');
  const loginCheck = fb(['login:list'], { capture: true, allowFail: true });
  const loggedIn =
    loginCheck.status === 0 &&
    !loginCheck.stdout.includes('No authorized accounts');

  if (!loggedIn) {
    console.log('Opening browser to log in to your Google / Firebase account...');
    fb(['login']);
  } else {
    console.log('   Already logged in to Firebase CLI.');
  }

  // 2. Choose / create Firebase project
  const defaultId = `crazy-44-nijmegen-${randomHex(4)}`;
  const projectInput = (
    await rl.question(
      `\n2) Enter a new Firebase Project ID (press Enter for "${defaultId}"): `,
    )
  ).trim();
  const projectId = projectInput || defaultId;

  console.log(`\nCreating Firebase project "${projectId}"...`);
  const createRes = fb(
    ['projects:create', projectId, '--display-name', 'Crazy 44'],
    { allowFail: true },
  );
  if (createRes.status !== 0) {
    console.log(
      '   (If that project already exists under your account, continuing with it...)',
    );
  }

  // 3. Create Web App & fetch SDK config
  console.log('\n3) Creating Firebase Web App & fetching config...');
  const appRes = fb(
    ['apps:create', 'WEB', 'Crazy 44 Web', '--project', projectId, '--json'],
    { capture: true, allowFail: true },
  );

  let appId = '';
  if (appRes.status === 0) {
    try {
      const parsed = JSON.parse(appRes.stdout);
      appId = parsed?.result?.appId || '';
    } catch {
      // fallback to apps:list
    }
  }

  if (!appId) {
    const listRes = fb(['apps:list', 'WEB', '--project', projectId, '--json'], {
      capture: true,
    });
    const parsed = JSON.parse(listRes.stdout);
    appId = parsed?.result?.[0]?.appId || '';
  }

  if (!appId) {
    throw new Error('Could not determine Web App ID from Firebase CLI.');
  }

  const sdkRes = fb(
    ['apps:sdkconfig', 'WEB', appId, '--project', projectId, '--json'],
    { capture: true },
  );
  const sdkParsed = JSON.parse(sdkRes.stdout);
  const sdk = sdkParsed?.result?.sdkConfig;
  if (!sdk?.apiKey || !sdk?.projectId || !sdk?.appId) {
    throw new Error(`Unexpected sdkconfig output:\n${sdkRes.stdout}`);
  }

  const firebaseConfig = {
    apiKey: sdk.apiKey,
    authDomain: sdk.authDomain || `${sdk.projectId}.firebaseapp.com`,
    projectId: sdk.projectId,
    storageBucket: sdk.storageBucket || `${sdk.projectId}.firebasestorage.app`,
    messagingSenderId: sdk.messagingSenderId || '',
    appId: sdk.appId,
  };

  // 4. Create Firestore database & deploy Firestore rules
  console.log('\n4) Provisioning Cloud Firestore (eur3) & deploying rules...');
  fb(
    [
      'firestore:databases:create',
      '(default)',
      '--location',
      'eur3',
      '--project',
      projectId,
    ],
    { allowFail: true },
  );
  fb(['deploy', '--only', 'firestore:rules', '--project', projectId]);

  // 5. Deploy Storage rules (prompt for Console one-click if Blaze/Storage not initialized)
  console.log('\n5) Deploying Firebase Storage rules...');
  const storageTry = fb(
    ['deploy', '--only', 'storage', '--project', projectId],
    { allowFail: true },
  );

  if (storageTry.status !== 0) {
    console.log('\n------------------------------------------------------------');
    console.log('Firebase Storage needs to be enabled once in the Console:');
    console.log(
      `  https://console.firebase.google.com/project/${projectId}/storage`,
    );
    console.log(
      'Click "Get started" (enable Blaze if prompted — 5 GB/day is free),',
    );
    console.log('then come back here and press Enter to deploy storage rules.');
    console.log('------------------------------------------------------------');
    await rl.question('Press Enter once Storage is enabled (or Ctrl+C to skip): ');
    fb(['deploy', '--only', 'storage', '--project', projectId], {
      allowFail: true,
    });
  }

  // 6. Write src/firebaseConfig.ts
  const configPath = path.join(repoRoot, 'src', 'firebaseConfig.ts');
  const fileContent = `import type { FirebaseConfig } from './types/game';

export const DEFAULT_FIREBASE_CONFIG: FirebaseConfig | null = ${JSON.stringify(
    firebaseConfig,
    null,
    2,
  )};
`;
  fs.writeFileSync(configPath, fileContent, 'utf8');
  console.log(`\n6) Updated ${path.relative(repoRoot, configPath)}!`);

  // 7. Commit and push to GitHub
  const pushAnswer = (
    await rl.question(
      '\n7) Commit & push src/firebaseConfig.ts to GitHub so GitHub Pages redeploys automatically? (Y/n): ',
    )
  )
    .trim()
    .toLowerCase();

  if (pushAnswer === '' || pushAnswer === 'y' || pushAnswer === 'yes') {
    run('git', ['add', 'src/firebaseConfig.ts']);
    run('git', [
      'commit',
      '-m',
      `Connect Firebase project ${firebaseConfig.projectId}`,
    ]);
    run('git', ['push', 'origin', 'main']);
    console.log('\nPushed to GitHub! GitHub Pages will redeploy in ~45 seconds.');
  }

  const adminToken = randomToken(16);
  console.log('\n============================================================');
  console.log('Setup complete!');
  console.log('Bookmark your Secret Admin URL (keep this private):');
  console.log(
    `  https://kidobricks.github.io/Crazy-44-Nijmegen-trip/#/admin?token=${adminToken}`,
  );
  console.log('============================================================\n');

  rl.close();
}

main().catch((err) => {
  console.error('\nSetup failed:', err.message || err);
  process.exit(1);
});
