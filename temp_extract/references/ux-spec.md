# UX spec (derived from the prototype)

## Design language
Premium ceremonial feel: deep navy and champagne gold on ivory paper. Thai-first.
- Tokens: `--bg #0b1930`, `--bg2 #13294b`, `--gold #e2c48a`, `--gold2 #b8924f`, `--text #f5f0e4`, `--mut #a7b3c8`, `--paper #f8f3e8`, `--ink #14284b`, `--ok #86d8ae`, `--bad #f39b9b`. Light-mode variants exist in the prototype (`prefers-color-scheme`).
- Fonts: Noto Serif Thai (headings, numbers), Noto Sans Thai (body).
- Touch targets at least 52px. Large type. Handwriting surfaces look like real paper (ivory, inner gold keyline, ruled lines on the note page).
- Motion only where it answers a tap or explains something: check-mark draw, route dashes, shutter flash, page spread fade.

## Visitor flow
1. **Home**: crest, school name, time-of-day greeting, live clock, "เขียนลงสมุดเยี่ยม", "เปิดอ่านสมุดเยี่ยม", small "ผู้ดูแลระบบ" link.
2. **Form** (no keyboard): five handwriting pads (ชื่อ-นามสกุล required, หน่วยงาน/ที่อยู่, เบอร์โทรศัพท์, ติดต่อใคร/ฝ่ายไหน, ทะเบียนรถ), head-count stepper, purpose chips (ติดต่อครู/ฝ่ายบริหาร, ผู้ปกครองเยี่ยมชม, รับ-ส่งนักเรียน, ศึกษาดูงาน, ช่าง/ส่งสินค้า, อื่นๆ), optional camera consent card, ruled **note page** (4 ink colors, 3 widths, emoji stamps, undo, clear), signature pad, PDPA consent, save.
3. **Recognize**: spinner "กำลังอ่านลายมือของคุณ", with "ข้ามขั้นตอนนี้" (aborts the AI call, saves images only).
4. **Review**: each handwriting image next to its typed transcription; unreadable shows "(อ่านไม่ออก)". Buttons: "ถูกต้อง บันทึกเลย", "เขียนใหม่" (returns to the form with all strokes, photo, purpose, count preserved), "บันทึกโดยไม่ใช้ตัวพิมพ์".
5. **Done**: animated check, visitor pass (number like `V261015-001`, nth visitor today, purpose, who, time, photo as round badge), 5-face rating, campus map with animated route from the gate to the destination (picked from the typed "who" and purpose; visitor can tap another building), back button. Auto-return to Home after 45 s idle.
6. **Book**: spread of ruled pages (2 on wide, 1 on narrow) with the handwritten note, name, date, small signature, school reply, heart counter. Public fields only.
7. **Admin** (PIN keypad): stats (today, still inside, total), search, filter (all/today/inside), per-visitor card with handwriting images, typed fields, photo, note text, rating, hearts; actions: record check-out, reply (staff typing allowed), delete (two-tap confirm); copy today's summary; edit school name.

## Admin dashboard ("ภาพรวมการเยี่ยมชม", default tab after PIN)
Answers one question for staff: who has come to the school, and who is here now.
- Header line: today's date, last updated time, auto refresh every 30 s (poll `admin_list`; pause polling when the tab is hidden).
- Four stat cards: visitors signed in today (with total head count), still inside the school, last 7 days, average impression rating (face + number).
- Bar chart: visitors per day for the last 7 days (Thai weekday labels).
- Bar chart: sign-ins by hour today (06:00 to 18:00).
- Horizontal bars: by purpose (all time, later add a 7/30-day toggle).
- "กำลังอยู่ในโรงเรียน" list: photo badge (or initial), name (handwriting image when no typed name), purpose, organization, who they came to see, time inside ("อยู่มา 1 ชม. 12 นาที"), button "ออกแล้ว" that calls `admin_checkout`.
- "ลงชื่อล่าสุด": the latest 8 sign-ins with time.
- Compute everything client-side from `admin_list` (use `sinceDays: 7` for the charts and a separate lightweight count for all-time). If the sheet grows past about 1,000 rows, add an `admin_stats` action that aggregates in Apps Script and returns only numbers.
- Optional later: a read-only **lobby display** mode (big text, names and purpose only, no phone, no photo) for a TV at the front office, and a day picker plus CSV export for monthly reports.

## Visitor number
`V` + `yyMMdd` + `-` + 3-digit sequence per day, generated server-side under a lock.

## Map zones (editable config)
admin (อาคารอำนวยการ), acad (อาคารเรียน 1), stu (อาคารกิจการนักเรียน), canteen (โรงอาหาร), med (ห้องพยาบาล). The layout is a placeholder; ask the user for the real campus buildings and rebuild the SVG and the keyword matcher.

## Photo capture rules
Opt-in checkbox with plain explanation, live preview with "● กล้องเปิดอยู่", auto-capture once 600 ms after the first pen-down on the note page, flash, preview, "ถ่ายใหม่" (3-2-1 countdown), "ลบภาพ", stop all tracks right after capture and on any navigation. If the camera is unavailable show a message and let the visitor continue.

## Acceptance checklist
- [ ] Finish a visit in under 60 s with no keyboard.
- [ ] Rewrite from Review keeps every stroke.
- [ ] Skipping or failing AI still saves all images and a usable row.
- [ ] Row in Sheet: typed fields, `noteText`, file IDs, consent timestamp, correct visitor number.
- [ ] Two iPads submitting at once never get the same number.
- [ ] Public book call never returns tel, car, purpose, photo or private image IDs.
- [ ] Wrong PIN 5 times locks admin login for 10 minutes.
- [ ] Offline submit is queued and delivered after reconnect, no duplicates.
- [ ] Camera stops (indicator off) after capture, cancel and page change.
- [ ] Admin delete removes the row and trashes the Drive files.
- [ ] Works in portrait and landscape, light and dark, with reduced motion.
