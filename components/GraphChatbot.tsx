'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
    ChatTeardropText, PaperPlaneRight, Sparkle, X, 
    CircleNotch, TreeStructure, Check, ArrowsClockwise, 
    Lightning, LightbulbFilament, WarningCircle
} from '@phosphor-icons/react';
import { 
    askGraphChatbot, convertChatResponseToGraph, 
    type ChatMessage, type ExtractedGraphPayload 
} from '@/lib/services/chatGraphEngine';
import ReactMarkdown from 'react-markdown';

interface GraphChatbotProps {
    title?: string;
    sourceContent?: string;
    existingNodes: Array<{ id: string; label: string; [key: string]: any }>;
    activeNode?: { id: string; label: string } | null;
    onInjectGraphData: (payload: ExtractedGraphPayload, userPrompt?: string) => void;
    open?: boolean;
    onOpenChange?: (isOpen: boolean) => void;
}

const QUICK_PROMPTS = [
    { label: 'Explore Blind Spots & Risks', icon: <WarningCircle size={13} weight="bold" /> },
    { label: 'Brainstorm Next Action Steps', icon: <Lightning size={13} weight="bold" /> },
    { label: 'Expand Core Concepts', icon: <LightbulbFilament size={13} weight="bold" /> },
    { label: 'Find Hidden Connections', icon: <TreeStructure size={13} weight="bold" /> },
];

export default function GraphChatbot({
    title = 'Knowledge Graph',
    sourceContent = '',
    existingNodes = [],
    activeNode = null,
    onInjectGraphData,
    open,
    onOpenChange,
}: GraphChatbotProps) {
    const [internalOpen, setInternalOpen] = useState(false);
    const isOpen = open !== undefined ? open : internalOpen;
    
    const setIsOpen = (val: boolean) => {
        setInternalOpen(val);
        onOpenChange?.(val);
    };
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            id: 'initial-greeting',
            role: 'assistant',
            content: `Hello! I am your **Graph Co-Pilot**. Ask me any questions, analysis requests, or conceptual expansions about this graph.\n\nWhenever I answer, you can click **"Make Graph"** on any response to convert it into nodes and link it to the main graph!`,
            timestamp: Date.now(),
        },
    ]);
    const [isAsking, setIsAsking] = useState(false);
    const [generatingGraphForId, setGeneratingGraphForId] = useState<string | null>(null);
    const [generatedMapIds, setGeneratedMapIds] = useState<Set<string>>(new Set());

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen]);

    const handleSendMessage = async (customPrompt?: string) => {
        const text = (customPrompt || input).trim();
        if (!text || isAsking) return;

        const userMsg: ChatMessage = {
            id: `user-${Date.now()}`,
            role: 'user',
            content: text,
            timestamp: Date.now(),
        };

        const updatedHistory = [...messages, userMsg];
        setMessages(updatedHistory);
        setInput('');
        setIsAsking(true);

        try {
            const reply = await askGraphChatbot(
                updatedHistory.map(m => ({ role: m.role, content: m.content })),
                {
                    title,
                    content: sourceContent,
                    nodeLabels: existingNodes.map(n => n.label),
                    activeNodeLabel: activeNode?.label,
                }
            );

            const aiMsg: ChatMessage = {
                id: `ai-${Date.now()}`,
                role: 'assistant',
                content: reply,
                timestamp: Date.now(),
            };

            setMessages(prev => [...prev, aiMsg]);
        } catch (err) {
            console.error('Chat error:', err);
            setMessages(prev => [
                ...prev,
                {
                    id: `ai-err-${Date.now()}`,
                    role: 'assistant',
                    content: 'Sorry, I encountered an issue analyzing this graph. Please try again.',
                    timestamp: Date.now(),
                },
            ]);
        } finally {
            setIsAsking(false);
        }
    };

    const handleMakeGraph = async (message: ChatMessage) => {
        if (generatingGraphForId || generatedMapIds.has(message.id)) return;

        const msgIdx = messages.findIndex(m => m.id === message.id);
        let userPrompt = 'Chat Insights';
        for (let i = msgIdx - 1; i >= 0; i--) {
            if (messages[i].role === 'user') {
                userPrompt = messages[i].content;
                break;
            }
        }

        setGeneratingGraphForId(message.id);
        try {
            const graphPayload = await convertChatResponseToGraph(message.content, {
                title,
                existingNodes: existingNodes.map(n => ({ id: n.id, label: n.label })),
                activeNodeId: activeNode?.id,
            });

            if (graphPayload && graphPayload.nodes.length > 0) {
                onInjectGraphData(graphPayload, userPrompt);
                setGeneratedMapIds(prev => new Set(prev).add(message.id));
            }
        } catch (e) {
            console.error('Failed to convert chat response to graph:', e);
            alert('Failed to generate graph nodes from this response.');
        } finally {
            setGeneratingGraphForId(null);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <div className="fixed bottom-6 left-6 z-50 flex flex-col items-start pointer-events-auto">
            {/* ── Chat Window ── */}
            {isOpen && (
                <div className="w-[380px] sm:w-[440px] h-[580px] max-h-[calc(100vh-100px)] flex flex-col rounded-[24px] bg-[var(--bg-card)] border border-[var(--border-soft)] shadow-[0_16px_48px_rgba(0,0,0,0.24)] overflow-hidden backdrop-blur-2xl mb-3 animate-in slide-in-from-bottom-5 duration-300">
                    {/* Header */}
                    <div className="px-5 py-4 bg-[var(--bg-muted)] border-b border-[var(--border-soft)] flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-[var(--ink)] text-[var(--bg-card)] flex items-center justify-center shadow-sm">
                                <Sparkle size={16} weight="fill" className="text-amber-400" />
                            </div>
                            <div>
                                <h3 className="text-[14px] font-bold tracking-tight text-[var(--ink)] flex items-center gap-2">
                                    Graph Intelligence
                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-500">
                                        Live Co-Pilot
                                    </span>
                                </h3>
                                <p className="text-[11px] text-[var(--ink-dim)] truncate max-w-[240px]">
                                    {activeNode ? `Focused on: ${activeNode.label}` : title}
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-1.5 rounded-full hover:bg-[var(--bg-card)] text-[var(--ink-dim)] hover:text-[var(--ink)] transition-colors"
                        >
                            <X size={18} weight="bold" />
                        </button>
                    </div>

                    {/* Messages Scroll Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
                        {messages.map(msg => {
                            const isAssistant = msg.role === 'assistant';
                            const isAlreadyGenerated = generatedMapIds.has(msg.id);
                            const isConverting = generatingGraphForId === msg.id;

                            return (
                                <div
                                    key={msg.id}
                                    className={`flex flex-col ${isAssistant ? 'items-start' : 'items-end'}`}
                                >
                                    <div
                                        className={`max-w-[90%] rounded-[18px] px-4 py-3 text-[13px] leading-relaxed shadow-sm ${
                                            isAssistant
                                                ? 'bg-[var(--bg-muted)] text-[var(--ink)] border border-[var(--border-soft)] rounded-tl-sm'
                                                : 'bg-[var(--ink)] text-[var(--bg-card)] rounded-tr-sm'
                                        }`}
                                    >
                                        <div className="prose prose-sm dark:prose-invert max-w-none text-[13px] leading-relaxed space-y-1.5">
                                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                                        </div>

                                        {/* "Make Graph" Action Button for AI Messages */}
                                        {isAssistant && msg.id !== 'initial-greeting' && (
                                            <div className="mt-3 pt-2.5 border-t border-[var(--border-soft)]/60 flex items-center justify-between gap-2">
                                                <button
                                                    onClick={() => handleMakeGraph(msg)}
                                                    disabled={isConverting || isAlreadyGenerated}
                                                    className={`px-3 py-1.5 rounded-full text-[12px] font-bold transition-all flex items-center gap-1.5 shadow-sm ${
                                                        isAlreadyGenerated
                                                            ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 cursor-default'
                                                            : isConverting
                                                            ? 'bg-[var(--ink)] text-[var(--bg-card)] opacity-80 cursor-wait'
                                                            : 'bg-[var(--ink)] text-[var(--bg-card)] hover:scale-[1.03] active:scale-95'
                                                    }`}
                                                >
                                                    {isConverting ? (
                                                        <>
                                                            <CircleNotch size={14} className="animate-spin" />
                                                            <span>Synthesizing Nodes...</span>
                                                        </>
                                                    ) : isAlreadyGenerated ? (
                                                        <>
                                                            <Check size={14} weight="bold" />
                                                            <span>Connected to Graph</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <TreeStructure size={14} weight="bold" className="text-amber-400" />
                                                            <span>Make Graph →</span>
                                                        </>
                                                    )}
                                                </button>

                                                <span className="text-[10px] opacity-60 font-medium">
                                                    {isAlreadyGenerated ? 'Linked' : 'Converts to nodes'}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}

                        {isAsking && (
                            <div className="flex items-center gap-2 text-[12px] text-[var(--ink-dim)] px-2 py-1">
                                <CircleNotch size={16} className="animate-spin text-[var(--ink)]" />
                                <span>Analyzing graph context and reasoning...</span>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Quick Prompts Bar */}
                    <div className="px-3 py-2 bg-[var(--bg-muted)]/50 border-t border-[var(--border-soft)] flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                        {QUICK_PROMPTS.map((p, i) => (
                            <button
                                key={i}
                                onClick={() => handleSendMessage(p.label)}
                                disabled={isAsking}
                                className="px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap bg-[var(--bg-card)] border border-[var(--border-soft)] hover:border-[var(--ink-dim)] text-[var(--ink-dim)] hover:text-[var(--ink)] transition-all flex items-center gap-1 shrink-0 disabled:opacity-50"
                            >
                                {p.icon}
                                {p.label}
                            </button>
                        ))}
                    </div>

                    {/* Input Bar */}
                    <div className="p-3 bg-[var(--bg-card)] border-t border-[var(--border-soft)] flex items-center gap-2">
                        <textarea
                            ref={textareaRef}
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Ask or request graph analysis..."
                            rows={1}
                            disabled={isAsking}
                            className="flex-1 max-h-24 bg-[var(--bg-muted)] border border-[var(--border-soft)] rounded-[14px] px-3.5 py-2 text-[13px] text-[var(--ink)] placeholder-[var(--ink-dim)] outline-none resize-none focus:border-[var(--ink-dim)] transition-all"
                        />
                        <button
                            onClick={() => handleSendMessage()}
                            disabled={!input.trim() || isAsking}
                            className={`p-2.5 rounded-full text-[var(--bg-card)] transition-all flex items-center justify-center shrink-0 ${
                                input.trim() && !isAsking
                                    ? 'bg-[var(--ink)] hover:scale-105 active:scale-95 shadow-md'
                                    : 'bg-[var(--border-soft)] text-[var(--ink-dim)] opacity-50 cursor-not-allowed'
                            }`}
                        >
                            <PaperPlaneRight size={16} weight="bold" />
                        </button>
                    </div>
                </div>
            )}

            {/* ── Floating Trigger Button ── */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`hidden md:flex items-center gap-2 px-4 py-3 rounded-full font-bold text-[13px] shadow-[0_8px_32px_rgba(0,0,0,0.2)] transition-all hover:scale-105 active:scale-95 ${
                    isOpen
                        ? 'bg-[var(--bg-card)] text-[var(--ink)] border border-[var(--border-soft)]'
                        : 'bg-[var(--ink)] text-[var(--bg-card)]'
                }`}
            >
                {isOpen ? (
                    <>
                        <X size={18} weight="bold" />
                        <span>Close Chat</span>
                    </>
                ) : (
                    <>
                        <Sparkle size={18} weight="fill" className="text-amber-400 animate-pulse" />
                        <span>Graph Chat</span>
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    </>
                )}
            </button>
        </div>
    );
}
