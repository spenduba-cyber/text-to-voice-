import React, { useState, useEffect } from 'react';
import {
  Volume2,
  Sparkles,
  Mic,
  Globe2,
  Layers,
  Flame,
  CheckCircle2,
  AlertCircle,
  Headphones,
  Sliders,
  AudioWaveform,
  UserPlus
} from 'lucide-react';
import { INITIAL_VOICES } from './data/voices';
import { INITIAL_VIBES } from './data/vibes';
import { VoiceProfile, VibeOption, GenerationResult } from './types';
import { VoiceSelector } from './components/VoiceSelector';
import { VoiceCloneModal } from './components/VoiceCloneModal';
import { VoiceCustomModal } from './components/VoiceCustomModal';
import { VibeSelector } from './components/VibeSelector';
import { TextInputPanel } from './components/TextInputPanel';
import { MasterAudioPlayer } from './components/MasterAudioPlayer';
import { GenerationHistory } from './components/GenerationHistory';

export default function App() {
  // Voice list with localStorage persistence
  const [voices, setVoices] = useState<VoiceProfile[]>(() => {
    const saved = localStorage.getItem('suaragen_custom_voices');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return [...INITIAL_VOICES, ...parsed];
      } catch (e) {
        return INITIAL_VOICES;
      }
    }
    return INITIAL_VOICES;
  });

  const [selectedVoice, setSelectedVoice] = useState<VoiceProfile>(INITIAL_VOICES[0]); // Aldi

  // Vibes with localStorage persistence
  const [vibes, setVibes] = useState<VibeOption[]>(() => {
    const saved = localStorage.getItem('suaragen_custom_vibes');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return [...INITIAL_VIBES, ...parsed];
      } catch (e) {
        return INITIAL_VIBES;
      }
    }
    return INITIAL_VIBES;
  });

  const [selectedVibe, setSelectedVibe] = useState<VibeOption>(INITIAL_VIBES[0]); // Puitis

  // Text state
  const [text, setText] = useState<string>(
    'Di setiap hembusan angin pagi, selalu ada harapan baru yang siap kita wujudkan bersama.'
  );

  const [addChime, setAddChime] = useState<boolean>(true);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationStep, setGenerationStep] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Result and History
  const [currentResult, setCurrentResult] = useState<GenerationResult | null>(null);
  const [history, setHistory] = useState<GenerationResult[]>(() => {
    const saved = localStorage.getItem('suaragen_history');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  // Modals
  const [isCloneModalOpen, setIsCloneModalOpen] = useState(false);
  const [isCustomVoiceModalOpen, setIsCustomVoiceModalOpen] = useState(false);

  // Save history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('suaragen_history', JSON.stringify(history.slice(0, 10)));
    } catch (e) {
      console.warn('Storage quota reached');
    }
  }, [history]);

  // Handler for adding cloned voice
  const handleVoiceCloned = (clonedVoice: VoiceProfile) => {
    setVoices((prev) => {
      const updated = [clonedVoice, ...prev];
      const customOnly = updated.filter((v) => v.isCloned || v.isCustom);
      localStorage.setItem('suaragen_custom_voices', JSON.stringify(customOnly));
      return updated;
    });
    setSelectedVoice(clonedVoice);
  };

  // Handler for adding custom voice
  const handleVoiceCreated = (customVoice: VoiceProfile) => {
    setVoices((prev) => {
      const updated = [customVoice, ...prev];
      const customOnly = updated.filter((v) => v.isCloned || v.isCustom);
      localStorage.setItem('suaragen_custom_voices', JSON.stringify(customOnly));
      return updated;
    });
    setSelectedVoice(customVoice);
  };

  // Handler for adding custom vibe
  const handleAddCustomVibe = (newVibe: VibeOption) => {
    setVibes((prev) => {
      const updated = [newVibe, ...prev];
      const customOnly = updated.filter((v) => v.isCustom);
      localStorage.setItem('suaragen_custom_vibes', JSON.stringify(customOnly));
      return updated;
    });
  };

  // Main Generator function
  const handleGenerate = async (customTranslations?: { id: string; en: string; ar: string }) => {
    if (!text.trim()) return;

    setIsGenerating(true);
    setErrorMsg(null);
    setGenerationStep('Menyelaraskan teks dan terjemahan 3 bahasa (ID, EN, AR)...');

    try {
      setGenerationStep('Menyintesis vokal karakter dan mengonversi 3 bahasa ke 1 file audio...');

      const response = await fetch('/api/tts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          translations: customTranslations,
          voiceNameGemini: selectedVoice.baseVoice,
          voiceName: selectedVoice.name,
          vibeTitle: selectedVibe.title,
          vibePrompt: selectedVibe.prompt,
          customStylePrompt: selectedVoice.customPrompt,
          addChimeBetweenLangs: addChime,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Terjadi kesalahan saat memproses suara.');
      }

      const newResult: GenerationResult = {
        id: `gen-${Date.now()}`,
        timestamp: new Date().toISOString(),
        originalText: text,
        voice: selectedVoice,
        vibe: selectedVibe,
        translations: data.translations,
        masterAudio: data.masterAudio,
        individualTracks: data.individualTracks,
      };

      setCurrentResult(newResult);
      setHistory((prev) => [newResult, ...prev]);

      // Scroll smoothly to player
      setTimeout(() => {
        const playerEl = document.getElementById('master-player-section');
        if (playerEl) {
          playerEl.scrollIntoView({ behavior: 'smooth' });
        }
      }, 150);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(
        err.message || 'Gagal menghasilkan suara 3 bahasa. Pastikan API key dan jaringan aktif.'
      );
    } finally {
      setIsGenerating(false);
      setGenerationStep('');
    }
  };

  const handleClearHistory = () => {
    setHistory([]);
    localStorage.removeItem('suaragen_history');
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col selection:bg-violet-500 selection:text-white">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800/80 px-4 lg:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-600 via-purple-600 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-violet-500/25">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black tracking-tight bg-gradient-to-r from-zinc-100 via-violet-200 to-pink-300 bg-clip-text text-transparent">
                  SuaraGen AI
                </h1>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-300 font-bold border border-violet-500/30">
                  Studio Vokal 3 Bahasa
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Text-to-Sound • Kloning Suara • Vibes Emosi • 1 Master Audio File
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsCloneModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 border border-violet-500/30 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Mic className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Kloning Suara</span>
            </button>
            <button
              onClick={() => setIsCustomVoiceModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Suara Kustom</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6 space-y-8">
        {/* Error Alert */}
        {errorMsg && (
          <div className="p-4 rounded-2xl bg-red-950/60 border border-red-800 text-red-200 text-sm flex items-start justify-between gap-3 animate-in fade-in">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Pemberitahuan Sistem</p>
                <p className="text-xs text-red-300/90 mt-0.5">{errorMsg}</p>
              </div>
            </div>
            <button
              onClick={() => setErrorMsg(null)}
              className="text-xs text-red-400 hover:text-white px-2 py-1 rounded"
            >
              Tutup
            </button>
          </div>
        )}

        {/* Section 1: Karakter Suara */}
        <section className="p-6 rounded-3xl bg-zinc-900/60 border border-zinc-800/80 shadow-xl backdrop-blur-sm">
          <VoiceSelector
            voices={voices}
            selectedVoice={selectedVoice}
            onSelectVoice={setSelectedVoice}
            onOpenCloneModal={() => setIsCloneModalOpen(true)}
            onOpenCustomModal={() => setIsCustomVoiceModalOpen(true)}
          />
        </section>

        {/* Section 2: Pilihan Vibes */}
        <section className="p-6 rounded-3xl bg-zinc-900/60 border border-zinc-800/80 shadow-xl backdrop-blur-sm">
          <VibeSelector
            vibes={vibes}
            selectedVibe={selectedVibe}
            onSelectVibe={setSelectedVibe}
            onAddCustomVibe={handleAddCustomVibe}
          />
        </section>

        {/* Section 3: Text Input & Multilingual 3-in-1 Control */}
        <section className="p-6 rounded-3xl bg-zinc-900/60 border border-zinc-800/80 shadow-xl backdrop-blur-sm">
          <TextInputPanel
            text={text}
            onChangeText={setText}
            selectedVoice={selectedVoice}
            selectedVibe={selectedVibe}
            isGenerating={isGenerating}
            onGenerate={handleGenerate}
            addChime={addChime}
            onToggleChime={setAddChime}
          />

          {/* Loading status bar */}
          {isGenerating && (
            <div className="mt-4 p-4 rounded-2xl bg-violet-950/40 border border-violet-500/40 flex items-center space-x-3 animate-pulse">
              <span className="w-5 h-5 border-2 border-violet-400 border-t-transparent rounded-full animate-spin shrink-0" />
              <div className="text-xs">
                <p className="font-semibold text-violet-200">Sedang Memproses...</p>
                <p className="text-zinc-400">{generationStep}</p>
              </div>
            </div>
          )}
        </section>

        {/* Section 4: Master 3-in-1 Audio Player (Output) */}
        {currentResult && (
          <section id="master-player-section" className="scroll-mt-20">
            <MasterAudioPlayer result={currentResult} />
          </section>
        )}

        {/* Section 5: Generation History */}
        <section>
          <GenerationHistory
            history={history}
            onSelectResult={(item) => {
              setCurrentResult(item);
              const playerEl = document.getElementById('master-player-section');
              if (playerEl) playerEl.scrollIntoView({ behavior: 'smooth' });
            }}
            onClearHistory={handleClearHistory}
          />
        </section>
      </main>

      {/* Voice Clone Modal */}
      <VoiceCloneModal
        isOpen={isCloneModalOpen}
        onClose={() => setIsCloneModalOpen(false)}
        onVoiceCloned={handleVoiceCloned}
      />

      {/* Voice Custom Modal */}
      <VoiceCustomModal
        isOpen={isCustomVoiceModalOpen}
        onClose={() => setIsCustomVoiceModalOpen(false)}
        onVoiceCreated={handleVoiceCreated}
      />

      {/* Footer */}
      <footer className="mt-auto border-t border-zinc-900 bg-zinc-950 py-6 px-4 text-center text-xs text-zinc-500">
        <p>
          SuaraGen AI • Generator Text to Sound & Kloning Suara Multi-Bahasa (Indonesia 🇮🇩, English 🇬🇧, Arab 🇸🇦) dalam 1 Master Audio File.
        </p>
      </footer>
    </div>
  );
}
