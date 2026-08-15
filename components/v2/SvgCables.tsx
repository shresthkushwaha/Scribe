'use client';

import React from 'react';
import { useScribeV2Store } from '@/lib/store/scribeV2Store';

export default function SvgCables() {
  const { blocks, connections } = useScribeV2Store();

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
      <defs>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
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

        let strokeColor = 'rgba(255,255,255,0.1)';
        if (isDesynced) strokeColor = '#ff4d00';
        else if (conn.type === 'GAP_LINK') strokeColor = 'rgba(255,100,0,0.4)';
        else if (isHollow) strokeColor = 'rgba(255,255,255,0.08)';
        else if (isSpecialist === 'red-team') strokeColor = 'rgba(255,77,0,0.5)';
        else if (isSpecialist === 'golden-path' || conn.type === 'SYNTHESIS') strokeColor = 'rgba(255,200,0,0.6)';

        const isGlow = isDesynced || isSpecialist === 'golden-path' || conn.type === 'SYNTHESIS';

        return (
          <g key={conn.id}>
            <path
              d={path}
              stroke={strokeColor}
              strokeWidth={isSpecialist ? "2" : "1"}
              strokeDasharray={isHollow ? "6 6" : undefined}
              fill="none"
              className={isDesynced ? 'animate-pulse' : ''}
              style={{ filter: isGlow ? 'url(#glow)' : 'none' }}
            />
            {/* Visual connector dots */}
            <circle cx={x1} cy={y1} r="3" fill={isDesynced ? '#ff4d00' : 'rgba(255,255,255,0.2)'} />
            <circle cx={x2} cy={y2} r="3" fill={isDesynced ? '#ff4d00' : 'rgba(255,255,255,0.2)'} />
          </g>
        );
      })}
    </svg>
  );
}
