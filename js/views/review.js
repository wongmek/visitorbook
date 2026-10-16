import { app, clear } from '../main.js';
import { toast } from '../model.js';
import { form } from './form.js';
import { done } from './done.js';

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

  // Simple finalize function for now - in real implementation, this would
  // submit the form data via API and then show done view with actual data
  const finalize = (typedData) => {
    // For now, just show done view with placeholder data
    // In real implementation, typedData would contain the form data
    // and we would call api.call('submit', { ...typedData, ... })
    const placeholderRecord = {
      id: 'temp-' + Date.now(),
      no: 'V' + new Date().toLocaleString('th-TH', { year: '2-digit', month: '2-digit', day: '2-digit' })+'-001',
      createdAt: new Date(),
      name: 'ผู้ทดสอบ',
      org: 'ทดสอบ',
      tel: '080-000-0000',
      who: 'ทดสอบ',
      car: 'ทดสอบ',
      purpose: 'ทดสอบ',
      pax: 1,
      noteText: 'นี่คือข้อความทดสอบ',
      rate: '',
      hearts: 0,
      reply: '',
      noteFileId: '',
      sigFileId: '',
      photoFileId: '',
      nameImgId: '',
      orgImgId: '',
      telImgId: '',
      whoImgId: '',
      carImgId: '',
      publicBook: true,
      consentAt: new Date()
    };

    done(placeholderRecord);
  };

  $('#confirm').onclick = () => finalize({});
  $('#rewrite').onclick = () => form(true);
}