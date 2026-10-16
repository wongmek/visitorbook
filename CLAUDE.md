# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the School Visitor Book kiosk system for Thai schools, running on iPad. The system consists of:
- **Frontend**: Static site hosted on GitHub Pages (vanilla JavaScript, no build step)
- **Backend**: Google Apps Script web app that interacts with Google Sheets and Drive
- **Database**: Google Sheets (visitor records)
- **Storage**: Google Drive (visitor photos, handwriting images, signatures)
- **AI**: Anthropic Messages API (for handwriting-to-text conversion, called only from Apps Script)

The frontend and backend are decoupled; the frontend communicates with the backend via a REST-like API over HTTP.

## Development Workflow

### Frontend Development
1. Edit files in the repository root or in `js/` and `css/` directories.
2. Test locally by opening `index.html` in a browser (or use a simple static server).
3. When ready to deploy, push changes to the GitHub Pages branch (typically `main` or `gh-pages`).
4. The frontend does not require a build step; it is served as-is.

### Backend Development
1. Edit the Apps Script code in `references/apps-script/Code.gs` (or directly in the Google Apps Script editor).
2. After editing, deploy a new version via "Manage deployments" in the Apps Script editor.
3. The `/exec` URL remains the same when versioning; update the frontend's `config.js` if the URL changes (though versioning preserves the URL).

### Common Tasks
- **View prototype**: Open `assets/prototype.html` in a browser to see the reference design.
- **Update configuration**: Modify `js/config.js` to set `API_URL`, `KIOSK_TOKEN`, and `SCHOOL_NAME`.
- **Offline testing**: The frontend includes an offline outbox (IndexedDB) to queue submissions when offline.

## Code Structure

### Frontend (to be scaffolded)
```
/ (GitHub Pages root)
  index.html          # Kiosk app shell (SPA container)
  css/app.css         # Design tokens and components (extracted from prototype)
  js/config.js        # Public configuration: { API_URL, KIOSK_TOKEN, SCHOOL_NAME }
  js/api.js           # Fetch wrapper + offline outbox (handles API calls to Apps Script)
  js/pad.js           # Handwriting canvas module (ported from prototype)
  js/camera.js        # Camera consent and capture module (ported from prototype)
  js/views/*.js       # View modules: home, form, review, done, book, admin
  manifest.webmanifest # PWA manifest for "Add to Home Screen"
  sw.js               # Service worker for PWA caching and offline support
```

### Backend (Google Apps Script)
```
references/apps-script/Code.gs   # Backend skeleton (to be deployed as a web app)
```
Key endpoints in the API (all POST with `Content-Type: text/plain;charset=utf-8` except `book` which is GET):
- `recognize`: Sends white-background PNG images to Apps Script, which calls Anthropic API for transcription.
- `submit`: Sends visitor data (typed and images) to be stored in Sheets and Drive.
- `rate`, `heart`, `book`, `admin_login`, `admin_list`, `admin_image`, `admin_checkout`, `admin_reply`, `admin_delete`.

## Key Conventions
- **No typed input for visitors**: All visitor fields are handwriting pads (name, organization, phone, etc.).
- **Secrets stay server-side**: Never store API keys, Google credentials, or admin PIN in the frontend or repository.
- **Image storage**: Handwriting and signature images are stored as PNG in Drive (thumbnails publicly shared only for book display). Visitor photos are stored in a private Drive folder.
- **Visitor number**: Generated server-side as `VYYMMDD-NNN` (year, month, day, and daily sequence) under a lock to prevent collisions.
- **Consent**: Camera and PDPA consent are required; images are only stored with explicit consent.

## References
- `SKILL.md`: Detailed instructions for building, extending, or deploying the system.
- `references/ux-spec.md`: User experience specification, design tokens, and acceptance checklist.
- `references/architecture.md`: Sheet schema, API contract, privacy rules, and backend notes.
- `assets/prototype.html`: Source of truth for visual design, flow, and copy (Thai).

## Notes for Claude Code
- When implementing features, follow the workflow outlined in `SKILL.md` (Phase 1-4).
- Always verify changes on a real iPad in Safari (portrait and landscape) before considering them complete.
- The system must meet the acceptance checklist in `ux-spec.md` (e.g., visitor finishes in under 60 seconds without typing).