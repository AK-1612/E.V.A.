/**
 * Tactile Haptic Feedback Utility using HTML5 Vibration API
 * Provides subtle, native-feeling feedback patterns for actions and speech states.
 */

export type HapticType =
  | 'light'
  | 'medium'
  | 'heavy'
  | 'startListening'
  | 'stopListening'
  | 'success'
  | 'warning'
  | 'error';

// Preset vibration durations (ms) or patterns ([vibrate, pause, vibrate, ...])
const HAPTIC_PATTERNS: Record<HapticType, number | number[]> = {
  light: 12,                  // Quick crisp tap for standard buttons and tabs
  medium: 24,                 // Affirmative tap for actions, modal triggers
  heavy: 38,                  // Distinct thud for power state toggles
  startListening: [18, 30, 22], // Dual pulse indicating mic is hot and recording
  stopListening: 15,          // Crisp subtle release when mic shuts off
  success: [15, 35, 20],      // Success resolution cue
  warning: [30, 40, 25],      // Soft caution cue
  error: [45, 50, 45],        // Double buzz for mic or network failures
};

let globalHapticEnabled = true;

export const setHapticsEnabled = (enabled: boolean): void => {
  globalHapticEnabled = enabled;
};

export const isHapticsSupported = (): boolean => {
  return (
    typeof window !== 'undefined' &&
    'navigator' in window &&
    typeof navigator.vibrate === 'function'
  );
};

export const triggerHaptic = (
  type: HapticType | number | number[] = 'light',
  overrideEnabled?: boolean
): boolean => {
  const isEnabled = overrideEnabled !== undefined ? overrideEnabled : globalHapticEnabled;
  if (!isEnabled) return false;
  if (!isHapticsSupported()) return false;

  try {
    let pattern: number | number[];
    if (typeof type === 'string') {
      pattern = HAPTIC_PATTERNS[type] || 12;
    } else {
      pattern = type;
    }
    return navigator.vibrate(pattern);
  } catch (e) {
    // Graceful fallback on restricted contexts (e.g. some iframe sandboxes)
    return false;
  }
};
