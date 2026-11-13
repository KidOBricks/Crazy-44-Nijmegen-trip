#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline/promises';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const isWin = process.platform === 'win32';

function formatArg(arg) {
  if (!isWin) return arg;
  if (/[\s"&|<>^()]/.test(arg)) {
    return `"${arg.replace(/"/g, '\\"')}"`;
  }
  return arg;
}

function run(cmd, args, { capture = false, allowFail = false } = {}) {
  const finalArgs = isWin ? args.map(formatArg) : args;
  const res = spawnSync(cmd, finalArgs, {
    cwd: repoRoot,
    shell: isWin,
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

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
  const listProjects = fb(['projects:list', '--json'], {
    capture: true,
    allowFail: true,
  });
  let existingProjects = [];
  if (listProjects.status === 0) {
    try {
      const parsed = JSON.parse(listProjects.stdout);
      existingProjects = (parsed?.result || []).map((p) => p.projectId);
    } catch {
      // ignore
    }
  }

  const existingCrazy = existingProjects.find((id) =>
    id.startsWith('crazy-44'),
  );
  const defaultId = existingCrazy || `crazy-44-nijmegen-${randomHex(4)}`;

  const projectInput = (
    await rl.question(
      `\n2) Enter a new or existing Firebase Project ID (press Enter for "${defaultId}"): `,
    )
  ).trim();
  const projectId = projectInput || defaultId;
  const projectExists = existingProjects.includes(projectId);

  if (!projectExists) {
    console.log(`\nCreating Firebase project "${projectId}"...`);
    const createRes = fb(
      ['projects:create', projectId, '--display-name', 'Crazy 44'],
      { capture: true, allowFail: true },
    );

    if (createRes.status !== 0) {
      const msg = (createRes.stderr || createRes.stdout || '').trim();
      console.error('\nCould not create Firebase project automatically:');
      if (msg) console.error(msg);
      console.log('\n------------------------------------------------------------');
      console.log('Create the project in your browser:');
      console.log('  https://console.firebase.google.com/');
      console.log(`Use Project ID "${projectId}", then press Enter here.`);
      console.log('------------------------------------------------------------');
      await rl.question('Press Enter once the project exists in Firebase Console: ');
    } else {
      console.log('   Project created! Waiting 5 seconds for IAM propagation...');
      await sleep(5000);
    }
  } else {
    console.log(`\n   Using existing Firebase project "${projectId}".`);
  }

  // 3. Create or reuse Web App & fetch SDK config
  console.log('\n3) Ensuring Firebase Web App exists & fetching config...');
  let appId = '';
  const listAppsRes = fb(['apps:list', 'WEB', '--project', projectId, '--json'], {
    capture: true,
    allowFail: true,
  });
  if (listAppsRes.status === 0) {
    try {
      const parsed = JSON.parse(listAppsRes.stdout);
      appId = parsed?.result?.[0]?.appId || '';
    } catch {
      // ignore
    }
  }

  if (!appId) {
    const appRes = fb(
      ['apps:create', 'WEB', 'Crazy-44-Web', '--project', projectId, '--json'],
      { capture: true, allowFail: true },
    );
    if (appRes.status === 0) {
      try {
        const parsed = JSON.parse(appRes.stdout);
        appId = parsed?.result?.appId || '';
      } catch {
        // ignore
      }
    }
  }

  if (!appId) {
    await sleep(2000);
    const retryList = fb(['apps:list', 'WEB', '--project', projectId, '--json'], {
      capture: true,
    });
    const parsed = JSON.parse(retryList.stdout);
    appId = parsed?.result?.[0]?.appId || '';
  }

  if (!appId) {
    throw new Error('Could not find or create a Web App in Firebase project.');
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

  // Write src/firebaseConfig.ts right away so config is never lost
  const configPath = path.join(repoRoot, 'src', 'firebaseConfig.ts');
  const fileContent = `import type { FirebaseConfig } from './types/game';

export const DEFAULT_FIREBASE_CONFIG: FirebaseConfig | null = ${JSON.stringify(
    firebaseConfig,
    null,
    2,
  )};
`;
  fs.writeFileSync(configPath, fileContent, 'utf8');
  console.log(`   Saved config to ${path.relative(repoRoot, configPath)}!`);

  // 4. Provision Cloud Firestore & deploy rules (with Console fallback)
  console.log('\n4) Setting up Cloud Firestore & rules...');
  const dbCreate = fb(
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

  let fsRulesRes = fb(
    ['deploy', '--only', 'firestore:rules', '--project', projectId],
    { allowFail: true },
  );

  if (dbCreate.status !== 0 || fsRulesRes.status !== 0) {
    console.log('\n------------------------------------------------------------');
    console.log('Google requires enabling Firestore once in the Firebase Console:');
    console.log(
      `  https://console.firebase.google.com/project/${projectId}/firestore`,
    );
    console.log('1. Click "Create database" -> Standard edition -> eur3 (europe-west).');
    console.log('2. Choose "Start in test mode" (or Production mode) and click Create.');
    console.log('3. Come back here and press Enter to deploy firestore.rules.');
    console.log('------------------------------------------------------------');
    await rl.question('Press Enter once Firestore is created (or type "skip"): ');
    fsRulesRes = fb(
      ['deploy', '--only', 'firestore:rules', '--project', projectId],
      { allowFail: true },
    );
    if (fsRulesRes.status !== 0) {
      console.log(
        '   Note: If rules deploy failed, paste firestore.rules in the Firestore -> Rules tab in Console.',
      );
    }
  }

  // 5. Deploy Storage rules (with Console fallback)
  console.log('\n5) Setting up Firebase Storage & rules...');
  let storageTry = fb(['deploy', '--only', 'storage', '--project', projectId], {
    allowFail: true,
  });

  if (storageTry.status !== 0) {
    console.log('\n------------------------------------------------------------');
    console.log('Firebase Storage needs to be enabled once in the Console:');
    console.log(
      `  https://console.firebase.google.com/project/${projectId}/storage`,
    );
    console.log(
      'Click "Get started" (enable Blaze if prompted — 5 GB/day is free),',
    );
    console.log('then come back here and press Enter to deploy storage.rules.');
    console.log('------------------------------------------------------------');
    await rl.question('Press Enter once Storage is enabled (or press Enter to skip): ');
    storageTry = fb(['deploy', '--only', 'storage', '--project', projectId], {
      allowFail: true,
    });
    if (storageTry.status !== 0) {
      console.log(
        '   Note: If storage rules deploy failed, paste storage.rules in the Storage -> Rules tab in Console.',
      );
    }
  }

  // 6. Commit and push to GitHub
  const pushAnswer = (
    await rl.question(
      '\n6) Commit & push src/firebaseConfig.ts to GitHub so GitHub Pages redeploys automatically? (Y/n): ',
    )
  )
    .trim()
    .toLowerCase();

  if (pushAnswer === '' || pushAnswer === 'y' || pushAnswer === 'yes') {
    run('git', ['add', 'src/firebaseConfig.ts']);
    const diffCheck = run('git', ['diff', '--cached', '--quiet'], {
      allowFail: true,
    });
    if (diffCheck.status !== 0) {
      run('git', [
        'commit',
        '-m',
        `Connect Firebase project ${firebaseConfig.projectId}`,
      ]);
      run('git', ['push', 'origin', 'main']);
      console.log('\nPushed to GitHub! GitHub Pages will redeploy in ~45 seconds.');
    } else {
      console.log('\nsrc/firebaseConfig.ts is already up to date.');
    }
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
