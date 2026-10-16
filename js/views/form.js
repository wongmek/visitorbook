import { app, clear } from '../main.js';
import { home } from './home.js';
import {
  school,
  esc,
  fmtT,
  fmtD,
  sameDay,
  toast,
  $,
  timers,
  mem,
  store, log
} from '../model.js';
import { PURPOSES } from '../config.js';
import { pad } from '../pad.js';
import { camStream, photo, snapping, stopCam, startCam, snap } from '../camera.js';
// Note: We also need to import the drawS function? Not directly used in form, but pad uses it.
// We also need to import the INKS array? We'll get it from pad.js if needed.

/**
 * Render the form view
 * @param {boolean} keep - Whether to keep the current state when returning to form
 */
export function form(keep) {
  clear();
  if (!keep) {
    // Reset form state
    purpose = '';
    pax = 1;
    photo = '';
    saved = {};
    cons = false;
  }
  // Note: In the prototype, there were many variables defined here: purpose, pax, photo, saved, cons, pend, N, G, P, FIELDS, LAB, toBlob, etc.
  // For simplicity, we'll define them locally, but note that some functions like pad and stopCam are imported.
  // We'll follow the prototype's structure but adjust for imports.

  // Create the form UI with handwriting pads, camera, purpose selection, etc.
  app.innerHTML = `<div class="view">
    <div class="form-row">
      <label>ชื่อ:</label>
      <div class="pad-container">
        <canvas class="pad" id="namePad"></canvas>
        <div class="hint" id="nameHint">เขียนชื่อที่นี่</div>
      </div>
    </div>

    <div class="form-row">
      <label>องค์กร:</label>
      <div class="pad-container">
        <canvas class="pad" id="orgPad"></canvas>
        <div class="hint" id="orgHint">เขียนองค์กรที่นี่</div>
      </div>
    </div>

    <div class="form-row">
      <label>เบอร์โทร:</label>
      <div class="pad-container">
        <canvas class="pad" id="telPad"></canvas>
        <div class="hint" id="telHint">เขียนเบอร์โทรที่นี่</div>
      </div>
    </div>

    <div class="form-row">
      <label>ใครมาพบ:</label>
      <div class="pad-container">
        <canvas class="pad" id="whoPad"></canvas>
        <div class="hint" id="whoHint">เขียนชื่อผู้ที่มาพบที่นี่</div>
      </div>
    </div>

    <div class="form-row">
      <label>รถ:</label>
      <div class="pad-container">
        <canvas class="pad" id="carPad"></canvas>
        <div class="hint" id="carHint">เขียนทะเบียนรถที่นี่</div>
      </div>
    </div>

    <div class="form-row">
      <label>วัตถุประสงค์:</label>
      <div class="purpose-buttons">
        ${PURPOSES.map(p => `<button class="purpose-btn">${p}</button>`).join('')}
      </div>
    </div>

    <div class="form-row">
      <label>จำนวนคน:</label>
      <div class="pax-selector">
        <button class="pax-btn dec">−</button>
        <span class="pax-display">${pax}</span>
        <button class="pax-btn inc">+</button>
      </div>
    </div>

    <div class="form-row camera-section">
      <div class="camera-consent">
        <input type="checkbox" id="camConsent">
        <label for="camConsent">อนุญาตใช้กล้องถ่ายรูป</label>
      </div>
      <div class="camera-preview">
        <video id="cvid" hidden></video>
        <div id="cimg" class="camera-image" hidden></div>
        <div id="cmsg" class="camera-message">กรุณาตกลงให้สิทธิ์กล้องเพื่อใช้งานฟีเจอร์นี้</div>
        <button class="cta" id="camOn">เปิดกล้อง</button>
        <button class="cta" id="camOff" hidden>ปิดกล้อง</button>
      </div>
    </div>

    <div class="form-row">
      <label>ลายเซ็น:</label>
      <div class="pad-container">
        <canvas class="pad" id="sigPad"></canvas>
        <div class="hint" id="sigHint">ลงลายเซ็นที่นี่</div>
      </div>
    </div>

    <div class="form-row">
      <button class="cta" id="submitBtn">บันทึกและตรวจทาน</button>
    </div>

    <button class="cta" id="backToHome">กลับหน้าแรก</button>
  </div>`;

  // Initialize handwriting pads
  const namePad = pad($('#namePad'), $('#nameHint'), '#000000', 1.5);
  const orgPad = pad($('#orgPad'), $('#orgHint'), '#000000', 1.5);
  const telPad = pad($('#telPad'), $('#telHint'), '#000000', 1.5);
  const whoPad = pad($('#whoPad'), $('#whoHint'), '#000000', 1.5);
  const carPad = pad($('#carPad'), $('#carHint'), '#000000', 1.5);
  const sigPad = pad($('#sigPad'), $('#sigHint'), '#000000', 1.5);

  // Initialize purpose selection
  let selectedPurpose = '';
  const purposeButtons = $$('.purpose-btn');
  purposeButtons.forEach(btn => {
    btn.onclick = () => {
      purposeButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedPurpose = btn.textContent;
      purpose = selectedPurpose;
    };
  });

  // Initialize PAX selector
  const paxDisplay = $('.pax-display');
  const paxDec = $('.pax-btn.dec');
  const paxInc = $('.pax-btn.inc');

  paxDec.onclick = () => {
    if (pax > 1) {
      pax--;
      paxDisplay.textContent = pax;
    }
  };

  paxInc.onclick = () => {
    if (pax < 30) {
      pax++;
      paxDisplay.textContent = pax;
    }
  };

  // Initialize camera
  const camConsent = $('#camConsent');
  const camOnBtn = $('#camOn');
  const camOffBtn = $('#camOff');
  const camMsg = $('#cmsg');
  const camVid = $('#cvid');
  const camImg = $('#cimg');

  camConsent.onchange = () => {
    if (camConsent.checked) {
      startCam().then(success => {
        if (!success) {
          camConsent.checked = false;
          camMsg.textContent = 'ไม่สามารถเปิดกล้องได้';
        }
      });
    } else {
      stopCam();
      camVid.hidden = true;
      camImg.hidden = true;
      camMsg.textContent = 'กล้องถูกปิดใช้งาน';
    }
  };

  camOnBtn.onclick = () => {
    if (camConsent.checked) {
      startCam().then(success => {
        if (!success) {
          camConsent.checked = false;
          camMsg.textContent = 'ไม่สามารถเปิดกล้องได้';
        }
      });
    }
  };

  camOffBtn.onclick = () => {
    camConsent.checked = false;
    stopCam();
  };

  // Handle auto-capture when user starts writing on any pad
  let autoCaptureDone = false;
  const pads = [namePad, orgPad, telPad, whoPad, carPad];
  pads.forEach(pad => {
    pad.onStart = () => {
      if (camConsent.checked && !autoCaptureDone && camStream && !snapping) {
        autoCaptureDone = true;
        snap();
      }
    };
  });

  // Handle submit button
  $('#submitBtn').onclick = () => {
    // Collect form data
    const formData = {
      purpose: purpose,
      pax: pax,
      photo: photo,
      // Convert pad strokes to images for saving
      nameImg: namePad ? namePad.png(800, '#ffffff') : '',
      orgImg: orgPad ? orgPad.png(800, '#ffffff') : '',
      telImg: telPad ? telPad.png(800, '#ffffff') : '',
      whoImg: whoPad ? whoPad.png(800, '#ffffff') : '',
      carImg: carPad ? carPad.png(800, '#ffffff') : '',
      sigImg: sigPad ? sigPad.png(800, '#ffffff') : ''
    };

    // Transition to review view with the collected data
    review(formData);
  };

  $('#backToHome').onclick = home;
}