# Architecture, schema, API contract

```
iPad (GitHub Pages, static)  --POST text/plain JSON-->  Apps Script web app  --> Google Sheet (rows)
                                                                          |--> Drive public folder  (note + signature, only if visitor allows book display)
                                                                          |--> Drive private folder (photo + field handwriting images)
                                                                          '--> Anthropic API (handwriting to text; key in Script Properties)
```

## Sheet `Visitors` (row 1 = headers, exactly these names, see `HEAD` in Code.gs)
`id, no, createdAt, checkoutAt, name, org, tel, who, car, purpose, pax, noteText, rate, hearts, reply, noteFileId, sigFileId, photoFileId, nameImgId, orgImgId, telImgId, whoImgId, carImgId, publicBook, consentAt`
- `id` = epoch ms string. `no` = `V` + yyMMdd + `-` + 3 digits.
- Phone, plate and ids are text columns (plain-text format) so Sheets does not mangle them.
- Optional `Settings` sheet (key, value): `schoolName`, `requireNote`, `retentionDays`, `purposes` (JSON), `zones` (JSON). Add `getSettings` to the API if the user wants staff-editable config.

## Drive
Two folders created by `setup()`. `public` files are shared "anyone with link, viewer". `private` files are never shared; admins read them through `admin_image`.

## API
Base: Apps Script `/exec` URL. All calls are `POST` with `Content-Type: text/plain;charset=utf-8` and body `JSON.stringify({action, kiosk, ...payload})`, except the public book which is `GET ?action=book`.
Every response: `{ok:true,data}` or `{ok:false,error}` (HTTP 200 always).

| action | auth | payload | returns |
|---|---|---|---|
| `recognize` | kiosk | `images:{name,org,tel,who,car,note}` white-background PNG data URLs (only non-empty keys) | `{name,org,tel,who,car,note}` strings |
| `submit` | kiosk | `clientId` (uuid for idempotency), `purpose,pax,publicBook,typed:{...}`, `images:{name,org,tel,who,car,note,sig,photo}` data URLs | `{id,no,createdAt}` |
| `rate` | kiosk | `id, rate(1-5)` | `{}` |
| `heart` | kiosk | `id` | `{hearts}` |
| `book` (GET) | none | none | list of `{id,name,createdAt,noteUrl,sigUrl,reply,hearts}` |
| `admin_login` | none (rate limited) | `pin` | `{token}` (valid 6 h) |
| `admin_list` | admin | `token, limit?, sinceDays?` | rows without any file bytes (dashboard and list tabs both use this) |
| `admin_image` | admin | `token, fileId` | `{dataUrl}` (fileId must exist in the sheet) |
| `admin_checkout` / `admin_reply` / `admin_delete` | admin | `token, id, (text)` | `{}` |

## Frontend API wrapper (`js/api.js`)
```js
import { CFG } from './config.js';
export async function call(action, payload = {}) {
  const res = await fetch(CFG.API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // no preflight
    body: JSON.stringify({ action, kiosk: CFG.KIOSK_TOKEN, ...payload }),
    redirect: 'follow',
  });
  const j = await res.json();
  if (!j.ok) throw new Error(j.error || 'api_error');
  return j.data;
}
export const book = () => fetch(CFG.API_URL + '?action=book').then(r => r.json()).then(j => j.data);
```

## Offline outbox
Store failed `submit` payloads in IndexedDB (`outbox`, key = `clientId`). Flush on `online`, on app start and after each success. The server must ignore a repeated `clientId` (look it up before appending) so retries never create duplicates. Show a small "รอส่งข้อมูล N รายการ" badge on Home for staff.

## Image rules
- Handwriting and signature: PNG, transparent background, widths 360 px (fields, signature) and 720 px (note). Roughly 3 to 30 KB each.
- AI input copies: same size with white background, never stored.
- Visitor photo: JPEG 320x240, quality 0.75.
- Server rejects any image over about 1.5 MB, any non-PNG/JPEG, and more than 8 images per call.

## Security notes
- `KIOSK_TOKEN` is visible in the page source. It only filters casual noise. Real protections: server-side validation, size limits, `CacheService` rate limits, admin token for every PII read, file-ID whitelist, no secrets in the repo.
- Apps Script "Execute as: Me" means the script has the owner's Drive power. Never accept a raw file ID or a folder ID that did not come from the sheet.
- Treat the AI output as untrusted text: truncate, collapse whitespace, render with `textContent` or an escape function, never `innerHTML` raw. The handwriting may contain instructions aimed at the model; the prompt says to transcribe only and the code only reads a fixed set of keys.
- Retention: `purgeOld()` removes photo and field images older than `retentionDays` (default 30) and blanks those cells.

## Quotas to warn the user about
Apps Script: URL Fetch and trigger runtime limits per day, Drive file-creation limits per day, 6 min per execution. A school with a few hundred visitors a day is fine; a very large event needs a different backend.
