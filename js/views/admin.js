import { app, clear } from '../main.js';
import { toast } from '../model.js';
import * as api from '../api.js';

/**
 * Render the admin view
 */
export function admin() {
  clear();
  app.innerHTML = `<div class="view">
    <h2>ผู้ดูแลระบบ</h2>
    <p>นี้คือหน้าผู้ดูแลระบบ. ในการใช้งานจริง, หน้านี้จะมีสถิติและรายการผู้เยี่ยมสำหรับผู้ดูแลระบบ.</p>
    <button class="cta" id="home">กลับหน้าแรก</button>
  </div>`;
  $('#home').onclick = home;
}

/**
 * Prompt for admin PIN and login
 */
export function askPin() {
  const pin = prompt('กรุณาใส่รหัสผู้ดูแลระบบ:');
  if (pin === null) { // User cancelled
    return;
  }

  api.call('admin_login', { pin })
    .then(result => {
      if (result.token) {
        // PIN is valid, show admin view
        admin();
      } else {
        toast('รหัสผ่านไม่ถูกต้อง');
      }
    })
    .catch(err => {
      toast('เกิดข้อผิดพลาด: ' + err.message);
    });
}