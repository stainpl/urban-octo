'use client';

import React from 'react';

type Props = {
  size?: number;
  thickness?: number; 
  colors?: string[]; 
  speed?: number; 
  className?: string;
  ariaLabel?: string;
};

export default function RoundLoader({
  size = 36,
  thickness = 4,
  colors = ['#06b6d4', '#60a5fa', '#f472b6', '#f97316'],
  speed = 1,
  className = '',
  ariaLabel = 'Loading',
}: Props) {
  const s = size;
  const innerRadius = Math.max(0, s / 2 - thickness);
  const background = `conic-gradient(${colors.join(',')})`;
  const mask = `radial-gradient(circle, transparent ${innerRadius}px, black ${innerRadius}px)`;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={ariaLabel}
      className={`inline-block ${className}`}
      style={{ width: s, height: s }}
    >
      <div
        className="rounded-full animate-spin"
        style={{
          width: '100%',
          height: '100%',
          background,
          WebkitMask: mask,
          mask: mask,
          animationDuration: `${speed}s`,
        }}
        aria-hidden="true"
      />

      <span className="sr-only">{ariaLabel}…</span>
    </div>
  );
}

/*
Usage (example, shown here only in comments):
<RoundLoader
  size={48}
  thickness={6}
  colors={["#06b6d4", "#60a5fa", "#f472b6", "#f97316"]}
  speed={0.9}
/>

Notes:
- This implementation uses a CSS conic-gradient as the color band and a radial-gradient mask to make a donut.
- Works well in modern browsers. We include WebKit mask for Safari support.
- If you need pixel-perfect SVG fallback for very old browsers, I can add an SVG-based version that uses multiple arcs or SVG gradients.
*/
