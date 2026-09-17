import { VoiceAccent } from '../types';

// Speech Synthesis & Recognition helpers

export function cleanTextForSpeech(text: string): string {
  if (!text) return '';
  return text
    // Replace acronym dots so E.V.A. is pronounced as 'Eva'
    .replace(/E\.V\.A\./gi, 'Eva')
    .replace(/E\.V\.A/gi, 'Eva')
    .replace(/A\.N\.S\.H\.U\.L\./gi, 'Anshul')
    .replace(/A\.N\.S\.H\.U\.L/gi, 'Anshul')
    // Remove markdown formatting
    .replace(/\*+/g, '')
    .replace(/_+/g, '')
    .replace(/`+/g, '')
    .replace(/#+/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Clean emojis & special chars that speech synthesizers fumble
    .replace(/[^\w\s.,!?'’"–—-]/g, '')
    // Replace multiple spaces or newlines with single space
    .replace(/\s+/g, ' ')
    .trim();
}

// Female voice name identifiers to strictly exclude
const FEMALE_INDICATORS = [
  'female', 'woman', 'girl',
  'samantha', 'serena', 'victoria', 'karen', 'zira', 'moira', 'tessa', 'fiona',
  'ava', 'allison', 'susan', 'veena', 'leona', 'yuna', 'kyoko', 'stephanie',
  'jenny', 'aria', 'sonia', 'natasha', 'libby', 'mia', 'clara', 'emma', 'hazel',
  'seda', 'ayanda', 'catherine', 'helena', 'heather', 'alice', 'agnes', 'vicki',
  'zoe', 'kate', 'lucy', 'amber', 'ashley', 'joana', 'monica', 'paulina', 'luciana',
  'marta', 'laura', 'anna', 'melina', 'yelda', 'milena', 'alva', 'ioana', 'sara',
  'nora', 'maja', 'sin-ji', 'ting-ting', 'mei-jia', 'ya-ling', 'hiu-gaai', 'hiu-man',
  'shelley', 'linda', 'amira', 'sangeeta', 'ananya', 'priya', 'neerja', 'swara'
];

// Male voice name identifiers across platforms (Apple, Google, Microsoft, Android)
const ACCENT_MALE_NAMES: Record<VoiceAccent, string[]> = {
  us: [
    'alex', 'david', 'guy', 'ryan', 'mark', 'aaron', 'tom', 'fred', 'ralph',
    'bruce', 'junior', 'albert', 'matthew', 'steven', 'christopher', 'eric'
  ],
  uk: [
    'daniel', 'oliver', 'arthur', 'george', 'gordon', 'charles', 'richard',
    'brian', 'alfie', 'william', 'thomas'
  ],
  in: [
    'rishi', 'prabhat', 'ravi', 'neel', 'hemanth', 'kunal', 'madhav', 'rohit'
  ],
  au: [
    'russell', 'william', 'lee', 'james', 'jack', 'ken', 'darren'
  ],
};

const ACCENT_LANG_CODES: Record<VoiceAccent, string[]> = {
  us: ['en-us', 'en_us'],
  uk: ['en-gb', 'en_gb', 'en-uk'],
  in: ['en-in', 'en_in', 'hi-in'],
  au: ['en-au', 'en_au'],
};

export const ACCENT_LABELS: Record<VoiceAccent, { name: string; flag: string; locale: string; sample: string }> = {
  us: {
    name: 'American',
    flag: '🇺🇸',
    locale: 'en-US',
    sample: "Hello! How can I help you today?",
  },
  uk: {
    name: 'British',
    flag: '🇬🇧',
    locale: 'en-GB',
    sample: "Hello! How can I help you today?",
  },
  in: {
    name: 'Indian',
    flag: '🇮🇳',
    locale: 'en-IN',
    sample: "Hello! How can I help you today?",
  },
  au: {
    name: 'Australian',
    flag: '🇦🇺',
    locale: 'en-AU',
    sample: "G'day! How can I help you today?",
  },
};

export function getAvailableVoices(): SpeechSynthesisVoice[] {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return [];
  }
  return window.speechSynthesis.getVoices();
}

// Check if voice is explicitly female
function isFemaleVoice(v: SpeechSynthesisVoice): boolean {
  const full = `${v.name} ${v.voiceURI || ''}`.toLowerCase();
  return FEMALE_INDICATORS.some((fem) => full.includes(fem));
}

// Check if voice is high quality / natural / neural
function isQualityVoice(v: SpeechSynthesisVoice): boolean {
  const n = (v.name + ' ' + (v.voiceURI || '')).toLowerCase();
  return (
    n.includes('natural') ||
    n.includes('enhanced') ||
    n.includes('premium') ||
    n.includes('siri') ||
    n.includes('neural') ||
    n.includes('google')
  );
}

// Check if voice is explicitly male
function isExplicitMale(v: SpeechSynthesisVoice, accent: VoiceAccent): boolean {
  const full = `${v.name} ${v.voiceURI || ''}`.toLowerCase();
  if (full.includes('male') || full.includes(' man ') || full.includes('(male)')) {
    return true;
  }
  const targetNames = ACCENT_MALE_NAMES[accent] || [];
  const allMaleNames = Object.values(ACCENT_MALE_NAMES).flat();
  return targetNames.some((name) => full.includes(name)) || allMaleNames.some((name) => full.includes(name));
}

export function findBestMaleVoice(
  voices: SpeechSynthesisVoice[],
  accent: VoiceAccent = 'us'
): { voice: SpeechSynthesisVoice | null; isExplicit: boolean } {
  if (!voices.length) return { voice: null, isExplicit: false };

  // Step 1: Strictly eliminate all female voices
  const maleCandidateVoices = voices.filter((v) => !isFemaleVoice(v));
  const pool = maleCandidateVoices.length > 0 ? maleCandidateVoices : voices;

  const targetLangs = ACCENT_LANG_CODES[accent] || ACCENT_LANG_CODES.us;
  const accentTargetNames = ACCENT_MALE_NAMES[accent] || [];

  // Filter pool by chosen accent locale
  const accentVoices = pool.filter((v) =>
    targetLangs.some((code) => v.lang.toLowerCase().replace('_', '-').startsWith(code))
  );

  // 1. High-quality + explicit accent male name (e.g. Alex, Daniel, Rishi, Russell)
  const bestAccentMale = accentVoices.find(
    (v) =>
      accentTargetNames.some((n) => v.name.toLowerCase().includes(n)) ||
      v.name.toLowerCase().includes('male')
  );
  if (bestAccentMale) return { voice: bestAccentMale, isExplicit: true };

  // 2. Any voice in this accent with male keyword or name
  const anyAccentMale = accentVoices.find((v) => isExplicitMale(v, accent));
  if (anyAccentMale) return { voice: anyAccentMale, isExplicit: true };

  // 3. Any high quality voice in this accent (that passed the non-female filter)
  const qualityAccent = accentVoices.find(isQualityVoice);
  if (qualityAccent && !isFemaleVoice(qualityAccent)) {
    return { voice: qualityAccent, isExplicit: false };
  }

  // 4. Any accent voice that passed non-female filter
  if (accentVoices.length > 0) {
    return { voice: accentVoices[0], isExplicit: false };
  }

  // 5. If no voice in this specific accent, look for ANY English male voice across all accents
  const anyEnglishMale = pool.find((v) => v.lang.startsWith('en') && isExplicitMale(v, accent));
  if (anyEnglishMale) return { voice: anyEnglishMale, isExplicit: true };

  // 6. First non-female English voice
  const nonFemaleEnglish = pool.find((v) => v.lang.startsWith('en'));
  if (nonFemaleEnglish) return { voice: nonFemaleEnglish, isExplicit: false };

  // 7. Last resort fallback
  return { voice: pool[0] || voices[0] || null, isExplicit: false };
}

export function getActiveMaleVoiceInfo(accent: VoiceAccent = 'us'): { voiceName: string; accentName: string } {
  const voices = getAvailableVoices();
  const { voice } = findBestMaleVoice(voices, accent);
  const accentLabel = ACCENT_LABELS[accent]?.name || 'American';

  if (!voice) {
    return {
      voiceName: `System Male (${accentLabel})`,
      accentName: accentLabel,
    };
  }

  // Clean voice name for clean UI display (e.g. "Alex", "Daniel (Enhanced)", "Google UK English Male")
  const cleanName = voice.name
    .replace(/\(.*?\)/g, '')
    .replace(/English/gi, '')
    .trim();

  return {
    voiceName: cleanName || voice.name,
    accentName: accentLabel,
  };
}

export function speakText(
  text: string,
  options?: {
    accent?: VoiceAccent;
    pitch?: number;
    rate?: number;
    volume?: number;
    onStart?: () => void;
    onEnd?: () => void;
  }
): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      options?.onStart?.();
      setTimeout(() => {
        options?.onEnd?.();
        resolve();
      }, 1000);
      return;
    }

    window.speechSynthesis.cancel();

    const spokenText = cleanTextForSpeech(text);
    if (!spokenText) {
      resolve();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(spokenText);
    const voices = window.speechSynthesis.getVoices();
    const accent = options?.accent ?? 'us';

    const { voice, isExplicit } = findBestMaleVoice(voices, accent);
    if (voice) {
      utterance.voice = voice;
    }

    // Set voice language
    utterance.lang = ACCENT_LABELS[accent]?.locale || 'en-US';

    // Rich masculine baritone register:
    // If voice was not certified explicit male, lower pitch further to 0.82 to guarantee masculine baritone
    const basePitch = isExplicit ? 0.90 : 0.82;
    const requestedPitch = options?.pitch ?? 1.0;
    // Scale pitch around masculine center
    utterance.pitch = Math.max(0.65, Math.min(1.2, basePitch * requestedPitch));

    utterance.rate = options?.rate ?? 1.0;
    utterance.volume = options?.volume ?? 1.0;

    utterance.onstart = () => {
      options?.onStart?.();
    };

    utterance.onend = () => {
      options?.onEnd?.();
      resolve();
    };

    utterance.onerror = () => {
      options?.onEnd?.();
      resolve();
    };

    window.speechSynthesis.speak(utterance);
  });
}

export function speakPreview(accent: VoiceAccent, pitch = 1.0, rate = 1.0): Promise<void> {
  const sample = ACCENT_LABELS[accent]?.sample || ACCENT_LABELS.us.sample;
  return speakText(sample, {
    accent,
    pitch,
    rate,
  });
}

export function stopSpeaking(): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

// Check if browser supports Web Speech API
export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
}

export function createSpeechRecognizer(callbacks: {
  accent?: VoiceAccent;
  onResult: (transcript: string, isFinal: boolean) => void;
  onError: (error: string) => void;
  onEnd: () => void;
  onStart: () => void;
}) {
  if (!isSpeechRecognitionSupported()) {
    return null;
  }

  const SpeechRecognitionClass =
    (window as unknown as { SpeechRecognition?: any; webkitSpeechRecognition?: any }).SpeechRecognition ||
    (window as unknown as { SpeechRecognition?: any; webkitSpeechRecognition?: any }).webkitSpeechRecognition;

  if (!SpeechRecognitionClass) return null;

  const recognition = new SpeechRecognitionClass();
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.lang = ACCENT_LABELS[callbacks.accent ?? 'us']?.locale || 'en-US';

  recognition.onstart = () => {
    callbacks.onStart();
  };

  recognition.onresult = (event: any) => {
    let interimTranscript = '';
    let finalTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        finalTranscript += event.results[i][0].transcript;
      } else {
        interimTranscript += event.results[i][0].transcript;
      }
    }

    const transcript = finalTranscript || interimTranscript;
    callbacks.onResult(transcript, Boolean(finalTranscript));
  };

  recognition.onerror = (event: any) => {
    callbacks.onError(event.error || 'Speech recognition error');
  };

  recognition.onend = () => {
    callbacks.onEnd();
  };

  return recognition;
}
