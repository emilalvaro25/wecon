/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { create } from 'zustand';
import { DEFAULT_LIVE_API_MODEL, DEFAULT_VOICE } from './constants';
import { FunctionResponseScheduling } from '@google/genai';
import { AVAILABLE_TOOLS } from './tools';
import { supabase } from './supabaseClient';
import { debounce } from 'lodash';

// FIX: Add missing FunctionCall type definition.
/**
 * Function Call type
 */
export type FunctionCall = {
  name: string;
  description?: string;
  parameters?: object;
  isEnabled: boolean;
  scheduling?: FunctionResponseScheduling;
};

// FIX: Add missing useUI store.
/**
 * UI State
 */
export const useUI = create<{
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
}>(set => ({
  isSidebarOpen: false,
  toggleSidebar: () => set(state => ({ isSidebarOpen: !state.isSidebarOpen })),
}));

/**
 * Settings
 */
export const useSettings = create<{
  systemPrompt: string;
  model: string;
  voice: string;
  loadInitialSettings: (prompt: string, voice: string) => void;
  setSystemPrompt: (prompt: string) => void;
  setModel: (model: string) => void;
  setVoice: (voice: string) => void;
  saveSettings: (userId: string) => Promise<void>;
}>((set, get) => ({
  systemPrompt:
    'You are a friendly and helpful customer support agent for an e-commerce company that sells electronics.',
  model: DEFAULT_LIVE_API_MODEL,
  voice: DEFAULT_VOICE,
  loadInitialSettings: (systemPrompt, voice) => {
    if (systemPrompt && voice) {
      set({ systemPrompt, voice });
    }
  },
  setSystemPrompt: (systemPrompt) => {
    set({ systemPrompt });
  },
  setModel: model => set({ model }),
  setVoice: (voice) => {
    set({ voice });
  },
  saveSettings: async (userId: string) => {
    const { systemPrompt, voice } = get();
    // Use `select` and `update` or `insert` to ensure a profile exists.
    // This is safer than relying on `upsert` when RLS is enabled without a specific `upsert` policy.
    const { data, error: selectError } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('user_id', userId)
      .single();

    if (selectError && selectError.code !== 'PGRST116') { // PGRST116: "No rows found"
      console.error("Error checking for profile:", selectError);
      throw selectError;
    }
    
    const settings = { user_id: userId, system_prompt: systemPrompt, voice: voice };

    if (data) {
      // Profile exists, update it
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ system_prompt: systemPrompt, voice: voice })
        .eq('user_id', userId);
      if (updateError) {
        console.error("Error updating settings:", updateError);
        throw updateError;
      }
    } else {
      // Profile does not exist, insert it
      const { error: insertError } = await supabase
        .from('profiles')
        .insert(settings);
      if (insertError) {
        console.error("Error inserting settings:", insertError);
        throw insertError;
      }
    }
  },
}));


// FIX: Add missing useTools store.
/**
 * Tools
 */
export const useTools = create<{
  tools: FunctionCall[];
  toggleTool: (name: string) => void;
  addTool: () => void;
  removeTool: (name: string) => void;
  updateTool: (name: string, updatedTool: FunctionCall) => void;
}>(set => ({
  tools: AVAILABLE_TOOLS,
  toggleTool: name =>
    set(state => ({
      tools: state.tools.map(tool =>
        tool.name === name ? { ...tool, isEnabled: !tool.isEnabled } : tool,
      ),
    })),
  addTool: () =>
    set(state => {
      const newTool: FunctionCall = {
        name: `new_function_${state.tools.length + 1}`,
        description: 'A new function call.',
        parameters: {
          type: 'OBJECT',
          properties: {},
        },
        isEnabled: true,
        scheduling: FunctionResponseScheduling.INTERRUPT,
      };
      return { tools: [...state.tools, newTool] };
    }),
  removeTool: name =>
    set(state => ({
      tools: state.tools.filter(tool => tool.name !== name),
    })),
  updateTool: (name, updatedTool) =>
    set(state => ({
      tools: state.tools.map(tool => (tool.name === name ? updatedTool : tool)),
    })),
}));

// FIX: Add missing useLogStore.
/**
 * Conversation Logs
 */
type Turn = {
  timestamp: Date;
  [key: string]: any;
};

export const useLogStore = create<{
  turns: Turn[];
  addTurn: (turn: Turn) => void;
  clearTurns: () => void;
}>(set => ({
  turns: [],
  addTurn: turn => set(state => ({ turns: [...state.turns, turn] })),
  clearTurns: () => set({ turns: [] }),
}));