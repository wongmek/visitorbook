/**
 * School Visitor Book backend (Google Apps Script, bound to the Google Sheet).
 * Deploy: Deploy > New deployment > Web app > Execute as: Me, Who has access: Anyone.
 * One-time: run setup(), setAdminPin('1234'), then set Script Properties KIOSK_TOKEN and ANTHROPIC_KEY.
 */
const MODEL = 'claude-sonnet-5-5'; // verify current model names in the Anthropic docs
const HEAD = ['id','no','createdAt','checkoutAt','name','org','tel','who','car','purpose','pax','noteText','rate','hearts','reply','noteFileId','sigFileId','photoFileId','nameImgId','orgImgId','telImgId','whoImgId','carImgId','publicBook','consentAt'];
const IMG_COLS = ['noteFileId','sigFileId','photoFileId','nameImgId','orgImgId','telImgId','whoImgId','carImgId'];
const FIELD_KEYS = ['name','org','tel','who','car'];
const MAX_B64 = 2000000;
const P = () => PropertiesService.getScriptProperties();

/* ---------- one-time setup ---------- */
function setup() {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName('Visitors') || ss.insertSheet('Visitors');
  sh.getRange(1, 1, 1, HEAD.length).setValues([HEAD]).setFontWeight('bold');
  sh.setFrozenRows(1);
  ['id','no','tel','car','noteFileId','sigFileId','photoFileId','nameImgId','orgImgId','telImgId','whoImgId','carImgId']
    .forEach(h => sh.getRange(2, HEAD.indexOf(h) + 1, sh.getMaxRows() - 1, 1).setNumberFormat('@'));
  if (!P().getProperty('PUBLIC_FOLDER')) P().setProperty('PUBLIC_FOLDER', DriveApp.createFolder('visitor-book-public').getId());
  if (!P().getProperty('PRIVATE_FOLDER')) P().setProperty('PRIVATE_FOLDER', DriveApp.createFolder('visitor-book-private').getId());
  if (!P().getProperty('RETENTION_DAYS')) P().setProperty('RETENTION_DAYS', '30');
}
function setAdminPin(pin) {
  const salt = Utilities.getUuid();
  P().setProperty('PIN_SALT', salt);
  P().setProperty('PIN_HASH', hash(salt + pin));
}
function installTriggers() {
  ScriptApp.getProjectTriggers().forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('purgeOld').timeBased().everyDays(1).atHour(2).create();
}
function hash(s) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, s)
    .map(b => (b < 0 ? b + 256 : b).toString(16).padStart(2, '0')).join('');
}

/* ---------- routing ---------- */
const ACTIONS = { recognize, submit, rate, heart, admin_login, admin_list, admin_image, admin_checkout, admin_reply, admin_delete };
const KIOSK = ['recognize', 'submit', 'rate', 'heart'];

function doGet(e) {
  if (e.parameter.action === 'book') return out({ ok: true, data: bookList() });
  return out({ ok: true, data: 'school-visitor-book' });
}
function doPost(e) {
  try {
    const req = JSON.parse(e.postData.contents);
    const h = ACTIONS[req.action];
    if (!h) throw new Error('unknown_action');
    if (KIOSK.includes(req.action) && req.kiosk !== P().getProperty('KIOSK_TOKEN')) throw new Error('forbidden');
    if (req.action.startsWith('admin_') && req.action !== 'admin_login') requireAdmin(req);
    return out({ ok: true, data: h(req) });
  } catch (err) {
    return out({ ok: false, error: String(err.message || err) });
  }
}
function out(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

/* ---------- helpers ---------- */
function sheet() { return SpreadsheetApp.getActive().getSheetByName('Visitors'); }
function table() {
  const sh = sheet(), n = sh.getLastRow();
  if (n < 2) return [];
  return sh.getRange(2, 1, n - 1, HEAD.length).getValues().map((r, i) => {
    const o = { _row: i + 2 }; HEAD.forEach((h, j) => o[h] = r[j]); return o;
  });
}
function setCell(row, h, v) { sheet().getRange(row, HEAD.indexOf(h) + 1).setValue(v); }
function findRow(id) {
  const r = table().find(x => String(x.id) === String(id));
  if (!r) throw new Error('not_found');
  return r;
}
function limit(key, max, secs) {
  const c = CacheService.getScriptCache(), n = +(c.get(key) || 0);
  if (n >= max) throw new Error('rate_limited');
  c.put(key, String(n + 1), secs);
}
function clean(v, max) { return String(v == null ? '' : v).replace(/\s+/g, ' ').trim().slice(0, max); }
function parseImg(dataUrl) {
  const m = /^data:(image\/(?:png|jpeg));base64,([A-Za-z0-9+\/=]+)$/.exec(dataUrl || '');
  if (!m || m[2].length > MAX_B64) throw new Error('bad_image');
  return { mime: m[1], b64: m[2] };
}
function saveImg(dataUrl, name, isPublic) {
  if (!dataUrl) return '';
  const im = parseImg(dataUrl);
  const folder = DriveApp.getFolderById(P().getProperty(isPublic ? 'PUBLIC_FOLDER' : 'PRIVATE_FOLDER'));
  const file = folder.createFile(Utilities.newBlob(Utilities.base64Decode(im.b64), im.mime, name));
  if (isPublic) file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return file.getId();
}
const thumb = id => id ? 'https://drive.google.com/thumbnail?id=' + id + '&sz=w900' : '';
function trash(id) { try { if (id) DriveApp.getFileById(id).setTrashed(true); } catch (e) {} }

/* ---------- kiosk actions ---------- */
function recognize(req) {
  limit('rl:rec', 20, 60);
  const keys = Object.keys(req.images || {}).filter(k => FIELD_KEYS.concat('note').includes(k));
  if (!keys.length || keys.length > 6) throw new Error('bad_request');
  // Return empty strings for all fields since transcription is disabled
  // Images are saved directly via submit() function
  const d = {};
  keys.forEach(k => d[k] = '');
  return d;
}

function submit(req) {
  limit('rl:submit', 30, 60);
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const clientId = clean(req.clientId, 64);
    if (clientId) { const dup = table().find(r => String(r.id) === clientId); if (dup) return { id: dup.id, no: dup.no, createdAt: dup.createdAt }; }
    const now = new Date(), tz = Session.getScriptTimeZone();
    const day = Utilities.formatDate(now, tz, 'yyMMdd');
    const seq = table().filter(r => String(r.no).indexOf('V' + day) === 0).length + 1;
    const no = 'V' + day + '-' + String(seq).padStart(3, '0');
    const id = clientId || String(now.getTime());
    const pub = req.publicBook !== false, im = req.images || {}, t = req.typed || {};
    const row = {
      id, no, createdAt: now, checkoutAt: '', name: clean(t.name, 80) || 'ผู้เยี่ยม', org: clean(t.org, 80), tel: clean(t.tel, 30), who: clean(t.who, 80), car: clean(t.car, 30),
      purpose: clean(req.purpose, 60), pax: Math.max(1, Math.min(30, +req.pax || 1)), noteText: clean(t.note, 600), rate: '', hearts: 0, reply: '',
      noteFileId: saveImg(im.note, no + '-note.png', pub), sigFileId: saveImg(im.sig, no + '-sig.png', pub),
      photoFileId: saveImg(im.photo, no + '-photo.jpg', false),
      nameImgId: saveImg(im.name, no + '-name.png', false), orgImgId: saveImg(im.org, no + '-org.png', false),
      telImgId: saveImg(im.tel, no + '-tel.png', false), whoImgId: saveImg(im.who, no + '-who.png', false), carImgId: saveImg(im.car, no + '-car.png', false),
      publicBook: pub, consentAt: now,
    };
    sheet().appendRow(HEAD.map(h => row[h]));
    return { id, no, createdAt: now };
  } finally { lock.releaseLock(); }
}
function rate(req) { const r = findRow(req.id), n = +req.rate; if (n >= 1 && n <= 5) setCell(r._row, 'rate', n); return {}; }
function heart(req) {
  limit('rl:heart', 120, 60);
  const lock = LockService.getScriptLock(); lock.waitLock(10000);
  try { const r = findRow(req.id); const n = (+r.hearts || 0) + 1; setCell(r._row, 'hearts', n); return { hearts: n }; }
  finally { lock.releaseLock(); }
}
function bookList() {
  return table().filter(r => r.noteFileId && r.publicBook === true)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 300)
    .map(r => ({ id: r.id, name: r.name, createdAt: r.createdAt, noteUrl: thumb(r.noteFileId), sigUrl: thumb(r.sigFileId), reply: r.reply, hearts: +r.hearts || 0 }));
}

/* ---------- admin ---------- */
function admin_login(req) {
  const c = CacheService.getScriptCache();
  if (+(c.get('pinfail') || 0) >= 5) throw new Error('locked');
  if (hash(P().getProperty('PIN_SALT') + clean(req.pin, 12)) !== P().getProperty('PIN_HASH')) {
    c.put('pinfail', String(+(c.get('pinfail') || 0) + 1), 600); throw new Error('bad_pin');
  }
  const token = Utilities.getUuid(); c.put('adm:' + token, '1', 21600); return { token };
}
function requireAdmin(req) { if (!CacheService.getScriptCache().get('adm:' + req.token)) throw new Error('unauthorized'); }
function admin_list(req) {
  const since = req.sinceDays ? Date.now() - (+req.sinceDays) * 86400000 : 0;
  return table().filter(r => new Date(r.createdAt).getTime() >= since)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, Math.min(+req.limit || 300, 1000))
    .map(r => { const o = {}; HEAD.forEach(h => o[h] = r[h]); o.hasPhoto = !!r.photoFileId; return o; });
}
function admin_image(req) {
  const ok = table().some(r => IMG_COLS.some(c => r[c] && r[c] === req.fileId));
  if (!ok) throw new Error('not_found');
  const b = DriveApp.getFileById(req.fileId).getBlob();
  return { dataUrl: 'data:' + b.getContentType() + ';base64,' + Utilities.base64Encode(b.getBytes()) };
}
function admin_checkout(req) { setCell(findRow(req.id)._row, 'checkoutAt', new Date()); return {}; }
function admin_reply(req) { setCell(findRow(req.id)._row, 'reply', clean(req.text, 400)); return {}; }
function admin_delete(req) {
  const lock = LockService.getScriptLock(); lock.waitLock(10000);
  try { const r = findRow(req.id); IMG_COLS.forEach(c => trash(r[c])); sheet().deleteRow(r._row); return {}; }
  finally { lock.releaseLock(); }
}

/* ---------- retention (daily trigger) ---------- */
function purgeOld() {
  const days = +P().getProperty('RETENTION_DAYS') || 30, cutoff = Date.now() - days * 86400000;
  table().forEach(r => {
    if (new Date(r.createdAt).getTime() > cutoff) return;
    ['photoFileId','nameImgId','orgImgId','telImgId','whoImgId','carImgId'].forEach(c => { if (r[c]) { trash(r[c]); setCell(r._row, c, ''); } });
  });
}
