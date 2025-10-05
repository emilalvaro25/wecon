/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { useUI } from '../../../lib/state';

interface HomeScreenProps {
  onStartSession: () => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ onStartSession }) => {
  const { toggleSidebar } = useUI();

  return (
    <div className="home-screen">
      <header className="home-header">
        <button className="icon-button" aria-label="Menu" onClick={toggleSidebar}><span className="material-symbols-outlined">menu</span></button>
        <h1 className="app-title">Kithai AI</h1>
        <div className="header-actions">
          <button className="icon-button" aria-label="Captions"><span className="material-symbols-outlined">closed_caption</span></button>
          <button className="icon-button" aria-label="Sound on"><span className="material-symbols-outlined">volume_up</span></button>
          <button className="icon-button" aria-label="Refresh"><span className="material-symbols-outlined">refresh</span></button>
        </div>
      </header>
      <main className="home-main">
        <h2 className="main-heading">What can I help with?</h2>
        <div className="chip-container">
          <button className="chip">
            <span className="material-symbols-outlined">palette</span>
            Create image
          </button>
          <button className="chip">
            <span className="material-symbols-outlined">summarize</span>
            Summarize text
          </button>
          <button className="chip">
            <span className="material-symbols-outlined">edit_square</span>
            Help me write
          </button>
          <button className="chip">
            More
          </button>
        </div>
      </main>
      <footer className="home-footer">
        <div className="input-bar">
          <button className="icon-button" aria-label="Attach image">
            <span className="material-symbols-outlined">add_photo_alternate</span>
          </button>
          <span className="input-placeholder">Ask anything</span>
          <div className="input-actions">
            <button className="mic-button" aria-label="Start voice input" onClick={onStartSession}>
              <span className="material-symbols-outlined">mic</span>
            </button>
            <div className="visualizer">
              <span/>
              <span/>
              <span/>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomeScreen;