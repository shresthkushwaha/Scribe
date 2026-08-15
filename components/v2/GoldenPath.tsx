'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface Point {
  x: number;
  y: number;
}

interface Props {
  points: Point[];
  isVisible: boolean;
}

export default function GoldenPath({ points, isVisible }: Props) {
  if (!isVisible || points.length < 2) return null;

  // Generate SVG path data
  const pathData = points.reduce((acc, point, i) => {
    const prefix = i === 0 ? 'M' : 'L';
    return `${acc} ${prefix} ${point.x + 128} ${point.y + 64}`; // +128, +64 to center in MacroBlock (256x128 approx)
  }, '');

  return (
    <svg className="absolute inset-0 pointer-events-none overflow-visible" style={{ zIndex: 5 }}>
      <defs>
        <filter id="golden-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="10" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      
      {/* Outer Glow */}
      <motion.path
        d={pathData}
        fill="none"
        stroke="#ff4d00"
        strokeWidth="12"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 0.2 }}
        transition={{ duration: 2, ease: "easeInOut" }}
        style={{ filter: 'blur(15px)' }}
      />

      {/* Main Path */}
      <motion.path
        d={pathData}
        fill="none"
        stroke="#ff4d00"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1.5, ease: "easeInOut" }}
        style={{ filter: 'drop-shadow(0 0 8px #ff4d00)' }}
      />
      
      {/* Particles/Pulse along path */}
      <motion.circle
        r="4"
        fill="#ffffff"
        initial={{ offsetDistance: "0%" }}
        animate={{ offsetDistance: "100%" }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        style={{ 
          offsetPath: `path('${pathData}')`,
          boxShadow: '0 0 20px #ff4d00'
        }}
      />
    </svg>
  );
}
