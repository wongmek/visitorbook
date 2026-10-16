import { app, clear } from '../main.js';
import { toast } from '../model.js';

/**
 * Render the admin view
 */
export function admin() {
  clear();
  app.innerHTML = `<div class="view">
    <h2>ผู้ดูแลระบบ</h2>
    <p>นี้คือหน้าผู้ดูแลระบบ. ในการใช้งานจริง, หน้านี้จะมีสถิติและรายการผู้เยี่ยมสำหรับผู้ดูแลระบบ.</p>
    <button class="cta" id="home">กลับหน้าแรก</button>
  </div>';
  $('#home').onclick = home;
}
}