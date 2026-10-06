import React from 'react';
import { History, Play, Download, Trash2, Clock, Globe2 } from 'lucide-react';
import { GenerationResult } from '../types';
import { formatTime, downloadBase64Wav } from '../utils/audioUtils';

interface GenerationHistoryProps {
  history: GenerationResult[];
  onSelectResult: (res: GenerationResult) => void;
  onClearHistory: () => void;
}

export const GenerationHistory: React.FC<GenerationHistoryProps> = ({
  history,
  onSelectResult,
  onClearHistory,
}) => {
  if (history.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-zinc-200 flex items-center gap-2">
          <History className="w-4 h-4 text-violet-400" />
          <span>Riwayat Suara 3 Bahasa Terakhir</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">
            {history.length}
          </span>
        </h4>

        <button
          onClick={onClearHistory}
          className="text-xs text-zinc-500 hover:text-red-400 flex items-center gap-1 transition"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Hapus Riwayat</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {history.slice(0, 6).map((item) => (
          <div
            key={item.id}
            className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 hover:border-zinc-700 transition flex items-center justify-between gap-3 group"
          >
            <div
              onClick={() => onSelectResult(item)}
              className="flex items-center space-x-3 cursor-pointer min-w-0 flex-1"
            >
              <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-xl shrink-0 group-hover:scale-105 transition">
                {item.voice.avatar}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h5 className="text-xs font-bold text-zinc-200 truncate">
                    {item.voice.name}
                  </h5>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-pink-500/10 text-pink-300 font-medium">
                    {item.vibe.title}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                  "{item.originalText}"
                </p>
                <div className="flex items-center gap-2 text-[10px] text-zinc-500 mt-1">
                  <span>⏱️ {formatTime(item.masterAudio.totalDurationSec)}</span>
                  <span>•</span>
                  <span>🇮🇩 🇬🇧 🇸🇦 3 Bahasa</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => onSelectResult(item)}
                title="Buka & Putar di Player"
                className="p-2 rounded-xl bg-violet-600/10 hover:bg-violet-600/20 text-violet-400 transition cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-violet-400" />
              </button>
              <button
                onClick={() =>
                  downloadBase64Wav(
                    item.masterAudio.base64Wav,
                    `SuaraGen_${item.voice.name}_${item.vibe.title}.wav`
                  )
                }
                title="Download Master WAV (3-in-1)"
                className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
