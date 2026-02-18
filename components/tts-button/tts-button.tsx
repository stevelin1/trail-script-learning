'use client';

import { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface TTSButtonProps {
  text: string;
  lang?: string;
  rate?: number;
  pitch?: number;
  className?: string;
  disabled?: boolean;
}

type TTSState = 'idle' | 'loading' | 'playing' | 'paused';

// Shared voice state across all TTSButton instances
let sharedVoice: string | null = null;
let voicesLoaded = false;
const voiceCallbacks: Array<(voice: string | null) => void> = [];

// Shared voice loader - runs only once
function loadSharedVoices() {
  if (voicesLoaded) return;

  const attemptLoad = () => {
    const availableVoices = speechSynthesis.getVoices();
    if (availableVoices.length === 0) return false;

    const japaneseVoices = availableVoices.filter((v) =>
      v.lang.startsWith('ja')
    );

    // Try to find a female voice first (names often contain 'Female', 'Kyoko', 'O-Ren', etc.)
    const femaleVoice = japaneseVoices.find((v) =>
      /female|kyoko|o-ren|女性/i.test(v.name)
    );

    if (femaleVoice) {
      sharedVoice = femaleVoice.name;
    } else if (japaneseVoices.length > 0) {
      sharedVoice = japaneseVoices[0].name;
    }

    voicesLoaded = true;
    voiceCallbacks.forEach(cb => cb(sharedVoice));
    voiceCallbacks.length = 0;
    return true;
  };

  if (attemptLoad()) return;

  // Chrome requires waiting for onvoiceschanged
  const listener = () => {
    if (attemptLoad()) {
      speechSynthesis.removeEventListener('voiceschanged', listener);
    }
  };
  speechSynthesis.addEventListener('voiceschanged', listener);

  // Fallback: retry after delay
  setTimeout(() => {
    if (!voicesLoaded) {
      attemptLoad();
    }
  }, 500);
}

// Start loading voices immediately
if (typeof window !== 'undefined' && !voicesLoaded) {
  loadSharedVoices();
}

export function TTSButton({
  text,
  lang = 'ja-JP',
  rate = 1,
  pitch = 1,
  className,
  disabled = false,
}: TTSButtonProps) {
  const [state, setState] = useState<TTSState>('idle');
  const [selectedVoice, setSelectedVoice] = useState<string | null>(() => sharedVoice);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Subscribe to shared voice updates
  useEffect(() => {
    if (voicesLoaded && sharedVoice) {
      setSelectedVoice(sharedVoice);
    } else if (!voicesLoaded) {
      voiceCallbacks.push(setSelectedVoice);
    }
    return () => {
      const idx = voiceCallbacks.indexOf(setSelectedVoice);
      if (idx > -1) voiceCallbacks.splice(idx, 1);
    };
  }, []);

  const handlePlay = () => {
    if (!text.trim()) return;

    // Cancel any ongoing speech
    speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance;
    utterance.lang = lang;
    utterance.rate = rate;
    utterance.pitch = pitch;

    // Set selected voice if available - get dynamically from speechSynthesis
    if (selectedVoice) {
      const allVoices = speechSynthesis.getVoices();
      const voice = allVoices.find((v) => v.name === selectedVoice);
      if (voice) {
        utterance.voice = voice;
      }
    }

    utterance.onstart = () => setState('playing');
    utterance.onend = () => setState('idle');
    utterance.onerror = () => {
      setState('idle');
      console.error('TTS error:', utterance);
    };

    setState('loading');
    // Small delay to allow state update
    setTimeout(() => {
      speechSynthesis.speak(utterance);
    }, 50);
  };

  const handlePause = () => {
    if (state === 'playing') {
      speechSynthesis.pause();
      setState('paused');
    } else if (state === 'paused') {
      speechSynthesis.resume();
      setState('playing');
    }
  };

  const handleStop = () => {
    speechSynthesis.cancel();
    setState('idle');
  };

  return (
    <div className="flex items-center gap-2">
      {state === 'idle' ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={handlePlay}
          disabled={disabled || !text.trim()}
          className={className}
          title="发音"
        >
          <Volume2 className="h-4 w-4" />
        </Button>
      ) : state === 'loading' ? (
        <Button variant="ghost" size="sm" disabled className={className}>
          <Loader2 className="h-4 w-4 animate-spin" />
        </Button>
      ) : (
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePause}
            className={className}
            title={state === 'playing' ? '暂停' : '继续'}
          >
            {state === 'playing' ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleStop}
            className={className}
            title="停止"
          >
            <VolumeX className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      )}
    </div>
  );
}
