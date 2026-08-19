'use client';

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const faqs = [
    {
        question: "Is my data really private?",
        answer: "Yes. By default, Scribe runs entirely locally in your browser. Your notes and maps are never sent to a cloud database unless you explicitly enable Pro cloud sync."
    },
    {
        question: "Can I use my own AI API keys?",
        answer: "Absolutely. You can plug in your own API keys for Claude or OpenAI. You only pay for what you use directly to the AI providers, and your keys are stored securely in your browser's local storage."
    },
    {
        question: "Does it work completely offline?",
        answer: "Yes! If you hook up a local AI model via Ollama or LM Studio, you can use the entire application without an internet connection."
    },
    {
        question: "What formats can I import?",
        answer: "Scribe supports Markdown natively, but can also auto-parse PDFs, DOCX, and TXT files directly into your visual workspace."
    }
];

export default function LandingFAQ() {
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    return (
        <section id="faq" className="py-20 max-w-3xl mx-auto px-4 md:px-6">
            
            <div className="text-center mb-12">
                <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-medium tracking-tight text-white mb-4">
                    Frequently asked questions.
                </h2>
            </div>

            <div className="space-y-3">
                {faqs.map((faq, index) => (
                    <div 
                        key={index}
                        className={`rounded-[12px] border transition-colors duration-200 overflow-hidden ${
                            openIndex === index 
                                ? 'bg-[#101111] border-[#383b3d]' 
                                : 'bg-[#0d0d0d] border-[#242728] hover:border-[#383b3d]'
                        }`}
                    >
                        <button
                            onClick={() => setOpenIndex(openIndex === index ? null : index)}
                            className="w-full flex items-center justify-between p-5 text-left"
                        >
                            <span className="font-medium text-[15px] text-white">{faq.question}</span>
                            <ChevronDown className={`w-4 h-4 text-[#8c8c8c] transition-transform duration-200 ${openIndex === index ? 'rotate-180' : ''}`} />
                        </button>
                        
                        <div 
                            className={`px-5 overflow-hidden transition-all duration-300 ease-in-out ${
                                openIndex === index ? 'max-h-40 pb-5 opacity-100' : 'max-h-0 opacity-0'
                            }`}
                        >
                            <p className="text-sm text-[#8c8c8c] leading-relaxed font-sans">
                                {faq.answer}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

        </section>
    );
}
