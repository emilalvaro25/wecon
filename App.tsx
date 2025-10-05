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
import React, { useState } from 'react';
import ErrorScreen from './components/demo/ErrorScreen';
import LiveSessionScreen from './components/demo/streaming-console/StreamingConsole';
import HomeScreen from './components/demo/welcome-screen/WelcomeScreen';
import { LiveAPIProvider } from './contexts/LiveAPIContext';
import Sidebar from './components/Sidebar';

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

  const startSession = async () => {
    try {
      // Check for microphone permissions before starting
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setScreen('live');
    } catch (err) {
      console.error("Microphone permission denied:", err);
      alert("Please enable microphone access to start a session.");
    }
  };
  const endSession = () => setScreen('home');

  return (
    <div className="App">
      <LiveAPIProvider apiKey={API_KEY}>
        <ErrorScreen />
        <Sidebar />
        {screen === 'home' ? (
          <HomeScreen onStartSession={startSession} />
        ) : (
          <LiveSessionScreen onEndSession={endSession} />
        )}
      </LiveAPIProvider>
    </div>
  );
}

export default App;