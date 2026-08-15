'use client';
import NavLink from 'next/link';
import React, {
    useEffect, useRef, useState, useMemo, useCallback,
} from 'react';
import * as d3 from 'd3';
import Link from 'next/link';
import { ArrowLeft, X, TreeStructure } from '@phosphor-icons/react';
import { Node, Link as GraphLink, LENS_CONFIGS, INSIGHT_COLORS, getClusterPositions } from '@/lib/graphEngine';

// ─── Props ─────────────────────────────────────────────────────────────────────

interface Props {
    nodes: Node[];
    links: GraphLink[];
    title?: string;
    backHref?: string;
    isArchipelago?: boolean;
}

// ─── Collision radius — lens-aware, prevents ALL overlap ───────────────────────
// Analyst sentence pills can be 100-200px wide, weaver uses dots

function pillW(n: Node): number {
    if (n.type === 'ENTITY') return n.width ?? (n.label.length * 10 + 30);
    if (n.type === 'TRAIT') return n.width ?? (n.label.length * 8 + 20);
    const rs = n.resonanceScore ?? 50;
    const max = rs > 60 ? 32 : 14;
    const raw = n.text ?? '';
    const lbl = raw.slice(0, max);
    return Math.max(100, lbl.length * 7.2 + 30);
}

function collideR(n: Node, lens: string): number {
    if (n.type === 'ANCHOR') return 0;

    if (lens === 'weaver') {
        if (n.type === 'SENTENCE') {
            const rs = n.resonanceScore ?? 50;
            if (rs > 60) return 22;
            if (rs < 20) return 8;
            return 14;
        }
        if (n.type === 'ENTITY') return (n.width ?? 80) / 1.8 + 14;
        if (n.type === 'TRAIT') return (n.width ?? 50) / 1.8 + 10;
        return 18;
    }

    // Analyst — pills need actual half-width + gap
    if (n.type === 'SENTENCE') return pillW(n) / 2 + 14;
    if (n.type === 'ENTITY') return pillW(n) / 2 + 12;
    if (n.type === 'TRAIT') return pillW(n) / 2 + 10;
    return 20;
}

// ─── Edge-point clip — returns the point on node boundary toward (ox,oy) ──────
// Prevents the line appearing to come from the center of the shape.

function getEdgePoint(
    cx: number, cy: number,  // center of this node
    ox: number, oy: number,  // center of other node
    n: Node, lens: string,
): { x: number; y: number } {
    const dx = ox - cx;
    const dy = oy - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 0.5) return { x: cx, y: cy };

    if (n.type === 'ANCHOR') return { x: cx, y: cy };

    // Weaver SENTENCE = circle
    if (n.type === 'SENTENCE' && lens === 'weaver') {
        const rs = n.resonanceScore ?? 50;
        const r = rs > 60 ? 10 : rs < 20 ? 3 : 6;
        return { x: cx + (dx / dist) * r, y: cy + (dy / dist) * r };
    }

    // Rect / pill — compute half-extents
    let hw: number, hh: number;
    if (n.type === 'SENTENCE') { hw = pillW(n) / 2; hh = 13; }
    else if (n.type === 'ENTITY') { hw = pillW(n) / 2; hh = 15; }
    else if (n.type === 'TRAIT') { hw = pillW(n) / 2; hh = 11; }
    else { hw = 14; hh = 14; }

    // Line-rect intersection: clip to whichever edge is hit first
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);
    const t = absX * hh > absY * hw ? hw / absX : hh / absY;

    return { x: cx + dx * t, y: cy + dy * t };
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function GraphCanvas({
    nodes: propNodes,
    links: propLinks,
    title,
    backHref = '/',
    isArchipelago = false,
}: Props) {
    const svgRef = useRef<SVGSVGElement>(null);
    const wrapperRef = useRef<SVGGElement>(null);
    const simRef = useRef<d3.Simulation<any, any> | null>(null);
    const lensRef = useRef('weaver'); // keep current lens accessible in tick

    const [lens, setLens] = useState<string>('weaver');
    const [activeId, setActiveId] = useState<string | null>(null);
    const [hoverId, setHoverId] = useState<string | null>(null);

    // ── Connected-node set ────────────────────────────────────────────────────
    const focusId = hoverId ?? activeId;
    const connectedIds = useMemo(() => {
        if (!focusId) return new Set<string>();
        const s = new Set([focusId]);
        propLinks.forEach(l => {
            const sid = (l.source as any).id ?? l.source;
            const tid = (l.target as any).id ?? l.target;
            if (sid === focusId) s.add(tid as string);
            if (tid === focusId) s.add(sid as string);
        });
        return s;
    }, [focusId, propLinks]);

    const activeNode = propNodes.find(n => n.id === activeId) ?? null;

    const connectedNodes = useMemo(() => {
        if (!activeId) return [];
        return propNodes.filter(n => n.id !== activeId && connectedIds.has(n.id));
    }, [activeId, propNodes, connectedIds]);

    const entityPeers = connectedNodes.filter(n => n.type === 'ENTITY' || n.type === 'TRAIT');
    const sentencePeers = connectedNodes.filter(n => n.type === 'SENTENCE');

    // keep lensRef in sync so tick closure uses latest
    useEffect(() => { lensRef.current = lens; }, [lens]);

    // ── Simulation ────────────────────────────────────────────────────────────
    useEffect(() => {
        if (!propNodes.length) return;
        if (simRef.current) simRef.current.stop();

        const cfg = LENS_CONFIGS[lens] ?? LENS_CONFIGS.weaver;
        const anchors = propNodes.filter(n => n.type === 'ANCHOR');
        const nIslands = anchors.length;
        const sentences = propNodes.filter(n => n.type === 'SENTENCE');
        const nSentences = sentences.length;

        const sim = d3.forceSimulation(propNodes as any)
            .alphaDecay(0.015)
            .alphaMin(0.001)
            .velocityDecay(cfg.friction ?? 0.85)

            // COLLISION — per-lens, per-type accurate radii, 4 iterations
            .force('collide', d3.forceCollide<any>()
                .radius(d => collideR(d, lens))
                .strength(0.85)
                .iterations(4))

            // CHARGE
            .force('charge', d3.forceManyBody<any>()
                .strength(d => {
                    if (d.type === 'ANCHOR') return 0;
                    const rs = d.resonanceScore ?? 50;
                    if (rs > 60) return -120;
                    if (rs < 20) return -8;
                    return (cfg.charge ?? -30) * (d.type === 'ENTITY' ? 1.6 : 1);
                })
                .distanceMax(360))

            // X
            .force('x', d3.forceX<any>(d => {
                if (d.type === 'ANCHOR') return d.fx ?? 0;
                if (isArchipelago && d.insightIndex != null && d.insightIndex !== -1) {
                    return getClusterPositions(nIslands)[d.insightIndex]?.x ?? 0;
                }
                if (lens === 'weaver' && d.type === 'SENTENCE' && d.index !== undefined) {
                    return (d.index * 40) - (nSentences * 20);
                }
                return 0;
            }).strength(d => {
                if (d.type === 'ANCHOR') return 1;
                if (isArchipelago && d.insightIndex != null && d.insightIndex !== -1) return 0.4;
                if (lens === 'weaver' && d.type === 'SENTENCE') return 1.0;
                return cfg.gravity ?? 0.01;
            }))

            // Y
            .force('y', d3.forceY<any>(d => {
                if (d.type === 'ANCHOR') return d.fy ?? 0;
                if (isArchipelago && d.insightIndex != null && d.insightIndex !== -1) {
                    return getClusterPositions(nIslands)[d.insightIndex]?.y ?? 0;
                }
                return 0;
            }).strength(d => {
                if (d.type === 'ANCHOR') return 1;
                if (isArchipelago && d.insightIndex != null && d.insightIndex !== -1) return 0.4;
                if (lens === 'weaver') return 0.06;
                return cfg.gravity ?? 0.01;
            }))

            // LINK
            .force('link', d3.forceLink<any, any>(propLinks as any)
                .id(d => d.id)
                .distance(d => {
                    if (isArchipelago) {
                        const si = (d.source as any).insightIndex;
                        const ti = (d.target as any).insightIndex;
                        return (si === -1 || ti === -1) ? 220 : cfg.linkDist ?? 100;
                    }
                    return cfg.linkDist ?? 100;
                })
                .strength(d => (d as any).type === 'DESCRIBES' ? 0.25 : 0.55))

            // MAGNETIC PULL toward active
            .force('magnetX', d3.forceX<any>(d => {
                if (!activeId) return 0;
                const a = propNodes.find(n => n.id === activeId);
                return (a as any)?.x ?? 0;
            }).strength(d => {
                if (!activeId || d.id === activeId || d.type === 'ANCHOR') return 0;
                const connected = propLinks.some(l => {
                    const s = (l.source as any).id ?? l.source;
                    const t = (l.target as any).id ?? l.target;
                    return (s === activeId && t === d.id) || (t === activeId && s === d.id);
                });
                return connected ? 0.28 : 0;
            }))
            .force('magnetY', d3.forceY<any>(d => {
                if (!activeId) return 0;
                const a = propNodes.find(n => n.id === activeId);
                return (a as any)?.y ?? 0;
            }).strength(d => {
                if (!activeId || d.id === activeId || d.type === 'ANCHOR') return 0;
                const connected = propLinks.some(l => {
                    const s = (l.source as any).id ?? l.source;
                    const t = (l.target as any).id ?? l.target;
                    return (s === activeId && t === d.id) || (t === activeId && s === d.id);
                });
                return connected ? 0.28 : 0;
            }));

        if (!isArchipelago) {
            sim.force('center', d3.forceCenter(0, 0).strength(0.05));
        }

        // Direct DOM tick (no React re-render per tick → smooth)
        sim.on('tick', () => {
            // Velocity clamp
            (propNodes as any[]).forEach(d => {
                if (d.vx != null) d.vx = Math.max(-3, Math.min(3, d.vx));
                if (d.vy != null) d.vy = Math.max(-3, Math.min(3, d.vy));
            });

            if (!wrapperRef.current) return;

            const curLens = lensRef.current;
            wrapperRef.current.querySelectorAll<SVGLineElement>('.sc-link').forEach((el, i) => {
                const l = propLinks[i] as any;
                if (!l?.source || !l?.target) return;
                const sn = l.source as any;
                const tn = l.target as any;
                const sp = getEdgePoint(sn.x ?? 0, sn.y ?? 0, tn.x ?? 0, tn.y ?? 0, sn, curLens);
                const tp = getEdgePoint(tn.x ?? 0, tn.y ?? 0, sn.x ?? 0, sn.y ?? 0, tn, curLens);
                el.setAttribute('x1', String(sp.x));
                el.setAttribute('y1', String(sp.y));
                el.setAttribute('x2', String(tp.x));
                el.setAttribute('y2', String(tp.y));
            });

            wrapperRef.current.querySelectorAll<SVGGElement>('.sc-node').forEach(el => {
                const n = (propNodes as any[]).find(x => x.id === el.getAttribute('data-id'));
                if (n) el.setAttribute('transform', `translate(${n.x ?? 0},${n.y ?? 0})`);
            });

            wrapperRef.current.querySelectorAll<SVGGElement>('.sc-anchor-g').forEach(el => {
                const n = (propNodes as any[]).find(x => x.id === el.getAttribute('data-id'));
                if (n) el.setAttribute('transform', `translate(${n.fx ?? n.x ?? 0},${n.fy ?? n.y ?? 0})`);
            });
        });

        simRef.current = sim;
        sim.alpha(1).restart();
        return () => { sim.stop(); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [propNodes, propLinks, lens, activeId, isArchipelago]);

    // ── Zoom — fixed: always preventDefault on wheel so browser never zooms ──
    useEffect(() => {
        const svg = svgRef.current;
        if (!svg || !wrapperRef.current) return;

        // Block native browser zoom on wheel events over the canvas
        const blockWheel = (e: WheelEvent) => { e.preventDefault(); };
        svg.addEventListener('wheel', blockWheel, { passive: false });

        const zoom = d3.zoom<SVGSVGElement, unknown>()
            .scaleExtent([0.04, 10])
            // Never filter — allow zoom even when cursor is on a node;
            // the SVG wheel handler handles preventDefault
            .filter(() => true)
            .on('zoom', e => {
                if (wrapperRef.current) {
                    wrapperRef.current.setAttribute('transform', e.transform.toString());
                }
            });

        d3.select(svg).call(zoom)
            .call(zoom.transform, d3.zoomIdentity
                .translate(svg.clientWidth / 2 || window.innerWidth / 2,
                    svg.clientHeight / 2 || window.innerHeight / 2)
                .scale(0.85));

        return () => { svg.removeEventListener('wheel', blockWheel); };
    }, []);

    // ── Drag ─────────────────────────────────────────────────────────────────
    useEffect(() => {
        if (!wrapperRef.current || !propNodes.length) return;
        const drag = d3.drag<SVGGElement, any>()
            .container(wrapperRef.current as any)
            .subject((_, d) => d)
            .on('start', (e, d) => {
                if (d.type === 'ANCHOR') return;
                if (!e.active) simRef.current?.alphaTarget(0.2).restart();
                d.fx = d.x; d.fy = d.y;
            })
            .on('drag', (e, d) => {
                if (d.type === 'ANCHOR') return;
                d.fx = e.x; d.fy = e.y;
            })
            .on('end', (e, d) => {
                if (d.type === 'ANCHOR') return;
                if (!e.active) simRef.current?.alphaTarget(0);
                if (d.id !== activeId) { d.fx = null; d.fy = null; }
            });

        const t = setTimeout(() => {
            if (wrapperRef.current) {
                d3.select(wrapperRef.current)
                    .selectAll<SVGGElement, Node>('.sc-node')
                    .data(propNodes)
                    .call(drag);
            }
        }, 80);
        return () => clearTimeout(t);
    }, [propNodes, activeId]);

    // ── Click handler ─────────────────────────────────────────────────────────
    const handleNodeClick = useCallback((n: Node) => {
        if (n.type === 'ANCHOR') return;
        if (activeId === n.id) {
            setActiveId(null);
            (n as any).fx = null; (n as any).fy = null;
        } else {
            setActiveId(n.id);
            (n as any).fx = (n as any).x;
            (n as any).fy = (n as any).y;
        }
        simRef.current?.alphaTarget(0.2).restart();
        setTimeout(() => simRef.current?.alphaTarget(0), 1200);
    }, [activeId]);

    // ── Helpers ───────────────────────────────────────────────────────────────
    const hasFocus = !!focusId;

    function ic(n: Node) {
        if (!isArchipelago || (n.insightIndex ?? -2) < 0) return null;
        return INSIGHT_COLORS[(n.insightIndex!) % INSIGHT_COLORS.length];
    }

    function pillLabel(n: Node): string {
        if (n.type !== 'SENTENCE') return n.label;
        const rs = n.resonanceScore ?? 50;
        const max = rs > 60 ? 32 : 14;
        const raw = n.text ?? '';
        return raw.slice(0, max) + (raw.length > max ? '…' : '');
    }

    const interactive = propNodes.filter(n => n.type !== 'ANCHOR');
    const anchorNodes = propNodes.filter(n => n.type === 'ANCHOR');

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="fixed inset-0 overflow-hidden" style={{ background: 'var(--bg)' }}>

            {/* ── Top bar ── */}
            <div
                className="absolute top-0 left-0 right-0 z-40 sm:h-11 flex flex-wrap sm:flex-nowrap items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 sm:py-0 min-h-[44px]"
                style={{
                    background: 'var(--bg-muted)',
                    backdropFilter: 'blur(16px)',
                    borderBottom: '1px solid var(--border-soft)',
                }}
            >
                {backHref && (
                    <NavLink href={backHref}
                        className="graph-back-btn flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-[12px] transition-colors mr-1 sm:mr-1 shrink-0"
                        style={{ color: 'var(--text-2)', fontFamily: 'var(--font-inter, sans-serif)' }}
                    >
                        <ArrowLeft size={14} weight="bold" />
                        Back
                    </NavLink>
                )}
                <div className="w-px h-3 mx-1 shrink-0" style={{ background: 'var(--border)' }} />
                {/* Lens tabs */}
                <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide py-1 shrink-0 max-w-[55%] sm:max-w-full">
                    {Object.entries(LENS_CONFIGS).map(([key, cfg]) => (
                        <button key={key} onClick={() => setLens(key)}
                            className="text-[9px] sm:text-[11px] px-2 sm:px-3 py-1 rounded-full transition-all duration-200 shrink-0 whitespace-nowrap"
                            style={{
                                fontFamily: 'var(--font-inter, sans-serif)',
                                letterSpacing: '0.02em',
                                background: lens === key ? 'var(--text-1)' : 'transparent',
                                border: `1px solid ${lens === key ? 'var(--text-1)' : 'transparent'}`,
                                color: lens === key ? 'var(--bg)' : 'var(--text-3)',
                            }}>
                            {cfg.label}
                        </button>
                    ))}
                </div>
                <div className="flex-1" />
                {title && (
                    <span className="text-[11px] sm:text-[13px] truncate max-w-[120px] sm:max-w-[200px] shrink-0"
                        style={{
                            color: 'var(--text-3)',
                            fontFamily: 'var(--font-dm-serif, serif)',
                            fontStyle: 'italic',
                        }}>
                        {title}
                    </span>
                )}
            </div>

            {/* ── SVG Canvas ── (starts below toolbar) */}
            <svg
                ref={svgRef}
                className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing pb-20 sm:pb-0"
                style={{ paddingTop: 44 }}
                onClick={() => { setActiveId(null); }}
            >
                <defs>
                    <filter id="glow-sm">
                        <feGaussianBlur stdDeviation="2" result="b" />
                        <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
                    </filter>
                    <filter id="glow-md">
                        <feGaussianBlur stdDeviation="4" result="b" />
                        <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
                    </filter>
                    <radialGradient id="fog" cx="50%" cy="50%" r="55%">
                        <stop offset="40%" stopColor="var(--bg-app)" stopOpacity="0" />
                        <stop offset="100%" stopColor="var(--bg-app)" stopOpacity="0.55" />
                    </radialGradient>
                </defs>

                <g ref={wrapperRef}>

                    {/* ── Archipelago aura rings ── */}
                    {isArchipelago && anchorNodes.map((anchor, i) => {
                        const color = INSIGHT_COLORS[i % INSIGHT_COLORS.length];
                        return (
                            <g key={`aura-${anchor.id}`}
                                className="sc-anchor-g" data-id={anchor.id}
                                transform={`translate(${anchor.fx ?? anchor.x ?? 0},${anchor.fy ?? anchor.y ?? 0})`}
                                pointerEvents="none">
                                <circle r={148} fill={color.fill} opacity={0.85} />
                                <circle r={148} fill="none" stroke={color.stroke} strokeWidth={0.8} opacity={0.3} />
                            </g>
                        );
                    })}

                    {/* ── Links ── */}
                    {propLinks.map((l, i) => {
                        const sid = (l.source as any).id ?? l.source;
                        const tid = (l.target as any).id ?? l.target;
                        const hi = hasFocus && (sid === focusId || tid === focusId);
                        const dim = hasFocus && !hi;
                        const isBridge = isArchipelago && (() => {
                            const sn = propNodes.find(n => n.id === sid);
                            const tn = propNodes.find(n => n.id === tid);
                            return sn?.insightIndex === -1 || tn?.insightIndex === -1;
                        })();
                        return (
                            <line key={i} className="sc-link"
                                stroke="var(--ink)"
                                strokeOpacity={
                                    hi ? 0.75
                                        : dim ? 0.04
                                            : isBridge ? 0.3
                                                : l.type === 'CONTAINS' ? 0.2 : 0.12
                                }
                                strokeWidth={hi ? 1.8 : isBridge ? 1.2 : l.type === 'CONTAINS' ? 0.9 : 0.6}
                                strokeDasharray={l.type === 'DESCRIBES' ? '3 5' : undefined}
                            />
                        );
                    })}

                    {/* ── Nodes ── */}
                    {interactive.map(n => {
                        const isActive = activeId === n.id;
                        const color = ic(n);
                        const rs = n.resonanceScore ?? 50;
                        const isStar = rs > 60;
                        const isDim = rs < 20;

                        // Color grading logic based on global connections
                        const deg = n.globalDegree ?? 0;
                        const isHot = deg >= 3;
                        const isWarm = deg > 0 && deg < 3;

                        const dimmed = hasFocus && !connectedIds.has(n.id);

                        return (
                            <g key={n.id} data-id={n.id}
                                className="sc-node"
                                style={{
                                    cursor: 'pointer',
                                    opacity: dimmed ? 0.06 : 1,
                                    transition: 'opacity 0.2s',
                                }}
                                onClick={e => { e.stopPropagation(); handleNodeClick(n); }}
                                onMouseEnter={() => setHoverId(n.id)}
                                onMouseLeave={() => setHoverId(null)}
                            >
                                {n.type === 'SENTENCE' ? (
                                    lens === 'weaver' ? (
                                        // ── Weaver: semantic dots ──
                                        <>
                                            {isStar && (
                                                <>
                                                    <circle r={20} fill={color?.stroke ?? 'var(--bg-muted)'} />
                                                    <circle r={10} fill={color?.dot ?? 'var(--text-1)'} />
                                                    <circle r={18} fill="none"
                                                        stroke={color?.stroke ?? 'var(--border)'}
                                                        strokeWidth={1} />
                                                    <text y={-26} textAnchor="middle" fontSize={8.5}
                                                        fill={color?.dot ?? 'var(--text-2)'}
                                                        fontFamily="monospace" pointerEvents="none"
                                                        style={{ userSelect: 'none' }}>
                                                        {(n.text ?? '').slice(0, 28) + ((n.text?.length ?? 0) > 28 ? '…' : '')}
                                                    </text>
                                                </>
                                            )}
                                            {!isStar && !isDim && (
                                                <circle r={6}
                                                    fill={color?.dot ?? 'var(--text-3)'}
                                                    stroke={isActive ? 'var(--text-1)' : 'none'} strokeWidth={1.5} />
                                            )}
                                            {isDim && (
                                                <circle r={3} fill={color?.dot ?? 'var(--border)'} />
                                            )}
                                        </>
                                    ) : (
                                        // ── Analyst: pill cards ──
                                        (() => {
                                            const w = pillW(n);
                                            const lbl = pillLabel(n);
                                            return (
                                                <>
                                                    {isStar && (
                                                        <ellipse rx={w / 2 + 10} ry={22}
                                                            fill="none"
                                                            stroke={color?.stroke ?? 'rgba(0,0,0,0.08)'}
                                                            strokeWidth={1}
                                                        />
                                                    )}
                                                    <rect x={-w / 2} y={-13} width={w} height={26} rx={13}
                                                        fill={color ? color.fill : (
                                                            isStar ? 'var(--bg)' : isDim ? 'var(--bg-muted)' : 'var(--bg-card)'
                                                        )}
                                                        stroke={color?.dot ?? (
                                                            isActive ? 'var(--text-1)' : isStar ? 'var(--text-3)' : isDim ? 'transparent' : 'var(--border)'
                                                        )}
                                                        strokeWidth={isActive ? 1.8 : isStar ? 1.2 : 0.7}
                                                    />
                                                    <text textAnchor="middle" dominantBaseline="middle"
                                                        fontSize={isStar ? 11 : 9.5}
                                                        fontFamily="monospace"
                                                        fill={color?.dot ?? (
                                                            isStar ? 'var(--text-1)' : isDim ? 'var(--text-4)' : 'var(--text-2)'
                                                        )}
                                                        pointerEvents="none" style={{ userSelect: 'none' }}>
                                                        {lbl}
                                                    </text>
                                                </>
                                            );
                                        })()
                                    )
                                ) : n.type === 'ENTITY' ? (
                                    // ── Entity chips ──
                                    (() => {
                                        const w = pillW(n);
                                        return (
                                            <>
                                                <rect x={-w / 2} y={-15} width={w} height={30} rx={6}
                                                    fill={color ? color.fill : (isHot ? 'var(--accent-red-bg, #faedf0)' : isWarm ? 'var(--accent-orange-bg, #fff7e6)' : 'var(--bg-card)')}
                                                    stroke={color?.dot ?? (
                                                        isActive ? 'var(--text-1)' : isHot ? 'var(--accent-red)' : isWarm ? 'var(--accent-orange)' : 'var(--border)'
                                                    )}
                                                    strokeWidth={isActive ? 1.8 : 1}
                                                />
                                                <text textAnchor="middle" dominantBaseline="middle"
                                                    fontSize={11} fontFamily="monospace" fontWeight="500"
                                                    fill={color?.dot ?? (isHot ? 'var(--accent-red)' : isWarm ? 'var(--accent-orange)' : 'var(--text-2)')}
                                                    pointerEvents="none" style={{ userSelect: 'none' }}>
                                                    {n.label}
                                                </text>
                                            </>
                                        );
                                    })()
                                ) : (
                                    // ── Trait tags ──
                                    (() => {
                                        const w = pillW(n);
                                        return (
                                            <>
                                                <rect x={-w / 2} y={-11} width={w} height={22} rx={11}
                                                    fill="var(--bg-muted)"
                                                    stroke={isActive ? 'var(--text-1)' : 'var(--border)'}
                                                    strokeWidth={isActive ? 1.5 : 0.8}
                                                />
                                                <text textAnchor="middle" dominantBaseline="middle"
                                                    fontSize={9} fontFamily="monospace"
                                                    fill="var(--text-3)"
                                                    pointerEvents="none" style={{ userSelect: 'none' }}>
                                                    {n.label}
                                                </text>
                                            </>
                                        );
                                    })()
                                )}
                            </g>
                        );
                    })}

                    {/* ── Anchor chips on top ── */}
                    {isArchipelago && anchorNodes.map((anchor, i) => {
                        const color = INSIGHT_COLORS[i % INSIGHT_COLORS.length];
                        const w = anchor.width ?? (anchor.label.length * 9 + 38);
                        return (
                            <g key={`chip-${anchor.id}`}
                                className="sc-anchor-g" data-id={`chip-${anchor.id}`}
                                transform={`translate(${anchor.fx ?? anchor.x ?? 0},${anchor.fy ?? anchor.y ?? 0})`}
                                pointerEvents="none">
                                <rect x={-w / 2} y={-17} width={w} height={34} rx={17}
                                    fill="var(--ink)" stroke={color.stroke} strokeWidth={1.5} opacity={0.97} />
                                <text textAnchor="middle" dominantBaseline="middle"
                                    fontSize={11} fontFamily="monospace" fontWeight="600"
                                    fill={color.dot}>
                                    {anchor.label}
                                </text>
                            </g>
                        );
                    })}
                </g>
            </svg>

            {/* ── Connection details panel ── */}
            {activeNode && (
                <div
                    className="fixed top-[60px] sm:top-[60px] right-2 sm:right-4 w-[280px] sm:w-[300px] max-h-[calc(100vh-140px)] sm:max-h-[calc(100vh-80px)]
                        flex flex-col overflow-hidden z-50 card"
                    style={{
                        animation: 'panelIn 180ms cubic-bezier(.22,1,.36,1)',
                    }}
                >
                    <style>{`
                        @keyframes panelIn {
                            from { opacity:0; transform: translateX(8px) scale(0.98); }
                            to   { opacity:1; transform: translateX(0) scale(1); }
                        }
                    `}</style>

                    {/* Header */}
                    <div className="flex items-center justify-between px-5 pt-5 pb-2">
                        <span className="text-[9px] font-mono text-[var(--text-3)] uppercase tracking-[0.18em]">
                            {activeNode.type}
                            {activeNode.resonanceScore != null && (
                                <span className="ml-2 text-[var(--text-2)] normal-case tracking-normal">
                                    rs {Math.round(activeNode.resonanceScore)}
                                </span>
                            )}
                        </span>
                        <button
                            onClick={() => { setActiveId(null); (activeNode as any).fx = null; (activeNode as any).fy = null; }}
                            className="w-6 h-6 rounded-full flex items-center justify-center text-[var(--text-3)]
                                hover:text-[var(--text-1)] hover:bg-[var(--bg-muted)] transition-all">
                            <X size={14} weight="bold" />
                        </button>
                    </div>

                    {/* Scrollable body */}
                    <div className="overflow-y-auto flex-1 px-5 pb-5">
                        {/* Content */}
                        {activeNode.type === 'SENTENCE' ? (
                            <>
                                <p className="text-[var(--text-2)] text-[12px] font-mono leading-[1.8] break-words mb-3">
                                    "{activeNode.text}"
                                </p>
                                {activeNode.resonanceScore != null && (
                                    <div className="mb-4">
                                        <div className="flex justify-between mb-1">
                                            <span className="text-[9px] font-mono text-[var(--text-3)] uppercase tracking-widest">Resonance</span>
                                            <span className="text-[9px] font-mono text-[var(--text-4)]">{Math.round(activeNode.resonanceScore)}%</span>
                                        </div>
                                        <div className="h-[2px] rounded-full bg-[var(--border)] overflow-hidden">
                                            <div className="h-full rounded-full"
                                                style={{
                                                    width: `${activeNode.resonanceScore}%`,
                                                    background: activeNode.resonanceScore > 60
                                                        ? 'var(--accent-green)'
                                                        : activeNode.resonanceScore > 30
                                                            ? 'var(--accent-amber)'
                                                            : 'var(--accent-red)',
                                                }} />
                                        </div>
                                    </div>
                                )}

                                {(activeNode as any).metadata?.noteId && (
                                    <div className="mt-4 pt-4 border-t border-[var(--border-soft)]">
                                        <Link
                                            href={`/graph/${(activeNode as any).metadata.noteId}`}
                                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl
                                                bg-[var(--text-1)] text-[var(--bg)] font-medium text-[12px]
                                                hover:opacity-90 transition-all shadow-sm"
                                        >
                                            <TreeStructure size={16} weight="bold" />
                                            Open Note Graph
                                        </Link>
                                    </div>
                                )}
                            </>
                        ) : (
                            <p className="text-[var(--text-1)] text-[14px] font-mono font-semibold mb-4">{activeNode.label}</p>
                        )}

                        {/* Connections */}
                        {connectedNodes.length > 0 && (
                            <>
                                <div className="h-px bg-[var(--border-soft)] mb-3.5" />
                                <p className="text-[9px] font-mono text-[var(--text-3)] uppercase tracking-[0.18em] mb-2.5">
                                    {connectedNodes.length} connection{connectedNodes.length !== 1 ? 's' : ''}
                                </p>

                                {/* Entity / Trait peers */}
                                {entityPeers.length > 0 && (
                                    <div className="space-y-1 mb-3">
                                        {entityPeers.map(peer => (
                                            <button key={peer.id}
                                                onClick={e => { e.stopPropagation(); handleNodeClick(peer); }}
                                                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg
                                                    bg-[var(--bg-card)] hover:bg-[var(--bg-hover)]
                                                    border border-transparent hover:border-[var(--border)]
                                                    text-left transition-all group">
                                                <span className={`w-[5px] h-[5px] rounded-full shrink-0
                                                    ${peer.type === 'ENTITY' ? 'bg-[var(--text-4)]' : 'bg-purple-300'}`} />
                                                <span className="text-[11px] font-mono text-[var(--text-2)] group-hover:text-[var(--text-1)] transition-colors flex-1 truncate">
                                                    {peer.label}
                                                </span>
                                                <span className="text-[var(--text-4)] text-[9px] group-hover:text-[var(--text-3)] transition-colors">
                                                    {peer.type === 'ENTITY' ? 'entity' : 'trait'}
                                                </span>
                                                <span className="text-[var(--text-4)] group-hover:text-[var(--text-2)] group-hover:translate-x-0.5 transition-all text-[10px]">→</span>
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* Sentence peers */}
                                {sentencePeers.length > 0 && (
                                    <div className="space-y-1">
                                        <p className="text-[9px] font-mono text-[var(--text-4)] uppercase tracking-widest mb-1.5">Passages</p>
                                        {sentencePeers.slice(0, 7).map(peer => {
                                            const prs = peer.resonanceScore ?? 0;
                                            return (
                                                <button key={peer.id}
                                                    onClick={e => { e.stopPropagation(); handleNodeClick(peer); }}
                                                    className="w-full flex items-start gap-2 px-3 py-2.5 rounded-lg
                                                        bg-[var(--bg-card)] hover:bg-[var(--bg-hover)]
                                                        border border-transparent hover:border-[var(--border)]
                                                        text-left transition-all group">
                                                    <span className={`w-[5px] h-[5px] rounded-full shrink-0 mt-1.5
                                                        ${prs > 60 ? 'bg-[#b87333]' : prs < 20 ? 'bg-[var(--border)]' : 'bg-[var(--text-4)]'}`} />
                                                    <span className="text-[11px] font-mono text-[var(--text-3)] group-hover:text-[var(--text-2)]
                                                        transition-colors leading-relaxed line-clamp-2 flex-1">
                                                        {peer.text?.slice(0, 85)}{(peer.text?.length ?? 0) > 85 ? '…' : ''}
                                                    </span>
                                                    <span className="text-[var(--text-4)] group-hover:text-[var(--text-2)] group-hover:translate-x-0.5 transition-all text-[10px] shrink-0 mt-0.5">→</span>
                                                </button>
                                            );
                                        })}
                                        {sentencePeers.length > 7 && (
                                            <p className="text-[10px] font-mono justify-center pt-1 text-[var(--text-4)]">
                                                +{sentencePeers.length - 7} more
                                            </p>
                                        )}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* ── Empty state ── */}
            {interactive.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none pt-24">
                    <p className="text-zinc-800 font-mono text-sm tracking-[0.2em] uppercase">
                        No content to visualise
                    </p>
                </div>
            )}
        </div>
    );
}
