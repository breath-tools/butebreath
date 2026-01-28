# ButeBreath

ButeBreath is a lightweight, fully customizable **Buteyko breathing** timer built as a **local-first**, privacy-friendly web app. It is designed to help users track CO2 tolerance (Control Pause) and heart rate while practicing specific Buteyko sequences.

## Safety disclaimer

This app is for general breathing practice and tracking. It is not medical advice. Stop if you feel unwell (for example dizziness, chest pain, shortness of breath beyond normal exercise discomfort). If you have a medical condition, talk to a clinician before doing breath-hold practice.

---

## App Preview

<img src="screenshots/main-screen.png" width="400">

---

## Quick start

Just open the web app:

✅ [https://breath-tools.github.io/butebreath/](https://breath-tools.github.io/butebreath/)

No account, no setup.

---

## Install (PWA)

ButeBreath is a **Progressive Web App**, meaning it can be installed on your device for offline use and a native feel.

### Android (Chrome)

1. Open the web app.
2. Tap **⋮** -> **Install app** (or **Add to Home screen**).

### iOS (Safari)

1. Open the web app.
2. Tap **Share** -> **Add to Home Screen**.

### Desktop (Chrome / Edge)

1. Open the web app.
2. Click the **Install** icon in the address bar.

---

## Features

* **Method 1**: Based on [NormalBreathing.com](https://www.normalbreathing.com) and [Advanced Buteyko Exercises](https://www.normalbreathing.com/buteyko-exercises/).
* **Method 2**: Based on the sequences found at [breathe.adam.nz](https://breathe.adam.nz).
* **Morning CP**: Dedicated mode to record your daily baseline immediately after waking.
* **Visual Feedback**: Real-time progress ring with phase cues and a step counter.
* **14-day Morning CP chart** (latest Morning CP entry per day) to monitor long-term progress.
* **ΔCP and ΔPulse charts** show daily average change (end minus start) across all sessions that day (last 14 days). Positive ΔCP is good, negative ΔPulse is usually good.
* **Local-first**: Data is stored on your device using PouchDB.
* **CouchDB Sync**: Optional multi-device synchronization.

---

## Privacy & Offline Support

* **Privacy**: Your data stays on your device. Sync is optional and requires your own CouchDB instance.
* **Offline**: Designed to run without a network connection once loaded using a Service Worker.

---

## CouchDB Sync (Optional)

Enable sync from **Settings** using:

* CouchDB Server URL
* Database name
* Basic Auth credentials

### ⚠️ Security Warning

If you enable **Remember password**, the app stores your CouchDB password locally in a cookie for 14 days (renewed when you connect). This cookie is readable by JavaScript (this is a static app, so it cannot set an HttpOnly cookie). Use this feature only on private, trusted devices.

Notes:

* This is convenience storage, not strong protection. It does not protect against XSS, malicious browser extensions, shared OS accounts, or anyone with local browser access.
* To remove stored credentials, disable **Remember password** and clear this site’s cookies/site data in your browser settings.

---

### Auto-connect behavior

* If **Remember password** is enabled and you are online, the app will try to auto-connect to CouchDB on launch and when the device comes back online.
* If you are offline, it runs fully offline and sync resumes automatically when online.

---

## CouchDB Server Setup

To enable multi-device sync, you need your own CouchDB instance with the following configuration:

### Requirements

1. **Enable CORS** in `local.ini`:

   ```ini
   [chttpd]
   enable_cors = true

   [cors]
   origins = https://breath-tools.github.io
   credentials = true
   ```

   **Note:** Do not use `origins = *` with `credentials = true`. For local testing, set `origins` to your dev origin (for example `http://localhost:8000`).

2. **Create a user** (via admin panel or curl)

3. **Create database** named `butebreath` (or your choice)

4. **Set permissions**: Add your user to database members

5. **Use HTTPS** (required for production) - use reverse proxy like Nginx/Caddy

### Common Issues

* **CORS errors**: Enable CORS in config, restart CouchDB
* **401/403**: Check user exists and has database access
* **Mixed content**: Must use HTTPS if app is on HTTPS

---

## Project status

This is a hobby project. It may be minimally maintained and inactive for periods of time. Use at your own risk. PRs are welcome.

---

## License

This project is licensed under the GNU GPL v3. See `LICENSE.txt`.

## Third Party Notices

This project bundles the following third-party software:

### PouchDB

* Component: `pouchdb.min.js`
* Project: PouchDB
* Version: 9.0.0
* License: Apache License 2.0
* Copyright: 2012-2024 Dale Harvey and the PouchDB team
