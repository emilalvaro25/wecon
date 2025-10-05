/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { useSettings, useUI } from '../lib/state';
import c from 'classnames';
import { AVAILABLE_VOICES } from '../lib/constants';
import { useLiveAPIContext } from '../contexts/LiveAPIContext';
import { supabase } from '../lib/supabaseClient';
import { Session } from '@supabase/supabase-js';
// FIX: Import React to resolve namespace issue with React.ChangeEvent.
import React, { useState } from 'react';

interface SidebarProps {
  session: Session;
}

export default function Sidebar({ session }: SidebarProps) {
  const { isSidebarOpen, toggleSidebar } = useUI();
  const { systemPrompt, voice, setSystemPrompt, setVoice, saveSettings } =
    useSettings();
  const { connected } = useLiveAPIContext();
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');


  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };
  
  const handleSave = async () => {
    setSaveState('saving');
    try {
      await saveSettings(session.user.id);
      setSaveState('saved');
      setTimeout(() => setSaveState('idle'), 2000); // Reset after 2s
    } catch (error) {
      setSaveState('error');
      setTimeout(() => setSaveState('idle'), 2000); // Reset after 2s
    }
  };

  const handleSettingChange = (setter: (value: string) => void) => (e: React.ChangeEvent<HTMLTextAreaElement | HTMLSelectElement>) => {
    setter(e.target.value);
    setSaveState('idle'); // Reset save state if user makes a new change
  };


  return (
    <>
      <aside className={c('sidebar', { open: isSidebarOpen })}>
        <div className="sidebar-header">
          <h3>Settings</h3>
          <button onClick={toggleSidebar} className="close-button">
            <span className="icon">close</span>
          </button>
        </div>
        <div className="sidebar-content">
          <div className="sidebar-section">
            <fieldset disabled={connected}>
              <label>
                System Prompt
                <textarea
                  value={systemPrompt}
                  onChange={handleSettingChange(setSystemPrompt)}
                  rows={10}
                  placeholder="Describe the role and personality of the AI..."
                />
              </label>
              <label>
                Voice
                <select value={voice} onChange={handleSettingChange(setVoice)}>
                  {AVAILABLE_VOICES.map(v => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </label>
              <button onClick={handleSave} className="save-settings-button" disabled={saveState === 'saving' || connected}>
                {saveState === 'saving' ? 'Saving...' : saveState === 'saved' ? 'Saved!' : saveState === 'error' ? 'Error!' : 'Save Settings'}
              </button>
            </fieldset>
          </div>
        </div>
        <div className="sidebar-footer">
          <button onClick={handleSignOut} className="signout-button">
            <span className="material-symbols-outlined">logout</span>
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}