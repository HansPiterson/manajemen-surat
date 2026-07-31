import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from './db/pool.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const keyPath = path.join(__dirname, '..', 'serviceAccountKey.json');
let serviceAccount = null;
if (fs.existsSync(keyPath)) {
  serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
}

async function getAccessToken() {
  if (!serviceAccount) return null;
  try {
    const { GoogleAuth } = await import('google-auth-library');
    const auth = new GoogleAuth({
      credentials: serviceAccount,
      scopes: ['https://www.googleapis.com/auth/firebase.messaging'],
    });
    const client = await auth.getClient();
    const t = await client.getAccessToken();
    return t.token;
  } catch (err) {
    console.error('[FCM] getAccessToken error:', err.message);
    return null;
  }
}

export async function sendPushToKurir(title, body, data = {}, targetKurirId) {
  try {
    if (!targetKurirId) {
      console.log('[FCM] No target courier, skipping push');
      return;
    }

    const accessToken = await getAccessToken();
    if (!accessToken || !serviceAccount) {
      console.log('[FCM] No access token or service account, skipping push');
      return;
    }

    const result = await pool.query(
      `SELECT dt.token
       FROM device_tokens dt
       JOIN users u ON dt.user_id = u.id
       WHERE u.id = $1
         AND u.role = 'kurir'
         AND u.status = 'approved'`,
      [targetKurirId]
    );
    const tokens = result.rows.map((row) => row.token);
    console.log(`[FCM] Sending push to ${tokens.length} device(s) for courier ${targetKurirId}`);
    if (tokens.length === 0) return;

    const projectId = serviceAccount.project_id;
    const url = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;

    for (const token of tokens) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: {
              token,
              notification: { title, body },
              data: Object.fromEntries(
                Object.entries(data).map(([key, value]) => [key, String(value)])
              ),
              android: {
                priority: 'high',
                notification: { sound: 'default', channel_id: 'surat_channel' },
              },
            },
          }),
        });
        const json = await response.json();
        console.log('[FCM] Response:', response.status, JSON.stringify(json));
      } catch (fcmError) {
        console.error('[FCM] Send error:', fcmError.message);
      }
    }
  } catch (error) {
    console.error('[FCM] sendPushToKurir error:', error.message);
  }
}
