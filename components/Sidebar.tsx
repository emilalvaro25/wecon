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

interface SidebarProps {
  session: Session;
}

export default function Sidebar({ session }: SidebarProps) {
  const { isSidebarOpen, toggleSidebar } = useUI();
  const { systemPrompt, voice, setSystemPrompt, setVoice } =
    useSettings();
  const { connected } = useLiveAPIContext();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
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
                  onChange={e => setSystemPrompt(e.target.value, session.user.id)}
                  rows={10}
                  placeholder="Describe the role and personality of the AI..."
                />
              </label>
              <label>
                Voice
                <select value={voice} onChange={e => setVoice(e.target.value, session.user.id)}>
                  {AVAILABLE_VOICES.map(v => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </label>
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