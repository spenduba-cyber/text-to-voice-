import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isProd = process.env.NODE_ENV === 'production';
const PORT = Number(process.env.PORT) || 3000;

const app = express();
app.use(express.json({ limit: '60mb' }));
app.use(express.urlencoded({ extended: true, limit: '60mb' }));

// Initialize GoogleGenAI SDK server-side
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Helper: Retry operation for transient API spikes (503 / 429)
async function withRetry<T>(fn: () => Promise<T>, retries = 2, delayMs = 1200): Promise<T> {
  let lastError: any;
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch (err: any) {
      lastError = err;
      if (i < retries) {
        await new Promise((r) => setTimeout(r, delayMs * (i + 1)));
      }
    }
  }
  throw lastError;
}

// Helper: Extract PCM from a 24kHz mono 16-bit WAV buffer
function extractPcmFromWav(wavBuffer: Buffer): { pcm: Buffer; sampleRate: number; channels: number } {
  if (wavBuffer.length < 44 || wavBuffer.toString('ascii', 0, 4) !== 'RIFF' || wavBuffer.toString('ascii', 8, 12) !== 'WAVE') {
    return { pcm: wavBuffer, sampleRate: 24000, channels: 1 };
  }

  let offset = 12;
  let sampleRate = 24000;
  let channels = 1;
  let pcmBuffer = Buffer.alloc(0);

  while (offset + 8 <= wavBuffer.length) {
    const chunkId = wavBuffer.toString('ascii', offset, offset + 4);
    const chunkSize = wavBuffer.readUInt32LE(offset + 4);
    offset += 8;

    if (chunkId === 'fmt ') {
      channels = wavBuffer.readUInt16LE(offset + 2);
      sampleRate = wavBuffer.readUInt32LE(offset + 4);
      offset += chunkSize;
    } else if (chunkId === 'data') {
      pcmBuffer = Buffer.from(wavBuffer.subarray(offset, Math.min(offset + chunkSize, wavBuffer.length)));
      break;
    } else {
      offset += chunkSize;
    }
  }

  if (pcmBuffer.length === 0 && wavBuffer.length > 44) {
    pcmBuffer = Buffer.from(wavBuffer.subarray(44));
  }

  return { pcm: pcmBuffer, sampleRate, channels };
}

// Helper: Wrap PCM with RIFF WAV Header
function createWavBuffer(pcm: Buffer, sampleRate = 24000, channels = 1, bitsPerSample = 16): Buffer {
  const byteRate = sampleRate * channels * (bitsPerSample / 8);
  const blockAlign = channels * (bitsPerSample / 8);
  const dataSize = pcm.length;
  const header = Buffer.alloc(44);

  header.write('RIFF', 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write('data', 36);
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, pcm]);
}

// Helper: Generate a soft transition cue chime (e.g. 587.33 Hz D5 chord)
function generateTransitionChime(sampleRate = 24000, durationSec = 0.45, frequency = 587.33): Buffer {
  const numSamples = Math.floor(sampleRate * durationSec);
  const buffer = Buffer.alloc(numSamples * 2);
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const envelope = Math.exp(-t * 7);
    const sample = (Math.sin(2 * Math.PI * frequency * t) * 0.7 + Math.sin(2 * Math.PI * (frequency * 1.5) * t) * 0.3) * envelope * 0.18;
    const int16 = Math.max(-32768, Math.min(32767, Math.floor(sample * 32767)));
    buffer.writeInt16LE(int16, i * 2);
  }
  return buffer;
}

// Helper: Generate silence
function generateSilence(sampleRate = 24000, durationSec = 0.5): Buffer {
  const numSamples = Math.floor(sampleRate * durationSec);
  return Buffer.alloc(numSamples * 2);
}

// API Health Check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    time: new Date().toISOString(),
  });
});

// Translation Preview: Translate input text into Indonesia, English, and Arabic
app.post('/api/translate-preview', async (req: Request, res: Response) => {
  try {
    const { text, vibe } = req.body;
    if (!text || typeof text !== 'string') {
      res.status(400).json({ error: 'Teks wajib diisi' });
      return;
    }

    const prompt = `Anda adalah penerjemah ahli dan pengarah suara profesional.
Tugas Anda adalah mengonversi teks input ke dalam 3 bahasa:
1. Bahasa Indonesia (id): Bahasa Indonesia yang alami, luwes, dan menyatu dengan nuansa/vibe "${vibe || 'natural'}".
2. Bahasa Inggris (en): Terjemahan bahasa Inggris yang fasih, alami, dan bertenaga emosional yang sama.
3. Bahasa Arab (ar): Terjemahan bahasa Arab fasih (العربية الفصحى) yang kaya makna, lengkap dengan harakat/tanda baca yang tepat agar pelafalan suara Text-to-Speech terdengar fasih dan indah.

Teks Input: "${text}"

Kembalikan HANYA format JSON valid tanpa tanda backtick markdown, dengan skema:
{
  "id": "teks dalam bahasa Indonesia",
  "en": "text in English",
  "ar": "النص باللغة العربية مع التشكيل المناسب"
}`;

    const response = await withRetry(() =>
      ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              en: { type: Type.STRING },
              ar: { type: Type.STRING },
            },
            required: ['id', 'en', 'ar'],
          },
        },
      })
    );

    const parsed = JSON.parse(response.text || '{}');
    res.json({
      success: true,
      translations: {
        id: parsed.id || text,
        en: parsed.en || text,
        ar: parsed.ar || text,
      },
    });
  } catch (error: any) {
    console.error('Error in translate-preview:', error);
    res.status(500).json({
      error: error.message || 'Gagal menerjemahkan teks.',
    });
  }
});

// Voice Cloning Analysis: Analyze an audio sample (mic recording or uploaded file)
app.post('/api/voice/clone', async (req: Request, res: Response) => {
  try {
    const { audioData, mimeType, sampleName } = req.body;
    if (!audioData) {
      res.status(400).json({ error: 'Data audio tidak ditemukan.' });
      return;
    }

    // Clean base64 if user sent data URI scheme
    const cleanBase64 = audioData.includes('base64,')
      ? audioData.split('base64,')[1]
      : audioData;

    const audioPart = {
      inlineData: {
        mimeType: mimeType || 'audio/wav',
        data: cleanBase64,
      },
    };

    const promptText = `Analisis karakteristik vokal dari audio sampel ini secara mendalam untuk keperluan Kloning Suara AI (AI Voice Cloning).
Jelaskan karakteristik suara yang terdengar:
1. Gender vokal (male / female).
2. Perkiraan usia vokal (muda, dewasa, tua).
3. Deskripsi timbre/tekstur suara (misal: berat, serak basah, hangat, renyah, jernih, sengau, lembut, berwibawa, bariton, sopran, dll).
4. Karakteristik intonasi, dinamika nafas, dan kecepatan bicara.
5. Pilihlah satu base voice Gemini yang paling mendekati karakter ini di antara: "Puck" (pria muda/ramah), "Charon" (pria dewasa/berat/dalam), "Fenrir" (pria tegas/bariton/kuat), "Kore" (wanita lembut/anggun/jelas), "Zephyr" (wanita ceria/dinamis/modern).
6. Susun "vocalStylePrompt": instruksi pengarah vokal yang sangat detail untuk model Text-to-Speech agar dapat menirukan karakter, gaya, nada, dan timbre sampel suara ini secara presisi saat membaca teks.
7. Nama profil kloning yang keren dan representatif.

Kembalikan jawaban HANYA dalam format JSON dengan skema:
{
  "cloneName": "Nama profil suara",
  "gender": "male" atau "female",
  "baseVoice": "Puck" | "Charon" | "Fenrir" | "Kore" | "Zephyr",
  "timbreDescription": "Deskripsi singkat tekstur vokal",
  "vocalStylePrompt": "Instruksi gaya suara spesifik untuk TTS",
  "suggestedPitchOffset": 0,
  "summary": "Ringkasan analisis karakter suara ini"
}`;

    const analysisResponse = await withRetry(() =>
      ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: {
          parts: [audioPart, { text: promptText }],
        },
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              cloneName: { type: Type.STRING },
              gender: { type: Type.STRING },
              baseVoice: { type: Type.STRING },
              timbreDescription: { type: Type.STRING },
              vocalStylePrompt: { type: Type.STRING },
              suggestedPitchOffset: { type: Type.NUMBER },
              summary: { type: Type.STRING },
            },
            required: [
              'cloneName',
              'gender',
              'baseVoice',
              'timbreDescription',
              'vocalStylePrompt',
              'summary',
            ],
          },
        },
      })
    );

    const parsed = JSON.parse(analysisResponse.text || '{}');
    res.json({
      success: true,
      profile: {
        id: `clone-${Date.now()}`,
        name: sampleName || parsed.cloneName || 'Suara Kloning AI',
        gender: parsed.gender || 'male',
        baseVoice: parsed.baseVoice || 'Puck',
        timbre: parsed.timbreDescription || 'Karakteristik unik',
        vocalStylePrompt: parsed.vocalStylePrompt || 'Natural, expressive',
        summary: parsed.summary || 'Profil vokal hasil kloning AI',
        createdAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Error in voice clone analysis:', error);
    res.status(500).json({
      error: error.message || 'Gagal menganalisis audio untuk kloning suara.',
    });
  }
});

// Single Voice TTS Synthesizer helper
async function synthesizeVoiceTrack(
  text: string,
  voiceName: string,
  stylePrompt: string,
  langLabel: string
): Promise<{ wavBuffer: Buffer; durationSec: number }> {
  // Use gemini-3.8-flash-lite-tts
  const promptParts: any = [
    {
      text: text,
      speechMetadata: {
        style: `${stylePrompt}. Spoken clearly and naturally in ${langLabel}.`,
      },
    },
  ];

  const response = await withRetry(() =>
    ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: promptParts,
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voiceName },
          },
        },
      },
    })
  );

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) {
    throw new Error(`Tidak ada audio yang dihasilkan untuk bahasa ${langLabel}`);
  }

  const rawWavBuffer = Buffer.from(base64Audio, 'base64');
  const { pcm, sampleRate } = extractPcmFromWav(rawWavBuffer);
  const durationSec = Math.round((pcm.length / (sampleRate * 2)) * 100) / 100;

  return { wavBuffer: rawWavBuffer, durationSec };
}

// Generate Text-to-Sound in 3 Languages into ONE Combined Master Audio File
app.post('/api/tts/generate', async (req: Request, res: Response) => {
  try {
    const {
      text,
      translations: providedTranslations,
      voiceNameGemini = 'Puck',
      voiceName = 'Aldi',
      vibeTitle = 'Alami',
      vibePrompt = 'Natural, bersahabat, artikulatif',
      customStylePrompt = '',
      addChimeBetweenLangs = true,
    } = req.body;

    if (!text || typeof text !== 'string') {
      res.status(400).json({ error: 'Teks wajib diisi' });
      return;
    }

    // Step 1: Translations for ID, EN, AR
    let trans = providedTranslations;
    if (!trans || !trans.id || !trans.en || !trans.ar) {
      const translatePrompt = `Terjemahkan dan adaptasikan teks berikut ke dalam 3 bahasa dengan gaya/vibe "${vibeTitle}":
1. "id": Bahasa Indonesia yang luwes dan penuh penjiwaan.
2. "en": Bahasa Inggris natural dan tepat emosinya.
3. "ar": Bahasa Arab (العربية الفصحى) lengkap dengan harakat untuk artikulasi audio yang jelas.

Teks: "${text}"

Format JSON persis:
{
  "id": "...",
  "en": "...",
  "ar": "..."
}`;

      const transRes = await withRetry(() =>
        ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: translatePrompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                en: { type: Type.STRING },
                ar: { type: Type.STRING },
              },
              required: ['id', 'en', 'ar'],
            },
          },
        })
      );

      trans = JSON.parse(transRes.text || '{}');
    }

    const idText = trans.id || text;
    const enText = trans.en || text;
    const arText = trans.ar || text;

    // Combined style direction
    const combinedStyle = [
      `Vibe: ${vibePrompt}`,
      customStylePrompt ? `Vocal style instruction: ${customStylePrompt}` : '',
      `Character voice: ${voiceName}`,
    ]
      .filter(Boolean)
      .join('. ');

    // Step 2: Generate TTS for all 3 languages
    // We execute them sequentially or concurrently
    console.log(`Generating TTS for ID, EN, AR with voice: ${voiceNameGemini}, vibe: ${vibeTitle}...`);

    const [idResult, enResult, arResult] = await Promise.all([
      synthesizeVoiceTrack(idText, voiceNameGemini, combinedStyle, 'Indonesian (Bahasa Indonesia)'),
      synthesizeVoiceTrack(enText, voiceNameGemini, combinedStyle, 'English'),
      synthesizeVoiceTrack(arText, voiceNameGemini, combinedStyle, 'Arabic (العربية)'),
    ]);

    // Step 3: Stitching the 3 audio tracks into ONE master file
    // Extract PCM from each
    const sampleRate = 24000;
    const idPcm = extractPcmFromWav(idResult.wavBuffer).pcm;
    const enPcm = extractPcmFromWav(enResult.wavBuffer).pcm;
    const arPcm = extractPcmFromWav(arResult.wavBuffer).pcm;

    // Generate transition cue (chime or subtle pause)
    const transitionBuffer = addChimeBetweenLangs
      ? Buffer.concat([generateSilence(sampleRate, 0.25), generateTransitionChime(sampleRate, 0.4, 587.33), generateSilence(sampleRate, 0.35)])
      : generateSilence(sampleRate, 0.7);

    const transitionSec = transitionBuffer.length / (sampleRate * 2);

    // Calculate section timestamps for timeline scrubber in player
    const idDuration = idPcm.length / (sampleRate * 2);
    const enDuration = enPcm.length / (sampleRate * 2);
    const arDuration = arPcm.length / (sampleRate * 2);

    const idStart = 0;
    const idEnd = idDuration;

    const enStart = idEnd + transitionSec;
    const enEnd = enStart + enDuration;

    const arStart = enEnd + transitionSec;
    const arEnd = arStart + arDuration;

    const totalDuration = arEnd;

    // Merge PCM buffers: ID -> Transition -> EN -> Transition -> AR
    const masterPcm = Buffer.concat([idPcm, transitionBuffer, enPcm, transitionBuffer, arPcm]);
    const masterWav = createWavBuffer(masterPcm, sampleRate, 1, 16);

    const sections = [
      {
        lang: 'id',
        title: 'Bahasa Indonesia',
        flag: '🇮🇩',
        startSec: Math.round(idStart * 100) / 100,
        endSec: Math.round(idEnd * 100) / 100,
        durationSec: Math.round(idDuration * 100) / 100,
        text: idText,
      },
      {
        lang: 'en',
        title: 'English',
        flag: '🇬🇧',
        startSec: Math.round(enStart * 100) / 100,
        endSec: Math.round(enEnd * 100) / 100,
        durationSec: Math.round(enDuration * 100) / 100,
        text: enText,
      },
      {
        lang: 'ar',
        title: 'العربية (Arabic)',
        flag: '🇸🇦',
        startSec: Math.round(arStart * 100) / 100,
        endSec: Math.round(arEnd * 100) / 100,
        durationSec: Math.round(arDuration * 100) / 100,
        text: arText,
      },
    ];

    res.json({
      success: true,
      translations: {
        id: idText,
        en: enText,
        ar: arText,
      },
      masterAudio: {
        base64Wav: masterWav.toString('base64'),
        mimeType: 'audio/wav',
        totalDurationSec: Math.round(totalDuration * 100) / 100,
        sampleRate,
        sections,
      },
      individualTracks: {
        id: {
          base64Wav: idResult.wavBuffer.toString('base64'),
          durationSec: Math.round(idDuration * 100) / 100,
          text: idText,
        },
        en: {
          base64Wav: enResult.wavBuffer.toString('base64'),
          durationSec: Math.round(enDuration * 100) / 100,
          text: enText,
        },
        ar: {
          base64Wav: arResult.wavBuffer.toString('base64'),
          durationSec: Math.round(arDuration * 100) / 100,
          text: arText,
        },
      },
    });
  } catch (error: any) {
    console.error('Error generating 3-language TTS:', error);
    res.status(500).json({
      error: error.message || 'Gagal menghasilkan suara 3 bahasa.',
    });
  }
});

// Text Suggestion: Provide inspiring preset text ideas based on vibe/topic
app.post('/api/text/suggest', async (req: Request, res: Response) => {
  try {
    const { category = 'inspirasi', vibe = 'puitis' } = req.body;
    const prompt = `Buatkan 3 contoh kalimat/paragraf pendek yang sangat menarik dalam Bahasa Indonesia untuk Text to Speech.
Kategori: ${category}
Vibe/Emosi: ${vibe}
Panjang teks tiap contoh: 1 hingga 2 kalimat pendek yang berdampak emosional, ritmis, dan nikmat didengarkan.

Kembalikan format JSON:
{
  "suggestions": [
    "contoh 1",
    "contoh 2",
    "contoh 3"
  ]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: ['suggestions'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({ success: true, suggestions: parsed.suggestions || [] });
  } catch (error: any) {
    res.json({
      success: true,
      suggestions: [
        'Setiap langkah kecil yang kamu ambil hari ini adalah jembatan menuju impian besarmu esok hari.',
        'Di antara hening malam dan bisikan angin, tersimpan ketenangan yang tak ternilai harganya.',
        'Waktu tidak menunggu siapapun, maka jadikanlah setiap detiknya penuh dengan karya dan kebaikan.',
      ],
    });
  }
});

// Vite middleware or static serving
if (!isProd) {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static(path.resolve(__dirname, 'dist')));
  app.get('*', (req: Request, res: Response) => {
    res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server SuaraGen AI aktif di http://0.0.0.0:${PORT}`);
});
