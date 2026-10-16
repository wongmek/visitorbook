import { app, clear } from '../main.js';
import { toast } from '../model.js';

/**
 * Render the review view
 * @param {Object} pend - Pending data to review
 */
export function review(pend) {
  clear();
  app.innerHTML = `<div class="view">
    <h2>ตรวจทานข้อมูลของคุณ</h2>
    <p>นี้คือหน้าตรวจทาน. ในการใช้งานจริง, หน้านี้จะแสดงภาพลายมือและข้อความที่ถอดได้เพื่อให้ผู้ใช้ตรวจสอบ.</p>
    <button class="cta" id="confirm">ยืนยันและบันทึก</button>
    <button class="ghost" id="rewrite">เขียนใหม่</button>
  </div>`;
  $('#confirm').onclick = () => finalize(/* typed data */);
  $('#rewrite').onclick = () => form(true);
}