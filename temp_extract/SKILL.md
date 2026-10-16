---
name: school-visitor-book
description: Build, extend or deploy the handwritten school visitor book kiosk (สมุดเยี่ยมโรงเรียน / หนังสือเยี่ยมโรงเรียน) for iPad, using GitHub Pages as the frontend, Google Sheets as the database and Google Drive for all captured images, with a Google Apps Script backend. Use this whenever the user mentions the visitor book, สมุดเยี่ยม, ลงชื่อเข้าเยี่ยม, iPad kiosk signature or handwriting guestbook, school visitor log, porting the prototype to GitHub Pages, Google Sheet or Google Drive storage, Apps Script backend, handwriting-to-text, or visitor photo capture, even if they do not name the skill.
---

# School Visitor Book (GitHub Pages + Google Sheets + Google Drive)

A premium, handwriting-first visitor book kiosk for a Thai school, running on an iPad. A working single-file prototype already exists. Your job is to turn it into a real, deployable system on the user's chosen stack and keep extending it.

Talk to the user in Thai unless they write in English. Keep code comments and commit messages in English.

## Fixed tech stack (do not substitute without asking)

| Layer | Choice |
|---|---|
| Frontend | Static site on **GitHub Pages** (HTTPS, so camera works). Vanilla JS modules, no build step unless the user asks. |
| Database | **Google Sheets** (one spreadsheet) |
| Images | **Google Drive** folders (all captured images: handwriting, signature, note page, visitor photo) |
| Backend | **Google Apps Script web app** bound to the sheet. It is the only thing that touches Sheets, Drive and the AI API. |
| Handwriting to text | Anthropic Messages API (vision), called **from Apps Script only**, key in Script Properties |

Why Apps Script in the middle: GitHub Pages is public static hosting. Nothing secret can live in the frontend, and the browser should not hold Google credentials or the AI key.

## Step 0: read before writing code

1. Open `assets/prototype.html`. It is the source of truth for look, flow and copy (Thai). Run it by opening the file in a browser. Note that it uses the Claude artifact runtime (`claude.use('sample')`, `localStorage`) for AI and storage; those two parts get replaced (see "What changes when porting").
2. Read `references/ux-spec.md` for the feature list, design tokens and acceptance criteria.
3. Read `references/architecture.md` for the sheet schema, API contract, privacy rules and gotchas.
4. Read `references/apps-script/Code.gs`. It is a complete backend skeleton. Adapt it rather than rewriting.

## Workflow

### Phase 1: Google backend (needs the user's hands)
Tell the user exactly which steps only they can do, in Thai, as a short numbered checklist:
1. Create a new Google Sheet, then Extensions > Apps Script. Paste `Code.gs`.
2. Run `setup()` once (authorize). It creates the `Visitors` sheet, a public Drive folder and a private Drive folder.
3. Run `setAdminPin('xxxx')` with a PIN they choose, and set Script Properties `KIOSK_TOKEN` (random string) and `ANTHROPIC_KEY`.
4. Deploy > New deployment > Web app > Execute as **Me**, Who has access **Anyone**. Copy the `/exec` URL.
5. Optionally run `installTriggers()` to enable daily photo purge.
Never ask the user to paste the Anthropic key into chat or into the repo. It goes only into Script Properties.

### Phase 2: scaffold the frontend
```
/ (repo root, served by GitHub Pages)
  index.html          kiosk app shell
  css/app.css         design tokens + components (extract from prototype)
  js/config.js        { API_URL, KIOSK_TOKEN, SCHOOL_NAME }  (public values only)
  js/api.js           fetch wrapper + offline outbox
  js/pad.js           handwriting canvas (port `pad`, `drawS` as is)
  js/camera.js        consent-based capture (port as is)
  js/views/*.js       home, form, review, done, book, admin
  manifest.webmanifest, sw.js   PWA for "Add to Home Screen" full-screen kiosk
```
Keep the prototype's visual design and Thai copy. Split it into modules; do not redesign.

### Phase 3: port feature by feature
Work in this order and verify each before moving on:
1. `api.js` + `config.js` (see `references/architecture.md` for the exact wrapper).
2. Form with handwriting pads, stamps, signature, camera consent (UI only, no network yet).
3. `recognize` then the review screen, then `submit` (saves row + uploads images).
4. Done screen: pass, map, rating (`rate` is a follow-up call that updates the row).
5. Book view reading `GET ?action=book`, hearts via `heart`.
6. Admin: PIN keypad to `admin_login`, then the **Dashboard** tab (default landing, spec in `references/ux-spec.md`), then the visitor list tab: filter, checkout, reply, delete, lazy-load private images.
7. Offline outbox, PWA, idle timeout, error states.

### Phase 4: deploy
Enable GitHub Pages (Settings > Pages, deploy from branch or via GitHub Actions). Put the final URL in the Apps Script deployment notes. Test on a real iPad in Safari, then "Add to Home Screen" and enable Guided Access for kiosk mode (tell the user how).

## What changes when porting from the prototype

| Prototype | Production |
|---|---|
| `claude.use('sample')` + `sample.json(...)` | `api.recognize({images})` which calls Apps Script, which calls the Anthropic API |
| `localStorage` (`vb_log`, `vb_school`) | Google Sheet via Apps Script; keep only an in-memory cache and the offline outbox (IndexedDB) |
| Images as data URLs inside the record | Uploaded to Drive; the sheet stores **file IDs**, never base64 |
| Admin PIN compared in the browser | PIN checked server-side; returns a short-lived admin token |
| `REQUIRE_NOTE`, `PURPOSES`, `ZONES`, `PIN` constants | Move to a `Settings` sheet or `config.js` so staff can edit without code |

## Non-negotiable rules

- **No typed input for visitors.** Name, organization, phone, who to see, car plate and the note are handwriting pads. Purpose and head count are taps. Only staff screens may use a keyboard.
- **Always store the original handwriting images**, and store the AI transcription as typed text next to them. The visitor reviews the transcription before saving and can rewrite or save without it.
- **Camera is consent-based and visible.** Opt-in checkbox, live preview with a recording indicator, one automatic capture when the visitor starts writing, flash and preview of the result, retake and delete, camera stream stopped right after. Never capture silently. Visitor photos are private (admin only, plus the visitor's own pass).
- **Secrets stay server-side.** No API keys, no Google service credentials, no admin PIN in the repo or the frontend. `KIOSK_TOKEN` in the frontend is a speed bump, not security; treat every write endpoint as publicly callable and validate and rate-limit it.
- **Apps Script runs as the owner.** Any action that takes a file ID must first confirm that ID exists in the sheet, otherwise the endpoint can read arbitrary Drive files.
- **PDPA.** Keep the consent text and timestamp per row, a retention setting (default: delete photos and field images after 30 days via trigger), and an admin delete that removes the row and trashes its Drive files.
- **Public guestbook shows only**: display name, date, note image, signature, school reply, hearts. Never phone, car plate, photo or purpose.
- Handle failure visibly: AI unavailable or slow, Drive quota, offline, rate limited. The visitor must never lose what they wrote. Queue and retry.

## Gotchas you will hit

- Apps Script web apps cannot answer CORS preflight. POST with `Content-Type: text/plain;charset=utf-8` and a JSON string body, and follow redirects. Do not send custom headers.
- Web app responses are slow (1 to 4 s cold). Show progress; never block the pad.
- Sheets converts strings to dates and numbers. Write ids and phone numbers as text (prefix with `'` or set the column format to plain text).
- Use `LockService` around "generate visitor number + append row" so two iPads cannot collide.
- Drive public thumbnails: `https://drive.google.com/thumbnail?id=FILE_ID&sz=w900` works in `<img>` only for files shared "anyone with link". Keep the private folder unshared and serve those through `admin_image` as base64.
- Safari needs a user gesture before `getUserMedia`; the consent checkbox tap is that gesture.
- Canvas export for AI: send **white background** PNGs (transparent ink on transparent background reads as black on black). Store the transparent versions.
- Re-deploying Apps Script: use "Manage deployments > Edit > New version" so the `/exec` URL stays the same.
- Verify current Anthropic model names and API fields in the official docs before hardcoding; put the model name in one constant.

## Definition of done

Run through `references/ux-spec.md` "Acceptance checklist" on a real iPad (portrait and landscape) and confirm: a visitor can finish in under 60 seconds without typing; the row appears in the Sheet with correct typed fields; all images open from Drive; photo and field images are not publicly reachable; the book shows only public fields; admin PIN works and rate-limits; offline submit syncs after reconnect; delete removes row and files.
