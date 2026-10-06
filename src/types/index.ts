export interface VoiceProfile {
  id: string;
  name: string;
  gender: 'male' | 'female';
  genderLabel: string;
  baseVoice: 'Puck' | 'Charon' | 'Fenrir' | 'Kore' | 'Zephyr';
  avatar: string;
  badgeColor: string;
  description: string;
  vocalTraits: string[];
  isCustom?: boolean;
  isCloned?: boolean;
  clonedFromAudioName?: string;
  customPrompt?: string;
  timbre?: string;
}

export interface VibeOption {
  id: string;
  title: string;
  iconName: string;
  tag: string;
  color: string;
  description: string;
  prompt: string;
  isCustom?: boolean;
}

export interface LanguageSection {
  lang: 'id' | 'en' | 'ar';
  title: string;
  flag: string;
  startSec: number;
  endSec: number;
  durationSec: number;
  text: string;
}

export interface IndividualTrack {
  base64Wav: string;
  durationSec: number;
  text: string;
}

export interface GenerationResult {
  id: string;
  timestamp: string;
  originalText: string;
  voice: VoiceProfile;
  vibe: VibeOption;
  translations: {
    id: string;
    en: string;
    ar: string;
  };
  masterAudio: {
    base64Wav: string;
    mimeType: string;
    totalDurationSec: number;
    sampleRate: number;
    sections: LanguageSection[];
  };
  individualTracks: {
    id: IndividualTrack;
    en: IndividualTrack;
    ar: IndividualTrack;
  };
}
