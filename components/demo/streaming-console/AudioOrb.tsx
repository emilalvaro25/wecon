/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';

interface AudioOrbProps {
  inputVolume: number;
  outputVolume: number;
}

const NUM_BARS = 72;
const MAX_AMP = 3; // a multiplier to make visualization more prominent
const MAX_BAR_HEIGHT = 90; // as a percentage of radius

const AudioOrb: React.FC<AudioOrbProps> = ({ inputVolume, outputVolume }) => {

  const renderBars = (volume: number, radiusPercent: number, className: string) => {
    return Array.from({ length: NUM_BARS }).map((_, i) => {
      const angle = (i / NUM_BARS) * 360;
      
      // Use a non-linear scale for better visuals
      const scaledVolume = Math.pow(volume, 0.6);
      
      const barHeight = Math.min(MAX_BAR_HEIGHT, scaledVolume * 100 * MAX_AMP);

      const containerStyle: React.CSSProperties = {
        height: `${radiusPercent}%`,
        transform: `rotate(${angle}deg)`,
      };

      const barStyle: React.CSSProperties = {
        height: `${barHeight}%`,
      };

      return (
        <div className="visualizer-bar-container" style={containerStyle} key={`${className}-${i}`}>
          <div className={`visualizer-bar ${className}`} style={barStyle}></div>
        </div>
      );
    });
  };

  return (
    <div className="audio-orb-container">
      <div className="audio-orb">
        <div className="audio-orb-surface"></div>
        <div className="visualizer-wrapper">
          {/* Outer ring for output audio */}
          {renderBars(outputVolume, 48, 'output-bar')}
          {/* Inner ring for input audio */}
          {renderBars(inputVolume, 38, 'input-bar')}
        </div>
      </div>
    </div>
  );
};

export default AudioOrb;
