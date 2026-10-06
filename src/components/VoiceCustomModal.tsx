import React, { useState } from 'react';
import { UserPlus, X, Check, Sparkles } from 'lucide-react';
import { VoiceProfile } from '../types';

interface VoiceCustomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVoiceCreated: (voice: VoiceProfile) => void;
}

export const VoiceCustomModal: React.FC<VoiceCustomModalProps> = ({
  isOpen,
  onClose,
  onVoiceCreated,
}) => {
  const [name, setName] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [baseVoice, setBaseVoice] = useState<'Puck' | 'Charon' | 'Fenrir' | 'Kore' | 'Zephyr'>('Puck');
  const [avatar, setAvatar] = useState('🎙️✨');
  const [description, setDescription] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [vocalTraitInput, setVocalTraitInput] = useState('');

  if (!isOpen) return null;

  const handleGenderChange = (newGender: 'male' | 'female') => {
    setGender(newGender);
    if (newGender === 'female' && (baseVoice === 'Puck' || baseVoice === 'Fenrir' || baseVoice === 'Charon')) {
      setBaseVoice('Kore');
    } else if (newGender === 'male' && (baseVoice === 'Kore' || baseVoice === 'Zephyr')) {
      setBaseVoice('Puck');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const traits = vocalTraitInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const newVoice: VoiceProfile = {
      id: `custom-${Date.now()}`,
      name: name.trim(),
      gender,
      genderLabel: gender === 'male' ? 'Laki-laki (Kustom)' : 'Perempuan (Kustom)',
      baseVoice,
      avatar: avatar || (gender === 'male' ? '👨‍💼' : '👩‍💼'),
      badgeColor: gender === 'male' ? 'from-indigo-600 to-cyan-600' : 'from-pink-600 to-rose-600',
      description: description.trim() || 'Karakter suara kustom kreasi Anda.',
      vocalTraits: traits.length > 0 ? traits : ['Kustom', gender === 'male' ? 'Pria' : 'Wanita'],
      isCustom: true,
      customPrompt: customPrompt.trim(),
    };

    onVoiceCreated(newVoice);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/60">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-zinc-100">Tambah Karakter Suara Sendiri</h2>
              <p className="text-xs text-zinc-400">Rancang profil suara kustom dengan pengarah vokal unik</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
              Nama Karakter Suara *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Rangga, Kirana, Narator Horor..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-cyan-500 text-zinc-100 placeholder-zinc-500 outline-none text-sm transition"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                Jenis Kelamin
              </label>
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-zinc-950 rounded-xl border border-zinc-800">
                <button
                  type="button"
                  onClick={() => handleGenderChange('male')}
                  className={`py-2 text-xs font-semibold rounded-lg transition ${
                    gender === 'male'
                      ? 'bg-blue-600 text-white shadow'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Laki-laki
                </button>
                <button
                  type="button"
                  onClick={() => handleGenderChange('female')}
                  className={`py-2 text-xs font-semibold rounded-lg transition ${
                    gender === 'female'
                      ? 'bg-rose-600 text-white shadow'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Perempuan
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                Emoji Avatar
              </label>
              <input
                type="text"
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
                maxLength={4}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-cyan-500 text-center text-lg text-zinc-100 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
              Base Engine Suara (Gemini Voice Model)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {gender === 'male' ? (
                <>
                  {[
                    { id: 'Puck', label: 'Puck (Ramah & Hangat)' },
                    { id: 'Fenrir', label: 'Fenrir (Tegas & Bariton)' },
                    { id: 'Charon', label: 'Charon (Dalam & Epik)' },
                  ].map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setBaseVoice(v.id as any)}
                      className={`p-2 rounded-xl text-left border transition text-xs ${
                        baseVoice === v.id
                          ? 'border-cyan-500 bg-cyan-500/10 text-cyan-200 font-semibold'
                          : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-zinc-300'
                      }`}
                    >
                      {v.label}
                    </button>
                  ))}
                </>
              ) : (
                <>
                  {[
                    { id: 'Kore', label: 'Kore (Anggun & Jernih)' },
                    { id: 'Zephyr', label: 'Zephyr (Ceria & Dinamis)' },
                  ].map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setBaseVoice(v.id as any)}
                      className={`p-2 rounded-xl text-left border transition text-xs ${
                        baseVoice === v.id
                          ? 'border-rose-500 bg-rose-500/10 text-rose-200 font-semibold'
                          : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-zinc-300'
                      }`}
                    >
                      {v.label}
                    </button>
                  ))}
                </>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
              Deskripsi Singkat Karakter
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Contoh: Suara berwibawa khas pengisi suara dokumenter alam liar..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-cyan-500 text-zinc-100 placeholder-zinc-500 outline-none text-sm transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>Instruksi Vokal AI (Style Directive)</span>
              <span className="text-[11px] text-zinc-500 lowercase">opsional</span>
            </label>
            <textarea
              rows={2}
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Contoh: Artikulasi lambat, intonasi tenang berwibawa, nafas teratur, kehangatan empati tinggi..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-cyan-500 text-zinc-100 placeholder-zinc-500 outline-none text-sm transition resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
              Label Karakter (pisahkan dengan koma)
            </label>
            <input
              type="text"
              value={vocalTraitInput}
              onChange={(e) => setVocalTraitInput(e.target.value)}
              placeholder="Contoh: Berwibawa, Serak, Cepat, Humoris"
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-cyan-500 text-zinc-100 placeholder-zinc-500 outline-none text-sm transition"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-sm font-semibold flex items-center gap-2 shadow-lg shadow-cyan-600/30 transition cursor-pointer"
            >
              <Check className="w-4 h-4" />
              Simpan Karakter Suara
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
