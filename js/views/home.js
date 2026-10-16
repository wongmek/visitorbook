import { app, clear } from '../main.js';
import { school, esc, fmtT, fmtD, toast, timers } from '../model.js';
import { form } from './form.js';
import { book } from './book.js';
import { askPin } from './admin.js';

/**
 * Render the home view
 */
export function home() {
  clear();
  const h = new Date().getHours();
  const g = h < 12 ? 'สวัสดีตอนเช้า' : h < 17 ? 'สวัสดีตอนบ่าย' : 'สวัสดีตอนเย็น';
  app.innerHTML = `<section class="home view">
    <div class="crest"><svg viewBox="0 0 48 48"><path d="M24 10c-5-3-11-3-17-1v26c6-2 12-2 17 1 5-3 11-3 17-1V9c-6-2-12-2-17 1z"/><path d="M24 10v26"/></svg></div>
    <div class="school">${esc(school)}</div>
    <h1>สมุดเยี่ยมโรงเรียน</h1>
    <p class="hello">${g} ยินดีต้อนรับ เขียนข้อความด้วยนิ้วหรือ Apple Pencil แล้วเซ็นชื่อได้เลย</p>
    <div class="clock" id="clk"></div>
    <button class="cta" id="start">เขียนลงสมุดเยี่ยม</button><button class="ghost" id="bk">เปิดอ่านสมุดเยี่ยม</button>
  </section><button class="ghost adminlink" id="adm">ผู้ดูแลระบบ</button>`;
  const tick = () => {
    const e = $('#clk');
    if (e) e.textContent = new Date().toLocaleString('th-TH', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  tick();
  const intervalId = setInterval(tick, 20000);
  timers.push(intervalId);
  $('#start').onclick = form;
  $('#bk').onclick = book;
  $('#adm').onclick = askPin;
}