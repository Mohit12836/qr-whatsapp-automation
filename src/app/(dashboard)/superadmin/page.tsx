'use client';

import React, { useState } from 'react';
import {
  ShieldAlert, Sparkles, Users, DollarSign, TrendingUp, Activity,
  Sliders, Gift, Eye, Send, CheckCircle2, Lock, Search, Zap,
  Building2, Globe, Wallet, AlertTriangle, XCircle, RefreshCw,
  ToggleLeft, ToggleRight, Cpu, MessageSquare, TrendingDown,
  Crown, BadgeCheck, Ban, Pause, Play, Edit, ChevronDown, ChevronUp,
  Radio, Plus, ExternalLink, Siren, ShieldCheck, IndianRupee,
  BarChart3, Boxes, Layers,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/use-auth';
import Link from 'next/link';
import { cn } from '@/lib/utils';

// ─────────────────────────── TYPES ───────────────────────────

type TenantTier = 'Trial' | 'Starter' | 'Pro' | 'VIP' | 'B2B-Enterprise';
type TenantStatus = 'active' | 'trial' | 'paused' | 'quarantined' | 'suspended';
type WACAHealth = 'GREEN' | 'YELLOW' | 'RED';
type BusinessMode = 'B2C' | 'B2B';

interface Tenant {
  id: string;
  name: string;
  ownerPhone: string;
  industry: string;
  city: string;
  mode: BusinessMode;
  tier: TenantTier;
  walletBalance: number;
  totalChatsToday: number;
  monthlyRevenue: string;
  status: TenantStatus;
  wacaHealth: WACAHealth;
  domain?: string;
  botPaused: boolean;
}

interface Brand {
  id: string;
  name: string;
  targetIndustry: string;
  domain: string;
  theme: string;
  status: 'live' | 'draft' | 'paused';
  clients: number;
  monthlyRevenue: string;
}

interface CEOCommand {
  id: string;
  command: string;
  result: string;
  timestamp: string;
  status: 'success' | 'pending' | 'error';
}

// ─────────────────────────── MOCK DATA ───────────────────────────

const INITIAL_TENANTS: Tenant[] = [
  { id: '1', name: 'Sharma Electronics & Appliances', ownerPhone: '+91 98931 23456', industry: 'Retail & Electronics', city: 'Indore', mode: 'B2C', tier: 'Pro', walletBalance: 1840, totalChatsToday: 142, monthlyRevenue: '₹2,40,000', status: 'active', wacaHealth: 'GREEN', domain: 'sharma-electro.vismart.ai', botPaused: false },
  { id: '2', name: 'Apex NEET & JEE Academy', ownerPhone: '+91 98260 54321', industry: 'Coaching Institute', city: 'Kota', mode: 'B2C', tier: 'VIP', walletBalance: 6200, totalChatsToday: 380, monthlyRevenue: '₹5,80,000', status: 'active', wacaHealth: 'GREEN', domain: 'apexacademy.vismart.ai', botPaused: false },
  { id: '3', name: 'Anand Textiles Pvt Ltd', ownerPhone: '+91 94250 99887', industry: 'Textile Manufacturing', city: 'Surat', mode: 'B2B', tier: 'B2B-Enterprise', walletBalance: 12400, totalChatsToday: 95, monthlyRevenue: '₹8,20,000', status: 'active', wacaHealth: 'GREEN', domain: 'sales.anandtextiles.com', botPaused: false },
  { id: '4', name: 'Dr. Smile Dental & Implant Clinic', ownerPhone: '+91 97555 11223', industry: 'Healthcare & Clinic', city: 'Bhopal', mode: 'B2C', tier: 'Trial', walletBalance: 150, totalChatsToday: 48, monthlyRevenue: '₹65,000', status: 'trial', wacaHealth: 'YELLOW', domain: 'drsmile.vismart.ai', botPaused: false },
  { id: '5', name: 'Royal Prime Properties', ownerPhone: '+91 99810 44556', industry: 'Real Estate', city: 'Pune', mode: 'B2C', tier: 'VIP', walletBalance: 3900, totalChatsToday: 210, monthlyRevenue: '₹14,50,000', status: 'active', wacaHealth: 'GREEN', domain: 'royalprime.vismart.ai', botPaused: false },
  { id: '6', name: 'Morbi Tiles & Ceramics Co.', ownerPhone: '+91 96870 33214', industry: 'Manufacturing (Tiles)', city: 'Morbi', mode: 'B2B', tier: 'B2B-Enterprise', walletBalance: 9800, totalChatsToday: 63, monthlyRevenue: '₹22,00,000', status: 'active', wacaHealth: 'RED', domain: 'quote.morbitiles.com', botPaused: true },
];

const INITIAL_BRANDS: Brand[] = [
  { id: 'b1', name: 'ClinicSmart AI', targetIndustry: 'Doctors & Clinics', domain: 'clinicsmart.vismart.ai', theme: 'Medical Blue', status: 'live', clients: 24, monthlyRevenue: '₹1,80,000' },
  { id: 'b2', name: 'TextileBot AI', targetIndustry: 'Textile Manufacturers', domain: 'textilebot.vismart.ai', theme: 'Fabric Green', status: 'live', clients: 18, monthlyRevenue: '₹3,60,000' },
  { id: 'b3', name: 'EstatesCloser AI', targetIndustry: 'Real Estate Brokers', domain: 'estatescloser.vismart.ai', theme: 'Property Gold', status: 'live', clients: 31, monthlyRevenue: '₹4,80,000' },
  { id: 'b4', name: 'FactoryQuote AI', targetIndustry: 'B2B Manufacturers', domain: 'factoryquote.vismart.ai', theme: 'Steel Grey', status: 'draft', clients: 0, monthlyRevenue: '₹0' },
];

const CEO_LOG: CEOCommand[] = [
  { id: 'c1', command: 'Morbi Tiles ke WhatsApp number ka bot pauz karo kyonki RED rating aayi hai', result: 'Bot paused. WACA auto-throttle activated. Owner alert sent.', timestamp: '11:38 AM', status: 'success' },
  { id: 'c2', command: 'Apex Academy ka wallet ₹500 bonus credit do is mahine ke performance ke liye', result: 'Wallet adjusted: +₹500 bonus. Ledger entry logged.', timestamp: '10:15 AM', status: 'success' },
  { id: 'c3', command: 'Aaj ka net profit aur Meta ka total bill batao', result: 'Gross Revenue: ₹4,85,000 | Meta Bill: ₹18,400 | AI Compute: ₹3,200 | Net Profit: ₹4,63,400 (95.5% margin)', timestamp: '09:00 AM', status: 'success' },
];

// ─────────────────────────── HELPER COMPONENTS ───────────────────────────

const HealthDot = ({ health }: { health: WACAHealth }) => {
  const map: Record<WACAHealth, { cls: string; label: string }> = {
    GREEN: { cls: 'bg-emerald-500', label: 'Healthy' },
    YELLOW: { cls: 'bg-amber-400 animate-pulse', label: 'Warning' },
    RED: { cls: 'bg-red-500 animate-pulse', label: 'Critical' },
  };
  return (
    <span className="flex items-center gap-1.5">
      <span className={cn('h-2 w-2 rounded-full inline-block', map[health].cls)} />
      <span className={cn('text-[11px] font-medium',
        health === 'GREEN' ? 'text-emerald-600' : health === 'YELLOW' ? 'text-amber-600' : 'text-red-500'
      )}>{map[health].label}</span>
    </span>
  );
};

const TierBadge = ({ tier }: { tier: TenantTier }) => {
  const map: Record<TenantTier, string> = {
    Trial: 'bg-slate-100 text-slate-600 border-slate-200',
    Starter: 'bg-blue-50 text-blue-600 border-blue-200',
    Pro: 'bg-violet-50 text-violet-600 border-violet-200',
    VIP: 'bg-amber-50 text-amber-600 border-amber-200',
    'B2B-Enterprise': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  };
  return <Badge variant="outline" className={cn('text-[10px] font-semibold px-1.5 py-0.5', map[tier])}>{tier}</Badge>;
};

const StatusBadge = ({ status }: { status: TenantStatus }) => {
  const map: Record<TenantStatus, { cls: string; label: string }> = {
    active: { cls: 'text-emerald-700 bg-emerald-50 border-emerald-200', label: 'Active' },
    trial: { cls: 'text-blue-700 bg-blue-50 border-blue-200', label: 'Trial' },
    paused: { cls: 'text-amber-700 bg-amber-50 border-amber-200', label: 'Paused' },
    quarantined: { cls: 'text-orange-700 bg-orange-50 border-orange-200', label: 'Quarantined' },
    suspended: { cls: 'text-red-700 bg-red-50 border-red-200', label: 'Suspended' },
  };
  return <Badge variant="outline" className={cn('text-[10px] font-semibold px-1.5 py-0.5', map[status].cls)}>{map[status].label}</Badge>;
};

// ─────────────────────────── MAIN PAGE ───────────────────────────

export default function SuperAdminPage() {
  const { accountRole, profile } = useAuth();
  const isSuperAdmin = accountRole === 'owner' || profile?.email === 'mohit12836@gmail.com';

  // ── State ──
  const [tenants, setTenants] = useState<Tenant[]>(INITIAL_TENANTS);
  const [brands] = useState<Brand[]>(INITIAL_BRANDS);
  const [ceoLog, setCeoLog] = useState<CEOCommand[]>(CEO_LOG);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [masterKillActive, setMasterKillActive] = useState(false);
  const [globalAutoReply, setGlobalAutoReply] = useState(true);

  // CEO Command Bar
  const [ceoInput, setCeoInput] = useState('');
  const [ceoLoading, setCeoLoading] = useState(false);

  // Tenant Detail Modal
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [walletAdjustAmount, setWalletAdjustAmount] = useState('');
  const [walletNote, setWalletNote] = useState('');
  const [customPromptText, setCustomPromptText] = useState('');

  // Rule Injection
  const [ruleCategory, setRuleCategory] = useState('All Coaching Academies');
  const [ruleText, setRuleText] = useState('');
  const [ruleInjected, setRuleInjected] = useState(false);

  // New Brand Modal
  const [showNewBrand, setShowNewBrand] = useState(false);
  const [newBrandName, setNewBrandName] = useState('');
  const [newBrandIndustry, setNewBrandIndustry] = useState('');
  const [newBrandDomain, setNewBrandDomain] = useState('');

  // Pricing Engine
  const [pricingMode, setPricingMode] = useState<BusinessMode>('B2C');
  const [chatRate, setChatRate] = useState('1.50');
  const [platformMargin, setPlatformMargin] = useState('60');
  const [moqEnabled, setMoqEnabled] = useState(false);
  const [moqMin, setMoqMin] = useState('50');

  // ── Computed ──
  const filteredTenants = tenants.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.ownerPhone.includes(searchQuery) ||
      t.industry.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalRevenue = '₹4,85,000';
  const metaBill = '₹18,400';
  const aiCost = '₹3,200';
  const netProfit = '₹4,63,400';
  const netMargin = '95.5%';
  const lowBalanceTenants = tenants.filter((t) => t.walletBalance < 300);
  const redHealthTenants = tenants.filter((t) => t.wacaHealth === 'RED');

  // ── Handlers ──
  const handleCEOCommand = () => {
    if (!ceoInput.trim()) return;
    setCeoLoading(true);
    setTimeout(() => {
      const newCmd: CEOCommand = {
        id: Date.now().toString(),
        command: ceoInput,
        result: 'Command received and processed. System updated accordingly.',
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        status: 'success',
      };
      setCeoLog((prev) => [newCmd, ...prev]);
      setCeoInput('');
      setCeoLoading(false);
    }, 1400);
  };

  const handleToggleBotPause = (id: string) => {
    setTenants((prev) => prev.map((t) => t.id === id ? { ...t, botPaused: !t.botPaused } : t));
  };

  const handleWalletAdjust = () => {
    if (!selectedTenant || !walletAdjustAmount) return;
    const amt = parseFloat(walletAdjustAmount);
    setTenants((prev) => prev.map((t) => t.id === selectedTenant.id ? { ...t, walletBalance: t.walletBalance + amt } : t));
    setWalletAdjustAmount('');
    setWalletNote('');
    setSelectedTenant(null);
  };

  const handleRuleInject = () => {
    if (!ruleText.trim()) return;
    setRuleInjected(true);
    setTimeout(() => { setRuleInjected(false); setRuleText(''); }, 3000);
  };

  const handleMasterKill = () => {
    setMasterKillActive((v) => !v);
    setTenants((prev) => prev.map((t) => ({ ...t, botPaused: !masterKillActive })));
  };

  // ── Access Guard ──
  if (!isSuperAdmin) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-4">
        <Card className="max-w-md w-full text-center p-8 border-border shadow-xl">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 mb-4">
            <Lock className="h-7 w-7" />
          </div>
          <CardTitle className="text-xl font-bold">Owner Access Required</CardTitle>
          <CardDescription className="mt-2 text-sm text-muted-foreground leading-relaxed">
            The SuperAdmin God-Mode Cockpit is reserved exclusively for the Master SaaS Owner.
          </CardDescription>
          <div className="mt-6 flex justify-center">
            <Button render={<Link href="/dashboard" />} className="rounded-xl font-semibold">
              Return to Dashboard
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-8">

      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20">
              <ShieldAlert className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-foreground">SuperAdmin God-Mode Cockpit</h1>
              <p className="text-xs text-muted-foreground">Complete control over all tenants, brands, pricing, and platform operations.</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 px-3 py-1.5 text-xs font-semibold">
            <Crown className="h-3 w-3 mr-1 text-amber-500" />Master Authority Active
          </Badge>
          {masterKillActive && (
            <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20 px-3 py-1.5 text-xs font-semibold animate-pulse">
              <Siren className="h-3 w-3 mr-1" />Kill-Switch ACTIVE
            </Badge>
          )}
        </div>
      </div>

      {/* ── ALERTS ── */}
      {(lowBalanceTenants.length > 0 || redHealthTenants.length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {lowBalanceTenants.length > 0 && (
            <Card className="border-amber-400/40 bg-amber-400/5">
              <CardContent className="p-3 flex items-center gap-2">
                <Wallet className="h-4 w-4 text-amber-500 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-amber-700">{lowBalanceTenants.length} Low Wallet Alert</p>
                  <p className="text-[11px] text-amber-600/80">{lowBalanceTenants.map(t => t.name.split(' ')[0]).join(', ')} — balance &lt; ₹300</p>
                </div>
              </CardContent>
            </Card>
          )}
          {redHealthTenants.length > 0 && (
            <Card className="border-red-400/40 bg-red-400/5">
              <CardContent className="p-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-red-700">{redHealthTenants.length} WACA Red Alert</p>
                  <p className="text-[11px] text-red-600/80">{redHealthTenants.map(t => t.name.split(' ')[0]).join(', ')} — spam risk, auto-paused</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ── AI CEO COMMAND BAR ── */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-violet-500/5">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            AI CEO Command Bar
            <Badge variant="outline" className="text-[10px] border-primary/30 text-primary bg-primary/10 ml-1">24/7 Active</Badge>
          </CardTitle>
          <CardDescription className="text-[11px]">
            बोलो या लिखो — AI CEO तुरंत काम करेगा। उदा: "Anand Textiles ka wallet ₹500 bado", "Aaj ka profit batao", "Morbi Tiles ka bot pauz karo"
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-3">
          <div className="flex gap-2">
            <Input
              value={ceoInput}
              onChange={(e) => setCeoInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCEOCommand()}
              placeholder="Type a command in Hindi or English..."
              className="text-sm h-9 flex-1"
            />
            <Button
              size="sm"
              onClick={handleCEOCommand}
              disabled={ceoLoading || !ceoInput.trim()}
              className="bg-primary hover:bg-primary/90 shrink-0 h-9 px-4"
            >
              {ceoLoading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <><Send className="h-3.5 w-3.5 mr-1" />Execute</>}
            </Button>
          </div>

          {/* CEO Log */}
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {ceoLog.map((cmd) => (
              <div key={cmd.id} className="text-[11px] rounded-lg border border-border bg-card p-2.5 space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <span className="font-medium text-foreground flex-1">▶ {cmd.command}</span>
                  <span className="text-muted-foreground shrink-0">{cmd.timestamp}</span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-700">
                  <CheckCircle2 className="h-3 w-3 shrink-0" />
                  <span>{cmd.result}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── 4 KPI METRIC CARDS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4 px-4">
            <CardTitle className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Active Tenants</CardTitle>
            <Users className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-bold">{tenants.length}</div>
            <p className="text-[11px] text-emerald-500 mt-0.5 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />+4 joined this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4 px-4">
            <CardTitle className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">AI Chats Today</CardTitle>
            <MessageSquare className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-bold">
              {tenants.reduce((s, t) => s + t.totalChatsToday, 0).toLocaleString()}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">94.2% handled by AI</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4 px-4">
            <CardTitle className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Gross Revenue</CardTitle>
            <IndianRupee className="h-4 w-4 text-violet-500" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-bold">{totalRevenue}</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Meta: {metaBill} | AI: {aiCost}</p>
          </CardContent>
        </Card>

        <Card className="border-amber-400/30 bg-amber-400/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4 px-4">
            <CardTitle className="text-[11px] font-medium text-amber-600 uppercase tracking-wider">Net Profit</CardTitle>
            <Sparkles className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-bold text-amber-600">{netProfit}</div>
            <p className="text-[11px] text-amber-600/80 mt-0.5">{netMargin} gross margin</p>
          </CardContent>
        </Card>
      </div>

      {/* ── MAIN TABS ── */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="h-9 text-xs gap-1 flex-wrap">
          <TabsTrigger value="overview" className="text-xs h-7"><Users className="h-3 w-3 mr-1" />Tenants</TabsTrigger>
          <TabsTrigger value="brands" className="text-xs h-7"><Layers className="h-3 w-3 mr-1" />Brands</TabsTrigger>
          <TabsTrigger value="pricing" className="text-xs h-7"><Sliders className="h-3 w-3 mr-1" />Pricing Rules</TabsTrigger>
          <TabsTrigger value="waca" className="text-xs h-7"><Radio className="h-3 w-3 mr-1" />WACA Health</TabsTrigger>
          <TabsTrigger value="rules" className="text-xs h-7"><Sparkles className="h-3 w-3 mr-1" />Rule Inject</TabsTrigger>
          <TabsTrigger value="security" className="text-xs h-7 text-red-600 data-[state=active]:text-red-600"><ShieldAlert className="h-3 w-3 mr-1" />Security</TabsTrigger>
        </TabsList>

        {/* ══ TAB 1: TENANTS ══ */}
        <TabsContent value="overview" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-sm font-semibold">Tenant & Merchant God-Mode</CardTitle>
                  <CardDescription className="text-xs">Wallet adjust, bot pause/resume, impersonate, custom prompt override.</CardDescription>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search name, city, industry..." className="pl-8 text-xs h-8" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/50 text-muted-foreground font-medium border-y">
                  <tr>
                    <th className="py-2.5 px-4">Business</th>
                    <th className="py-2.5 px-4">Mode</th>
                    <th className="py-2.5 px-4">Tier</th>
                    <th className="py-2.5 px-4">Wallet</th>
                    <th className="py-2.5 px-4">Chats</th>
                    <th className="py-2.5 px-4">WACA</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4 text-right">God-Mode Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredTenants.map((t) => (
                    <tr key={t.id} className={cn("transition-colors hover:bg-muted/30", t.wacaHealth === 'RED' && 'bg-red-500/5')}>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-foreground">{t.name}</div>
                        <div className="text-[11px] text-muted-foreground">{t.city} · {t.ownerPhone}</div>
                        {t.domain && (
                          <a href={`https://${t.domain}`} target="_blank" rel="noreferrer" className="text-[10px] text-primary flex items-center gap-0.5 hover:underline">
                            {t.domain} <ExternalLink className="h-2.5 w-2.5" />
                          </a>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" className={cn('text-[10px]', t.mode === 'B2B' ? 'border-emerald-300 text-emerald-700 bg-emerald-50' : 'border-blue-300 text-blue-700 bg-blue-50')}>
                          {t.mode}
                        </Badge>
                      </td>
                      <td className="py-3 px-4"><TierBadge tier={t.tier} /></td>
                      <td className="py-3 px-4">
                        <span className={cn('font-semibold', t.walletBalance < 300 ? 'text-red-600' : 'text-foreground')}>
                          ₹{t.walletBalance.toLocaleString()}
                        </span>
                        {t.walletBalance < 300 && <span className="block text-[10px] text-red-400">Low!</span>}
                      </td>
                      <td className="py-3 px-4">{t.totalChatsToday}</td>
                      <td className="py-3 px-4"><HealthDot health={t.wacaHealth} /></td>
                      <td className="py-3 px-4">
                        <StatusBadge status={t.botPaused ? 'paused' : t.status} />
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost" size="sm"
                            className={cn("h-7 px-2 text-[10px]", t.botPaused ? 'text-emerald-600 hover:text-emerald-700' : 'text-amber-600 hover:text-amber-700')}
                            onClick={() => handleToggleBotPause(t.id)}
                          >
                            {t.botPaused ? <><Play className="h-3 w-3 mr-0.5" />Resume</> : <><Pause className="h-3 w-3 mr-0.5" />Pause</>}
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 px-2 text-[10px]" onClick={() => { setSelectedTenant(t); setWalletAdjustAmount(''); }}>
                            <Wallet className="h-3 w-3 mr-0.5" />Wallet
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 px-2 text-[10px] text-primary">
                            <Eye className="h-3 w-3 mr-0.5" />View
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ══ TAB 2: BRANDS ══ */}
        <TabsContent value="brands" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold">Multi-Brand Vertical Manager</h2>
              <p className="text-xs text-muted-foreground">1 Core Engine → Multiple Niche Brands. Each brand gets its own domain, landing page & AI agents.</p>
            </div>
            <Button size="sm" className="h-8 text-xs" onClick={() => setShowNewBrand(true)}>
              <Plus className="h-3.5 w-3.5 mr-1" />New Brand
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {brands.map((brand) => (
              <Card key={brand.id} className={cn("relative", brand.status === 'draft' && 'border-dashed opacity-70')}>
                <CardHeader className="pb-2 pt-4 px-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-sm font-semibold">{brand.name}</CardTitle>
                      <CardDescription className="text-[11px] mt-0.5">{brand.targetIndustry}</CardDescription>
                    </div>
                    <Badge variant="outline" className={cn('text-[10px] font-semibold shrink-0',
                      brand.status === 'live' ? 'bg-emerald-50 text-emerald-700 border-emerald-300' :
                      brand.status === 'paused' ? 'bg-amber-50 text-amber-700 border-amber-300' :
                      'bg-slate-50 text-slate-600 border-slate-300'
                    )}>
                      {brand.status === 'live' ? '🟢 Live' : brand.status === 'draft' ? '📝 Draft' : '⏸ Paused'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-3">
                  <div className="flex items-center gap-1.5 text-[11px] text-primary">
                    <Globe className="h-3 w-3 shrink-0" />
                    <a href={`https://${brand.domain}`} target="_blank" rel="noreferrer" className="hover:underline">{brand.domain}</a>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-lg bg-muted/50 py-2">
                      <div className="text-sm font-bold">{brand.clients}</div>
                      <div className="text-[10px] text-muted-foreground">Clients</div>
                    </div>
                    <div className="rounded-lg bg-muted/50 py-2">
                      <div className="text-sm font-bold">{brand.monthlyRevenue}</div>
                      <div className="text-[10px] text-muted-foreground">MRR</div>
                    </div>
                    <div className="rounded-lg bg-muted/50 py-2">
                      <div className="text-sm font-bold">{brand.theme}</div>
                      <div className="text-[10px] text-muted-foreground">Theme</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="text-[11px] h-7 flex-1">
                      <Edit className="h-3 w-3 mr-1" />Edit Brand
                    </Button>
                    <Button variant="outline" size="sm" className="text-[11px] h-7 flex-1">
                      <ExternalLink className="h-3 w-3 mr-1" />Preview
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ══ TAB 3: PRICING ENGINE ══ */}
        <TabsContent value="pricing" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Sliders className="h-4 w-4 text-primary" />Dynamic Pricing & Business Rules Engine
              </CardTitle>
              <CardDescription className="text-xs">
                Switch between B2B and B2C modes. Change rates and rules here — they apply instantly across the whole platform without any code change.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* B2B / B2C Toggle */}
              <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/40 border border-border">
                <button
                  onClick={() => setPricingMode('B2C')}
                  className={cn("flex-1 py-2.5 rounded-md text-xs font-semibold transition-all", pricingMode === 'B2C' ? 'bg-blue-600 text-white shadow-sm' : 'text-muted-foreground hover:bg-muted')}
                >
                  🛒 B2C Retail Mode
                </button>
                <button
                  onClick={() => setPricingMode('B2B')}
                  className={cn("flex-1 py-2.5 rounded-md text-xs font-semibold transition-all", pricingMode === 'B2B' ? 'bg-emerald-600 text-white shadow-sm' : 'text-muted-foreground hover:bg-muted')}
                >
                  🏭 B2B Wholesale Mode
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Per Chat Rate */}
                <div className="space-y-2">
                  <label className="text-xs font-medium">Per Conversation Rate (₹)</label>
                  <div className="flex items-center gap-2">
                    <Input value={chatRate} onChange={(e) => setChatRate(e.target.value)} className="text-sm h-9 font-semibold" />
                    <span className="text-xs text-muted-foreground shrink-0">per chat</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">Our cost: ~₹0.50 | Your margin: ~{Math.round(((parseFloat(chatRate || '1.5') - 0.5) / parseFloat(chatRate || '1.5')) * 100)}%</p>
                </div>

                {/* Platform Margin */}
                <div className="space-y-2">
                  <label className="text-xs font-medium">Platform Service Margin (%)</label>
                  <div className="flex items-center gap-2">
                    <Input value={platformMargin} onChange={(e) => setPlatformMargin(e.target.value)} className="text-sm h-9 font-semibold" />
                    <span className="text-xs text-muted-foreground shrink-0">% markup</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">Applied on Meta message fees before billing</p>
                </div>
              </div>

              {/* B2B Specific */}
              {pricingMode === 'B2B' && (
                <div className="space-y-4 rounded-lg border border-emerald-200 bg-emerald-50/50 p-4">
                  <p className="text-xs font-semibold text-emerald-800 flex items-center gap-1.5"><Boxes className="h-3.5 w-3.5" />B2B Wholesale Controls</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-xs font-medium">Minimum Order Quantity (MOQ) Gate</label>
                      <p className="text-[11px] text-muted-foreground">AI will reject single-unit buyers automatically</p>
                    </div>
                    <Switch checked={moqEnabled} onCheckedChange={setMoqEnabled} />
                  </div>
                  {moqEnabled && (
                    <div className="space-y-1">
                      <label className="text-xs font-medium">Minimum Order Quantity (units)</label>
                      <Input value={moqMin} onChange={(e) => setMoqMin(e.target.value)} className="text-sm h-9 w-40" type="number" />
                    </div>
                  )}
                  <div className="text-[11px] text-emerald-700 bg-emerald-100 rounded p-2">
                    📦 B2B AI will: Show slab pricing (100 pcs/500 pcs/1000 pcs tiers) · Add 18% GST automatically · Ask for firm name & GST number before quoting
                  </div>
                </div>
              )}

              <Button size="sm" className="bg-primary hover:bg-primary/90 text-xs h-8 px-5">
                <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />Save & Apply Globally (Instant)
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ══ TAB 4: WACA HEALTH ══ */}
        <TabsContent value="waca" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Radio className="h-4 w-4 text-primary" />
                Meta WACA Health & Quality Radar
              </CardTitle>
              <CardDescription className="text-xs">
                Real-time Meta WhatsApp phone number quality monitoring. RED numbers are auto-paused to prevent permanent bans.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {tenants.map((t) => (
                <div key={t.id} className={cn("flex items-center justify-between rounded-lg border p-3",
                  t.wacaHealth === 'RED' ? 'border-red-300 bg-red-50' :
                  t.wacaHealth === 'YELLOW' ? 'border-amber-300 bg-amber-50' :
                  'border-border bg-card'
                )}>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{t.name}</p>
                    <p className="text-[11px] text-muted-foreground">{t.domain}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <HealthDot health={t.wacaHealth} />
                    {t.wacaHealth === 'RED' && (
                      <Badge variant="outline" className="text-[10px] border-red-300 text-red-700 bg-red-50">
                        ⛔ Auto-Paused
                      </Badge>
                    )}
                    {t.wacaHealth === 'YELLOW' && (
                      <Badge variant="outline" className="text-[10px] border-amber-300 text-amber-700 bg-amber-50">
                        ⚡ 50% Throttled
                      </Badge>
                    )}
                    <span className="text-[11px] text-muted-foreground">{t.totalChatsToday} chats</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ══ TAB 5: RULE INJECTION ══ */}
        <TabsContent value="rules" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Global AI Rule Injection Studio
              </CardTitle>
              <CardDescription className="text-xs">
                Inject a master business rule across an entire industry category at once. All tenant bots update instantly.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Target Industry Category</label>
                  <select
                    value={ruleCategory}
                    onChange={(e) => setRuleCategory(e.target.value)}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option>All Coaching Academies (32)</option>
                    <option>All Solar Installers (28)</option>
                    <option>All Healthcare & Clinics (24)</option>
                    <option>All Real Estate Dealers (18)</option>
                    <option>All Textile Manufacturers (14)</option>
                    <option>All B2B Manufacturers (22)</option>
                    <option>Everyone (All Tenants)</option>
                  </select>
                </div>
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-xs font-medium">Master Business Rule / Instruction</label>
                  <Textarea
                    value={ruleText}
                    onChange={(e) => setRuleText(e.target.value)}
                    placeholder="e.g. Always ask for the student's target exam (NEET/JEE) and current grade before quoting batch fees..."
                    className="text-xs resize-none h-20"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button size="sm" onClick={handleRuleInject} disabled={!ruleText.trim() || ruleInjected} className="bg-primary hover:bg-primary/90 text-xs h-8">
                  <Send className="h-3.5 w-3.5 mr-1.5" />Inject Rule to {ruleCategory}
                </Button>
                {ruleInjected && (
                  <div className="text-xs font-medium text-emerald-600 flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4" />Rule injected! All {ruleCategory} bots updated instantly.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ══ TAB 6: SECURITY ══ */}
        <TabsContent value="security" className="space-y-4 mt-4">
          {/* Master Kill Switch */}
          <Card className={cn("border-2 transition-colors", masterKillActive ? 'border-red-500 bg-red-500/5' : 'border-red-200')}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-red-700">
                <Siren className="h-4 w-4" />
                🔴 Master Emergency Kill-Switch
              </CardTitle>
              <CardDescription className="text-xs text-red-600/80">
                Instantly freeze ALL outbound AI messaging across every tenant on the platform. Use only in a Meta-wide emergency or critical bug situation.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 rounded-lg bg-card border border-red-200">
                <div>
                  <p className="text-sm font-semibold">{masterKillActive ? '⛔ ALL BOTS ARE PAUSED' : '✅ All Bots Running Normally'}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {masterKillActive ? 'All outbound WhatsApp messages are frozen. Tap again to restore.' : 'Tap to freeze all outbound messaging instantly.'}
                  </p>
                </div>
                <Button
                  onClick={handleMasterKill}
                  className={cn("font-semibold text-xs h-9 px-5", masterKillActive ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700')}
                >
                  {masterKillActive ? <><Play className="h-3.5 w-3.5 mr-1.5" />Restore All</> : <><XCircle className="h-3.5 w-3.5 mr-1.5" />Kill All Bots</>}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Global Auto-Reply Toggle */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold flex items-center gap-2"><Cpu className="h-4 w-4 text-primary" />Global Auto-Reply Engine</p>
                  <p className="text-xs text-muted-foreground mt-0.5">When OFF, all incoming messages are queued for human review. No AI responses sent.</p>
                </div>
                <Switch checked={globalAutoReply} onCheckedChange={setGlobalAutoReply} />
              </div>
              {!globalAutoReply && (
                <div className="mt-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2.5 flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  Auto-reply is OFF. All tenant bots are waiting silently. Customers will see delayed responses.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Ethical Shield Status */}
          <Card className="border-emerald-200 bg-emerald-50/40">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 border border-emerald-200 shrink-0">
                  <ShieldCheck className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-emerald-800">Dharmic / Ethical Shield — Active</p>
                  <p className="text-xs text-emerald-700/80">Prohibited categories (meat/slaughter, gambling, fraud) auto-quarantine is ON. Violations are flagged for your review.</p>
                </div>
                <Badge variant="outline" className="ml-auto shrink-0 text-[10px] border-emerald-400 text-emerald-700 bg-emerald-50">
                  <BadgeCheck className="h-3 w-3 mr-1" />Protected
                </Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── TENANT DETAIL MODAL (Wallet Adjust) ── */}
      <Dialog open={!!selectedTenant} onOpenChange={(open) => !open && setSelectedTenant(null)}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Wallet className="h-4 w-4 text-primary" />Wallet & Override: {selectedTenant?.name}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Current Balance: <strong>₹{selectedTenant?.walletBalance.toLocaleString()}</strong> · Adjust wallet or override AI prompt.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Wallet Adjust */}
            <div className="space-y-2 rounded-lg border border-border p-3 bg-muted/20">
              <label className="text-xs font-semibold">Wallet Adjustment (₹)</label>
              <p className="text-[11px] text-muted-foreground">Enter positive to add, negative to deduct (e.g. +500 or -200)</p>
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={walletAdjustAmount}
                  onChange={(e) => setWalletAdjustAmount(e.target.value)}
                  placeholder="e.g. +500 or -200"
                  className="text-sm h-9"
                />
              </div>
              <Input
                value={walletNote}
                onChange={(e) => setWalletNote(e.target.value)}
                placeholder="Reason / Note (e.g. Bonus credit for VIP performance)"
                className="text-xs h-8"
              />
            </div>

            {/* Custom Prompt Override */}
            <div className="space-y-2 rounded-lg border border-border p-3 bg-muted/20">
              <label className="text-xs font-semibold">Custom AI Prompt Override</label>
              <p className="text-[11px] text-muted-foreground">Adds a special instruction to this tenant's bot without code changes.</p>
              <Textarea
                value={customPromptText}
                onChange={(e) => setCustomPromptText(e.target.value)}
                placeholder="e.g. Always mention the Diwali sale (40% off) for all inquiries this week."
                className="text-xs resize-none h-20"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setSelectedTenant(null)}>Cancel</Button>
            <Button size="sm" className="bg-primary hover:bg-primary/90" onClick={handleWalletAdjust}>
              <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── NEW BRAND MODAL ── */}
      <Dialog open={showNewBrand} onOpenChange={setShowNewBrand}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Layers className="h-4 w-4 text-primary" />Spawn New Niche Brand
            </DialogTitle>
            <DialogDescription className="text-xs">
              1 Core Vismart Engine → New specialized brand with its own landing page, domain, and AI agents. Live in 60 seconds.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Brand Name</label>
              <Input value={newBrandName} onChange={(e) => setNewBrandName(e.target.value)} placeholder="e.g. ClinicSmart AI" className="text-sm h-9" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Target Industry</label>
              <Input value={newBrandIndustry} onChange={(e) => setNewBrandIndustry(e.target.value)} placeholder="e.g. Doctors & Clinics, Textile Manufacturers..." className="text-sm h-9" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Custom Domain</label>
              <div className="flex gap-2 items-center">
                <Input value={newBrandDomain} onChange={(e) => setNewBrandDomain(e.target.value)} placeholder="clinicsmart" className="text-sm h-9" />
                <span className="text-xs text-muted-foreground shrink-0">.vismart.ai</span>
              </div>
              <p className="text-[11px] text-muted-foreground">Or connect your own: chat.yourbrand.com (SSL auto-provisioned)</p>
            </div>
            <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 text-[11px] text-primary space-y-1">
              <p className="font-semibold">✨ AI CEO will auto-generate:</p>
              <p>• Industry-specific landing page with matching theme & copy</p>
              <p>• Pre-trained AI agent for {newBrandIndustry || 'the target industry'}</p>
              <p>• Free SSL certificate on custom domain</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowNewBrand(false)}>Cancel</Button>
            <Button
              size="sm"
              className="bg-primary hover:bg-primary/90"
              disabled={!newBrandName || !newBrandIndustry || !newBrandDomain}
              onClick={() => setShowNewBrand(false)}
            >
              <Zap className="h-3.5 w-3.5 mr-1.5" />Launch Brand (60 sec)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
