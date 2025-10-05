/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect, useRef } from 'react';
import { useLiveAPIContext } from '../../../contexts/LiveAPIContext';
import { AudioRecorder } from '../../../lib/audio-recorder';
import { LiveConnectConfig, Modality } from '@google/genai';
import AudioOrb from './AudioOrb';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../../../lib/supabaseClient';
import { useSettings } from '../../../lib/state';

interface LiveSessionScreenProps {
  onEndSession: () => void;
  session: Session;
}

const LiveSessionScreen: React.FC<LiveSessionScreenProps> = ({ onEndSession, session }) => {
  const { client, connected, connect, disconnect, volume } = useLiveAPIContext();
  const { voice } = useSettings();
  const [audioRecorder] = useState(() => new AudioRecorder());
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [inputVolume, setInputVolume] = useState(0);
  const [sessionError, setSessionError] = useState<string | null>(null);

  const currentUserTurnRef = useRef('');
  const currentAgentTurnRef = useRef('');
  const connectInProgress = useRef(false);

  // 1. Connect to Live API
  useEffect(() => {
    const setupAndConnect = async () => {
      // Guard against re-running
      if (connected || connectInProgress.current) {
        return;
      }
      connectInProgress.current = true;
  
      // Build config and connect to Live API
      const liveApiConfig: LiveConnectConfig = {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: voice,
            },
          },
        },
        inputAudioTranscription: {},
        outputAudioTranscription: {},
      };
      
      try {
        await connect(liveApiConfig);
      } catch (e: any) {
        console.error('Failed to connect to Live API:', e);
        setSessionError(`Failed to connect to the AI service: ${e.message}`);
      }
    };
  
    setupAndConnect();

  }, [connect, connected, voice]);


  // 2. Set up event listeners for transcription and saving turns
  useEffect(() => {
    const handleInput = (text: string) => {
      currentUserTurnRef.current += text;
    };
    const handleOutput = (text: string) => {
      currentAgentTurnRef.current += text;
    };
    const handleTurnComplete = async () => {
      if (!session?.user?.email) return;

      const userTurn = currentUserTurnRef.current.trim();
      const agentTurn = currentAgentTurnRef.current.trim();

      const turnsToInsert = [];
      if (userTurn) {
        turnsToInsert.push({ user_email: session.user.email, turn_data: { actor: 'user', content: userTurn } });
      }
      if (agentTurn) {
        turnsToInsert.push({ user_email: session.user.email, turn_data: { actor: 'agent', content: agentTurn } });
      }

      if (turnsToInsert.length > 0) {
        const { error } = await supabase.from('conversation_history').insert(turnsToInsert);
        if (error) {
          console.error('Error saving turns:', error.message, error.details);
          if (error.message.includes('relation "public.conversation_history" does not exist')) {
            setSessionError("Failed to save conversation: The database setup is incomplete. Please run the setup script in DATABASE_SETUP.md in your Supabase project's SQL Editor.");
          } else {
            setSessionError(`Failed to save conversation due to a database error: ${error.message}`);
          }
        }
      }
      
      // Reset for next turn
      currentUserTurnRef.current = '';
      currentAgentTurnRef.current = '';
    };

    client.on('inputTranscription', handleInput);
    client.on('outputTranscription', handleOutput);
    client.on('turncomplete', handleTurnComplete);

    return () => {
      client.off('inputTranscription', handleInput);
      client.off('outputTranscription', handleOutput);
      client.off('turncomplete', handleTurnComplete);
    };

  }, [client, session.user.email]);

  // 3. Manage audio recording based on connection and mute state
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

  if (sessionError) {
    return (
      <div className="live-session-screen-error">
        <div className="error-content">
          <span className="material-symbols-outlined error-icon-large">error</span>
          <h2>Failed to Start Session</h2>
          <p>{sessionError}</p>
          <button className="control-button" onClick={onEndSession}>Go Back</button>
        </div>
      </div>
    );
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