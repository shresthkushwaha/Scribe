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
        } else if (e.key === 'Escape') {
            setIsOpen(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            textareaRef.current?.focus();
        }
    }, [isOpen]);

    return (
        <div className="fixed bottom-6 left-6 z-50 flex flex-col items-start pointer-events-auto">
            {/* ── Chat Window with WCAG Dialog Semantics ── */}
            {isOpen && (
                <div 
                    id="graph-chat-panel"
                    role="dialog"
                    aria-modal="false"
                    aria-labelledby="graph-intelligence-heading"
                    className="w-[380px] sm:w-[440px] h-[580px] max-h-[calc(100vh-100px)] flex flex-col rounded-[24px] bg-[var(--bg-card)] border border-[var(--border)] shadow-[0_16px_48px_rgba(0,0,0,0.24)] overflow-hidden backdrop-blur-2xl mb-3 animate-in slide-in-from-bottom-5 duration-300"
                >
                    {/* Header */}
                    <div className="px-5 py-4 bg-[var(--bg-muted)] border-b border-[var(--border)] flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-[var(--ink)] text-[var(--bg-card)] flex items-center justify-center shadow-sm" aria-hidden="true">
                                <Sparkle size={16} weight="fill" className="text-amber-400" />
                            </div>
                            <div>
                                <h3 id="graph-intelligence-heading" className="text-[14px] font-bold tracking-tight text-[var(--ink)] flex items-center gap-2">
                                    Graph Intelligence
                                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30">
                                        Live Co-Pilot
                                    </span>
                                </h3>
                                <p className="text-[11px] text-[var(--ink-dim)] truncate max-w-[240px]">
                                    {activeNode ? `Focused on: ${activeNode.label}` : title}
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            aria-label="Close Graph Intelligence Chat"
                            className="p-2 rounded-full hover:bg-[var(--bg-card)] text-[var(--ink-dim)] hover:text-[var(--ink)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                        >
                            <X size={18} weight="bold" />
                        </button>
                    </div>

                    {/* Messages Scroll Area with Live Region for Screen Readers */}
                    <div 
                        role="log"
                        aria-live="polite"
                        aria-atomic="false"
                        aria-label="Chat Message History"
                        className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar"
                    >
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
                                        className={`max-w-[92%] rounded-[18px] px-4 py-3 text-[13px] leading-relaxed shadow-sm ${
                                            isAssistant
                                                ? 'bg-[var(--bg-card)] text-[var(--ink)] border border-[var(--border)] rounded-tl-sm'
                                                : 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-tr-sm font-medium shadow-md'
                                        }`}
                                    >
                                        {isAssistant ? (
                                            <div className="text-[13px] leading-relaxed space-y-2 text-[var(--ink)] font-normal">
                                                <ReactMarkdown
                                                    components={{
                                                        h1: ({ children }) => <h1 className="text-[15px] font-bold text-[var(--ink)] mt-2 mb-1">{children}</h1>,
                                                        h2: ({ children }) => <h2 className="text-[14px] font-bold text-[var(--ink)] mt-2 mb-1">{children}</h2>,
                                                        h3: ({ children }) => <h3 className="text-[13px] font-bold text-[var(--ink)] mt-1.5 mb-1">{children}</h3>,
                                                        p: ({ children }) => <p className="text-[13px] text-[var(--ink)] leading-relaxed my-1">{children}</p>,
                                                        ul: ({ children }) => <ul className="list-disc pl-4 space-y-1.5 my-1.5 text-[var(--ink)]">{children}</ul>,
                                                        ol: ({ children }) => <ol className="list-decimal pl-4 space-y-1.5 my-1.5 text-[var(--ink)]">{children}</ol>,
                                                        li: ({ children }) => <li className="text-[13px] text-[var(--ink)] leading-relaxed">{children}</li>,
                                                        strong: ({ children }) => <strong className="font-bold text-[var(--ink)]">{children}</strong>,
                                                        em: ({ children }) => <em className="italic text-[var(--ink)]">{children}</em>,
                                                        code: ({ children }) => <code className="bg-[var(--bg-muted)] text-[var(--ink)] px-1.5 py-0.5 rounded font-mono text-[12px] border border-[var(--border)]">{children}</code>
                                                    }}
                                                >
                                                    {msg.content}
                                                </ReactMarkdown>
                                            </div>
                                        ) : (
                                            <p className="text-[13px] leading-relaxed whitespace-pre-wrap text-white dark:text-slate-900">
                                                {msg.content}
                                            </p>
                                        )}

                                        {/* "Make Graph" Action Button for AI Messages */}
                                        {isAssistant && msg.id !== 'initial-greeting' && (
                                            <div className="mt-3 pt-2.5 border-t border-[var(--border)] flex items-center justify-between gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => handleMakeGraph(msg)}
                                                    disabled={isConverting || isAlreadyGenerated}
                                                    aria-label={isAlreadyGenerated ? "Nodes already connected to graph" : "Convert these insights into interactive graph nodes"}
                                                    className={`px-3 py-1.5 rounded-full text-[12px] font-bold transition-all flex items-center gap-1.5 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                                                        isAlreadyGenerated
                                                            ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 cursor-default'
                                                            : isConverting
                                                            ? 'bg-[var(--ink)] text-[var(--bg-card)] opacity-80 cursor-wait'
                                                            : 'bg-[var(--ink)] text-[var(--bg-card)] hover:scale-[1.03] active:scale-95'
                                                    }`}
                                                >
                                                    {isConverting ? (
                                                        <>
                                                            <CircleNotch size={14} className="animate-spin" aria-hidden="true" />
                                                            <span>Synthesizing Nodes...</span>
                                                        </>
                                                    ) : isAlreadyGenerated ? (
                                                        <>
                                                            <Check size={14} weight="bold" aria-hidden="true" />
                                                            <span>Connected to Graph</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <TreeStructure size={14} weight="bold" className="text-amber-400" aria-hidden="true" />
                                                            <span>Make Graph →</span>
                                                        </>
                                                    )}
                                                </button>

                                                <span className="text-[10px] text-[var(--ink-dim)] font-medium">
                                                    {isAlreadyGenerated ? 'Linked' : 'Converts to nodes'}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}

                        {isAsking && (
                            <div className="flex items-center gap-2 text-[12px] text-[var(--ink)] font-medium px-2 py-1" aria-live="polite">
                                <CircleNotch size={16} className="animate-spin text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                                <span>Analyzing graph context and synthesizing insights...</span>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Quick Prompts Bar */}
                    <div 
                        role="group" 
                        aria-label="Quick analysis prompts"
                        className="px-3 py-2 bg-[var(--bg-muted)]/70 border-t border-[var(--border)] flex items-center gap-1.5 overflow-x-auto no-scrollbar"
                    >
                        {QUICK_PROMPTS.map((p, i) => (
                            <button
                                key={i}
                                type="button"
                                onClick={() => handleSendMessage(p.label)}
                                disabled={isAsking}
                                aria-label={`Prompt: ${p.label}`}
                                className="px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap bg-[var(--bg-card)] border border-[var(--border)] hover:border-[var(--ink)] text-[var(--ink)] transition-all flex items-center gap-1.5 shrink-0 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                            >
                                <span aria-hidden="true">{p.icon}</span>
                                <span>{p.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Input Bar */}
                    <div className="p-3 bg-[var(--bg-card)] border-t border-[var(--border)] flex items-center gap-2">
                        <label htmlFor="graph-chat-input" className="sr-only">
                            Ask or request graph analysis
                        </label>
                        <textarea
                            id="graph-chat-input"
                            ref={textareaRef}
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Ask or request graph analysis..."
                            rows={1}
                            disabled={isAsking}
                            aria-label="Ask or request graph analysis"
                            className="flex-1 max-h-24 bg-[var(--bg-muted)] border border-[var(--border)] rounded-[14px] px-3.5 py-2 text-[13px] text-[var(--ink)] placeholder:text-[var(--ink-dim)] outline-none resize-none focus:border-[var(--ink)] focus-visible:ring-2 focus-visible:ring-emerald-500 transition-all"
                        />
                        <button
                            type="button"
                            onClick={() => handleSendMessage()}
                            disabled={!input.trim() || isAsking}
                            aria-label="Send message"
                            className={`p-2.5 rounded-full text-[var(--bg-card)] transition-all flex items-center justify-center shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                                input.trim() && !isAsking
                                    ? 'bg-[var(--ink)] hover:scale-105 active:scale-95 shadow-md'
                                    : 'bg-[var(--bg-muted)] text-[var(--ink-dim)] opacity-50 cursor-not-allowed border border-[var(--border)]'
                            }`}
                        >
                            <PaperPlaneRight size={16} weight="bold" aria-hidden="true" />
                        </button>
                    </div>
                </div>
            )}

            {/* ── Floating Trigger Button with ARIA attributes ── */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                aria-expanded={isOpen}
                aria-controls="graph-chat-panel"
                aria-label={isOpen ? "Close Graph Intelligence Chat" : "Open Graph Intelligence Chat Co-Pilot"}
                className={`hidden md:flex items-center gap-2 px-4 py-3 rounded-full font-bold text-[13px] shadow-[0_8px_32px_rgba(0,0,0,0.2)] transition-all hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                    isOpen
                        ? 'bg-[var(--bg-card)] text-[var(--ink)] border border-[var(--border)]'
                        : 'bg-[var(--ink)] text-[var(--bg-card)]'
                }`}
            >
                {isOpen ? (
                    <>
                        <X size={18} weight="bold" aria-hidden="true" />
                        <span>Close Chat</span>
                    </>
                ) : (
                    <>
                        <Sparkle size={18} weight="fill" className="text-amber-400 animate-pulse" aria-hidden="true" />
                        <span>Graph Chat</span>
                        <span className="w-2 h-2 rounded-full bg-emerald-400" aria-hidden="true" />
                    </>
                )}
            </button>
        </div>
    );
}
