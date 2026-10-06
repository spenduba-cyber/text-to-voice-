import React, { useState, useRef } from 'react';
import {
  Mic,
  Square,
  Upload,
  Sparkles,
  Play,
  Pause,
  X,
  CheckCircle2,
  AlertCircle,
  FileAudio,
  Radio,
  Volume2
} from 'lucide-react';
import { MicRecorder, fileToBase64 } from '../utils/audioUtils';
import { VoiceProfile } from '../types';

interface VoiceCloneModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVoiceCloned: (clonedVoice: VoiceProfile) => void;
}

export const VoiceCloneModal: React.FC<VoiceCloneModalProps> = ({
  isOpen,
  onClose,
  onVoiceCloned,
}) => {
  const [activeTab, setActiveTab] = useState<'record' | 'upload'>('record');
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null);
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const [audioMimeType, setAudioMimeType] = useState<string>('audio/wav');
  const [fileName, setFileName] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [clonedResult, setClonedResult] = useState<any | null>(null);
  const [customCloneName, setCustomCloneName] = useState('');

  const recorderRef = useRef<MicRecorder | null>(null);
  const timerIntervalRef = useRef<any>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleStartRecord = async () => {
    try {
      setAnalysisError(null);
      setClonedResult(null);
      setAudioPreviewUrl(null);
      setAudioBase64(null);

      recorderRef.current = new MicRecorder();
      await recorderRef.current.start();
      setIsRecording(true);
      setRecordSeconds(0);

      timerIntervalRef.current = setInterval(() => {
        setRecordSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      setAnalysisError('Izin mikrofon ditolak atau perangkat tidak ditemukan.');
    }
  };

  const handleStopRecord = async () => {
    if (!recorderRef.current) return;
    try {
      clearInterval(timerIntervalRef.current);
      setIsRecording(false);
      const { base64, mimeType, url } = await recorderRef.current.stop();
      setAudioPreviewUrl(url);
      setAudioBase64(base64);
      setAudioMimeType(mimeType);
      setFileName(`Rekaman-Mikrofon-${recordSeconds}detik`);
    } catch (err: any) {
      setAnalysisError('Gagal menghentikan rekaman audio.');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAnalysisError(null);
    setClonedResult(null);
    try {
      const { base64, mimeType } = await fileToBase64(file);
      const url = URL.createObjectURL(file);
      setAudioPreviewUrl(url);
      setAudioBase64(base64);
      setAudioMimeType(mimeType);
      setFileName(file.name);
    } catch (err: any) {
      setAnalysisError('Gagal membaca file audio.');
    }
  };

  const togglePlayAudio = () => {
    if (!audioPreviewUrl) return;
    if (!previewAudioRef.current) {
      previewAudioRef.current = new Audio(audioPreviewUrl);
      previewAudioRef.current.onended = () => setIsPlayingPreview(false);
    }

    if (isPlayingPreview) {
      previewAudioRef.current.pause();
      setIsPlayingPreview(false);
    } else {
      previewAudioRef.current.play();
      setIsPlayingPreview(true);
    }
  };

  const handleAnalyzeAndClone = async () => {
    if (!audioBase64) {
      setAnalysisError('Silakan rekam suara atau unggah file sampel terlebih dahulu.');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const response = await fetch('/api/voice/clone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioData: audioBase64,
          mimeType: audioMimeType,
          sampleName: fileName,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Gagal memproses kloning suara.');
      }

      setClonedResult(data.profile);
      setCustomCloneName(data.profile.name || 'Kloning Suara Kustom');
    } catch (err: any) {
      console.error(err);
      setAnalysisError(err.message || 'Kloning suara gagal diproses oleh AI.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveAndUse = () => {
    if (!clonedResult) return;

    const newVoice: VoiceProfile = {
      id: clonedResult.id || `clone-${Date.now()}`,
      name: customCloneName.trim() || clonedResult.name || 'Kloning Suara Saya',
      gender: clonedResult.gender === 'female' ? 'female' : 'male',
      genderLabel: clonedResult.gender === 'female' ? 'Perempuan (Kloning)' : 'Laki-laki (Kloning)',
      baseVoice: clonedResult.baseVoice || (clonedResult.gender === 'female' ? 'Kore' : 'Puck'),
      avatar: clonedResult.gender === 'female' ? '🎙️👩' : '🎙️👨',
      badgeColor: 'from-violet-600 to-indigo-700',
      description: clonedResult.summary || 'Karakter suara hasil kloning sampel audio Anda.',
      vocalTraits: [
        'Kloning AI',
        clonedResult.gender === 'female' ? 'Wanita' : 'Pria',
        clonedResult.timbre || 'Khas',
      ],
      isCloned: true,
      clonedFromAudioName: fileName,
      customPrompt: clonedResult.vocalStylePrompt,
      timbre: clonedResult.timbre,
    };

    onVoiceCloned(newVoice);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/60">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 to-fuchsia-600 flex items-center justify-center text-white shadow-lg shadow-violet-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
                Kloning Suara AI
                <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 font-medium border border-violet-500/30">
                  Multimodal Gemini
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Input contoh suara untuk dianalisis dan dikloning menjadi karakter suara baru
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Tab Selection */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-950 rounded-xl border border-zinc-800">
            <button
              onClick={() => setActiveTab('record')}
              className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-medium text-sm transition ${
                activeTab === 'record'
                  ? 'bg-zinc-800 text-white shadow'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Mic className="w-4 h-4 text-violet-400" />
              Rekam Suara Langsung
            </button>
            <button
              onClick={() => setActiveTab('upload')}
              className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-medium text-sm transition ${
                activeTab === 'upload'
                  ? 'bg-zinc-800 text-white shadow'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Upload className="w-4 h-4 text-emerald-400" />
              Unggah File Sampel
            </button>
          </div>

          {/* Active Tab Panel */}
          {activeTab === 'record' ? (
            <div className="p-6 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 flex flex-col items-center justify-center text-center space-y-4">
              <div
                className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ${
                  isRecording
                    ? 'bg-red-500/20 text-red-500 border-2 border-red-500 scale-110 shadow-lg shadow-red-500/30 animate-pulse'
                    : 'bg-violet-600/10 text-violet-400 border border-violet-500/30 hover:border-violet-500'
                }`}
              >
                <Mic className="w-9 h-9" />
              </div>

              {isRecording ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-center gap-2 text-red-400 font-medium">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                    Sedang Merekam Suara... ({recordSeconds} detik)
                  </div>
                  <p className="text-xs text-zinc-400 max-w-sm">
                    Ucapkan 1-3 kalimat dengan jelas dan nada suara santai alami Anda.
                  </p>
                  <button
                    onClick={handleStopRecord}
                    className="mt-3 px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-sm font-semibold flex items-center gap-2 mx-auto shadow-lg shadow-red-600/30 transition cursor-pointer"
                  >
                    <Square className="w-4 h-4 fill-white" />
                    Hentikan Rekaman
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-zinc-200">
                    Rekam suara Anda minimal 5-15 detik
                  </p>
                  <p className="text-xs text-zinc-400 max-w-md">
                    Tips: Baca kutipan kalimat pendek atau berbicaralah dengan gaya natural agar AI dapat mendeteksi timbre dan artikulasi Anda.
                  </p>
                  <button
                    onClick={handleStartRecord}
                    className="mt-3 px-6 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl text-sm font-semibold flex items-center gap-2 mx-auto shadow-lg shadow-violet-600/30 transition cursor-pointer"
                  >
                    <Radio className="w-4 h-4" />
                    Mulai Merekam
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-zinc-950/70 border border-dashed border-zinc-800 hover:border-zinc-700 flex flex-col items-center justify-center text-center space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*,.wav,.mp3,.m4a,.ogg,.webm"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400">
                <FileAudio className="w-8 h-8 text-emerald-400" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-zinc-200">
                  Pilih file sampel suara Anda
                </p>
                <p className="text-xs text-zinc-400">
                  Mendukung format WAV, MP3, M4A, OGG, WEBM (Maks 20MB)
                </p>
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-sm font-medium flex items-center gap-2 transition cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                Pilih File Audio
              </button>
            </div>
          )}

          {/* Sample Audio Preview & Actions */}
          {audioPreviewUrl && (
            <div className="p-4 rounded-xl bg-zinc-800/60 border border-zinc-700/60 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <button
                  onClick={togglePlayAudio}
                  className="w-10 h-10 rounded-full bg-violet-600 hover:bg-violet-500 text-white flex items-center justify-center shadow transition"
                >
                  {isPlayingPreview ? (
                    <Pause className="w-4 h-4 fill-white" />
                  ) : (
                    <Play className="w-4 h-4 fill-white ml-0.5" />
                  )}
                </button>
                <div>
                  <p className="text-sm font-semibold text-zinc-200 truncate max-w-xs">
                    {fileName || 'Sampel Suara Siap'}
                  </p>
                  <p className="text-xs text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Audio berhasil dimuat & siap di-kloning
                  </p>
                </div>
              </div>

              <button
                onClick={handleAnalyzeAndClone}
                disabled={isAnalyzing}
                className="px-4 py-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 disabled:opacity-50 text-white rounded-xl text-sm font-semibold flex items-center gap-2 shadow-lg shadow-violet-600/30 transition cursor-pointer"
              >
                {isAnalyzing ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Menganalisis Suara...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Kloning Suara Ini
                  </>
                )}
              </button>
            </div>
          )}

          {/* Error Message */}
          {analysisError && (
            <div className="p-3.5 rounded-xl bg-red-950/50 border border-red-800/80 text-red-300 text-sm flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <span>{analysisError}</span>
            </div>
          )}

          {/* Analysis Result Card */}
          {clonedResult && (
            <div className="p-5 rounded-2xl bg-zinc-950 border border-violet-500/40 space-y-4 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-2xl shadow-md">
                    {clonedResult.gender === 'female' ? '🎙️👩' : '🎙️👨'}
                  </div>
                  <div>
                    <span className="text-xs uppercase tracking-wider text-violet-400 font-semibold">
                      Hasil Kloning Berhasil
                    </span>
                    <input
                      type="text"
                      value={customCloneName}
                      onChange={(e) => setCustomCloneName(e.target.value)}
                      placeholder="Beri Nama Suara..."
                      className="block text-base font-bold text-zinc-100 bg-transparent border-b border-zinc-700 focus:border-violet-500 outline-none pb-0.5"
                    />
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Base: {clonedResult.baseVoice}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800">
                  <span className="text-zinc-500 block mb-0.5">Gender & Usia:</span>
                  <span className="text-zinc-200 font-medium capitalize">
                    {clonedResult.gender === 'female' ? 'Wanita' : 'Pria'}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800">
                  <span className="text-zinc-500 block mb-0.5">Tekstur Timbre:</span>
                  <span className="text-zinc-200 font-medium truncate block">
                    {clonedResult.timbreDescription || clonedResult.timbre || 'Khas & berkarakter'}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-zinc-900/80 border border-zinc-800 text-xs text-zinc-300 space-y-1">
                <span className="text-zinc-400 font-medium block">Analisis AI:</span>
                <p>{clonedResult.summary}</p>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={handleSaveAndUse}
                  className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-sm font-semibold flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Simpan & Gunakan Suara Ini
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
