import React, { useState } from 'react';
import {
  Sparkles,
  Globe2,
  Languages,
  ChevronDown,
  ChevronUp,
  Volume2,
  Wand2,
  Check,
  RefreshCw,
  SlidersHorizontal
} from 'lucide-react';
import { VoiceProfile, VibeOption } from '../types';

interface TextInputPanelProps {
  text: string;
  onChangeText: (newText: string) => void;
  selectedVoice: VoiceProfile;
  selectedVibe: VibeOption;
  isGenerating: boolean;
  onGenerate: (customTranslations?: { id: string; en: string; ar: string }) => void;
  addChime: boolean;
  onToggleChime: (val: boolean) => void;
}

export const TextInputPanel: React.FC<TextInputPanelProps> = ({
  text,
  onChangeText,
  selectedVoice,
  selectedVibe,
  isGenerating,
  onGenerate,
  addChime,
  onToggleChime,
}) => {
  const [showTranslationsPreview, setShowTranslationsPreview] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [customIdText, setCustomIdText] = useState('');
  const [customEnText, setCustomEnText] = useState('');
  const [customArText, setCustomArText] = useState('');
  const [activeLangTab, setActiveLangTab] = useState<'id' | 'en' | 'ar'>('id');
  const [showInspirations, setShowInspirations] = useState(false);
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([
    'Setiap langkah kecil yang kamu ambil hari ini adalah jembatan menuju impian besarmu esok hari.',
    'Di antara keheningan malam dan hembusan angin sejuk, tersimpan ketenangan jiwa yang tak ternilai.',
    'Kekuatan terbesar manusia bukanlah tidak pernah jatuh, melainkan bangkit kembali setiap kali terjatuh.',
  ]);

  const handleFetchSuggestions = async (category: string) => {
    setIsFetchingSuggestions(true);
    try {
      const res = await fetch('/api/text/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, vibe: selectedVibe.id }),
      });
      const data = await res.json();
      if (data.suggestions && data.suggestions.length > 0) {
        setSuggestions(data.suggestions);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsFetchingSuggestions(false);
    }
  };

  const handlePreTranslate = async () => {
    if (!text.trim()) return;
    setIsTranslating(true);
    try {
      const res = await fetch('/api/translate-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, vibe: selectedVibe.title }),
      });
      const data = await res.json();
      if (data.success && data.translations) {
        setCustomIdText(data.translations.id);
        setCustomEnText(data.translations.en);
        setCustomArText(data.translations.ar);
        setShowTranslationsPreview(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleTriggerGenerate = () => {
    if (showTranslationsPreview && (customIdText || customEnText || customArText)) {
      onGenerate({
        id: customIdText || text,
        en: customEnText || text,
        ar: customArText || text,
      });
    } else {
      onGenerate();
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Bar: Label and Suggestions Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <label className="text-sm font-bold text-zinc-100 flex items-center gap-2">
            <span>Teks yang Ingin Diucapkan</span>
          </label>
          <span className="text-[11px] text-zinc-500">
            ({text.length} karakter • {text.trim() ? text.trim().split(/\s+/).length : 0} kata)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowInspirations(!showInspirations)}
            className="px-3 py-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-800 text-violet-400 hover:text-violet-300 text-xs font-medium flex items-center gap-1.5 border border-zinc-700/60 transition cursor-pointer"
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>Ide Teks</span>
          </button>
        </div>
      </div>

      {/* Inspirations Panel Dropdown */}
      {showInspirations && (
        <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-700/70 space-y-2.5 animate-in fade-in">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-400 font-semibold">Pilih Kategori Inspirasi Teks:</span>
            <div className="flex gap-1">
              {['Motivasi', 'Puisi', 'Kisah Epik', 'Promosi', 'Ketenangan'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => handleFetchSuggestions(cat)}
                  className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] transition"
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            {suggestions.map((item, idx) => (
              <div
                key={idx}
                onClick={() => {
                  onChangeText(item);
                  setShowInspirations(false);
                }}
                className="p-2.5 rounded-lg bg-zinc-950/80 hover:bg-violet-950/30 hover:border-violet-500/50 border border-zinc-800 text-xs text-zinc-200 cursor-pointer transition flex items-center justify-between group"
              >
                <span className="truncate pr-2 italic">"{item}"</span>
                <span className="text-[10px] text-violet-400 opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                  Gunakan ↵
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Textarea */}
      <div className="relative">
        <textarea
          rows={4}
          value={text}
          onChange={(e) => onChangeText(e.target.value)}
          placeholder="Tulis kalimat apa saja di sini... SuaraGen AI akan mengonversinya secara otomatis ke dalam 3 Bahasa: Indonesia 🇮🇩, Inggris 🇬🇧, dan Arab 🇸🇦 dalam satu file suara utuh."
          className="w-full px-4 py-3.5 rounded-2xl bg-zinc-900/90 border border-zinc-700/80 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 text-zinc-100 placeholder-zinc-500 text-sm leading-relaxed outline-none transition resize-y min-h-[110px]"
        />
      </div>

      {/* Multilingual 3-in-1 Feature Showcase Box */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-violet-950/30 via-zinc-900/70 to-indigo-950/30 border border-zinc-800/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-violet-600/20 text-violet-400 border border-violet-500/30 flex items-center justify-center shrink-0">
            <Globe2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-zinc-200">
                Konversi 3 Bahasa Sekaligus dalam 1 File
              </h4>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-violet-500/20 text-violet-300 font-semibold border border-violet-500/30">
                Fitur Utama
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 flex items-center gap-1.5 mt-0.5">
              <span>🇮🇩 Bahasa Indonesia</span>
              <span>•</span>
              <span>🇬🇧 English</span>
              <span>•</span>
              <span>🇸🇦 العربية (Arab Harakat)</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          <button
            type="button"
            onClick={handlePreTranslate}
            disabled={!text.trim() || isTranslating}
            className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium border border-zinc-700/80 flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer"
          >
            {isTranslating ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-violet-400" />
            ) : (
              <Languages className="w-3.5 h-3.5 text-violet-400" />
            )}
            <span>Lihat / Edit Terjemahan</span>
          </button>
        </div>
      </div>

      {/* Accordion / Editable Preview for the 3 Languages */}
      {showTranslationsPreview && (
        <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
            <div className="flex items-center space-x-1.5">
              {[
                { id: 'id', label: '🇮🇩 Indonesia' },
                { id: 'en', label: '🇬🇧 English' },
                { id: 'ar', label: '🇸🇦 العربية (Arab)' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveLangTab(tab.id as any)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                    activeLangTab === tab.id
                      ? 'bg-violet-600 text-white shadow'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowTranslationsPreview(false)}
              className="text-xs text-zinc-400 hover:text-zinc-200 flex items-center gap-1"
            >
              <span>Tutup Panel</span>
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
          </div>

          <div>
            {activeLangTab === 'id' && (
              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                  Teks Bahasa Indonesia:
                </label>
                <textarea
                  rows={2}
                  value={customIdText}
                  onChange={(e) => setCustomIdText(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 text-xs focus:border-violet-500 outline-none"
                />
              </div>
            )}

            {activeLangTab === 'en' && (
              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                  Teks English (Inggris):
                </label>
                <textarea
                  rows={2}
                  value={customEnText}
                  onChange={(e) => setCustomEnText(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 text-xs focus:border-violet-500 outline-none"
                />
              </div>
            )}

            {activeLangTab === 'ar' && (
              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                  النص العربي (Bahasa Arab berharakat):
                </label>
                <textarea
                  rows={2}
                  dir="rtl"
                  value={customArText}
                  onChange={(e) => setCustomArText(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 text-sm font-arabic focus:border-violet-500 outline-none text-right"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Settings Bar & Big Generate Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
        {/* Chime toggle */}
        <label className="flex items-center space-x-2 text-xs text-zinc-300 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={addChime}
            onChange={(e) => onToggleChime(e.target.checked)}
            className="w-4 h-4 rounded bg-zinc-900 border-zinc-700 text-violet-600 focus:ring-violet-500 focus:ring-offset-0"
          />
          <span>Sisipkan nada chime transisi lembut antar-bahasa</span>
        </label>

        {/* Generate Button */}
        <button
          onClick={handleTriggerGenerate}
          disabled={!text.trim() || isGenerating}
          className="w-full sm:w-auto px-7 py-3 rounded-2xl bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 hover:from-violet-500 hover:via-purple-500 hover:to-pink-500 text-white font-bold text-sm shadow-xl shadow-violet-600/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2.5 transition-all duration-200 cursor-pointer active:scale-98"
        >
          {isGenerating ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Memproses Suara 3 Bahasa...</span>
            </>
          ) : (
            <>
              <Volume2 className="w-5 h-5" />
              <span>Generate Suara 3 Bahasa (1 File)</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
