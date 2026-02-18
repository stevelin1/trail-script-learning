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

export function TTSButton({
  text,
  lang = 'ja-JP',
  rate = 1,
  pitch = 1,
  className,
  disabled = false,
}: TTSButtonProps) {
  const [state, setState] = useState<TTSState>('idle');
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Load available voices
  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = speechSynthesis.getVoices();
      const japaneseVoices = availableVoices.filter((v) =>
        v.lang.startsWith('ja')
      );
      setVoices(japaneseVoices);

      // Auto-select first Japanese voice
      if (japaneseVoices.length > 0 && !selectedVoice) {
        setSelectedVoice(japaneseVoices[0].name);
      }
    };

    // Chrome requires onvoiceschanged event
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = loadVoices;
    }

    loadVoices();
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

    // Set selected voice if available
    if (selectedVoice) {
      const voice = voices.find((v) => v.name === selectedVoice);
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
