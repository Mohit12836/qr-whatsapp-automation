'use client';

import { useState } from 'react';
import {
  Sparkles,
  Bot,
  X,
  CheckCircle2,
  AlertTriangle,
  Send,
  Zap,
  PhoneCall,
  ArrowRight,
  TrendingUp,
  Lightbulb,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface Suggestion {
  id: string;
  type: 'gap' | 'lead' | 'insight';
  title: string;
  description: string;
  actionText: string;
  actionHref?: string;
  suggestedAnswer?: string;
}

export function AISuccessAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'suggestions' | 'simulator'>('suggestions');
  const [testInput, setTestInput] = useState('');
  const [testMessages, setTestMessages] = useState<Array<{ sender: 'user' | 'bot'; text: string }>>([
    { sender: 'bot', text: 'Namaste! Main aapka AI Sales Employee hoon. Mujhse koi bhi business sawal puch kar test karein! 🚀' }
  ]);
  const [isSimulating, setIsSimulating] = useState(false);

  const [suggestions, setSuggestions] = useState<Suggestion[]>([
    {
      id: '1',
      type: 'gap',
      title: 'Missing Warranty Information',
      description: '6 customers asked about "Inverter Warranty" yesterday. Adding this can boost conversion by 18%.',
      suggestedAnswer: 'Humare solar inverters par 5-year comprehensive onsite replacement warranty aur panels par 25-year performance warranty milti hai.',
      actionText: 'Approve & Add Rule',
    },
    {
      id: '2',
      type: 'lead',
      title: '3 High-Intent Leads Need Review',
      description: 'Pooja Solar (50kW inquiry) and 2 others requested custom quotes above ₹5,00,000.',
      actionText: 'View Hot Leads in Inbox',
      actionHref: '/inbox',
    },
    {
      id: '3',
      type: 'insight',
      title: 'Daily 8 PM Voice Interview Active',
      description: 'AI will call you at 8:00 PM tonight on +91 98765 43210 to learn your latest discounts.',
      actionText: 'Manage Voice Settings',
      actionHref: '/agents',
    }
  ]);

  const [approvedIds, setApprovedIds] = useState<string[]>([]);

  const handleApprove = (id: string) => {
    setApprovedIds((prev) => [...prev, id]);
  };

  const handleSendMessage = () => {
    if (!testInput.trim()) return;
    const userMsg = testInput.trim();
    setTestMessages((prev) => [...prev, { sender: 'user', text: userMsg }]);
    setTestInput('');
    setIsSimulating(true);

    setTimeout(() => {
      let botReply = 'Namaste! Bilkul, hamare paas best price aur instant 10% cash discount available hai. Kya main aapko payment link share kar doon?';
      const lower = userMsg.toLowerCase();
      if (lower.includes('price') || lower.includes('cost') || lower.includes('kitna')) {
        botReply = 'Sir, 3kW standard package ₹87,000 net padega (Govt subsidy deduct karke). Free site visit kal 11 baje book kar dein?';
      } else if (lower.includes('warranty') || lower.includes('guarantee')) {
        botReply = 'Humare sabhi solar setups par 25-year panel performance guarantee aur 5-year inverter replacement warranty milti hai! 🛡️';
      }
      setTestMessages((prev) => [...prev, { sender: 'bot', text: botReply }]);
      setIsSimulating(false);
    }, 700);
  };

  return (
    <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-40 flex flex-col items-end">
      {/* EXPANDED ASSISTANT CARD */}
      {isOpen && (
        <div className="mb-3 w-[92vw] sm:w-[390px] max-h-[560px] flex flex-col rounded-2xl border border-emerald-500/30 bg-slate-950/95 backdrop-blur-2xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] shadow-emerald-950/40 text-slate-100 overflow-hidden transition-all duration-300 animate-in fade-in slide-in-from-bottom-5">
          {/* Top Bar */}
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/10 bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-950">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="h-8 w-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <Bot className="h-4.5 w-4.5" />
                </div>
                <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-slate-950 animate-pulse" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  AI Sales Companion
                  <span className="text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.2 rounded-full">
                    Live Guard
                  </span>
                </h4>
                <p className="text-[10px] text-slate-400">Self-driving continuous learning</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="h-7 w-7 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-white/10 bg-slate-900/50 p-1 gap-1">
            <button
              onClick={() => setActiveTab('suggestions')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'suggestions'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Lightbulb className="h-3.5 w-3.5" />
              Smart Alerts ({suggestions.length - approvedIds.length})
            </button>
            <button
              onClick={() => setActiveTab('simulator')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'simulator'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Zap className="h-3.5 w-3.5" />
              Quick Test Bot
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3 min-h-[300px] max-h-[380px]">
            {activeTab === 'suggestions' && (
              <div className="space-y-2.5">
                {suggestions.map((item) => {
                  const isDone = approvedIds.includes(item.id);
                  return (
                    <div
                      key={item.id}
                      className={`p-3 rounded-xl border transition-all text-xs ${
                        isDone
                          ? 'bg-emerald-950/20 border-emerald-500/20 opacity-60'
                          : item.type === 'gap'
                          ? 'bg-slate-900/80 border-amber-500/30 hover:border-amber-500/50'
                          : 'bg-slate-900/80 border-white/10 hover:border-emerald-500/40'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-1.5 font-bold text-slate-200">
                          {item.type === 'gap' && <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />}
                          {item.type === 'lead' && <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />}
                          {item.type === 'insight' && <PhoneCall className="h-3.5 w-3.5 text-cyan-400" />}
                          <span>{item.title}</span>
                        </div>
                        {isDone && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />}
                      </div>

                      <p className="text-[11px] text-slate-400 leading-relaxed mb-2.5">{item.description}</p>

                      {item.suggestedAnswer && !isDone && (
                        <div className="p-2 rounded-lg bg-black/40 border border-white/5 mb-2.5">
                          <p className="text-[10px] text-emerald-400 font-bold uppercase mb-0.5">Proposed AI Reply:</p>
                          <p className="text-[11px] text-slate-300 italic">&ldquo;{item.suggestedAnswer}&rdquo;</p>
                        </div>
                      )}

                      {!isDone && (
                        <div className="flex items-center justify-end gap-2 pt-1">
                          {item.actionHref ? (
                            <Button
                              size="sm"
                              render={<Link href={item.actionHref} />}
                              className="h-7 text-[11px] bg-slate-800 hover:bg-slate-700 text-white border border-white/10 rounded-lg px-2.5"
                            >
                              {item.actionText} <ArrowRight className="h-3 w-3 ml-1" />
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => handleApprove(item.id)}
                              className="h-7 text-[11px] bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold rounded-lg px-3 shadow-md shadow-emerald-500/20"
                            >
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              {item.actionText}
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                <div className="pt-2 text-center">
                  <Link
                    href="/agents"
                    className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 transition-colors inline-flex items-center gap-1"
                  >
                    Open Full Approval Radar & Interviewer →
                  </Link>
                </div>
              </div>
            )}

            {activeTab === 'simulator' && (
              <div className="flex flex-col h-full space-y-2">
                <div className="flex-1 space-y-2 max-h-[250px] overflow-y-auto pr-1">
                  {testMessages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                          msg.sender === 'user'
                            ? 'bg-emerald-600 text-white rounded-br-none'
                            : 'bg-slate-900 border border-white/10 text-slate-200 rounded-bl-none shadow-sm'
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  {isSimulating && (
                    <div className="flex justify-start">
                      <div className="bg-slate-900 border border-white/10 text-emerald-400 text-xs px-3 py-1.5 rounded-xl rounded-bl-none animate-pulse flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-bounce" />
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-bounce [animation-delay:0.2s]" />
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-bounce [animation-delay:0.4s]" />
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-2 flex items-center gap-1.5">
                  <input
                    type="text"
                    value={testInput}
                    onChange={(e) => setTestInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Type test message in Hindi/English..."
                    className="flex-1 bg-slate-900 border border-white/15 rounded-xl px-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!testInput.trim()}
                    className="h-8 w-8 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 flex items-center justify-center transition-all"
                  >
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* FLOATING TRIGGER PILL */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group relative flex items-center gap-2.5 rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 p-1 pl-3 pr-4 shadow-[0_0_30px_rgba(16,185,129,0.4)] hover:shadow-[0_0_40px_rgba(16,185,129,0.6)] text-slate-950 font-bold text-xs transition-all active:scale-95 border border-emerald-300/40"
      >
        <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75" />
          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-400 text-[9px] font-black text-slate-950 items-center justify-center">
            {suggestions.length - approvedIds.length}
          </span>
        </span>
        <div className="h-7 w-7 rounded-full bg-slate-950/20 flex items-center justify-center text-slate-950">
          <Sparkles className="h-4 w-4 group-hover:rotate-12 transition-transform" />
        </div>
        <span className="tracking-tight font-extrabold hidden sm:inline">AI Companion</span>
        <span className="tracking-tight font-extrabold sm:hidden">AI</span>
      </button>
    </div>
  );
}
