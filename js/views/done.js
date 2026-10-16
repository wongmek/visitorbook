import { app, clear } from '../main.js';
import { toast } from '../model.js';

/**
 * Render the done view
 * @param {Object} r - Visitor record
 */
export function done(r) {
  clear();
  app.innerHTML = `<div class="view">
    <h2>บันทึกสำเร็จ</h2>
    <p>ขอบคุณที่มาเยี่ยม. ในการใช้งานจริง, หน้านี้จะแสดงบัตรผ่านและข้อมูลสรุปการเยี่ยมชม.</p>
    <button class="cta" id="home">กลับหน้าแรก</button>
  </div>`;
  $('#home').onclick = home;
}