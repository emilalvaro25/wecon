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
import React, { useState, useEffect, useCallback } from 'react';
import cn from 'classnames';
import ErrorScreen from './components/demo/ErrorScreen';
import LiveSessionScreen from './components/demo/streaming-console/StreamingConsole';
import HomeScreen from './components/demo/welcome-screen/WelcomeScreen';
import { LiveAPIProvider } from './contexts/LiveAPIContext';
import Sidebar from './components/Sidebar';
import { useUI, useSettings } from './lib/state';
import { supabase } from './lib/supabaseClient';
import { Session } from '@supabase/supabase-js';
import Auth from './components/auth/Auth';

const API_KEY = process.env.API_KEY as string;
if (typeof API_KEY !== 'string') {
  throw new Error(
    'Missing required environment variable: API_KEY'
  );
}

/**
 * Main application component that provides a streaming interface for Live API.
 * Manages video streaming state and provides controls for webcam/screen capture.
 */
function App() {
  const [screen, setScreen] = useState<'home' | 'live'>('home');
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { isSidebarOpen } = useUI();
  const { loadInitialSettings } = useSettings();

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      if (session) {
        const { data } = await supabase
          .from('profiles')
          .select('system_prompt, voice')
          .eq('user_id', session.user.id)
          .single();
        if (data) {
          loadInitialSettings(data.system_prompt, data.voice);
        }
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    return () => subscription.unsubscribe();
  }, [loadInitialSettings]);

  const startSession = useCallback(async () => {
    try {
      // Check for microphone permissions before starting
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setScreen('live');
    } catch (err) {
      console.error("Microphone permission denied:", err);
      alert("Please enable microphone access to start a session.");
    }
  }, []);

  const endSession = useCallback(() => setScreen('home'), []);

  const renderContent = () => {
    if (loading) {
      return <div className="loading-screen">Loading...</div>;
    }
    if (!session) {
      return <Auth />;
    }
    return (
      <>
        <Sidebar session={session} />
        <main className="main-content">
          {screen === 'home' ? (
            <HomeScreen onStartSession={startSession} />
          ) : (
            <LiveSessionScreen session={session} onEndSession={endSession} />
          )}
        </main>
      </>
    );
  };

  return (
    <div className={cn('App', { 'sidebar-is-open': isSidebarOpen })}>
      <LiveAPIProvider apiKey={API_KEY}>
        <ErrorScreen />
        {renderContent()}
      </LiveAPIProvider>
    </div>
  );
}

export default App;