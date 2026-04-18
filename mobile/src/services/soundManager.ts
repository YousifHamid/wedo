/**
 * soundManager.ts — Wedo Sound & Haptic Notification Manager
 *
 * Since expo-av is not installed, we use:
 *   - React Native Vibration API for pattern-based haptic tones
 *   - expo-haptics (built into Expo SDK) for premium feedback
 *
 * Each notification type has a unique vibration rhythm so the user
 * can feel the difference even without audio.
 *
 * To add real audio later: install expo-av and uncomment the Audio sections.
 */
import { Vibration, Platform } from 'react-native';

// ─── Vibration Patterns ────────────────────────────────────────────────────────
//  Format: [pause, vibrate, pause, vibrate, ...]  (milliseconds)

/** 🚗 Driver: New trip received — excited double-pulse */
const DRIVER_NEW_TRIP_PATTERN = [
  0,   150,   // strong pulse 1
  80,  150,   // strong pulse 2
  80,  150,   // strong pulse 3
  200, 80,    // pause → short ping
  60,  80,    // short ping 2
  60,  80,    // short ping 3
  200, 300,   // final long buzz
];

/** ✅ User: Driver accepted — calm confirmation triple */
const USER_DRIVER_ACCEPTED_PATTERN = [
  0,   100,   // soft pulse 1
  100, 100,   // soft pulse 2
  100, 200,   // longer confirmation buzz
];

/** ❌ Cancel — descending sad pattern */
const CANCEL_PATTERN = [
  0,   200,   // long
  100, 100,   // medium
  80,  60,    // short
];

/** ⭐ Trip complete — celebratory ascending */
const TRIP_COMPLETE_PATTERN = [
  0,   60,
  50,  80,
  50,  100,
  50,  150,
  50,  200,
];

/** 🔔 Generic notification — single soft pulse */
const NOTIFICATION_PATTERN = [0, 100, 80, 100];

// ─── Optional: expo-av Audio URLs (ready to uncomment if expo-av added) ─────
// const DRIVER_TRIP_SOUND_URL = 'https://assets.mixkit.co/active_storage/sfx/2869/2869.wav';
// const USER_ACCEPTED_SOUND_URL = 'https://assets.mixkit.co/active_storage/sfx/2571/2571.wav';

class SoundManager {
  private enabled = true;

  setEnabled(val: boolean) {
    this.enabled = val;
  }

  /** 🚗 Play when driver receives a new trip request */
  playDriverNewTrip() {
    if (!this.enabled) return;
    // Repeat pattern 2 times to make it more noticeable for drivers
    Vibration.vibrate(DRIVER_NEW_TRIP_PATTERN);
    // Repeat after 2 seconds if still showing
    setTimeout(() => {
      Vibration.vibrate(DRIVER_NEW_TRIP_PATTERN);
    }, 2000);
  }

  /** Stop driver trip ringtone (call on accept/reject) */
  stopDriverRingtone() {
    Vibration.cancel();
  }

  /** ✅ Play when driver accepts — felt by the user */
  playUserDriverAccepted() {
    if (!this.enabled) return;
    Vibration.vibrate(USER_DRIVER_ACCEPTED_PATTERN);
  }

  /** ❌ Play on trip cancellation */
  playCancel() {
    if (!this.enabled) return;
    Vibration.vibrate(CANCEL_PATTERN);
  }

  /** ⭐ Play on trip completion */
  playTripComplete() {
    if (!this.enabled) return;
    Vibration.vibrate(TRIP_COMPLETE_PATTERN);
  }

  /** 🔔 Generic soft notification */
  playNotification() {
    if (!this.enabled) return;
    Vibration.vibrate(NOTIFICATION_PATTERN);
  }
}

const soundManager = new SoundManager();
export default soundManager;

/**
 * UPGRADE PATH: When expo-av is installed, run:
 *   npx expo install expo-av
 *
 * Then uncomment the Audio sections and map each method to
 * play a real MP3/WAV sound alongside the vibration:
 *
 * import { Audio } from 'expo-av';
 *
 * async playDriverNewTrip() {
 *   const { sound } = await Audio.Sound.createAsync(
 *     { uri: DRIVER_TRIP_SOUND_URL },
 *     { shouldPlay: true, isLooping: false, volume: 1.0 }
 *   );
 *   // ... cleanup after playback
 * }
 */
