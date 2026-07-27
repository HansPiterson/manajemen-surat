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
  } catch {
    return null;
  }
}

export async function sendPushToKurir(title, body, data = {}) {
  try {
    const accessToken = await getAccessToken();
    if (!accessToken || !serviceAccount) return;

    const result = await pool.query(
      `SELECT dt.token FROM device_tokens dt
       JOIN users u ON dt.user_id = u.id
       WHERE u.role = 'kurir' AND u.status = 'approved'`
    );
    const tokens = result.rows.map(r => r.token);
    if (tokens.length === 0) return;

    const projectId = serviceAccount.project_id;
    const url = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;

    for (const token of tokens) {
      try {
        await fetch(url, {
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
                Object.entries(data).map(([k, v]) => [k, String(v)])
              ),
              android: {
                priority: 'high',
                notification: { sound: 'default', channel_id: 'surat_channel' },
              },
            },
          }),
        });
      } catch {}
    }
  } catch (err) {
    console.error('[FCM]', err.message);
  }
}
