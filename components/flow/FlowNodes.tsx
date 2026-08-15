import { Handle, Position } from '@xyflow/react';
import React from 'react';
import { Ghost, Lightning, ArrowsClockwise, TreeStructure, Warning, Lightbulb, ChatText, Question, Info, ChartLineUp, Sparkle } from '@phosphor-icons/react';

interface NodeData {
  label: string;
  category?: string;
  type?: string;
  pkgId?: string;
  resonanceScore?: number;
}

const CATEGORY_ICONS: Record<string, any> = {
  'CRITIQUE': <Warning size={16} weight="bold" />,
  'RISK': <Info size={16} weight="bold" />,
  'OPPORTUNITY': <Lightbulb size={16} weight="bold" />,
  'PATH': <ChartLineUp size={16} weight="bold" />,
  'INSIGHT': <ChatText size={16} weight="bold" />,
  'QUESTION': <Question size={16} weight="bold" />,
  'FACT': <Info size={16} weight="bold" />,
};

const STRAT_COLORS: Record<string, { accent: string; bg: string }> = {
  'STRAT_CRITIQUE': { accent: '#f97316', bg: 'rgba(249,115,22,0.1)' },
  'STRAT_RISK': { accent: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
  'STRAT_OPPORTUNITY': { accent: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  'STRAT_INSIGHT': { accent: '#06b6d4', bg: 'rgba(6,182,212,0.1)' },
  'STRAT_PATH': { accent: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  'STRAT_FACT': { accent: '#94a3b8', bg: 'rgba(148,163,184,0.08)' },
  'STRAT_QUESTION': { accent: '#a855f7', bg: 'rgba(168,85,247,0.1)' },
};

const ARCHIPELAGO_COLORS = [
  '#64a0ff', // blue
  '#ffb450', // amber
  '#50dc96', // green
  '#dc78ff', // purple
];

export function StrategistNode({ data, type, selected }: any) {
  const cfg = STRAT_COLORS[type] || STRAT_COLORS['STRAT_INSIGHT'];
  const icon = CATEGORY_ICONS[data.category || 'INSIGHT'];
  const hasInsight = typeof (data.insightIndex ?? data.fullNode?.insightIndex) === 'number';
  const insightIdx = data.insightIndex ?? data.fullNode?.insightIndex;
  const accentColor = data.color || (hasInsight ? ARCHIPELAGO_COLORS[insightIdx % 4] : cfg.accent);
  const bgColor = `${accentColor}11`;
  const isLatest = data.isLatest || false;

  return (
    <div className={`relative px-4 py-3 rounded-xl border transition-all duration-300 min-w-[140px] max-w-[240px]
      ${selected ? 'ring-2 ring-offset-2' : 'shadow-lg'} 
      ${isLatest ? 'glow-new-node' : ''}
      tactical-glass`}
      style={{ 
        borderLeftColor: selected ? accentColor : 'rgba(255,255,255,0.1)',
        borderRightColor: selected ? accentColor : 'rgba(255,255,255,0.1)',
        borderBottomColor: selected ? accentColor : 'rgba(255,255,255,0.1)',
        backgroundColor: bgColor,
        boxShadow: selected ? `0 0 20px ${accentColor}44` : 'none',
        borderTopWidth: '4px',
        borderTopStyle: 'solid',
        borderTopColor: accentColor,
        '--glow-color': accentColor
      } as any}>
      
      <Handle type="target" position={Position.Top} style={{ background: accentColor, opacity: 0 }} />
      <Handle type="source" position={Position.Bottom} style={{ background: accentColor, opacity: 0 }} />

      <div className="flex items-center gap-2 mb-1">
          <span style={{ color: accentColor }}>{icon}</span>
          <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: accentColor }}>
          {data.category || 'NODE'}
          </span>
      </div>

      <div className="text-[13px] font-bold text-gray-900 leading-tight">
        {data.label}
      </div>
      
      {data.resonanceScore && (
        <div className="mt-2 h-1 w-full bg-gray-200/20 rounded-full overflow-hidden">
          <div className="h-full" style={{ width: `${data.resonanceScore}%`, backgroundColor: accentColor }} />
        </div>
      )}
    </div>
  );
}

/**
 * Persona Node — The Tactical Swarm Card
 */
export function PersonaNode({ data, selected }: any) {
  const pkgIcons: Record<string, React.ReactNode> = {
    'bauhaus': <Ghost size={20} weight="fill" />,
    'red-team': <Lightning size={20} weight="fill" />,
    'market-movers': <ArrowsClockwise size={20} weight="fill" />,
    'deep-thinkers': <TreeStructure size={20} weight="fill" />
  };

  const pkgColor = data.pkgId === 'red-team' ? 'var(--swarm-red)' :
                   data.pkgId === 'bauhaus' ? 'var(--swarm-rose)' :
                   data.pkgId === 'market-movers' ? 'var(--swarm-mint)' : 'var(--swarm-violet)';
  
  const icon = data.pkgId ? pkgIcons[data.pkgId] : <Lightning size={20} weight="fill" />;
  const isLatest = data.isLatest || false;

  return (
    <div className={`relative px-4 py-4 rounded-2xl border-l-[6px] transition-all duration-300 w-[180px]
      ${selected ? 'ring-2' : ''} 
      ${isLatest ? 'glow-new-node' : ''}
      tactical-glass`}
      style={{ 
        borderTopColor: selected ? pkgColor : 'var(--tactical-border)',
        borderRightColor: selected ? pkgColor : 'var(--tactical-border)',
        borderBottomColor: selected ? pkgColor : 'var(--tactical-border)',
        borderLeftWidth: '6px',
        borderLeftStyle: 'solid',
        borderLeftColor: pkgColor,
        boxShadow: selected ? `0 0 25px ${pkgColor}55` : 'none',
        '--glow-color': pkgColor
      } as any}>
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />

      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg" style={{ backgroundColor: `${pkgColor}22`, color: pkgColor }}>
          {icon}
        </div>
        <div>
          <div className="text-[11px] font-black uppercase text-gray-900 tracking-wider">
            {data.label}
          </div>
          <div className="text-[8px] font-bold opacity-60 uppercase tracking-tighter" style={{ color: pkgColor }}>
              {data.pkgId?.replace('-', ' ')}
          </div>
        </div>
      </div>
    </div>
  );
}

export function EntityNode({ data, selected, type }: any) {
    const isHot = (data.resonanceScore ?? 50) > 85;
    const isWarm = (data.resonanceScore ?? 50) > 70;
    
    const hasInsight = typeof (data.insightIndex ?? data.fullNode?.insightIndex) === 'number';
    const insightIdx = data.insightIndex ?? data.fullNode?.insightIndex;
    const isPillar = type === 'ANCHOR' && data.r > 30;
    
    const accent = data.color || (hasInsight ? ARCHIPELAGO_COLORS[insightIdx % 4] : (isHot ? 'var(--accent-red)' : isWarm ? 'var(--accent-orange)' : 'var(--ink)'));
    const bg = data.color ? `${data.color}11` : (hasInsight ? `${accent}11` : (isHot ? 'var(--accent-red-bg)' : isWarm ? 'var(--accent-orange-bg)' : 'var(--bg-card)'));
    const isLatest = data.isLatest || false;

    return (
        <div className={`px-4 py-2 rounded-full border transition-all duration-300 min-w-[80px] text-center
          ${selected ? 'ring-1 ring-offset-2' : 'shadow-sm'} 
          ${isLatest ? 'glow-new-node' : ''}
          tactical-glass backdrop-blur-2xl px-4 py-1.5 rounded-lg border-2 font-bold shadow-sm transition-all duration-200
          ${selected ? 'scale-105' : ''}`}
          style={{ 
            borderTopColor: selected ? accent : 'rgba(255,255,255,0.08)',
            borderLeftColor: selected ? accent : 'rgba(255,255,255,0.08)',
            borderBottomColor: selected ? accent : 'rgba(255,255,255,0.08)',
            backgroundColor: bg,
            boxShadow: selected ? `0 0 15px ${accent}33` : (isPillar ? `0 0 30px ${accent}15` : 'none'),
            color: accent,
            fontSize: isPillar ? '18px' : '13px',
            textTransform: isPillar ? 'uppercase' : 'none',
            borderRightWidth: hasInsight ? '4px' : '0px',
            borderRightStyle: 'solid',
            borderRightColor: accent,
            letterSpacing: isPillar ? '0.05em' : 'normal',
            '--glow-color': accent
          } as any}>
            <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
            <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
            {data.label}
        </div>
    );
}

/**
 * Sentence Node — Small Semantic Pills
 */
export function SentenceNode({ data, selected }: any) {
    return (
        <div className={`px-3 py-1 rounded-full border shadow-sm transition-all duration-200 text-[11px] font-medium
            ${selected ? 'scale-110 border-blue-400 text-blue-600 bg-blue-50' : 'bg-white border-gray-200 text-gray-600'}`}>
            <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
            <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
            {data.label || (data.text?.length > 40 ? data.text.slice(0, 37) + '...' : data.text)}
        </div>
    );
}

/**
 * Section Group — Container for themed mutation clusters
 */
export function SectionGroupNode({ data, selected }: any) {
    return (
        <div className={`relative w-full h-full rounded-[40px] border-2 border-dashed transition-all duration-500
            ${selected ? 'border-black/60 ring-4 ring-black/5' : 'border-black/20'} 
            bg-white/10 backdrop-blur-3xl shadow-[0_40px_100px_rgba(0,0,0,0.05)]`}>
            
            <div className="absolute -top-5 left-10 px-6 py-2 rounded-full bg-black text-white flex items-center gap-2 shadow-2xl transition-transform duration-500 scale-110">
                <Sparkle size={14} weight="fill" className="text-amber-400" />
                <span className="text-[11px] font-black uppercase tracking-[0.25em] whitespace-nowrap">
                    {data.label || 'STRATEGIC SECTION'}
                </span>
            </div>
        </div>
    );
}
