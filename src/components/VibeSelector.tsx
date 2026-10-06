import React, { useState } from 'react';
import {
  Feather,
  ShieldAlert,
  HeartHandshake,
  Sparkles,
  Ear,
  Flame,
  Radio,
  Eye,
  Coffee,
  Moon,
  Plus,
  X,
  CheckCircle2,
  Sliders
} from 'lucide-react';
import { VibeOption } from '../types';

interface VibeSelectorProps {
  vibes: VibeOption[];
  selectedVibe: VibeOption;
  onSelectVibe: (vibe: VibeOption) => void;
  onAddCustomVibe: (newVibe: VibeOption) => void;
}

export const VibeSelector: React.FC<VibeSelectorProps> = ({
  vibes,
  selectedVibe,
  onSelectVibe,
  onAddCustomVibe,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [customTag, setCustomTag] = useState('');
  const [customDesc, setCustomDesc] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');

  // Icon resolver
  const renderIcon = (name: string, className = 'w-4 h-4') => {
    switch (name) {
      case 'Feather':
        return <Feather className={className} />;
      case 'ShieldAlert':
        return <ShieldAlert className={className} />;
      case 'HeartHandshake':
        return <HeartHandshake className={className} />;
      case 'Sparkles':
        return <Sparkles className={className} />;
      case 'Ear':
        return <Ear className={className} />;
      case 'Flame':
        return <Flame className={className} />;
      case 'Radio':
        return <Radio className={className} />;
      case 'Eye':
        return <Eye className={className} />;
      case 'Coffee':
        return <Coffee className={className} />;
      case 'Moon':
        return <Moon className={className} />;
      default:
        return <Sliders className={className} />;
    }
  };

  const handleSaveCustomVibe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle.trim()) return;

    const newVibe: VibeOption = {
      id: `vibe-${Date.now()}`,
      title: customTitle.trim(),
      iconName: 'Sliders',
      tag: customTag.trim() || 'Vibe Kustom',
      color: 'border-fuchsia-500/60 bg-fuchsia-500/10 text-fuchsia-300',
      description: customDesc.trim() || 'Vibe dan emosi kustom racikan Anda.',
      prompt: customPrompt.trim() || customTitle.trim(),
      isCustom: true,
    };

    onAddCustomVibe(newVibe);
    onSelectVibe(newVibe);
    setIsModalOpen(false);
    setCustomTitle('');
    setCustomTag('');
    setCustomDesc('');
    setCustomPrompt('');
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
            <span>Pilihan Vibes Suara</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-pink-500/10 text-pink-300 font-medium border border-pink-500/20">
              {vibes.length} Vibes
            </span>
          </h3>
          <p className="text-xs text-zinc-400">
            Pilih nuansa vokal emosional untuk menghidupkan pesan Anda
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 text-pink-400" />
          <span>Tambah Vibes Sendiri</span>
        </button>
      </div>

      {/* Vibe Cards Horizontal Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
        {vibes.map((vibe) => {
          const isSelected = selectedVibe.id === vibe.id;
          return (
            <button
              key={vibe.id}
              onClick={() => onSelectVibe(vibe)}
              type="button"
              className={`p-3 rounded-xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'bg-zinc-800 border-pink-500 shadow-md shadow-pink-500/10 ring-1 ring-pink-500/40 text-white'
                  : 'bg-zinc-900/70 border-zinc-800/90 text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1.5">
                <div
                  className={`p-1.5 rounded-lg ${
                    isSelected ? 'bg-pink-500/20 text-pink-400' : 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  {renderIcon(vibe.iconName, 'w-4 h-4')}
                </div>
                {isSelected && <CheckCircle2 className="w-4 h-4 text-pink-400 shrink-0" />}
              </div>

              <div>
                <h4 className="text-xs font-bold text-zinc-100 truncate">{vibe.title}</h4>
                <p className="text-[10px] text-zinc-400 line-clamp-1 mt-0.5">{vibe.tag}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Vibe details note */}
      <div className="px-3.5 py-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800/80 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-zinc-300">
          <span className="font-semibold text-pink-400">Vibe Aktif: {selectedVibe.title}</span>
          <span className="text-zinc-500">•</span>
          <span className="text-zinc-400 truncate max-w-md">{selectedVibe.description}</span>
        </div>
      </div>

      {/* Custom Vibe Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-700/80 rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/60">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-pink-500/20 text-pink-400 flex items-center justify-center">
                  <Sliders className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-zinc-100 text-sm">Racik Vibes Suara Sendiri</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomVibe} className="p-5 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Nama Vibes *
                </label>
                <input
                  type="text"
                  required
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="Contoh: Sarkas Cerdas, Motivator Api, Meditasi Alam..."
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-pink-500 text-zinc-100 text-sm outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Label / Kategori Singkat
                </label>
                <input
                  type="text"
                  value={customTag}
                  onChange={(e) => setCustomTag(e.target.value)}
                  placeholder="Contoh: Teatrikal & Emosional"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-pink-500 text-zinc-100 text-sm outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Deskripsi Singkat Vibes
                </label>
                <input
                  type="text"
                  value={customDesc}
                  onChange={(e) => setCustomDesc(e.target.value)}
                  placeholder="Contoh: Sangat berapi-api membakar semangat audiens"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-pink-500 text-zinc-100 text-sm outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Instruksi Vokal AI (Style Directive) *
                </label>
                <textarea
                  rows={2}
                  required
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="Jelaskan tempo bicara, hembusan nafas, artikulasi, dan emosi yang diinginkan..."
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-pink-500 text-zinc-100 text-sm outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white rounded-xl text-xs font-semibold shadow transition cursor-pointer"
                >
                  Simpan Vibes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
