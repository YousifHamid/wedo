/**
 * Proxy Phone Number Service
 * ──────────────────────────────────────────────────────────────
 * Generates temporary masked numbers per trip session.
 * Neither rider nor driver ever sees the other's real number.
 *
 * How it works (like Uber):
 *   Rider calls proxyPhoneDriver  →  VOIP provider forwards to real driver number
 *   Driver calls proxyPhoneRider  →  VOIP provider forwards to real rider number
 *
 * Production: Replace generateProxyNumber() body with Twilio Proxy API call.
 * Twilio docs: https://www.twilio.com/docs/proxy
 *
 * For Sudan (current): Uses simulated proxy numbers stored per trip.
 * The numbers are realistic-looking but route through server logic.
 */

import Trip from '../models/Trip';

// ─── Sudanese number prefix pool (real Sudanese carrier prefixes) ───────────
const PROXY_PREFIXES = ['0911', '0912', '0922', '0923', '0924', '0960', '0961'];

/**
 * Generates a realistic-looking Sudanese proxy number.
 * This number is NOT the real user number.
 */
function generateProxyNumber(): string {
  const prefix = PROXY_PREFIXES[Math.floor(Math.random() * PROXY_PREFIXES.length)];
  const suffix = Math.floor(100000 + Math.random() * 900000).toString();
  return `${prefix}${suffix}`;
}

/**
 * Assigns proxy numbers to a trip if not already assigned.
 * Returns both proxy numbers.
 */
export async function assignProxyNumbers(tripId: string): Promise<{
  proxyPhoneRider: string;
  proxyPhoneDriver: string;
}> {
  const trip = await Trip.findById(tripId);
  if (!trip) throw new Error('Trip not found');

  // Only generate once per trip
  if (trip.proxyPhoneRider && trip.proxyPhoneDriver) {
    return {
      proxyPhoneRider: trip.proxyPhoneRider,
      proxyPhoneDriver: trip.proxyPhoneDriver,
    };
  }

  const proxyPhoneRider = generateProxyNumber();   // rider calls this → driver gets the call
  const proxyPhoneDriver = generateProxyNumber();  // driver calls this → rider gets the call

  await Trip.findByIdAndUpdate(tripId, { proxyPhoneRider, proxyPhoneDriver });

  // ─── PRODUCTION HOOK ──────────────────────────────────────────────────────
  // Replace the above with Twilio Proxy Session:
  //
  // const twilioClient = require('twilio')(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);
  // const session = await twilioClient.proxy.v1.services(process.env.TWILIO_SERVICE_SID)
  //   .sessions.create({ uniqueName: tripId, ttl: 7200 });
  // await session.participants.create({ identifier: riderRealPhone, friendlyName: 'rider' });
  // await session.participants.create({ identifier: driverRealPhone, friendlyName: 'driver' });
  // const riderParticipant = session.participants().list()[0];
  // proxyPhoneRider = riderParticipant.proxyIdentifier;  // ← real Twilio masked number
  // ─────────────────────────────────────────────────────────────────────────

  return { proxyPhoneRider, proxyPhoneDriver };
}

/**
 * Clears proxy numbers after trip ends (so numbers can be recycled).
 */
export async function releaseProxyNumbers(tripId: string): Promise<void> {
  await Trip.findByIdAndUpdate(tripId, {
    $unset: { proxyPhoneRider: '', proxyPhoneDriver: '' }
  });
  // Production: also close the Twilio Proxy Session here
}
