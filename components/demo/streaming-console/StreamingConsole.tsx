/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect } from 'react';
import { useLiveAPIContext } from '../../../contexts/LiveAPIContext';
import { AudioRecorder } from '../../../lib/audio-recorder';
import { Modality } from '@google/genai';
import AudioOrb from './AudioOrb';

interface LiveSessionScreenProps {
  onEndSession: () => void;
}

const LiveSessionScreen: React.FC<LiveSessionScreenProps> = ({ onEndSession }) => {
  const { client, connected, connect, disconnect, setConfig, volume } = useLiveAPIContext();
  const [audioRecorder] = useState(() => new AudioRecorder());
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [inputVolume, setInputVolume] = useState(0);

  // Set initial config for the Live API
  useEffect(() => {
    setConfig({
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: {
            voiceName: 'Zephyr',
          },
        },
      },
      inputAudioTranscription: {},
      outputAudioTranscription: {},
    });
  }, [setConfig]);

  // Automatically connect when the component mounts
  useEffect(() => {
    if (!connected) {
      connect();
    }
  }, [connected, connect]);

  // Manage audio recording based on connection and mute state
  useEffect(() => {
    const onData = (base64: string) => {
      if (client.status === 'connected') {
          client.sendRealtimeInput([
            {
              mimeType: 'audio/pcm;rate=16000',
              data: base64,
            },
          ]);
      }
    };
    
    const onVolume = (vol: number) => {
      setInputVolume(vol);
    };

    if (connected && !isMuted) {
      audioRecorder.start();
      audioRecorder.on('data', onData);
      audioRecorder.on('volume', onVolume);
    } else {
      audioRecorder.stop();
    }

    return () => {
      audioRecorder.off('data', onData);
      audioRecorder.off('volume', onVolume);
      audioRecorder.stop();
    };
  }, [connected, isMuted, audioRecorder, client]);

  const handleEndSession = () => {
    if (connected) {
      disconnect();
    }
    onEndSession();
  };
  
  const handleMicToggle = () => {
    setIsMuted(prev => !prev);
  };
  
  const handleCameraToggle = () => {
    setIsCameraOn(prev => !prev);
  }

  return (
    <div className="live-session-screen">
       <header className="live-header">
        <h1 className="session-name">Josefa</h1>
        <div className="header-actions">
           <button className="icon-button" aria-label="Captions"><span className="material-symbols-outlined">closed_caption</span></button>
           <button className="icon-button" aria-label="Sound on"><span className="material-symbols-outlined">volume_up</span></button>
           <button className="icon-button" aria-label="Audio settings"><span className="material-symbols-outlined">tune</span></button>
        </div>
      </header>
      <main className="live-main">
        <div className="satellite-container">
          <span className="material-symbols-outlined satellite">satellite_alt</span>
        </div>
        <div className="audio-orb-container">
            <AudioOrb inputVolume={inputVolume} outputVolume={volume} />
        </div>
      </main>
      <footer className="live-footer">
        <div className="control-bar">
          <button className="control-button" aria-label="Toggle camera" onClick={handleCameraToggle}>
            <span className="material-symbols-outlined">{isCameraOn ? 'videocam' : 'videocam_off'}</span>
          </button>
          <button className="control-button" aria-label="Toggle microphone" onClick={handleMicToggle}>
            <span className="material-symbols-outlined">{isMuted ? 'mic_off' : 'mic'}</span>
          </button>
          <button className="control-button" aria-label="More options">
            <span className="material-symbols-outlined">more_horiz</span>
          </button>
          <button className="control-button end-call" aria-label="End call" onClick={handleEndSession}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
      </footer>
    </div>
  );
};

export default LiveSessionScreen;