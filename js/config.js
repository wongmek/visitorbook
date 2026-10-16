// Public configuration for the school visitor book kiosk
export const API_URL = 'https://script.google.com/macros/s/AKfycbxrY2jKXVbC7CNVDqIoD5ZUlFPcqoXgz8fACuaon2we32VYZo-5Dfpl3-hUK6VAHp_mcg/exec'; // Set to your Apps Script web app URL after deployment
export const KIOSK_TOKEN = '1111100000'; // Set to match the kiosk token in Apps Script properties
export const SCHOOL_NAME = 'โรงเรียน มอ.วิทยานุสรณ์'; // Default school name, can be updated via admin

// Public constants used in the UI
export const PURPOSES = [
   'โรงเรียนพระราชทาน',
  'ติดต่อครู / ฝ่ายบริหาร',
  'ผู้ปกครองเยี่ยมชม',
  'รับ-ส่งนักเรียน',
  'ศึกษาดูงาน',
  'ช่าง / ส่งสินค้า',
  'อื่นๆ'
];