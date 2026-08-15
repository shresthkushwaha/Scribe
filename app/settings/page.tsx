'use client';

import React, { useState, useEffect } from 'react';
import { useNotesStore } from '@/lib/notesStore';
import { DataMigration } from '@/components/DataMigration';
import { Sun, Moon, Database, Palette, GearSix, Key, Sparkle, ArrowRight, ShieldCheck, CheckCircle } from '@phosphor-icons/react';
import BYOKModal from '@/components/BYOKModal';
import { useBYOKStore } from '@/lib/byokStore';

export default function SettingsPage() {
    const { theme, setTheme } = useNotesStore();
    const { config, load: loadBYOK } = useBYOKStore();
    const [isBYOKOpen, setIsBYOKOpen] = useState(false);

    useEffect(() => {
        loadBYOK();
    }, [loadBYOK]);

    const activeKey = config.keys.find(k => k.id === config.activeKeyId);

    const toggleTheme = () => {
        setTheme(theme === 'light' ? 'dark' : 'light');
    };

    return (
        <div className="flex flex-col h-full bg-(--bg-app)">
            {/* Header */}
            <header className="flex items-center justify-between px-8 py-6 border-b border-(--border-soft) bg-(--bg-app) sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-(--bg-lavender) text-(--ink)">
                        <GearSix size={24} weight="fill" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-serif font-semibold text-(--ink)">Settings</h1>
                        <p className="text-sm text-(--ink-dim)">Manage your preferences, API keys, and data</p>
                    </div>
                </div>
            </header>

            {/* Content */}
            <div className="flex-1 overflow-y-auto no-scrollbar">
                <div className="max-w-4xl mx-auto w-full px-8 py-10 flex flex-col gap-10 pb-32">

                    {/* AI & BYOK Section */}
                    <section className="flex flex-col gap-4">
                        <div className="flex items-center gap-2 pb-2 border-b border-(--border-soft)">
                            <Key size={20} weight="bold" className="text-(--ink-dim)" />
                            <h2 className="text-sm uppercase tracking-wider font-bold text-(--ink-dim)">AI Credentials & BYOK</h2>
                        </div>

                        <div className="p-6 rounded-2xl bg-(--bg-card) border border-(--border-soft) shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                            <div className="flex flex-col gap-1.5 max-w-lg">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-lg font-semibold text-(--ink)">
                                        Bring Your Own Key (BYOK)
                                    </h3>
                                    {activeKey ? (
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                                            <CheckCircle size={12} weight="fill" />
                                            Active
                                        </span>
                                    ) : (
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                                            Default Gemini
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm text-(--ink-dim) leading-relaxed">
                                    {activeKey 
                                        ? `Currently powered by ${activeKey.name} (${activeKey.preferredModel}). All in-graph chat and spatial mapping requests will use this credential.`
                                        : 'Connect your own Google Gemini, Anthropic Claude, OpenAI, DeepSeek, or local Ollama / LM Studio models.'}
                                </p>
                            </div>

                            <button
                                onClick={() => setIsBYOKOpen(true)}
                                className="px-5 py-2.5 rounded-full text-sm font-bold bg-(--ink) text-(--bg-card) hover:opacity-90 transition-all flex items-center gap-2 shrink-0 self-start sm:self-center shadow-sm"
                            >
                                <Key size={16} weight="bold" />
                                <span>{activeKey ? 'Manage Keys' : 'Configure BYOK'}</span>
                                <ArrowRight size={14} weight="bold" />
                            </button>
                        </div>
                    </section>

                    {/* Appearance Section */}
                    <section className="flex flex-col gap-6">
                        <div className="flex items-center gap-2 pb-2 border-b border-(--border-soft)">
                            <Palette size={20} weight="bold" className="text-(--ink-dim)" />
                            <h2 className="text-sm uppercase tracking-wider font-bold text-(--ink-dim)">Appearance</h2>
                        </div>

                        <div className="flex items-center justify-between p-6 rounded-2xl bg-(--bg-card) border border-(--border-soft) shadow-sm">
                            <div className="flex flex-col gap-1">
                                <h3 className="text-lg font-semibold text-(--ink)">Display Theme</h3>
                                <p className="text-sm text-(--ink-dim)">Switch between light and dark mode</p>
                            </div>

                            <button
                                onClick={toggleTheme}
                                className="relative inline-flex h-9 w-20 items-center rounded-full bg-(--bg-muted) border border-(--border-soft) transition-colors focus:outline-none"
                            >
                                <div
                                    className={`flex items-center justify-center h-7 w-7 transform rounded-full bg-(--bg-card) border border-(--border-soft) shadow-sm transition-transform duration-200 ease-in-out ${theme === 'dark' ? 'translate-x-11' : 'translate-x-1'
                                        }`}
                                >
                                    {theme === 'light' ? (
                                        <Sun size={16} weight="bold" className="text-orange-400" />
                                    ) : (
                                        <Moon size={16} weight="bold" className="text-indigo-400" />
                                    )}
                                </div>
                                <span className="sr-only">Toggle theme</span>
                            </button>
                        </div>
                    </section>

                    {/* Data & Backup Section */}
                    <section className="flex flex-col gap-6">
                        <div className="flex items-center gap-2 pb-2 border-b border-(--border-soft)">
                            <Database size={20} weight="bold" className="text-(--ink-dim)" />
                            <h2 className="text-sm uppercase tracking-wider font-bold text-(--ink-dim)">Data & Backup</h2>
                        </div>

                        <div className="flex flex-col gap-4">
                            <p className="text-sm text-(--ink-dim) px-1">
                                Import your existing notes from Markdown files or restore your library from a JSON backup.
                                We recommend backing up your data regularly to keep your notes safe.
                            </p>
                            <DataMigration />
                        </div>
                    </section>

                </div>
            </div>

            <BYOKModal 
                isOpen={isBYOKOpen} 
                onClose={() => setIsBYOKOpen(false)} 
            />
        </div>
    );
}
