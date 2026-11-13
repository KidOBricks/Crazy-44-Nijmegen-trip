# Crazy 44 — Scavenger Hunt Web App

A mobile-first live scavenger hunt web application with separate **Admin** and **Participant (Team)** views, built with React, TypeScript, Vite, and Firebase, and auto-deployed to **GitHub Pages**.

## Live URL

Once GitHub Pages is enabled (**Settings → Pages → Source: GitHub Actions**), your site will be available at:

```
https://kidobricks.github.io/Crazy-44-Nijmegen-trip/
```

---

## Features

- **Admin Panel (`#/admin?token=...`)**:
  - **Tasks & Categories**: Pre-seeded with 35 starter tasks across 4 categories. Add categories, add tasks (1–44), configure points (default `1`), upload reference images, and click any task to edit and push live instantly.
  - **Live Grading & Phone Alerts**: Sticky top-of-screen alert banner + chime/vibration + browser notifications + optional `ntfy.sh` locked-screen phone push whenever a team uploads proof. Submissions are organized with **Graded / Marked at the top** and **Unmarked at the bottom**, supporting **Approve**, **+1 Bonus**, **Reject (Redo with feedback)**, manual point overrides, and team penalties (`-5`, etc.).
  - **Teams & Game Control**: Create numbered teams (`1`, `2`, `3`, `4`+) with custom names and colors (preset swatches + color wheel), generate custom shareable team links & QR codes, Start/End game with configurable timer, and inspect interactive **End Game** visualizations (podium, score bar chart, category breakdown, timeline, team media reels, and side-by-side task comparisons).
- **Participant View (`#/team/:teamId?t=...`)**:
  - Waiting lobby with team badge & Rules modal before the game starts.
  - Categorized tasks (`1..N`) with automatic photo compression and mobile photo/video upload.
  - Separate **Completed Tasks** tab (`Pending` allows re-uploading; `Approved` locks; `Rejected` returns to **Tasks** with a red **Redo** banner).
  - Automatic final podium & scores when the organizer ends the game.

---

## 3-Minute Firebase Setup (Required for Multi-Phone Live Sync)

1. Go to [Firebase Console](https://console.firebase.google.com/) and create a project.
2. Add a **Web App** (`</>`) and copy the `firebaseConfig` object.
3. Enable **Cloud Firestore** (in **Build → Firestore Database**) and paste these rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

4. **Photo & Video Uploads (100% Free, No Billing Card Needed)**:
   - **Photos** already work out-of-the-box for free on Firebase Spark (compressed and stored in Firestore).
   - For **Video uploads** without upgrading Firebase to Blaze, create a free [Cloudinary](https://cloudinary.com/) account (no card required) → **Settings → Upload → Add upload preset** (Signing Mode: **Unsigned**) → enter your **Cloud Name** and **Upload Preset** in **Admin → Settings**.
   - *(Optional)* If you already have Firebase Blaze enabled, you can instead enable Firebase Storage and paste `storage.rules`.

5. Open the deployed site, paste your `firebaseConfig` snippet on the home screen (or hardcode it in `src/firebaseConfig.ts` and push), and bookmark your generated `#/admin?token=...` URL!

### Optional: Locked-Screen Phone Push Alerts (`ntfy.sh`)
1. Install the free **ntfy** app on iOS or Android.
2. Subscribe to a unique private topic name (e.g. `crazy44-nijmegen-9821`).
3. Enter that same topic name in **Admin → Settings** and save. Every team upload will send a push notification directly to your phone even when locked.

---

## Local Development & Tests

```bash
npm install
npm test -- --run
npm run dev
```
