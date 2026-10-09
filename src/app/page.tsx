'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Bot,
  Sparkles,
  Zap,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  MessageSquare,
  DollarSign,
  TrendingUp,
  CreditCard,
  Mic,
  Brain,
  Sliders,
  Calendar,
  Star,
  Users,
  Building2,
  Sun,
  Stethoscope,
  GraduationCap,
  ShoppingBag,
  Send,
  RefreshCcw,
  ChevronDown,
  Lock,
  PhoneCall,
  Flame,
  Award,
  Crown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export default function LandingPage() {
  // Industry Demo Roleplay Selector
  const [selectedIndustry, setSelectedIndustry] = useState<'solar' | 'clinic' | 'coaching' | 'realestate' | 'retail'>('solar');

  // Interactive Live Chat Simulator State
  const [demoMessages, setDemoMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string }>>([
    { sender: 'user', text: 'Namaste, mujhe ghar ke liye 3kW solar rooftop lagwana hai. Kitna kharcha aayega?' },
    {
      sender: 'ai',
      text: 'Namaste! 🙏 Surya Solar me aapka swagat hai. 3kW Solar Rooftop system ka total cost approx ₹1,65,000 aata hai. Isme PM Surya Ghar Yojana ke tehat ₹78,000 seedha aapke bank account me DBT Subsidy aayegi, to aapka net kharcha sirf ₹87,000 rahega!\n\nKya aapki chhat par 300 sq.ft shadow-free jagah available hai? Humare engineer kal free site survey ke liye aa sakte hain.',
    },
  ]);
  const [demoInput, setDemoInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // ROI Calculator State
  const [dailyLeads, setDailyLeads] = useState(40);
  const avgOrderValue = 15000;
  const estimatedExtraSales = Math.round((dailyLeads * 30 * 0.12 * avgOrderValue) / 1000); // 12% extra conversion in thousands

  // Handle live test chat simulation
  const handleSendDemoMessage = () => {
    if (!demoInput.trim()) return;
    const userMsg = demoInput;
    setDemoMessages((prev) => [...prev, { sender: 'user', text: userMsg }]);
    setDemoInput('');
    setIsTyping(true);

    setTimeout(() => {
      let reply = '';
      const lower = userMsg.toLowerCase();
      if (lower.includes('discount') || lower.includes('kam') || lower.includes('offer')) {
        reply = 'Sir, agar aap aaj apna slot hold karte hain, to hum special festival discount ke sath ₹5,000 ka extra cashback voucher de rahe hain! Kya main aapka ₹999 refundable token link bhej doon?';
      } else if (lower.includes('site') || lower.includes('survey') || lower.includes('book') || lower.includes('visit')) {
        reply = 'Bilkul! Humare certified solar engineer kal dopahar 12:00 PM ya sham 4:00 PM par visit kar sakte hain. Kripya apna address confirm kijiye.';
      } else if (lower.includes('pay') || lower.includes('upi') || lower.includes('link') || lower.includes('token')) {
        reply = 'Ye lijiye aapka secure UPI booking link: https://rzp.io/l/solar-token-999. Pay karne ke baad screenshot bhejne ki zarurat nahi hai, system automatically confirm kar lega! 🎉';
      } else {
        reply = 'Ji bilkul! Iske bare me humare paas complete details hain. Aapka monthly electricity bill lagbhag kitna aata hai, taaki hum exact capacity calculate kar sakein?';
      }

      setDemoMessages((prev) => [...prev, { sender: 'ai', text: reply }]);
      setIsTyping(false);
    }, 850);
  };

  // Switch demo industry
  const switchIndustry = (ind: 'solar' | 'clinic' | 'coaching' | 'realestate' | 'retail') => {
    setSelectedIndustry(ind);
    if (ind === 'solar') {
      setDemoMessages([
        { sender: 'user', text: 'Hi, 3kW solar ka quote chahiye.' },
        {
          sender: 'ai',
          text: 'Namaste! 🙏 3kW system par ₹78,000 Govt Subsidy ke baad net cost sirf ₹87,000 aayegi. Har mahine ₹3,500 tak bill bachega! Kya kal free site visit schedule karein?',
        },
      ]);
    } else if (ind === 'clinic') {
      setDemoMessages([
        { sender: 'user', text: 'Doctor sahab ka Sunday OPD timing kya hai?' },
        {
          sender: 'ai',
          text: 'Namaste! 🩺 Dr. Sharma Sunday ko subah 10:00 AM se 1:00 PM tak available hain. Appointments limited hain. Kya main aapke liye 11:30 AM ka slot book kar doon?',
        },
      ]);
    } else if (ind === 'coaching') {
      setDemoMessages([
        { sender: 'user', text: 'JEE Dropper batch ki fees kitni hai?' },
        {
          sender: 'ai',
          text: 'Hello! 🎓 Apex Academy ke JEE 2027 Dropper batch ki annual fees ₹65,000 hai (Printed Books + All India Test Series included). Top 50 students ke liye 20% scholarship test kal hai. Kya aap register karna chahte hain?',
        },
      ]);
    } else if (ind === 'realestate') {
      setDemoMessages([
        { sender: 'user', text: '3 BHK flat in Prime City ka brochure bhejo.' },
        {
          sender: 'ai',
          text: 'Namaste! 🏢 Prime Grandeur me 3 BHK luxury apartments ₹72 Lakh se start hain (Clubhouse + 2 Car Parking). Brochure download link: https://vismart.cloud/brochure/prime-3bhk.pdf. Kya aap weekend par sample flat visit karna chahenge?',
        },
      ]);
    } else {
      setDemoMessages([
        { sender: 'user', text: 'Sony 55 inch 4K TV available hai?' },
        {
          sender: 'ai',
          text: 'Ji haan! 📺 Sony Bravia 55" 4K Google TV stock me available hai. Market price ₹58,990 hai, par aaj hamare store par exclusive festive deal me ₹52,490 + No Cost EMI mil rahi hai. Kya main booking link share kar doon?',
        },
      ]);
    }
  };

  return (
    <div className="min-h-screen bg-[#05070D] text-slate-100 selection:bg-emerald-500/30 overflow-x-hidden relative">
      {/* ============================================================
          DYNAMIC AURORA MESH BACKGROUND GLOW ORBS
          ============================================================ */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {/* Orb 1: Neon Emerald (Top Left) */}
        <div className="absolute -top-[15%] -left-[10%] w-[550px] h-[550px] rounded-full bg-gradient-to-br from-emerald-500/20 via-teal-500/10 to-transparent blur-[130px] animate-aurora" />
        {/* Orb 2: Hyper Violet & Indigo (Top Right) */}
        <div className="absolute top-[5%] -right-[15%] w-[600px] h-[600px] rounded-full bg-gradient-to-bl from-violet-600/25 via-indigo-500/15 to-transparent blur-[140px] animate-aurora" style={{ animationDelay: '-4s' }} />
        {/* Orb 3: Radiant Amber Glow (Center) */}
        <div className="absolute top-[45%] left-[25%] w-[450px] h-[450px] rounded-full bg-gradient-to-tr from-amber-500/15 via-rose-500/10 to-transparent blur-[130px] animate-aurora" style={{ animationDelay: '-8s' }} />
        {/* Orb 4: Electric Cyan (Bottom Right) */}
        <div className="absolute bottom-[10%] right-[10%] w-[500px] h-[500px] rounded-full bg-gradient-to-tl from-cyan-500/20 via-emerald-500/10 to-transparent blur-[130px] animate-aurora" style={{ animationDelay: '-6s' }} />
      </div>

      <div className="relative z-10">
        {/* 1. TOP ANNOUNCEMENT BAR */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-500 via-indigo-600 to-emerald-600 bg-[length:200%_auto] animate-gradient-x px-4 py-2 text-center text-xs font-bold text-white shadow-lg shadow-emerald-500/10">
          <span className="inline-flex items-center gap-1.5">
            <Flame className="h-4 w-4 text-amber-300 animate-bounce" />
            Launch Special: Get Your Full 24/7 AI Sales Employee for just ₹99 (7-Day Risk-Free Trial)
          </span>
          <Link href="/pay/trial" className="ml-2.5 underline font-extrabold hover:text-amber-200 transition-colors">
            Claim ₹99 Trial Now →
          </Link>
        </div>

        {/* 2. NAVIGATION HEADER */}
        <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#05070D]/80 backdrop-blur-2xl">
          <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-500 text-slate-950 font-black shadow-lg shadow-emerald-500/30 group-hover:scale-105 transition-transform">
                <Bot className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold tracking-tight text-white sm:text-lg leading-tight flex items-center gap-1">
                  Vismart <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">AI Suite</span>
                </span>
                <span className="text-[10px] font-semibold text-emerald-400/80 uppercase tracking-widest">
                  Autonomous Sales Engine
                </span>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-300">
              <a href="#demo" className="transition-colors hover:text-emerald-400">
                Live Roleplay Demo
              </a>
              <Link href="/onboarding" className="transition-colors text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5 text-emerald-400 animate-spin" />
                Self-Driving Setup
              </Link>
              <a href="#features" className="transition-colors hover:text-emerald-400">
                AI Superpowers
              </a>
              <a href="#industries" className="transition-colors hover:text-emerald-400">
                Industries
              </a>
              <a href="#pricing" className="transition-colors hover:text-emerald-400">
                Pricing
              </a>
              <a href="#calculator" className="transition-colors hover:text-emerald-400">
                ROI Calculator
              </a>
            </nav>

            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                href="/login"
                className="text-sm font-semibold text-slate-300 hover:text-white transition-colors px-2 sm:px-3 py-1.5"
              >
                Sign In
              </Link>
              <Button
                render={<Link href="/onboarding" />}
                className="bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 rounded-xl text-xs sm:text-sm font-extrabold shadow-lg shadow-emerald-500/25 active:scale-95 transition-all"
              >
                Guided Setup ⚡
              </Button>
            </div>
          </div>
        </header>

        {/* 3. HERO SECTION */}
        <section className="relative overflow-hidden pt-14 pb-20 md:pt-24 md:pb-28">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 relative z-10">
            <div className="text-center max-w-4xl mx-auto space-y-6">
              {/* Floating Magic Chip */}
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-bold text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.2)] animate-float-slow">
                <Sparkles className="h-4 w-4 text-emerald-400 animate-spin" />
                <span>Next-Gen Autonomous AI Sales Employee • Zero Human Staff Needed</span>
              </div>

              {/* Shimmering Dynamic Headline */}
              <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight text-white leading-[1.12]">
                Hire a 24/7 WhatsApp{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-300 via-violet-400 to-emerald-400 bg-[length:200%_auto] animate-gradient-x">
                  AI Sales Employee
                </span>{' '}
                That Closes Deals While You Sleep.
              </h1>

              <p className="text-sm sm:text-base md:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
                Not a basic FAQ bot. An autonomous sales closer with infinite memory, Hinglish conversation mastery, daily 8 PM voice interviews, and instant Razorpay UPI closing.
              </p>

              {/* Dual Action Glowing Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                <Button
                  size="lg"
                  render={<Link href="/onboarding" />}
                  className="w-full sm:w-auto h-13 px-9 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 text-slate-950 rounded-2xl text-base font-extrabold shadow-[0_0_35px_rgba(16,185,129,0.4)] active:scale-95 transition-all gap-2 animate-pulse-glow"
                >
                  Start Guided Setup (2 Mins) <ArrowRight className="h-5 w-5" />
                </Button>

                <Button
                  size="lg"
                  render={<Link href="/pay/trial" />}
                  className="w-full sm:w-auto h-13 px-7 rounded-2xl border border-white/20 bg-slate-900/80 hover:bg-slate-800 text-white font-bold text-sm backdrop-blur-xl transition-all shadow-lg hover:border-emerald-500/40"
                >
                  <CreditCard className="h-4 w-4 mr-2 text-cyan-400" />
                  Activate ₹99 Trial
                </Button>
              </div>

              {/* Trust Badges */}
              <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 pt-6 text-xs font-medium text-slate-400">
                <span className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" /> Official Cloud API (Zero Ban)
                </span>
                <span className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-cyan-400" /> Razorpay UPI AutoPay
                </span>
                <span className="flex items-center gap-2">
                  <Brain className="h-4 w-4 text-amber-400" /> Human-in-the-Loop Approval Radar
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* 4. INTERACTIVE LIVE WHATSAPP ROLEPLAY DEMO (#demo) */}
        <section id="demo" className="py-20 relative">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
              <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-xs font-bold px-3 py-1">
                Interactive Test Chamber
              </Badge>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
                Experience Your AI Sales Employee Live
              </h2>
              <p className="text-xs sm:text-sm text-slate-300">
                Select an industry below and chat with the AI in real time right in your browser.
              </p>
            </div>

            {/* Industry Selector Tabs */}
            <div className="flex flex-wrap justify-center gap-2.5 mb-8">
              {[
                { id: 'solar', label: '☀️ Solar Rooftop Solutions' },
                { id: 'clinic', label: '🏥 Doctor & Dental Clinic' },
                { id: 'coaching', label: '🎓 JEE & NEET Coaching' },
                { id: 'realestate', label: '🏢 Real Estate & Plots' },
                { id: 'retail', label: '🛍️ Electronics & Retail' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => switchIndustry(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    selectedIndustry === tab.id
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-lg shadow-emerald-500/30 scale-105'
                      : 'bg-slate-900/80 border border-white/10 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Glowing Border Beam Chat Mockup */}
            <div className="max-w-xl mx-auto rounded-3xl p-1 magic-border-beam shadow-[0_0_50px_rgba(16,185,129,0.25)]">
              <div className="rounded-[22px] bg-[#0A0E1A] overflow-hidden flex flex-col h-[530px]">
                {/* WhatsApp Top Bar */}
                <div className="bg-emerald-900/90 border-b border-emerald-700/50 px-4 py-3 text-white flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-emerald-400 text-slate-950 font-black shadow-md">
                      <Bot className="h-5 w-5" />
                      <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-300 ring-2 ring-emerald-900 animate-pulse" />
                    </div>
                    <div>
                      <p className="text-sm font-bold leading-tight">Vismart AI Sales Closer</p>
                      <p className="text-[10px] text-emerald-200">Online 24/7 • Instant ₹999 Token Closer</p>
                    </div>
                  </div>
                  <Badge className="bg-emerald-500 text-slate-950 font-extrabold text-[10px] border-none">
                    Live Demo
                  </Badge>
                </div>

                {/* Chat Conversation Body */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#080C16] text-xs">
                  {demoMessages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl p-3 leading-relaxed shadow-sm whitespace-pre-line ${
                          msg.sender === 'user'
                            ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-br-none'
                            : 'bg-slate-900 text-slate-100 border border-white/10 rounded-bl-none'
                        }`}
                      >
                        {msg.text}
                      </div>
                      <span className="text-[9px] text-slate-400 px-1 mt-0.5">
                        {msg.sender === 'user' ? 'You (Customer)' : 'AI Sales Closer'}
                      </span>
                    </div>
                  ))}

                  {isTyping && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-300 bg-slate-900 border border-white/10 p-2.5 rounded-2xl w-fit">
                      <Sparkles className="h-3.5 w-3.5 animate-spin text-emerald-400" />
                      AI is formulating best offer &amp; reply...
                    </div>
                  )}
                </div>

                {/* Quick Test Prompt Chips */}
                <div className="px-3 py-2 bg-slate-950 border-t border-white/10 flex gap-2 overflow-x-auto text-[10px]">
                  <span className="text-slate-400 shrink-0 py-0.5 font-medium">Try asking:</span>
                  <button
                    type="button"
                    onClick={() => setDemoInput('Kuch discount ya cashback offer milega?')}
                    className="bg-slate-900 border border-white/10 px-2.5 py-1 rounded-lg text-slate-200 hover:bg-slate-800 shrink-0"
                  >
                    &quot;Discount milega?&quot;
                  </button>
                  <button
                    type="button"
                    onClick={() => setDemoInput('Site visit kab schedule kar sakte hain?')}
                    className="bg-slate-900 border border-white/10 px-2.5 py-1 rounded-lg text-slate-200 hover:bg-slate-800 shrink-0"
                  >
                    &quot;Site visit book karo&quot;
                  </button>
                  <button
                    type="button"
                    onClick={() => setDemoInput('Advance pay karne ka UPI link bhejo')}
                    className="bg-slate-900 border border-white/10 px-2.5 py-1 rounded-lg text-slate-200 hover:bg-slate-800 shrink-0"
                  >
                    &quot;UPI link bhejo&quot;
                  </button>
                </div>

                {/* Chat Input Bar */}
                <div className="p-3 border-t border-white/10 bg-[#0A0E1A] shrink-0 flex items-center gap-2">
                  <Input
                    placeholder="Type customer query (e.g. Kya discount milega?)..."
                    value={demoInput}
                    onChange={(e) => setDemoInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendDemoMessage()}
                    className="h-10 rounded-xl text-xs bg-slate-900 border-white/10 text-white placeholder:text-slate-500"
                  />
                  <Button
                    onClick={handleSendDemoMessage}
                    className="h-10 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl shrink-0"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 5. SIX CORE SUPERPOWERS (BENTO GRID WITH GLASS GLOW) */}
        <section id="features" className="py-24 relative">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto mb-16 space-y-2">
              <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/40 text-xs font-bold px-3 py-1">
                Autonomous Intelligence
              </Badge>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
                Why Traditional Chatbots Fail &amp; Vismart Wins
              </h2>
              <p className="text-xs sm:text-sm text-slate-300">
                Engineered specifically for Indian businesses to eliminate manual labor and convert inbound chats into paid bank orders.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Card 1: Human-in-the-Loop Radar */}
              <div className="glass-card-glow rounded-3xl p-6 relative overflow-hidden group">
                <div className="h-12 w-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20 mb-4 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
                  <Brain className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">
                  Human-in-the-Loop AI Brain Radar
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  AI extracts new pricing &amp; timing rules from your chats, but <strong className="text-white">never sets any rule live without your 1-click approval</strong>. Zero hallucinations guaranteed.
                </p>
              </div>

              {/* Card 2: Daily Voice Interviewer */}
              <div className="glass-card-glow rounded-3xl p-6 relative overflow-hidden group">
                <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20 mb-4 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                  <Mic className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">
                  Daily 8 PM WhatsApp Voice Interviewer
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  No confusing dashboard forms! AI asks you 3 quick questions on WhatsApp daily via voice notes to learn today&apos;s stock, prices, and offers.
                </p>
              </div>

              {/* Card 3: Dynamic Razorpay UPI Links */}
              <div className="glass-card-glow rounded-3xl p-6 relative overflow-hidden group">
                <div className="h-12 w-12 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20 mb-4 shadow-[0_0_20px_rgba(6,182,212,0.2)]">
                  <CreditCard className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">
                  Dynamic UPI Payment Links in Chat
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Generates instant ₹999 booking token links or full invoice UPI links directly inside the WhatsApp conversation with webhook auto-confirmation.
                </p>
              </div>

              {/* Card 4: 1-Click AI Agent Marketplace */}
              <div className="glass-card-glow rounded-3xl p-6 relative overflow-hidden group">
                <div className="h-12 w-12 rounded-2xl bg-violet-500/10 text-violet-400 flex items-center justify-center border border-violet-500/20 mb-4 shadow-[0_0_20px_rgba(139,92,246,0.2)]">
                  <Sliders className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">
                  App-Store Style 1-Click Agent Toggles
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Toggle on specialized AI agents: Sales Closer, Doctor Booking, 24h Abandoned Lead Recovery, Hindi Voice Note Transcriber, and Review Collector.
                </p>
              </div>

              {/* Card 5: Infinite Episodic Memory */}
              <div className="glass-card-glow rounded-3xl p-6 relative overflow-hidden group">
                <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20 mb-4 shadow-[0_0_20px_rgba(99,102,241,0.2)]">
                  <MessageSquare className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">
                  Infinite Long-Term Customer Memory
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Vector database remembers what customer discussed 3 months ago: their roof size, previous purchases, budget, and future expansion signals.
                </p>
              </div>

              {/* Card 6: Zero-Ban Official Meta API */}
              <div className="glass-card-glow rounded-3xl p-6 relative overflow-hidden group">
                <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20 mb-4 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">
                  Official Meta Cloud API (Zero Ban)
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  100% compliant with WhatsApp Business Cloud API. Your business number will never be banned unlike unofficial scraper tools.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 6. INTERACTIVE ROI REVENUE CALCULATOR (#calculator) */}
        <section id="calculator" className="py-20 relative">
          <div className="container mx-auto max-w-4xl px-4 sm:px-6">
            <div className="glass-card-glow rounded-3xl p-6 sm:p-10 border border-white/10 shadow-2xl">
              <div className="text-center space-y-2 mb-8">
                <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-xs font-bold px-3 py-1">
                  Revenue Growth Calculator
                </Badge>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                  How Much Extra Money Will Your AI Closer Make?
                </h2>
                <p className="text-xs sm:text-sm text-slate-300">
                  Calculate the revenue recovered from night inquiries (8 PM - 9 AM) and automated 24h discount follow-ups.
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-2 text-sm font-bold text-white">
                    <span>Inbound WhatsApp Inquiries Per Day:</span>
                    <span className="text-emerald-400 font-extrabold text-base">{dailyLeads} Inquiries/Day</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="200"
                    step="5"
                    value={dailyLeads}
                    onChange={(e) => setDailyLeads(Number(e.target.value))}
                    className="w-full accent-emerald-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                    <span>10 Leads</span>
                    <span>100 Leads</span>
                    <span>200 Leads/Day</span>
                  </div>
                </div>

                <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-cyan-500/15 p-6 text-center space-y-2 shadow-inner">
                  <p className="text-xs uppercase tracking-wider font-extrabold text-emerald-400">
                    Estimated Extra Monthly Revenue Closed by AI
                  </p>
                  <p className="text-3xl sm:text-5xl font-black text-white">
                    ₹{estimatedExtraSales.toLocaleString()},000
                    <span className="text-sm sm:text-base font-normal text-slate-300"> /month</span>
                  </p>
                  <p className="text-xs text-slate-300">
                    Based on standard 12% additional closing rate from instant 24/7 replies and automated Razorpay UPI links.
                  </p>
                </div>

                <div className="text-center pt-2">
                  <Button
                    size="lg"
                    render={<Link href="/pay/trial" />}
                    className="bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 text-slate-950 rounded-2xl text-sm font-extrabold px-9 py-3 shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:scale-105 active:scale-95 transition-all"
                  >
                    Start ₹99 Trial &amp; Recover Your Leads ⚡
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 7. TRANSPARENT PRICING GRID (#pricing) */}
        <section id="pricing" className="py-24 relative">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto mb-16 space-y-2">
              <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-xs font-bold px-3 py-1">
                Transparent Plans
              </Badge>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
                Invest in an AI Employee for 1/10th the Cost of a Human
              </h2>
              <p className="text-xs sm:text-sm text-slate-300">
                No salary, no holidays, no commission disputes. Starts at just ₹99 for a full 7-day test.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
              {/* PLAN 1: 7-DAY TRIAL */}
              <div className="glass-card-glow rounded-3xl p-6 flex flex-col justify-between">
                <div>
                  <Badge variant="outline" className="text-xs font-bold border-white/20 text-slate-300 mb-3">
                    7-Day Risk-Free Trial
                  </Badge>
                  <h3 className="text-xl font-bold text-white">Starter Test Drive</h3>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-4xl font-black text-white">₹99</span>
                    <span className="text-xs text-slate-400">for 7 days</span>
                  </div>
                  <p className="text-xs text-slate-300 mt-2">
                    Test your AI Sales Closer on your own WhatsApp number with full features.
                  </p>

                  <div className="mt-6 space-y-3 text-xs text-slate-300 border-t border-white/10 pt-5">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                      <span>1 Active AI Sales Closer Agent</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                      <span>Daily 8 PM Voice Interviewer</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                      <span>Razorpay UPI Payment Link Generation</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                      <span>Human-in-the-Loop Approval Radar</span>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-4">
                  <Button
                    render={<Link href="/pay/trial" />}
                    className="w-full bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold py-2.5 border border-white/15"
                  >
                    Start ₹99 Trial Now
                  </Button>
                </div>
              </div>

              {/* PLAN 2: PRO AI CLOSER (FEATURED WITH MAGIC BORDER BEAM) */}
              <div className="magic-border-beam rounded-3xl p-1 shadow-[0_0_50px_rgba(16,185,129,0.3)]">
                <div className="rounded-[22px] bg-[#0C1222] p-6 flex flex-col justify-between h-full relative">
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-emerald-400 to-cyan-400 text-slate-950 px-4 py-1 rounded-full text-[11px] font-black uppercase tracking-wider shadow-lg">
                    Most Popular for Indian SMBs
                  </div>

                  <div>
                    <Badge className="bg-emerald-500/20 text-emerald-300 border-none text-xs font-bold mb-3 mt-1">
                      Monthly Growth
                    </Badge>
                    <h3 className="text-xl font-extrabold text-white">Pro AI Sales Closer</h3>
                    <div className="mt-4 flex items-baseline gap-1">
                      <span className="text-4xl font-black text-white">₹1,499</span>
                      <span className="text-xs text-slate-400">/month (AutoPay)</span>
                    </div>
                    <p className="text-xs text-slate-300 mt-2">
                      Complete autonomous sales suite for active shops, clinics, and solar installers.
                    </p>

                    <div className="mt-6 space-y-3 text-xs text-slate-200 border-t border-white/10 pt-5">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                        <span><strong>Unlimited</strong> AI Sales &amp; Booking Agents</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                        <span>24h Abandoned Lead Recovery Bot</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                        <span>Hindi Voice Note Transcription &amp; Reply</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                        <span>Custom Discount Negotiation Slider</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                        <span>Unlimited WhatsApp Contacts &amp; Broadcasts</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 pt-4">
                    <Button
                      render={<Link href="/pay/trial" />}
                      className="w-full bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 text-slate-950 font-black rounded-xl text-xs py-3 shadow-lg shadow-emerald-500/30"
                    >
                      Activate Pro via ₹99 Trial ⚡
                    </Button>
                  </div>
                </div>
              </div>

              {/* PLAN 3: ENTERPRISE VIP */}
              <div className="glass-card-glow rounded-3xl p-6 flex flex-col justify-between">
                <div>
                  <Badge variant="outline" className="text-xs font-bold border-white/20 text-slate-300 mb-3">
                    Custom Multi-Branch
                  </Badge>
                  <h3 className="text-xl font-bold text-white">Enterprise VIP</h3>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-4xl font-black text-white">₹3,999</span>
                    <span className="text-xs text-slate-400">/month</span>
                  </div>
                  <p className="text-xs text-slate-300 mt-2">
                    For coaching franchises, multi-doctor hospitals, and real estate developer firms.
                  </p>

                  <div className="mt-6 space-y-3 text-xs text-slate-300 border-t border-white/10 pt-5">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-cyan-400 shrink-0" />
                      <span>Multi-Branch Number Routing</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-cyan-400 shrink-0" />
                      <span>Dedicated Relationship Manager</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-cyan-400 shrink-0" />
                      <span>Custom ERP / CRM Webhook Sync</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-cyan-400 shrink-0" />
                      <span>Zero Transaction Commission Rate</span>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-4">
                  <Button
                    render={<Link href="/pay/trial" />}
                    variant="outline"
                    className="w-full rounded-xl text-xs font-bold py-2.5 border-white/20 hover:bg-slate-800 text-white"
                  >
                    Contact Enterprise Team
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 8. FOOTER */}
        <footer className="border-t border-white/10 bg-[#030508] py-14 text-xs text-slate-400">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 text-slate-950 font-bold">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <p className="font-bold text-white">Jain Digital Service India Vismart</p>
                <p className="text-[10px] text-emerald-400 font-mono">UDYAM-MP-37-0000236 • Official Meta Tech Platform</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-6">
              <a href="/company.html" className="hover:text-emerald-400 transition-colors">Entity Profile</a>
              <a href="/privacy.html" className="hover:text-emerald-400 transition-colors">Privacy Policy</a>
              <a href="/terms.html" className="hover:text-emerald-400 transition-colors">Terms of Service</a>
              <Link href="/login" className="hover:text-emerald-400 transition-colors">Sign In</Link>
              <Link href="/pay/trial" className="hover:text-emerald-400 transition-colors">₹99 Trial Checkout</Link>
            </div>

            <p className="text-[11px] text-right">
              &copy; {new Date().getFullYear()} Jain Digital Service India Vismart.<br />
              All rights reserved. Built with Official Meta Cloud API.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
