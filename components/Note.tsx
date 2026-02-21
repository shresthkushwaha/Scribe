'use client';

import React from 'react';
import { useStore, ScribeNode } from '../lib/store';
import { motion } from 'framer-motion';

interface NoteProps {
    node: ScribeNode;
}

export default function Note({ node }: NoteProps) {
    const { setHoverNode, hoverNodeId, activeNodeId, centerNodeId } = useStore();
    const isHovered = hoverNodeId === node.id;
    const isActive = activeNodeId === node.id;
    const isCenter = centerNodeId === node.id;

    const getVisuals = () => {
        const res = node.resonanceScore || 50;
        const baseSize = node.r || (node.type === 'SENTENCE' ? 6 : 40);
        const scale = res / 50;

        switch (node.type) {
            case 'SOURCE':
                return {
                    shape: 'rect',
                    className: `fill-[#111] stroke-white/20`,
                    r: baseSize * scale
                };
            case 'SENTENCE':
                if (res > 70) { // Elite "Star"
                    return {
                        shape: 'star',
                        className: `fill-orange-500 stroke-orange-300`,
                        r: 12 * scale
                    };
                }
                return {
                    shape: 'circle',
                    className: `fill-white/20 stroke-white/10`,
                    r: baseSize * scale
                };
            case 'ENTITY':
                return {
                    shape: 'pill',
                    className: `fill-white/5 stroke-white/20 font-black`,
                    width: node.width || 100,
                    height: 36
                };
            default:
                return { shape: 'circle', className: 'fill-white/10', r: baseSize };
        }
    };

    const visuals = getVisuals();

    return (
        <motion.g
            onMouseEnter={() => setHoverNode(node.id)}
            onMouseLeave={() => setHoverNode(null)}
            animate={{
                scale: isHovered ? 1.2 : 1,
                opacity: (hoverNodeId && !isHovered && !isActive) ? 0.3 : 1
            }}
        >
            {/* Visual Representation */}
            {visuals.shape === 'circle' && (
                <circle
                    r={visuals.r}
                    className={`${visuals.className} transition-all duration-500`}
                    strokeWidth={isActive ? 3 : 1}
                />
            )}

            {visuals.shape === 'rect' && (
                <rect
                    x={-visuals.r!} y={-visuals.r!}
                    width={visuals.r! * 2} height={visuals.r! * 2}
                    rx={12}
                    className={`${visuals.className} transition-all duration-500`}
                    strokeWidth={isActive ? 3 : 1}
                />
            )}

            {visuals.shape === 'pill' && (
                <rect
                    x={-visuals.width! / 2} y={-visuals.height! / 2}
                    width={visuals.width} height={visuals.height}
                    rx={18}
                    className={`${visuals.className} transition-all duration-500`}
                    strokeWidth={isActive ? 3 : 1}
                />
            )}

            {visuals.shape === 'star' && (
                <path
                    d="M 0,-15 L 4,-5 L 14,-4 L 7,3 L 9,13 L 0,8 L -9,13 L -7,3 L -14,-4 L -4,-5 Z"
                    className={`${visuals.className} transition-all duration-500`}
                    transform={`scale(${visuals.r! / 10})`}
                    strokeWidth={2}
                />
            )}

            {/* Labels */}
            {(node.type !== 'SENTENCE' || isHovered || isCenter || visuals.shape === 'star') && (
                <text
                    y={visuals.shape === 'pill' ? 5 : (visuals.r ? visuals.r + 20 : 30)}
                    textAnchor="middle"
                    className={`font-mono pointer-events-none select-none ${visuals.shape === 'star' ? 'text-[10px] font-black fill-orange-500' : 'text-[8px] fill-white/50'
                        } uppercase tracking-[0.2em]`}
                >
                    {node.label || (node.text.length > 20 ? node.text.substring(0, 20) + '...' : node.text)}
                </text>
            )}

            {/* Active Indicator */}
            {isActive && (
                <circle
                    r={(visuals.r || 50) + 10}
                    className="fill-none stroke-white/10"
                    strokeDasharray="4 4"
                />
            )}
        </motion.g>
    );
}
