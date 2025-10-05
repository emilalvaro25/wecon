/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
/**
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GenAILiveClient } from '../../lib/genai-live-client';
import { LiveConnectConfig, Modality, LiveServerToolCall } from '@google/genai';
import { AudioStreamer } from '../../lib/audio-streamer';
import { audioContext } from '../../lib/utils';
import VolMeterWorket from '../../lib/worklets/vol-meter';
import { useSettings } from '../../lib/state';
import { supabase } from '../../lib/supabaseClient';

export type UseLiveApiResults = {
  client: GenAILiveClient;
  connect: (config: LiveConnectConfig) => Promise<void>;
  disconnect: () => void;
  connected: boolean;
  volume: number;
};

export function useLiveApi({
  apiKey,
}: {
  apiKey: string;
}): UseLiveApiResults {
  const { model } = useSettings();
  const client = useMemo(() => new GenAILiveClient(apiKey, model), [apiKey, model]);

  const audioStreamerRef = useRef<AudioStreamer | null>(null);

  const [volume, setVolume] = useState(0);
  const [connected, setConnected] = useState(false);

  // register audio for streaming server -> speakers
  useEffect(() => {
    if (!audioStreamerRef.current) {
      audioContext({ id: 'audio-out' }).then((audioCtx: AudioContext) => {
        audioStreamerRef.current = new AudioStreamer(audioCtx);
        audioStreamerRef.current
          .addWorklet<any>('vumeter-out', VolMeterWorket, (ev: any) => {
            setVolume(ev.data.volume);
          })
          .then(() => {
            // Successfully added worklet
          })
          .catch(err => {
            console.error('Error adding worklet:', err);
          });
      });
    }
  }, [audioStreamerRef]);

  useEffect(() => {
    const onOpen = () => {
      setConnected(true);
    };

    const onClose = () => {
      setConnected(false);
    };

    const stopAudioStreamer = () => {
      if (audioStreamerRef.current) {
        audioStreamerRef.current.stop();
      }
    };

    const onAudio = (data: ArrayBuffer) => {
      if (audioStreamerRef.current) {
        audioStreamerRef.current.addPCM16(new Uint8Array(data));
      }
    };

    // Bind event listeners
    client.on('open', onOpen);
    client.on('close', onClose);
    client.on('interrupted', stopAudioStreamer);
    client.on('audio', onAudio);

    const onToolCall = async (toolCall: LiveServerToolCall) => {
      const functionResponses: any[] = [];

      for (const fc of toolCall.functionCalls) {
        try {
          // The name of the Supabase Edge Function to invoke.
          const functionName = 'google-api-proxy';
          const { data, error } = await supabase.functions.invoke(functionName, {
            // Pass the tool name and arguments to the server-side function.
            body: {
              toolName: fc.name,
              toolArgs: fc.args,
            },
          });

          if (error) throw error;

          // Send the successful result back to the Gemini model.
          functionResponses.push({
            id: fc.id,
            name: fc.name,
            response: { result: data.result || 'Function executed successfully.' },
          });

        } catch (err: any) {
          console.error(`Error calling tool ${fc.name}:`, err);
          // Send an error message back to the model if the tool call fails.
          functionResponses.push({
            id: fc.id,
            name: fc.name,
            response: { error: err.message || 'An unknown error occurred.' },
          });
        }
      }

      // Send all collected responses back to the model.
      if (functionResponses.length > 0) {
        client.sendToolResponse({ functionResponses: functionResponses });
      }
    };

    client.on('toolcall', onToolCall);

    return () => {
      // Clean up event listeners
      client.off('open', onOpen);
      client.off('close', onClose);
      client.off('interrupted', stopAudioStreamer);
      client.off('audio', onAudio);
      client.off('toolcall', onToolCall);
    };
  }, [client]);

  const connect = useCallback(async (config: LiveConnectConfig) => {
    if (!config) {
      throw new Error('A config must be provided to connect.');
    }
    client.disconnect();
    await client.connect(config);
  }, [client]);

  const disconnect = useCallback(async () => {
    client.disconnect();
    setConnected(false);
  }, [setConnected, client]);

  return {
    client,
    connect,
    connected,
    disconnect,
    volume,
  };
}