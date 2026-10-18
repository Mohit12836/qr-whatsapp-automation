'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Radio,
  Send,
  CheckCircle2,
  ArrowRight,
  Bot,
  Zap,
  CreditCard,
  FileText,
  Users,
  MessageSquare,
  Clock,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
  Flame,
  Check,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ChannelAutomationDemoPage() {
  // Step 1: Channel Setup
  const [channelName, setChannelName] = useState('Surya Solar Wholesale Deals');
  const [channelFollowers, setChannelFollowers] = useState(2450);
  const [productTitle, setProductTitle] = useState('5kW On-Grid Solar System Complete Kit');
  const [dealPrice, setDealPrice] = useState('2,45,000');
  const [tokenAdvance, setTokenAdvance] = useState('24,500');

  // Step state
  const [activeStep, setActiveStep] = useState<1 | 2 | 3 | 4>(1);
  const [isPosting, setIsPosting] = useState(false);
  const [postPublished, setPostPublished] = useState(false);
  const [leadSimulated, setLeadSimulated] = useState(false);
  const [agentProcessing, setAgentProcessing] = useState(false);
  const [dealClosed, setDealClosed] = useState(false);
  const [followupStatus, setFollowupStatus] = useState<'pending' | 'cancelled_replied'>('pending');

  // 1. Publish to Channel
  const handlePublishToChannel = () => {
    setIsPosting(true);
    setTimeout(() => {
      setIsPosting(false);
      setPostPublished(true);
      setActiveStep(2);
    }, 900);
  };

  // 2. Simulate Customer Tap & Lead Entry
  const handleSimulateCustomerTap = () => {
    setLeadSimulated(true);
    setActiveStep(3);
    setAgentProcessing(true);

    // AI steps sequence
    setTimeout(() => {
      setAgentProcessing(false);
      setDealClosed(true);
      setActiveStep(4);
    }, 1800);
  };

  // 3. Customer replies "Paid"
  const handleCustomerReplyPaid = () => {
    setFollowupStatus('cancelled_replied');
  };

  const handleReset = () => {
    setActiveStep(1);
    setPostPublished(false);
    setLeadSimulated(false);
    setAgentProcessing(false);
    setDealClosed(false);
    setFollowupStatus('pending');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8 font-sans selection:bg-emerald-500 selection:text-white">
      {/* Header Banner */}
      <div className="max-w-6xl mx-auto space-y-3 mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
          <Radio className="w-3.5 h-3.5 animate-pulse" />
          Live Interactive Funnel Demo
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
          WhatsApp Channel Automation & AI Sales Closer
        </h1>
        <p className="text-base sm:text-lg text-slate-400 max-w-3xl">
          See how an automated WhatsApp Channel reaches thousands for <span className="text-emerald-400 font-semibold">₹0 cost</span> and 
          funnels warm buyers straight to our autonomous <span className="text-emerald-400 font-semibold">AI Closer</span> to close payment links in seconds.
        </p>
      </div>

      {/* Progress Pipeline */}
      <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <div className={`p-4 rounded-xl border transition-all ${activeStep >= 1 ? 'bg-slate-900 border-emerald-500/50 text-white' : 'bg-slate-900/40 border-slate-800 text-slate-500'}`}>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider mb-1">
            <Radio className="w-4 h-4 text-emerald-400" /> 1. Channel Post
          </div>
          <div className="text-sm font-semibold">{postPublished ? 'Published to 2.4k' : 'Drafting Auto-Post'}</div>
        </div>

        <div className={`p-4 rounded-xl border transition-all ${activeStep >= 2 ? 'bg-slate-900 border-emerald-500/50 text-white' : 'bg-slate-900/40 border-slate-800 text-slate-500'}`}>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider mb-1">
            <Users className="w-4 h-4 text-emerald-400" /> 2. Buyer Inbound
          </div>
          <div className="text-sm font-semibold">{leadSimulated ? 'Customer Tapped CTA' : 'Waiting for Click'}</div>
        </div>

        <div className={`p-4 rounded-xl border transition-all ${activeStep >= 3 ? 'bg-slate-900 border-emerald-500/50 text-white' : 'bg-slate-900/40 border-slate-800 text-slate-500'}`}>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider mb-1">
            <Bot className="w-4 h-4 text-emerald-400" /> 3. AI Fact & Quote
          </div>
          <div className="text-sm font-semibold">{agentProcessing ? 'Agent Reasoning...' : dealClosed ? 'Quote & UPI Link' : 'Standby'}</div>
        </div>

        <div className={`p-4 rounded-xl border transition-all ${activeStep >= 4 ? 'bg-slate-900 border-emerald-500/50 text-white' : 'bg-slate-900/40 border-slate-800 text-slate-500'}`}>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider mb-1">
            <Clock className="w-4 h-4 text-emerald-400" /> 4. Follow-Up Engine
          </div>
          <div className="text-sm font-semibold">{followupStatus === 'cancelled_replied' ? 'Timer Disarmed (Paid)' : 'Armed (48h Auto-Stop)'}</div>
        </div>
      </div>

      {/* Main Split Demo Area */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Control Panel */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="bg-slate-900/80 border-slate-800 text-slate-100 shadow-2xl backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Zap className="w-5 h-5 text-amber-400" /> Automation Control Center
              </CardTitle>
              <CardDescription className="text-slate-400">
                Trigger each step of the automated channel sales machine.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-slate-300">WhatsApp Channel Name</Label>
                <Input
                  value={channelName}
                  onChange={(e) => setChannelName(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-slate-100 focus:border-emerald-500"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold text-slate-300">Featured Offer / Product</Label>
                <Input
                  value={productTitle}
                  onChange={(e) => setProductTitle(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-slate-100 focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-300">Total Price (₹)</Label>
                  <Input
                    value={dealPrice}
                    onChange={(e) => setDealPrice(e.target.value)}
                    className="bg-slate-950 border-slate-800 text-slate-100"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-300">Token Advance (₹)</Label>
                  <Input
                    value={tokenAdvance}
                    onChange={(e) => setTokenAdvance(e.target.value)}
                    className="bg-slate-950 border-slate-800 text-slate-100"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 space-y-3">
                {!postPublished ? (
                  <Button
                    onClick={handlePublishToChannel}
                    disabled={isPosting}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-6 text-base rounded-xl shadow-lg shadow-emerald-950 transition-all cursor-pointer"
                  >
                    {isPosting ? (
                      <span className="flex items-center gap-2">
                        <RefreshCw className="w-5 h-5 animate-spin" /> Publishing to Channel...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5" /> 1. Auto-Post Deal to WhatsApp Channel
                      </span>
                    )}
                  </Button>
                ) : !leadSimulated ? (
                  <Button
                    onClick={handleSimulateCustomerTap}
                    className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-6 text-base rounded-xl shadow-lg shadow-amber-950 transition-all cursor-pointer animate-bounce"
                  >
                    <span className="flex items-center gap-2">
                      <Users className="w-5 h-5" /> 2. Simulate Customer Tapping "Claim Deal"
                    </span>
                  </Button>
                ) : dealClosed && followupStatus === 'pending' ? (
                  <Button
                    onClick={handleCustomerReplyPaid}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-5 text-sm rounded-xl transition-all cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <Check className="w-4 h-4" /> 3. Customer Replies "Paid ₹{tokenAdvance}" (Disarm Followup)
                    </span>
                  </Button>
                ) : (
                  <Button
                    onClick={handleReset}
                    variant="outline"
                    className="w-full border-slate-700 hover:bg-slate-800 text-slate-300 py-4 cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" /> Reset Demo
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Value Summary Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 space-y-3">
            <h3 className="font-bold text-sm text-slate-300 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Commercial Advantages
            </h3>
            <ul className="text-xs text-slate-400 space-y-2">
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>₹0 Meta Costs:</strong> Channel updates cost zero template fees, unlike direct cold WhatsApp broadcasts.</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>0% Ban Risk:</strong> Subscribers willingly follow your channel. WhatsApp never flags or bans channel updates.</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Automated Inbound Closer:</strong> The CTA wa.me link directly routes high-intent buyers to our autonomous sales agent.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Right Column: Visual WhatsApp Channel & Chat Screens */}
        <div className="lg:col-span-7 space-y-6">

          {/* Simulated WhatsApp Channel View */}
          <div className="rounded-3xl border border-slate-800 bg-[#0b141a] overflow-hidden shadow-2xl">
            {/* WhatsApp Channel Header */}
            <div className="bg-[#1f2c34] px-5 py-3.5 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-sm ring-2 ring-emerald-400/30">
                  SS
                </div>
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-slate-100 text-sm">
                    {channelName}
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-none text-[10px] px-1.5 py-0 h-4">
                      Verified
                    </Badge>
                  </div>
                  <div className="text-xs text-slate-400">{channelFollowers.toLocaleString()} followers • Channel</div>
                </div>
              </div>
              <div className="text-xs text-slate-400 flex items-center gap-1">
                <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" /> Public Channel
              </div>
            </div>

            {/* Channel Content Body */}
            <div className="p-4 sm:p-6 space-y-4 min-h-[220px] bg-[#0b141a] bg-opacity-95 bg-[radial-gradient(#1f2c34_1px,transparent_1px)] [background-size:16px_16px]">
              {postPublished ? (
                <div className="max-w-md mx-auto bg-[#1f2c34] rounded-2xl p-4 shadow-xl border border-emerald-500/20 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-semibold text-emerald-400 flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5" /> FLASH WHOLESALE DEAL
                    </span>
                    <span>Today, 10:00 AM</span>
                  </div>

                  <p className="text-sm text-slate-100 leading-relaxed font-medium">
                    ☀️ <strong>{productTitle}</strong> complete kit in stock!<br />
                    💰 Wholesale Price: <strong>₹{dealPrice}</strong> (Subsidy ₹78,000 eligible)<br />
                    ⚡ Only 3 sets remaining at this festive rate.
                  </p>

                  <div className="pt-2">
                    <div className="bg-[#111b21] p-3 rounded-xl border border-slate-700/60 flex items-center justify-between group hover:border-emerald-500 transition-all cursor-pointer">
                      <div className="space-y-0.5">
                        <div className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                          👉 Tap to Claim Deal & Get GST Quote <ArrowRight className="w-3 h-3" />
                        </div>
                        <div className="text-[11px] text-slate-400">wa.me/919876543210?text=I_want_5kw_solar</div>
                      </div>
                      <ExternalLink className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                    <span>❤️ 142 • 👍 89 • 🔥 64</span>
                    <span>Forwarded 34 times</span>
                  </div>
                </div>
              ) : (
                <div className="h-44 flex flex-col items-center justify-center text-center text-slate-500 space-y-2">
                  <Radio className="w-8 h-8 text-slate-700 animate-pulse" />
                  <p className="text-sm">Click "1. Auto-Post Deal to WhatsApp Channel" to trigger AI publisher</p>
                </div>
              )}
            </div>
          </div>

          {/* Simulated Inbound 1-on-1 WhatsApp Chat with AI Closer */}
          {leadSimulated && (
            <div className="rounded-3xl border border-slate-800 bg-[#0b141a] overflow-hidden shadow-2xl animate-in fade-in duration-500">
              {/* WhatsApp Chat Header */}
              <div className="bg-[#1f2c34] px-5 py-3 flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center text-white font-bold text-xs">
                    KV
                  </div>
                  <div>
                    <div className="font-bold text-slate-100 text-sm">Kunal Verma (+91 98765 43210)</div>
                    <div className="text-xs text-emerald-400 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      Inbound from Channel Link • Online
                    </div>
                  </div>
                </div>
                <Badge className="bg-emerald-500/20 text-emerald-400 border-none text-xs">
                  AI Closer Active
                </Badge>
              </div>

              {/* Chat Thread */}
              <div className="p-4 sm:p-5 space-y-3 bg-[#0b141a] min-h-[260px]">
                {/* 1. Customer Message */}
                <div className="flex justify-end">
                  <div className="max-w-md bg-[#005c4b] text-white p-3 rounded-2xl rounded-tr-none text-xs sm:text-sm shadow">
                    Namaste, maine aapke WhatsApp Channel par 5kW Solar ka offer dekha. Mujhe iska quotation aur token booking link chahiye!
                    <div className="text-[10px] text-emerald-200 text-right mt-1">10:02 AM • Read ✓✓</div>
                  </div>
                </div>

                {/* 2. AI Processing Badge */}
                {agentProcessing && (
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 w-fit">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                    <span>Agent reading query, calculating GST quote, generating Razorpay link...</span>
                  </div>
                )}

                {/* 3. AI Closer Response */}
                {dealClosed && (
                  <div className="flex justify-start space-y-2 flex-col max-w-lg">
                    <div className="bg-[#202c33] text-slate-100 p-4 rounded-2xl rounded-tl-none text-xs sm:text-sm shadow space-y-2 border border-slate-700/60">
                      <div className="font-semibold text-emerald-400 flex items-center gap-1.5 text-xs">
                        <Bot className="w-4 h-4" /> Vismart AI Sales Executive (Instant Auto-Reply)
                      </div>
                      <p>
                        Namaste Kunal ji! 🙏 Aapka <strong>{productTitle}</strong> ka official quotation taiyar hai:
                      </p>

                      <div className="bg-[#111b21] p-2.5 rounded-xl border border-slate-800 text-xs font-mono space-y-1">
                        <div>📋 <strong>Estimate No:</strong> QT-2026-8492</div>
                        <div>📦 <strong>Item:</strong> 5kW Solar Panels + 5kW On-Grid Inverter</div>
                        <div>💰 <strong>Total Price:</strong> ₹{dealPrice} (incl. 18% GST)</div>
                        <div className="text-emerald-400 font-bold">⚡ 10% Booking Token: ₹{tokenAdvance}</div>
                      </div>

                      <p>
                        Aap niche diye gaye official UPI payment link se booking token confirm kar sakte hain:
                      </p>

                      <div className="bg-emerald-950/40 p-3 rounded-xl border border-emerald-500/30 flex items-center justify-between">
                        <div>
                          <div className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                            <CreditCard className="w-3.5 h-3.5" /> Pay ₹{tokenAdvance} via UPI / Razorpay
                          </div>
                          <div className="text-[10px] text-slate-400">https://rzp.io/l/test_plink_solar_token</div>
                        </div>
                        <Badge className="bg-emerald-500 text-slate-950 font-bold text-[10px]">PAY NOW</Badge>
                      </div>

                      <p className="text-xs text-slate-400">
                        Payment confirm hote hi hamare technical engineer kal dopahar site inspection ke liye pahuchenge.
                      </p>

                      <div className="text-[10px] text-slate-500 text-right">10:02 AM • Delivered ✓✓</div>
                    </div>

                    {/* Follow-up Status Pill */}
                    <div className="text-xs text-slate-400 flex items-center gap-2 px-2">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      <span>
                        Automated Follow-up Engine:{' '}
                        {followupStatus === 'cancelled_replied' ? (
                          <strong className="text-emerald-400">CANCELLED (Customer Paid & Replied)</strong>
                        ) : (
                          <strong className="text-amber-400">Scheduled for 48 Hours (+2 Days)</strong>
                        )}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
