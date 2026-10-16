import { CFG } from './config.js';

/**
 * Call the Apps Script backend API
 * @param {string} action - The action to perform
 * @param {Object} payload - The payload to send
 * @returns {Promise<any>} The response data
 */
export async function call(action, payload = {}) {
  const res = await fetch(CFG.API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action, kiosk: CFG.KIOSK_TOKEN, ...payload }),
    redirect: 'follow',
  });
  const j = await res.json();
  if (!j.ok) throw new Error(j.error || 'api_error');
  return j.data;
}

/**
 * Fetch the public visitor book (GET request)
 * @returns {Promise<Array>} List of visitor records for public display
 */
export const book = () =>
  fetch(CFG.API_URL + '?action=book')
    .then(r => r.json())
    .then(j => j.data);

// TODO: Implement offline outbox using IndexedDB for failed submissions