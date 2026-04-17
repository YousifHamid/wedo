/**
 * ╔══════════════════════════════════════════════════════════╗
 * ║           WEDO DEMO ACCESS — PRIVATE                     ║
 * ║  10 accounts — each works as BOTH Rider & Captain        ║
 * ║  Each role login is tracked independently (own session)  ║
 * ╚══════════════════════════════════════════════════════════╝
 *
 * ABSOLUTE EXPIRY: Hardcoded in this APK binary.
 * Survives uninstall + reinstall — tied to the build, not storage.
 * To renew: change DEMO_APK_EXPIRY below and rebuild the APK.
 */

export interface DemoAccount {
  id: string;
  phone: string;
  password: string;
  label: string; // who you share it with
  // NOTE: No fixed role — the role is chosen at login screen (rider or driver)
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    id: 'DEMO_01',
    phone: '0910000001',
    password: 'Wedo#A1',
    label: 'Tester 1',
  },
  {
    id: 'DEMO_02',
    phone: '0910000002',
    password: 'Wedo#B2',
    label: 'Tester 2',
  },
  {
    id: 'DEMO_03',
    phone: '0910000003',
    password: 'Wedo#C3',
    label: 'Investor A',
  },
  {
    id: 'DEMO_04',
    phone: '0910000004',
    password: 'Wedo#D4',
    label: 'Investor B',
  },
  {
    id: 'DEMO_05',
    phone: '0910000005',
    password: 'Wedo#E5',
    label: 'VIP Preview',
  },
  {
    id: 'DEMO_06',
    phone: '0910000006',
    password: 'Wedo#F6',
    label: 'Extra Tester 1',
  },
  {
    id: 'DEMO_07',
    phone: '0910000007',
    password: 'Wedo#G7',
    label: 'Extra Tester 2',
  },
  {
    id: 'DEMO_08',
    phone: '0910000008',
    password: 'Wedo#H8',
    label: 'QA Team 1',
  },
  {
    id: 'DEMO_09',
    phone: '0910000009',
    password: 'Wedo#I9',
    label: 'QA Team 2',
  },
  {
    id: 'DEMO_10',
    phone: '0910000010',
    password: 'Wedo#J10',
    label: 'Management',
  },
];

// ─── Per-device session window (Starts from first login on that device) ───────
export const DEMO_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 Days (One Week)

// ─── ABSOLUTE APK SAFETY LIMIT ──────────────────────────────────────────────
// This is a safety net. The main logic is the 7-day session above.
// To renew: change the date below and rebuild.
export const DEMO_APK_EXPIRY = new Date('2026-05-01T23:59:59Z').getTime();
//                                        ^^^^^^^^^^^^^^^^^^^^
//                                        MAY 1, 2026
