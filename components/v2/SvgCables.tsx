'use client';

import React from 'react';
import { useScribeV2Store } from '@/lib/store/scribeV2Store';

export default function SvgCables() {
  const { blocks, connections } = useScribeV2Store();

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
      <defs>
        <filter id="cable-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <linearGradient id="pulse-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#ff4d00" stopOpacity="0.8" />
          <stop offset="50%" stopColor="#32d74b" stopOpacity="1" />
          <stop offset="100%" stopColor="#ff4d00" stopOpacity="0.8" />
        </linearGradient>
      </defs>

      {connections.map(conn => {
        const source = blocks.find(b => b.id === conn.sourceId);
        const target = blocks.find(b => b.id === conn.targetId);

        if (!source || !target) return null;

        // Calculate anchors (center of blocks)
        const x1 = source.x + 128; // 256 / 2
        const y1 = source.y + 60;  // approximate header height
        const x2 = target.x + 128;
        const y2 = target.y + 0;   // top of target block

        const dx = Math.abs(x2 - x1) * 0.5;
        const path = `M ${x1} ${y1} C ${x1} ${y1 + dx} ${x2} ${y2 - dx} ${x2} ${y2}`;

        const isDesynced = target.isDesynced;
        const isHollow = source.isHollow || target.isHollow || conn.type === 'GAP_LINK';
        const isSpecialist = source.specialistType || target.specialistType || conn.type === 'SYNTHESIS';

        let strokeColor = 'rgba(255,255,255,0.14)';
        if (isDesynced) strokeColor = '#ff4d00';
        else if (conn.type === 'GAP_LINK') strokeColor = 'rgba(255,100,0,0.5)';
        else if (isHollow) strokeColor = 'rgba(255,255,255,0.08)';
        else if (isSpecialist === 'red-team') strokeColor = '#ff453a';
        else if (isSpecialist === 'golden-path' || conn.type === 'SYNTHESIS') strokeColor = '#32d74b';

        const isGlow = isDesynced || isSpecialist === 'golden-path' || conn.type === 'SYNTHESIS';

        return (
          <g key={conn.id}>
            {/* Background Cable Stroke */}
            <path
              d={path}
              stroke={strokeColor}
              strokeWidth={isSpecialist ? "2.5" : "1.5"}
              strokeDasharray={isHollow ? "6 6" : undefined}
              fill="none"
              style={{ filter: isGlow ? 'url(#cable-glow)' : 'none' }}
            />

            {/* Dynamic Telemetry Pulse (TSOT [SOT-COMP-3012]) */}
            {!isHollow && (
              <path
                d={path}
                stroke={isDesynced ? '#ff4d00' : isSpecialist ? '#32d74b' : 'rgba(255, 77, 0, 0.4)'}
                strokeWidth={isSpecialist ? "3" : "2"}
                strokeDasharray="4 12"
                fill="none"
                className="animate-pulse"
                style={{
                  animation: 'cablePulse 12s linear infinite',
                  filter: 'drop-shadow(0 0 4px rgba(255,77,0,0.5))'
                }}
              />
            )}

            {/* Terminal Connection Ports */}
            <circle cx={x1} cy={y1} r="4" fill={isDesynced ? '#ff4d00' : '#ffffff'} stroke="#07080a" strokeWidth="1.5" />
            <circle cx={x2} cy={y2} r="4" fill={isDesynced ? '#ff4d00' : isSpecialist ? '#32d74b' : '#ff4d00'} stroke="#07080a" strokeWidth="1.5" />
          </g>
        );
      })}
    </svg>
  );
}
