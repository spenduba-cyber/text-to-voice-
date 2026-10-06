import React, { useState } from 'react';
import { Sparkles, UserPlus, Mic, CheckCircle2, User, ChevronRight } from 'lucide-react';
import { VoiceProfile } from '../types';

interface VoiceSelectorProps {
  voices: VoiceProfile[];
  selectedVoice: VoiceProfile;
  onSelectVoice: (voice: VoiceProfile) => void;
  onOpenCloneModal: () => void;
  onOpenCustomModal: () => void;
}

export const VoiceSelector: React.FC<VoiceSelectorProps> = ({
  voices,
  selectedVoice,
  onSelectVoice,
  onOpenCloneModal,
  onOpenCustomModal,
}) => {
  const [filter, setFilter] = useState<'all' | 'male' | 'female' | 'cloned' | 'custom'>('all');

  const filteredVoices = voices.filter((v) => {
    if (filter === 'male') return v.gender === 'male';
    if (filter === 'female') return v.gender === 'female';
    if (filter === 'cloned') return v.isCloned;
    if (filter === 'custom') return v.isCustom;
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Header and Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
            <span>Pilihan Karakter Suara</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-300 font-medium border border-violet-500/20">
              {voices.length} Tersedia
            </span>
          </h3>
          <p className="text-xs text-zinc-400">
            Pilih suara karakter default (Aldi, Gadis, Grag, Luna, dll), atau gunakan suara kloningan Anda
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenCloneModal}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-violet-600/20 transition cursor-pointer"
          >
            <Mic className="w-3.5 h-3.5" />
            <span>Kloning Suara</span>
          </button>

          <button
            onClick={onOpenCustomModal}
            className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5 text-cyan-400" />
            <span>Tambah Suara</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        {[
          { id: 'all', label: 'Semua Suara' },
          { id: 'male', label: '👨 Laki-laki' },
          { id: 'female', label: '👩 Perempuan' },
          { id: 'cloned', label: '🎙️ Kloning AI' },
          { id: 'custom', label: '✨ Buatan Sendiri' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id as any)}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition cursor-pointer ${
              filter === tab.id
                ? 'bg-zinc-100 text-zinc-900 shadow'
                : 'bg-zinc-900/80 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Voice Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 max-h-[380px] overflow-y-auto pr-1">
        {filteredVoices.map((voice) => {
          const isSelected = selectedVoice.id === voice.id;
          return (
            <div
              key={voice.id}
              onClick={() => onSelectVoice(voice)}
              className={`relative p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer text-left flex flex-col justify-between ${
                isSelected
                  ? 'bg-gradient-to-b from-zinc-800/90 to-zinc-900/95 border-violet-500 shadow-lg shadow-violet-500/10 ring-1 ring-violet-500/50 scale-[1.01]'
                  : 'bg-zinc-900/60 border-zinc-800/90 hover:bg-zinc-800/60 hover:border-zinc-700'
              }`}
            >
              {isSelected && (
                <div className="absolute top-3 right-3 text-violet-400">
                  <CheckCircle2 className="w-4 h-4 fill-violet-500/20" />
                </div>
              )}

              <div>
                <div className="flex items-center space-x-3 mb-2.5">
                  <div
                    className={`w-11 h-11 rounded-xl bg-gradient-to-tr ${voice.badgeColor} flex items-center justify-center text-xl shadow-md`}
                  >
                    {voice.avatar}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-sm font-bold text-zinc-100">{voice.name}</h4>
                      {voice.isCloned && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-fuchsia-500/20 text-fuchsia-300 font-semibold border border-fuchsia-500/30">
                          Kloning
                        </span>
                      )}
                      {voice.isCustom && !voice.isCloned && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/30">
                          Kustom
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-400">
                      {voice.genderLabel} • <span className="text-zinc-500 font-mono">{voice.baseVoice}</span>
                    </p>
                  </div>
                </div>

                <p className="text-xs text-zinc-400 line-clamp-2 mb-3">
                  {voice.description}
                </p>
              </div>

              {/* Trait badges */}
              <div className="flex flex-wrap gap-1 mt-auto pt-2 border-t border-zinc-800/60">
                {voice.vocalTraits.slice(0, 3).map((trait, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 font-medium"
                  >
                    {trait}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
