import { useEffect, useRef } from 'react';
import { useAppStore } from '../stores/app-store';
import { AmbientAudioEngine } from '../lib/audio-engine';

export function useAmbientAudio() {
  const { ambientSound, ambientVolume } = useAppStore();
  const audioEngineRef = useRef<AmbientAudioEngine | null>(null);

  useEffect(() => {
    if (!audioEngineRef.current) {
      audioEngineRef.current = new AmbientAudioEngine();
    }
    const engine = audioEngineRef.current;

    if (ambientSound === 'off') {
      engine.stop();
    } else {
      engine.play(ambientSound);
      engine.setVolume(ambientVolume);
    }

    return () => {
      engine.stop();
    };
  }, [ambientSound]);

  useEffect(() => {
    if (audioEngineRef.current) {
      audioEngineRef.current.setVolume(ambientVolume);
    }
  }, [ambientVolume]);
}
