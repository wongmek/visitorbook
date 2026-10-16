import { app, clear } from '../main.js';
import { toast } from '../model.js';

/**
 * Render the book view (public visitor book)
 */
export function book() {
  clear();
  app.innerHTML = `<div class="view">
    <h2>สมุดเยี่ยม</h2>
    <p>นี้คือหน้าสมุดเยี่ยมสาธารณะ. ในการใช้งานจริง, หน้านี้จะแสดงรายการผู้เยี่ยมที่อนุญาตให้แสดงในสมุดสาธารณะ.</p>
    <button class="cta" id="home">กลับหน้าแรก</button>
  </div>`;
  $('#home').onclick = home;
}