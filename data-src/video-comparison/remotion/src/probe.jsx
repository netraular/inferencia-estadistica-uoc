import React from 'react';
import {AbsoluteFill, Composition, interpolate, registerRoot, useCurrentFrame} from 'remotion';

function Probe() {
  const frame = useCurrentFrame();
  const width = interpolate(frame, [0, 29], [0, 800], {extrapolateRight: 'clamp'});
  return <AbsoluteFill style={{background: '#f5f7fa', padding: 100, color: '#17332c', fontFamily: 'sans-serif'}}>
    <h1>Remotion: probabilidad como area</h1>
    <div style={{width, height: 160, background: '#07816c', marginTop: 60}} />
    <p style={{fontSize: 32}}>Fotograma {frame} / 29</p>
  </AbsoluteFill>;
}

registerRoot(() => <Composition id="Probe" component={Probe} width={1280} height={720} fps={30} durationInFrames={30} />);