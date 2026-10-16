// Camera consent and capture module ported from prototype
export let camStream = null;
export let photo = '';
export let snapping = false;

/**
 * Stop the camera stream and release resources
 */
export function stopCam() {
  if (camStream) {
    camStream.getTracks().forEach(t => t.stop());
    camStream = null;
  }
}

/**
 * Start the camera stream from the user-facing camera
 * @returns {Promise<boolean>} true if camera started successfully, false otherwise
 */
export async function startCam() {
  try {
    camStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: 640, height: 480 },
      audio: false
    });
    const v = document.getElementById('cvid');
    v.srcObject = camStream;
    await v.play().catch(() => {});
    v.hidden = false;
    document.getElementById('cimg').hidden = true;
    document.getElementById('crec').hidden = false;
    document.getElementById('cmsg').textContent = 'กล้องพร้อมแล้ว เมื่อคุณเริ่มเขียน ระบบจะถ่ายภาพให้ 1 ครั้ง';
    return true;
  } catch (e) {
    document.getElementById('cvid').hidden = true;
    document.getElementById('crec').hidden = true;
    document.getElementById('cmsg').textContent = 'เปิดกล้องไม่ได้ในอุปกรณ์นี้ (ตรวจสอบสิทธิ์กล้องของเบราว์เซอร์) ข้ามขั้นตอนนี้ได้';
    document.getElementById('camOn').checked = false;
    return false;
  }
}

/**
 * Capture a photo from the video stream and prepare for display
 */
export function snap() {
  const v = document.getElementById('cvid');
  if (!camStream || !v.videoWidth) return;
  const c = document.createElement('canvas');
  c.width = 320;
  c.height = 240;
  const vw = v.videoWidth;
  const vh = v.videoHeight;
  const t = 4 / 3;
  let sw = vw;
  let sh = vw / t;
  if (sh > vh) {
    sh = vh;
    sw = vh * t;
  }
  c.getContext('2d').drawImage(v, (vw - sw) / 2, (vh - sh) / 2, sw, sh, 0, 0, 320, 240);
  photo = c.toDataURL('image/jpeg', 0.75);
  const fl = document.getElementById('cfl');
  fl.classList.remove('go');
  void fl.offsetWidth;
  fl.classList.add('go');
  document.getElementById('cimg').src = photo;
  document.getElementById('cimg').hidden = false;
  document.getElementById('cvid').hidden = true;
  document.getElementById('crec').hidden = true;
  stopCam();
  document.getElementById('cmsg').textContent = 'ถ่ายภาพแล้ว ภาพนี้จะแสดงบนบัตรผ่านของคุณ และไม่ปรากฏในสมุดเยี่ยมสาธารณะ';
  document.getElementById('cre').hidden = false;
  document.getElementById('cdel').hidden = false;
}