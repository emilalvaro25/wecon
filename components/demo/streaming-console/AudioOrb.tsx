/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';

interface AudioOrbProps {
  inputVolume: number;
  outputVolume: number;
}

const AudioOrb: React.FC<AudioOrbProps> = ({ inputVolume, outputVolume }) => {
  const isUserSpeaking = inputVolume > outputVolume;
  const volume = Math.max(inputVolume, outputVolume);
  
  // Use a non-linear scale for a more pronounced visual effect at lower volumes
  const visualVolume = Math.min(1, Math.pow(volume, 0.6) * 3);

  const style: React.CSSProperties = {
    '--volume-scale': 1 + visualVolume * 0.25,
    '--glow-opacity': Math.min(1, 0.4 + visualVolume * 0.6),
    '--glow-color': isUserSpeaking ? 'var(--user-audio-color)' : 'var(--agent-audio-color)',
  };

  return (
    <div className="audio-orb-container" style={style}>
      <div className="pluto-orb-glow" />
      <div className="pluto-orb-surface" />
    </div>
  );
};

export default AudioOrb;