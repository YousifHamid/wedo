/**
 * Demo Guard Service
 *
 * Handles all logic for demo account validation:
 * - Device fingerprinting (locks credential+role combo to 1 device)
 * - 7-day session expiry from first login per role
 * - Each account can log in as BOTH rider AND driver independently
 *   (rider session and driver session are tracked separately)
 *
 * Works 100% offline — no server, no Firebase needed.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEMO_ACCOUNTS, DEMO_EXPIRY_MS, DEMO_APK_EXPIRY, DemoAccount } from '../config/demoAccounts';

const DEVICE_ID_KEY = 'wedo_device_fingerprint';
const SESSION_PREFIX = 'wedo_demo_session_';

// ─── UUID Generator (no extra package needed) ────────────────────────────────
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ─── Device Fingerprint ───────────────────────────────────────────────────────
export async function getOrCreateDeviceId(): Promise<string> {
  let id = await AsyncStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = generateUUID();
    await AsyncStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

// ─── Session Storage ──────────────────────────────────────────────────────────
interface DemoSession {
  deviceId: string;
  firstOpenedAt: number; // Unix timestamp (ms)
}

// ─── Result Types ─────────────────────────────────────────────────────────────
export type DemoValidationResult =
  | { status: 'ok'; account: DemoAccount; role: 'rider' | 'driver'; remainingMs: number }
  | { status: 'expired'; expiredAt: number }
  | { status: 'device_locked' }   // used on a different device
  | { status: 'not_demo' };       // not a demo account — proceed with server

// ─── Main Validation Function ─────────────────────────────────────────────────
// Each account+role combo is tracked independently:
//   - "0910000001 as rider"  → its own device lock + 7-day timer
//   - "0910000001 as driver" → separate device lock + 7-day timer
export async function validateDemoLogin(
  phone: string,
  password: string,
  role: 'rider' | 'driver'
): Promise<DemoValidationResult> {
  // 1. Find matching demo account (no role check — all accounts are dual-role)
  const account = DEMO_ACCOUNTS.find(
    (a) => a.phone === phone && a.password === password
  );

  if (!account) {
    return { status: 'not_demo' };
  }

  // ── ABSOLUTE APK EXPIRY CHECK (reinstall-proof) ─────────────────────────
  if (Date.now() >= DEMO_APK_EXPIRY) {
    return { status: 'expired', expiredAt: DEMO_APK_EXPIRY };
  }

  const deviceId = await getOrCreateDeviceId();

  // Session key is per account + role — so each role is independent
  const sessionKey = `${SESSION_PREFIX}${account.id}_${role}`;
  const sessionRaw = await AsyncStorage.getItem(sessionKey);

  if (sessionRaw) {
    const session: DemoSession = JSON.parse(sessionRaw);

    // 2. Device lock check
    if (session.deviceId !== deviceId) {
      return { status: 'device_locked' };
    }

    // 3. Expiry check
    const elapsed = Date.now() - session.firstOpenedAt;
    if (elapsed >= DEMO_EXPIRY_MS) {
      return { status: 'expired', expiredAt: session.firstOpenedAt + DEMO_EXPIRY_MS };
    }

    // 4. All good — return remaining time
    const remainingMs = DEMO_EXPIRY_MS - elapsed;
    return { status: 'ok', account, role, remainingMs };

  } else {
    // 5. First time using this account+role — claim it for this device
    const session: DemoSession = {
      deviceId,
      firstOpenedAt: Date.now(),
    };
    await AsyncStorage.setItem(sessionKey, JSON.stringify(session));
    return { status: 'ok', account, role, remainingMs: DEMO_EXPIRY_MS };
  }
}

// ─── Helper: Format remaining time ───────────────────────────────────────────
export function formatRemainingTime(ms: number): string {
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) return `${hours}h ${minutes}m remaining`;
  return `${minutes} minutes remaining`;
}
