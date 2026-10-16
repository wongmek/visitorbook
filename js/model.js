// Application state and helper functions
// Note: In production, replace localStorage-based store with API calls and IndexedDB outbox
import { SCHOOL_NAME } from './config.js';

// State
export let mem = { log: [], school: SCHOOL_NAME };
export const store = {
  get(k, d) {
    try {
      const v = localStorage.getItem(k);
      return v ? JSON.parse(v) : d;
    } catch (e) {
      return mem[k] ?? d;
    }
  },
  set(k, v) {
    mem[k] = v;
    try {
      localStorage.setItem(k, JSON.stringify(v));
    } catch (e) {
      toast('พื้นที่จัดเก็บเต็ม ข้อมูลล่าสุดอาจไม่ถูกบันทึกถาวร');
    }
  }
};
export let log = store.get('vb_log', []);
export let school = store.get('vb_school', SCHOOL_NAME);

// Timers for clearing timeouts and intervals
export let timers = [];

// Helper functions
export const $ = s => document.querySelector(s);
export const $$ = s => document.querySelectorAll(s);
export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
}[c]));
export const fmtT = t => new Date(t).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
export const fmtD = t => new Date(t).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
export const sameDay = (a, b) => new Date(a).toDateString() === new Date(b).toDateString();
export const toast = m => {
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = m;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2200);
};
export const clear = () => {
  timers.forEach(clearTimeout);
  timers.forEach(clearInterval);
  timers = [];
};