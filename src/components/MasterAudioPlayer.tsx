import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Download,
  Volume2,
  VolumeX,
  FastForward,
  Copy,
  Check,
  Globe2,
  Sparkles,
  Music,
  Share2
} from 'lucide-react';
import { GenerationResult, LanguageSection } from '../types';
import { formatTime, downloadBase64Wav, base64ToBlobUrl } from '../utils/audioUtils';

interface MasterAudioPlayerProps {
  result: GenerationResult;
}

export const MasterAudioPlayer: React.FC<MasterAudioPlayerProps> = ({ result }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(result.masterAudio.totalDurationSec || 1);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [copiedLang, setCopiedLang] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const blobUrlRef = useRef<string | null>(null);

  // Initialize audio blob url whenever result changes
  useEffect(() => {
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
    }
    const url = base64ToBlobUrl(result.masterAudio.base64Wav, result.masterAudio.mimeType);
    blobUrlRef.current = url;

    if (audioRef.current) {
      audioRef.current.src = url;
      audioRef.current.load();
      audioRef.current.playbackRate = playbackRate;
      setCurrentTime(0);
      setIsPlaying(false);
    }

    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
      }
    };
  }, [result]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current && !isNaN(audioRef.current.duration)) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const handleJumpToSection = (startSec: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = startSec;
      setCurrentTime(startSec);
      if (!isPlaying) {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (audioRef.current) {
      audioRef.current.volume = val;
      setIsMuted(val === 0);
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    if (isMuted) {
      audioRef.current.volume = volume || 1;
      setIsMuted(false);
    } else {
      audioRef.current.volume = 0;
      setIsMuted(true);
    }
  };

  const changeSpeed = (speed: number) => {
    setPlaybackRate(speed);
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  };

  const copyText = (lang: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLang(lang);
    setTimeout(() => setCopiedLang(null), 2000);
  };

  // Determine which language section is active right now
  const activeSection = result.masterAudio.sections.find(
    (sec) => currentTime >= sec.startSec && currentTime <= sec.endSec
  );

  return (
    <div className="p-6 rounded-3xl bg-zinc-900 border border-zinc-700/80 shadow-2xl space-y-6">
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleAudioEnded}
      />

      {/* Top Banner: Info & Master Download */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 via-fuchsia-600 to-pink-600 flex items-center justify-center text-white shadow-lg shadow-violet-500/20 text-2xl">
            {result.voice.avatar}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-zinc-100">
                Master Audio 3 Bahasa (1 File Terpadu)
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                24kHz Hi-Fi
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Suara: <strong className="text-zinc-200">{result.voice.name}</strong> • Vibe: <strong className="text-pink-400">{result.vibe.title}</strong> • Durasi: {formatTime(duration)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Master Download Button */}
          <button
            onClick={() =>
              downloadBase64Wav(
                result.masterAudio.base64Wav,
                `SuaraGen_${result.voice.name}_${result.vibe.title}_3Bahasa.wav`
              )
            }
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-violet-600/30 transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download Master WAV (3-in-1)</span>
          </button>
        </div>
      </div>

      {/* Segmented Timeline of the 3 Languages */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-zinc-400">
          <span className="font-semibold text-zinc-300 flex items-center gap-1.5">
            <Globe2 className="w-3.5 h-3.5 text-violet-400" />
            Navigasi Timeline 3 Bahasa (Klik untuk Langsung Lompat):
          </span>
          <span className="font-mono text-zinc-300">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>

        {/* Multi-language Segment Bar */}
        <div className="grid grid-cols-3 gap-2">
          {result.masterAudio.sections.map((sec) => {
            const isSecActive = activeSection?.lang === sec.lang;
            return (
              <button
                key={sec.lang}
                onClick={() => handleJumpToSection(sec.startSec)}
                type="button"
                className={`p-3 rounded-2xl border text-left transition-all duration-200 cursor-pointer ${
                  isSecActive
                    ? 'bg-zinc-800 border-violet-500 ring-2 ring-violet-500/30 shadow-lg shadow-violet-500/10'
                    : 'bg-zinc-950/70 border-zinc-800/90 hover:bg-zinc-800/40'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base">{sec.flag}</span>
                    <span className="text-xs font-bold text-zinc-100">{sec.title}</span>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                    {formatTime(sec.startSec)}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 truncate italic">
                  "{sec.text}"
                </p>
              </button>
            );
          })}
        </div>

        {/* Scrubber slider */}
        <div className="pt-2">
          <input
            type="range"
            min={0}
            max={duration || 1}
            step={0.01}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-2 rounded-lg bg-zinc-800 appearance-none cursor-pointer accent-violet-500"
          />
        </div>
      </div>

      {/* Main Playback Controls Bar */}
      <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800/90 flex flex-wrap items-center justify-between gap-4">
        {/* Play/Pause & Replay */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => handleJumpToSection(0)}
            title="Ulangi dari Awal"
            className="p-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={togglePlay}
            className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white flex items-center justify-center shadow-lg shadow-violet-600/30 transition cursor-pointer active:scale-95"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-white" />
            ) : (
              <Play className="w-5 h-5 fill-white ml-0.5" />
            )}
          </button>

          <div className="hidden sm:flex items-center gap-1.5 pl-2">
            <span className="text-xs text-zinc-500">Kecepatan:</span>
            {[0.75, 1.0, 1.25, 1.5].map((spd) => (
              <button
                key={spd}
                onClick={() => changeSpeed(spd)}
                className={`px-2 py-1 rounded-lg text-xs font-semibold transition ${
                  playbackRate === spd
                    ? 'bg-violet-600 text-white'
                    : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>
        </div>

        {/* Volume & Individual Downloads */}
        <div className="flex items-center space-x-4">
          {/* Volume */}
          <div className="hidden md:flex items-center space-x-2">
            <button onClick={toggleMute} className="text-zinc-400 hover:text-zinc-200">
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-16 h-1.5 rounded-lg bg-zinc-800 appearance-none cursor-pointer accent-violet-500"
            />
          </div>

          {/* Quick Actions Dropdown / Individual downloads */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() =>
                downloadBase64Wav(
                  result.individualTracks.id.base64Wav,
                  `SuaraGen_ID_${result.voice.name}.wav`
                )
              }
              title="Download Hanya Bahasa Indonesia"
              className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium transition cursor-pointer flex items-center gap-1"
            >
              <span>🇮🇩 ID</span>
              <Download className="w-3 h-3 text-zinc-400" />
            </button>
            <button
              onClick={() =>
                downloadBase64Wav(
                  result.individualTracks.en.base64Wav,
                  `SuaraGen_EN_${result.voice.name}.wav`
                )
              }
              title="Download Only English"
              className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium transition cursor-pointer flex items-center gap-1"
            >
              <span>🇬🇧 EN</span>
              <Download className="w-3 h-3 text-zinc-400" />
            </button>
            <button
              onClick={() =>
                downloadBase64Wav(
                  result.individualTracks.ar.base64Wav,
                  `SuaraGen_AR_${result.voice.name}.wav`
                )
              }
              title="تحميل المقطع الصوتي العربي فقط"
              className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium transition cursor-pointer flex items-center gap-1"
            >
              <span>🇸🇦 AR</span>
              <Download className="w-3 h-3 text-zinc-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Script & Translation Accordion Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {result.masterAudio.sections.map((sec) => (
          <div
            key={sec.lang}
            className={`p-4 rounded-2xl border transition-all ${
              activeSection?.lang === sec.lang
                ? 'bg-zinc-950 border-violet-500/80 shadow-md shadow-violet-500/10 ring-1 ring-violet-500/30'
                : 'bg-zinc-950/60 border-zinc-800/80'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 font-bold text-xs text-zinc-200">
                <span>{sec.flag}</span>
                <span>{sec.title}</span>
              </div>
              <button
                onClick={() => copyText(sec.lang, sec.text)}
                className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 text-[11px] flex items-center gap-1"
              >
                {copiedLang === sec.lang ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400">Tersalin</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Salin</span>
                  </>
                )}
              </button>
            </div>
            <p
              dir={sec.lang === 'ar' ? 'rtl' : 'ltr'}
              className={`text-xs text-zinc-300 leading-relaxed ${
                sec.lang === 'ar' ? 'font-arabic text-sm text-right' : ''
              }`}
            >
              {sec.text}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
