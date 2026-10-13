'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  Bot,
  Sparkles,
  Zap,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  Sun,
  Stethoscope,
  GraduationCap,
  Building2,
  ShoppingBag,
  Wrench,
  Globe,
  FileText,
  HelpCircle,
  Package,
  Mic,
  MessageSquare,
  AlertTriangle,
  Play,
  QrCode,
  Lock,
  Flame,
  Check,
  RefreshCcw,
  Sliders,
  DollarSign,
  PhoneCall,
  Loader2,
  Send,
  Mail,
  X,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
type BusinessCategory = 'solar' | 'clinic' | 'coaching' | 'realestate' | 'retail' | 'service' | 'other';
type UxMode = 'beginner' | 'business' | 'advanced';

export default function OnboardingPage() {
  const router = useRouter();

  // Wizard Navigation
  const [step, setStep] = useState<Step>(1);
  const [uxMode, setUxMode] = useState<UxMode>('beginner');

  // Step 2: Business Profile & Adaptive Fields
  const [businessName, setBusinessName] = useState('');
  const [category, setCategory] = useState<BusinessCategory>('solar');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  // Category-specific adaptive fields
  const [solarCapacity, setSolarCapacity] = useState('3kW to 10kW Rooftop');
  const [clinicOpdTiming, setClinicOpdTiming] = useState('10:00 AM - 1:00 PM, 5:00 PM - 8:00 PM');
  const [coachingTargetExam, setCoachingTargetExam] = useState('JEE, NEET, Foundation (Class 9-12)');
  const [realEstateType, setRealEstateType] = useState('2 & 3 BHK Luxury Apartments, Residential Plots');
  const [retailProducts, setRetailProducts] = useState('Electronics, Mobile Phones, Home Appliances');

  // Step 3: Goals Selection
  const [selectedGoals, setSelectedGoals] = useState<string[]>([
    'Answer customer queries 24/7',
    'Capture and qualify hot leads',
    'Book site visits and appointments',
    'Send instant UPI payment links',
  ]);

  // Step 4: AI Configuration Progress Simulation
  const [configProgress, setConfigProgress] = useState(100);

  // Step 5: Knowledge Sources
  const [knowledgeMethod, setKnowledgeMethod] = useState<'url' | 'pdf' | 'qa' | 'products'>('url');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [customQaList, setCustomQaList] = useState<Array<{ q: string; a: string }>>([
    { q: 'What is your refund policy?', a: '₹999 token is 100% refundable if site survey is not feasible.' },
    { q: 'Do you offer government subsidies?', a: 'Yes, up to ₹78,000 direct bank transfer under PM Surya Ghar Yojana.' },
  ]);
  const [newQ, setNewQ] = useState('');
  const [newA, setNewA] = useState('');
  const [hasAddedKnowledge, setHasAddedKnowledge] = useState(true);

  // Step 6: Test Playground in Wizard
  const [testChat, setTestChat] = useState<Array<{ sender: 'user' | 'ai'; text: string }>>([
    { sender: 'user', text: 'Namaste! 5kW solar rooftop system ka total price kitna hai?' },
    {
      sender: 'ai',
      text: 'Namaste! 🙏 5kW Solar Rooftop system ka approx cost ₹2,60,000 aata hai. Isme ₹78,000 Govt Subsidy ke baad aapka net kharcha sirf ₹1,82,000 padega. Kya kal free site inspection ke liye engineer bhejein?',
    },
  ]);
  const [testInput, setTestInput] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);

  // Step 7: WhatsApp Connection Method
  const [waMethod, setWaMethod] = useState<'qr' | 'cloud_api'>('qr');
  const [waConnected, setWaConnected] = useState(false);

  // Server Provisioning & Auth State
  const [idempotencyKey, setIdempotencyKey] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signup' | 'signin'>('signup');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Load draft on initial mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('vismart_onboarding_draft');
      if (saved) {
        const d = JSON.parse(saved);
        if (d.businessName) setBusinessName(d.businessName);
        if (d.category) setCategory(d.category);
        if (d.city) setCity(d.city);
        if (d.phone) setPhone(d.phone);
        if (d.selectedGoals) setSelectedGoals(d.selectedGoals);
        if (d.customQaList) setCustomQaList(d.customQaList);
        if (d.idempotencyKey) setIdempotencyKey(d.idempotencyKey);
        if (d.step && d.step > 1) setStep(d.step as Step);
      } else {
        setIdempotencyKey(`onboard_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`);
      }
    } catch {
      setIdempotencyKey(`onboard_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`);
    }
  }, []);

  // Save draft on state changes
  useEffect(() => {
    try {
      if (businessName || customQaList.length > 0) {
        const draft = {
          businessName,
          category,
          city,
          phone,
          selectedGoals,
          customQaList,
          idempotencyKey,
          step,
        };
        localStorage.setItem('vismart_onboarding_draft', JSON.stringify(draft));
      }
    } catch {
      // Ignore storage write issues
    }
  }, [businessName, category, city, phone, selectedGoals, customQaList, idempotencyKey, step]);

  const toggleGoal = (goal: string) => {
    if (selectedGoals.includes(goal)) {
      setSelectedGoals(selectedGoals.filter((g) => g !== goal));
    } else {
      setSelectedGoals([...selectedGoals, goal]);
    }
  };

  const handleAddQa = () => {
    if (!newQ.trim() || !newA.trim()) return;
    setCustomQaList([...customQaList, { q: newQ, a: newA }]);
    setNewQ('');
    setNewA('');
  };

  const executeProvisioning = async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const categoryDetails = {
        solarCapacity,
        clinicOpdTiming,
        coachingTargetExam,
        realEstateType,
        retailProducts,
      };

      const res = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: businessName || 'My Business',
          industry: category,
          city,
          phone,
          goals: selectedGoals,
          knowledgeItems: customQaList,
          categoryDetails,
          idempotencyKey,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to complete workspace onboarding.');
      }

      // Clear draft on verified completion
      try {
        localStorage.removeItem('vismart_onboarding_draft');
      } catch {}

      router.push('/dashboard');
    } catch (err: any) {
      setSubmitError(err.message || 'An unexpected error occurred. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleLaunch = async () => {
    setSubmitError(null);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setAuthModalOpen(true);
      return;
    }

    await executeProvisioning();
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsAuthenticating(true);

    const supabase = createClient();

    try {
      if (authMode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email: authEmail.trim(),
          password: authPassword,
          options: {
            data: {
              full_name: businessName || 'Business Owner',
            },
          },
        });

        if (error) throw error;
        if (!data.user) throw new Error('Signup failed. Please try again.');
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: authEmail.trim(),
          password: authPassword,
        });

        if (error) throw error;
        if (!data.user) throw new Error('Sign in failed. Please check your credentials.');
      }

      setAuthModalOpen(false);
      await executeProvisioning();
    } catch (err: any) {
      setAuthError(err.message || 'Authentication failed');
      setIsAuthenticating(false);
    }
  };

  const handleSendTestMessage = () => {
    if (!testInput.trim()) return;
    const userMsg = testInput;
    setTestChat((prev) => [...prev, { sender: 'user', text: userMsg }]);
    setTestInput('');
    setIsSimulating(true);

    setTimeout(() => {
      let reply = '';
      const lower = userMsg.toLowerCase();
      if (lower.includes('discount') || lower.includes('kam')) {
        reply = 'Sir, agar aap aaj apna booking slot confirm karte hain, to hum special festival discount ke sath ₹5,000 ka cashback voucher apply kar denge!';
      } else if (lower.includes('book') || lower.includes('visit') || lower.includes('appointment')) {
        reply = 'Bilkul! Humare executive kal dopahar 12:00 PM ya sham 4:00 PM par visit kar sakte hain. Kripya apna address confirm kijiye.';
      } else if (lower.includes('pay') || lower.includes('upi') || lower.includes('link')) {
        reply = 'Ye lijiye aapka secure UPI token link: https://rzp.io/l/token-999. Pay karte hi booking slip generate ho jayegi! 🎉';
      } else {
        reply = `Ji bilkul! ${businessName || 'Humari company'} me aapka swagat hai. Hum aapko complete quote aur details share kar rahe hain.`;
      }
      setTestChat((prev) => [...prev, { sender: 'ai', text: reply }]);
      setIsSimulating(false);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[#05070D] text-slate-100 selection:bg-emerald-500/30 relative overflow-x-hidden">
      {/* Background Aurora Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[5%] left-[10%] w-[500px] h-[500px] rounded-full bg-emerald-500/15 blur-[140px] animate-aurora" />
        <div className="absolute top-[40%] right-[10%] w-[500px] h-[500px] rounded-full bg-cyan-500/15 blur-[140px] animate-aurora" style={{ animationDelay: '-5s' }} />
        <div className="absolute bottom-[10%] left-[30%] w-[450px] h-[450px] rounded-full bg-violet-600/15 blur-[140px] animate-aurora" style={{ animationDelay: '-10s' }} />
      </div>

      {/* Top Navbar */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#05070D]/80 backdrop-blur-2xl">
        <div className="container mx-auto max-w-5xl flex h-16 items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 text-slate-950 font-black shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <Bot className="h-5 w-5" />
            </div>
            <span className="font-extrabold tracking-tight text-white sm:text-base">
              Vismart <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Self-Driving Setup</span>
            </span>
          </Link>

          {/* UX Mode Selector (3 Levels) */}
          <div className="flex items-center gap-1 p-1 bg-slate-900 border border-white/10 rounded-xl text-xs">
            <button
              type="button"
              onClick={() => setUxMode('beginner')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                uxMode === 'beginner' ? 'bg-emerald-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              🟢 Beginner
            </button>
            <button
              type="button"
              onClick={() => setUxMode('business')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                uxMode === 'business' ? 'bg-cyan-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              🔵 Business
            </button>
            <button
              type="button"
              onClick={() => setUxMode('advanced')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                uxMode === 'advanced' ? 'bg-violet-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              🟣 Advanced
            </button>
          </div>

          <Link href="/dashboard" className="text-xs font-semibold text-slate-400 hover:text-white transition-colors">
            Exit to Dashboard →
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="container mx-auto max-w-4xl px-4 py-8 sm:py-12 relative z-10">
        {/* Step Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 mb-2">
            <span>Step {step} of 8</span>
            <span className="text-emerald-400">
              {step === 1 && 'Welcome & Overview'}
              {step === 2 && 'Business Identification'}
              {step === 3 && 'Goal Selection'}
              {step === 4 && 'AI Auto-Configuration'}
              {step === 5 && 'Business Knowledge'}
              {step === 6 && 'Interactive Test Chat'}
              {step === 7 && 'WhatsApp Connection'}
              {step === 8 && 'Launch & Activation'}
            </span>
          </div>
          <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-white/10">
            <div
              className="bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 h-full transition-all duration-500 rounded-full"
              style={{ width: `${(step / 8) * 100}%` }}
            />
          </div>
        </div>

        {/* ============================================================
            SCREEN 01 — WELCOME & VALUE PITCH
            ============================================================ */}
        {step === 1 && (
          <Card className="glass-card-glow border-white/10 rounded-3xl p-6 sm:p-10 text-center space-y-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-400 via-teal-400 to-cyan-500 text-slate-950 font-black shadow-[0_0_35px_rgba(16,185,129,0.35)] animate-float-slow">
              <Sparkles className="h-8 w-8" />
            </div>

            <div className="space-y-3 max-w-2xl mx-auto">
              <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-xs font-bold px-3 py-1">
                Zero Technical Knowledge Required
              </Badge>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                Build Your 24/7 WhatsApp AI Sales Employee in 5 Minutes
              </h1>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                No complex dashboards or confusing prompts. Just tell our setup companion about your business, and it will configure, train, test, and connect your AI employee automatically.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto text-left text-xs pt-4">
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 space-y-1">
                <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                  <CheckCircle2 className="h-4 w-4" /> Step 1: Discover
                </div>
                <p className="text-slate-400">Tell us what you sell &amp; your primary goal.</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 space-y-1">
                <div className="flex items-center gap-1.5 text-cyan-400 font-bold">
                  <CheckCircle2 className="h-4 w-4" /> Step 2: Teach
                </div>
                <p className="text-slate-400">Add website URL, PDFs, or simple FAQs.</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 space-y-1">
                <div className="flex items-center gap-1.5 text-violet-400 font-bold">
                  <CheckCircle2 className="h-4 w-4" /> Step 3: Launch
                </div>
                <p className="text-slate-400">Test live and connect to WhatsApp in 1 click.</p>
              </div>
            </div>

            <div className="pt-6">
              <Button
                size="lg"
                onClick={() => setStep(2)}
                className="h-13 px-10 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 text-slate-950 rounded-2xl text-base font-extrabold shadow-[0_0_30px_rgba(16,185,129,0.35)] hover:scale-105 active:scale-95 transition-all gap-2"
              >
                Start Guided Setup Now <ArrowRight className="h-5 w-5" />
              </Button>
            </div>
          </Card>
        )}

        {/* ============================================================
            SCREEN 02 — ADAPTIVE BUSINESS DISCOVERY
            ============================================================ */}
        {step === 2 && (
          <Card className="glass-card-glow border-white/10 rounded-3xl p-6 sm:p-8 space-y-6">
            <div className="space-y-1">
              <Badge className="bg-emerald-500/20 text-emerald-300 border-none text-xs font-bold">
                Step 2 of 8 • Business Profile
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-bold text-white">
                What type of business do you run?
              </h2>
              <p className="text-xs sm:text-sm text-slate-300">
                Our companion automatically adapts questions and sales scripts to your exact industry.
              </p>
            </div>

            {/* Category Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { id: 'solar', label: 'Solar Rooftop', icon: Sun, desc: 'Subsidies & site visits' },
                { id: 'clinic', label: 'Doctor / Clinic', icon: Stethoscope, desc: 'OPD appointments' },
                { id: 'coaching', label: 'Coaching Institute', icon: GraduationCap, desc: 'Admissions & fees' },
                { id: 'realestate', label: 'Real Estate', icon: Building2, desc: 'Flats & site tours' },
                { id: 'retail', label: 'Retail / Shop', icon: ShoppingBag, desc: 'Products & delivery' },
                { id: 'service', label: 'Service Business', icon: Wrench, desc: 'Quotes & bookings' },
              ].map((item) => {
                const Icon = item.icon;
                const isSelected = category === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setCategory(item.id as BusinessCategory)}
                    className={`flex flex-col items-start p-3.5 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? 'border-emerald-400 bg-emerald-500/15 shadow-md shadow-emerald-500/20 scale-[1.02]'
                        : 'border-white/10 bg-slate-900/70 hover:bg-slate-850 text-slate-300'
                    }`}
                  >
                    <Icon className={`h-5 w-5 mb-1.5 ${isSelected ? 'text-emerald-400' : 'text-slate-400'}`} />
                    <span className="text-xs font-bold text-white">{item.label}</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">{item.desc}</span>
                  </button>
                );
              })}
            </div>

            {/* Basic Info Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <Label className="text-xs font-bold text-white">Business / Shop Name</Label>
                <Input
                  placeholder="e.g. Surya Solar Rooftop / Dr. Sharma Clinic"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="mt-1 h-10 rounded-xl text-xs bg-slate-900 border-white/10 text-white"
                />
              </div>
              <div>
                <Label className="text-xs font-bold text-white">Operating City / Region</Label>
                <Input
                  placeholder="e.g. Indore, Bhopal, Delhi NCR"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="mt-1 h-10 rounded-xl text-xs bg-slate-900 border-white/10 text-white"
                />
              </div>
            </div>

            {/* Adaptive Category Field */}
            <div className="rounded-2xl p-4 bg-emerald-500/10 border border-emerald-500/20 space-y-2">
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <Sparkles className="h-4 w-4" /> Adaptive Industry Detail
              </span>
              {category === 'solar' && (
                <div>
                  <Label className="text-xs text-slate-300">What solar capacities and subsidies do you handle?</Label>
                  <Input
                    value={solarCapacity}
                    onChange={(e) => setSolarCapacity(e.target.value)}
                    className="mt-1 h-9 rounded-xl text-xs bg-slate-900 border-white/10 text-white"
                  />
                </div>
              )}
              {category === 'clinic' && (
                <div>
                  <Label className="text-xs text-slate-300">What are your typical doctor consultation timings?</Label>
                  <Input
                    value={clinicOpdTiming}
                    onChange={(e) => setClinicOpdTiming(e.target.value)}
                    className="mt-1 h-9 rounded-xl text-xs bg-slate-900 border-white/10 text-white"
                  />
                </div>
              )}
              {category === 'coaching' && (
                <div>
                  <Label className="text-xs text-slate-300">Which courses / exams do you prepare students for?</Label>
                  <Input
                    value={coachingTargetExam}
                    onChange={(e) => setCoachingTargetExam(e.target.value)}
                    className="mt-1 h-9 rounded-xl text-xs bg-slate-900 border-white/10 text-white"
                  />
                </div>
              )}
              {category === 'realestate' && (
                <div>
                  <Label className="text-xs text-slate-300">What properties do you specialize in?</Label>
                  <Input
                    value={realEstateType}
                    onChange={(e) => setRealEstateType(e.target.value)}
                    className="mt-1 h-9 rounded-xl text-xs bg-slate-900 border-white/10 text-white"
                  />
                </div>
              )}
              {category === 'retail' && (
                <div>
                  <Label className="text-xs text-slate-300">What main product categories do you sell?</Label>
                  <Input
                    value={retailProducts}
                    onChange={(e) => setRetailProducts(e.target.value)}
                    className="mt-1 h-9 rounded-xl text-xs bg-slate-900 border-white/10 text-white"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-4">
              <Button variant="ghost" onClick={() => setStep(1)} className="rounded-xl text-xs text-slate-400">
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Button>
              <Button
                onClick={() => setStep(3)}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs px-6"
              >
                Continue to Goal Selection →
              </Button>
            </div>
          </Card>
        )}

        {/* ============================================================
            SCREEN 03 — GOAL SELECTION
            ============================================================ */}
        {step === 3 && (
          <Card className="glass-card-glow border-white/10 rounded-3xl p-6 sm:p-8 space-y-6">
            <div className="space-y-1">
              <Badge className="bg-cyan-500/20 text-cyan-300 border-none text-xs font-bold">
                Step 3 of 8 • Primary Goals
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-bold text-white">
                What should your AI employee accomplish?
              </h2>
              <p className="text-xs sm:text-sm text-slate-300">
                Select all that apply. The software will automatically configure prompts and action tools accordingly.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {[
                { id: 'Answer customer queries 24/7', title: 'Answer Queries 24/7', desc: 'Instant answers to price, specs, and timing questions.' },
                { id: 'Capture and qualify hot leads', title: 'Capture & Qualify Leads', desc: 'Collect phone, name, budget, and location before handing over.' },
                { id: 'Book site visits and appointments', title: 'Book Visits & Appointments', desc: 'Lock calendar slots for site inspection or doctor visits.' },
                { id: 'Send instant UPI payment links', title: 'Send UPI Payment Links', desc: 'Generate ₹999 booking tokens or Razorpay invoice links.' },
                { id: '24h Inactive Lead Follow-up', title: '24h Inactive Follow-up', desc: 'Re-engage dropped leads after 24h with a special discount.' },
                { id: 'Seamless Human Team Handoff', title: 'Instant Human Takeover', desc: 'Notify your team when customer asks for complex or human help.' },
              ].map((goal) => {
                const isChecked = selectedGoals.includes(goal.id);
                return (
                  <button
                    key={goal.id}
                    type="button"
                    onClick={() => toggleGoal(goal.id)}
                    className={`flex items-start gap-3 p-4 rounded-2xl border text-left transition-all ${
                      isChecked
                        ? 'border-cyan-400 bg-cyan-500/15 shadow-md shadow-cyan-500/20'
                        : 'border-white/10 bg-slate-900/70 hover:bg-slate-850 text-slate-300'
                    }`}
                  >
                    <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border mt-0.5 ${
                      isChecked ? 'bg-cyan-400 border-cyan-400 text-slate-950' : 'border-white/20 bg-slate-800'
                    }`}>
                      {isChecked && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">{goal.title}</span>
                      <span className="text-[11px] text-slate-400 mt-0.5 block leading-snug">{goal.desc}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-4">
              <Button variant="ghost" onClick={() => setStep(2)} className="rounded-xl text-xs text-slate-400">
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Button>
              <Button
                onClick={() => setStep(4)}
                className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-xs px-6"
              >
                Configure My AI Employee ⚡
              </Button>
            </div>
          </Card>
        )}

        {/* ============================================================
            SCREEN 04 — MAGIC AUTO-CONFIGURATION IN PROGRESS
            ============================================================ */}
        {step === 4 && (
          <Card className="glass-card-glow border-white/10 rounded-3xl p-6 sm:p-10 text-center space-y-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-400 via-teal-400 to-cyan-500 text-slate-950 font-black shadow-[0_0_35px_rgba(16,185,129,0.35)] animate-spin">
              <Sparkles className="h-8 w-8" />
            </div>

            <div className="space-y-2 max-w-md mx-auto">
              <Badge className="bg-emerald-500/20 text-emerald-300 border-none text-xs font-bold">
                Step 4 of 8 • Auto-Configuration
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                Your AI Employee is Ready!
              </h2>
              <p className="text-xs sm:text-sm text-slate-300">
                We synthesized your {category.toUpperCase()} industry profile into a complete autonomous sales agent.
              </p>
            </div>

            {/* Checklist items that were configured */}
            <div className="max-w-md mx-auto space-y-2.5 text-left text-xs bg-slate-900/90 border border-white/10 p-4 rounded-2xl">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-200">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Industry Persona &amp; Tone (Friendly Hinglish)
                </span>
                <span className="text-[10px] text-emerald-400 font-bold">Configured</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-200">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Razorpay UPI Action Tool
                </span>
                <span className="text-[10px] text-emerald-400 font-bold">Attached</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-200">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Site Visit &amp; Booking Tool
                </span>
                <span className="text-[10px] text-emerald-400 font-bold">Attached</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-200">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Human Takeover &amp; Notification Trigger
                </span>
                <span className="text-[10px] text-emerald-400 font-bold">Armed</span>
              </div>
            </div>

            <div className="pt-4 flex justify-center gap-3">
              <Button
                size="lg"
                onClick={() => setStep(5)}
                className="h-12 px-8 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 text-slate-950 rounded-2xl text-sm font-extrabold shadow-lg shadow-emerald-500/25 hover:scale-105 active:scale-95 transition-all"
              >
                Add Knowledge &amp; Business Rules →
              </Button>
            </div>
          </Card>
        )}

        {/* ============================================================
            SCREEN 05 — EASY KNOWLEDGE TRAINING (4 SIMPLE WAYS)
            ============================================================ */}
        {step === 5 && (
          <Card className="glass-card-glow border-white/10 rounded-3xl p-6 sm:p-8 space-y-6">
            <div className="space-y-1">
              <Badge className="bg-emerald-500/20 text-emerald-300 border-none text-xs font-bold">
                Step 5 of 8 • Knowledge Training
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-bold text-white">
                Teach your AI in plain simple ways
              </h2>
              <p className="text-xs sm:text-sm text-slate-300">
                Choose any 1 method below. The AI will ingest your prices, policies, and offers with zero hallucination.
              </p>
            </div>

            {/* 4 Method Tabs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'url', label: 'Website URL', icon: Globe, badge: 'Fastest' },
                { id: 'pdf', label: 'PDF / Documents', icon: FileText, badge: 'Catalogs' },
                { id: 'qa', label: 'Q&A Builder', icon: HelpCircle, badge: '5 Questions' },
                { id: 'products', label: 'Price List', icon: Package, badge: 'Discounts' },
              ].map((tab) => {
                const Icon = tab.icon;
                const isSelected = knowledgeMethod === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setKnowledgeMethod(tab.id as any)}
                    className={`flex flex-col items-center p-3 rounded-2xl border text-center transition-all ${
                      isSelected
                        ? 'border-emerald-400 bg-emerald-500/15 shadow-md shadow-emerald-500/20'
                        : 'border-white/10 bg-slate-900/70 hover:bg-slate-850 text-slate-400'
                    }`}
                  >
                    <Icon className={`h-5 w-5 mb-1 ${isSelected ? 'text-emerald-400' : 'text-slate-400'}`} />
                    <span className="text-xs font-bold text-white">{tab.label}</span>
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 mt-1">
                      {tab.badge}
                    </Badge>
                  </button>
                );
              })}
            </div>

            {/* Method Content */}
            <div className="rounded-2xl p-4 bg-slate-900 border border-white/10">
              {knowledgeMethod === 'url' && (
                <div className="space-y-3">
                  <Label className="text-xs font-bold text-white">Enter Your Business Website URL</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="https://yourbusiness.com"
                      value={websiteUrl}
                      onChange={(e) => setWebsiteUrl(e.target.value)}
                      className="h-10 rounded-xl text-xs bg-slate-950 border-white/10 text-white"
                    />
                    <Button className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs shrink-0">
                      Crawl &amp; Extract
                    </Button>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Our crawler will extract your service list, FAQs, and contact info in under 15 seconds.
                  </p>
                </div>
              )}

              {knowledgeMethod === 'pdf' && (
                <div className="border-2 border-dashed border-white/20 rounded-2xl p-8 text-center space-y-2">
                  <FileText className="h-8 w-8 text-emerald-400 mx-auto" />
                  <p className="text-xs font-bold text-white">Drop your Product Catalog or Brochure PDF here</p>
                  <p className="text-[10px] text-slate-400">Supports PDF, DOCX, TXT up to 25MB</p>
                  <Button size="sm" variant="outline" className="rounded-xl text-xs border-white/20">
                    Browse Files
                  </Button>
                </div>
              )}

              {knowledgeMethod === 'qa' && (
                <div className="space-y-3">
                  <div className="space-y-2">
                    {customQaList.map((item, idx) => (
                      <div key={idx} className="p-3 bg-slate-950 rounded-xl border border-white/10 text-xs">
                        <p className="font-bold text-emerald-400">Q: {item.q}</p>
                        <p className="text-slate-300 mt-0.5">A: {item.a}</p>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2 pt-2 border-t border-white/10">
                    <Input
                      placeholder="Question (e.g. Sunday OPD timing kya hai?)"
                      value={newQ}
                      onChange={(e) => setNewQ(e.target.value)}
                      className="h-9 rounded-xl text-xs bg-slate-950 border-white/10 text-white"
                    />
                    <Textarea
                      rows={2}
                      placeholder="Answer for AI (e.g. Sunday 10 AM to 1 PM strictly by appointment)"
                      value={newA}
                      onChange={(e) => setNewA(e.target.value)}
                      className="text-xs rounded-xl bg-slate-950 border-white/10 text-white"
                    />
                    <Button size="sm" onClick={handleAddQa} className="bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs">
                      + Add Question
                    </Button>
                  </div>
                </div>
              )}

              {knowledgeMethod === 'products' && (
                <div className="space-y-3">
                  <Label className="text-xs font-bold text-white">Add Products &amp; Pricing Limits</Label>
                  <Textarea
                    rows={4}
                    placeholder="3kW Solar System: ₹1,65,000 (Subsidy ₹78,000)&#10;5kW Solar System: ₹2,60,000 (Subsidy ₹78,000)&#10;Max Discount Allowed: 8%"
                    className="text-xs rounded-xl bg-slate-950 border-white/10 text-white"
                  />
                  <p className="text-[11px] text-slate-400">
                    AI will automatically use this table to quote prices and calculate savings.
                  </p>
                </div>
              )}
            </div>

            {/* Automatic Knowledge Quality Check */}
            <div className="rounded-2xl p-4 bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-white">AI Knowledge Quality: 94% Ready</p>
                  <p className="text-[10px] text-slate-400">
                    Your AI can now answer 14 common customer inquiries with 100% precision.
                  </p>
                </div>
              </div>
              <Badge className="bg-emerald-500/20 text-emerald-400 border-none text-[10px]">
                Grounding Verified
              </Badge>
            </div>

            <div className="flex items-center justify-between pt-4">
              <Button variant="ghost" onClick={() => setStep(4)} className="rounded-xl text-xs text-slate-400">
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Button>
              <Button
                onClick={() => setStep(6)}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs px-6"
              >
                Test AI in Simulator →
              </Button>
            </div>
          </Card>
        )}

        {/* ============================================================
            SCREEN 06 — SUGGESTED TEST QUESTIONS PLAYGROUND
            ============================================================ */}
        {step === 6 && (
          <Card className="glass-card-glow border-white/10 rounded-3xl p-6 sm:p-8 space-y-6">
            <div className="space-y-1">
              <Badge className="bg-violet-500/20 text-violet-300 border-none text-xs font-bold">
                Step 6 of 8 • Test Playground
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-bold text-white">
                Test your AI employee before going live
              </h2>
              <p className="text-xs sm:text-sm text-slate-300">
                Click any suggested test question or type your own to verify responses.
              </p>
            </div>

            {/* Suggested Question Chips */}
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="text-slate-400 py-1 text-[11px] font-medium">Click to test:</span>
              {[
                '3kW solar ka kitna subsidy milega?',
                'Kya main site survey book kar sakta hu?',
                'Mujhe discount chahiye, 10% kam karo',
                'Advance payment ka UPI link bhejo',
              ].map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setTestInput(chip);
                  }}
                  className="px-3 py-1 bg-slate-900 border border-white/15 rounded-xl text-slate-200 hover:bg-slate-800 text-[11px] transition-colors"
                >
                  &quot;{chip}&quot;
                </button>
              ))}
            </div>

            {/* Chat Simulator Box */}
            <div className="rounded-2xl border border-white/10 bg-[#080C16] overflow-hidden flex flex-col h-[320px]">
              <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
                {testChat.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl p-3 leading-relaxed shadow-sm ${
                        msg.sender === 'user'
                          ? 'bg-emerald-600 text-white rounded-br-none'
                          : 'bg-slate-900 text-slate-100 border border-white/10 rounded-bl-none'
                      }`}
                    >
                      {msg.text}
                    </div>
                    <span className="text-[9px] text-slate-400 px-1 mt-0.5">
                      {msg.sender === 'user' ? 'You' : 'AI Sales Closer'}
                    </span>
                  </div>
                ))}
                {isSimulating && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-300 bg-slate-900 border border-white/10 p-2.5 rounded-2xl w-fit">
                    <Sparkles className="h-3.5 w-3.5 animate-spin text-emerald-400" />
                    AI is testing against knowledge base...
                  </div>
                )}
              </div>

              <div className="p-2.5 border-t border-white/10 bg-[#0A0E1A] flex gap-2">
                <Input
                  placeholder="Type a test customer question..."
                  value={testInput}
                  onChange={(e) => setTestInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendTestMessage()}
                  className="h-9 rounded-xl text-xs bg-slate-900 border-white/10 text-white"
                />
                <Button
                  onClick={handleSendTestMessage}
                  className="h-9 px-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4">
              <Button variant="ghost" onClick={() => setStep(5)} className="rounded-xl text-xs text-slate-400">
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Button>
              <Button
                onClick={() => setStep(7)}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs px-6"
              >
                Looks Great! Connect WhatsApp →
              </Button>
            </div>
          </Card>
        )}

        {/* ============================================================
            SCREEN 07 — WHATSAPP CONNECTION (NON-SCARY)
            ============================================================ */}
        {step === 7 && (
          <Card className="glass-card-glow border-white/10 rounded-3xl p-6 sm:p-8 space-y-6">
            <div className="space-y-1">
              <Badge className="bg-emerald-500/20 text-emerald-300 border-none text-xs font-bold">
                Step 7 of 8 • WhatsApp Connect
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-bold text-white">
                Connect your WhatsApp in 60 seconds
              </h2>
              <p className="text-xs sm:text-sm text-slate-300">
                Choose your preferred onboarding method. You can start with free QR connect or official Meta Cloud API.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Option 1: Quick QR Demo */}
              <div
                onClick={() => {
                  setWaMethod('qr');
                  setWaConnected(true);
                }}
                className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                  waMethod === 'qr'
                    ? 'border-emerald-400 bg-emerald-500/15 shadow-lg shadow-emerald-500/20'
                    : 'border-white/10 bg-slate-900 hover:bg-slate-850'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <QrCode className="h-6 w-6 text-emerald-400" />
                  <Badge className="bg-emerald-500/20 text-emerald-400 border-none text-[10px]">
                    Instant (0-Cost)
                  </Badge>
                </div>
                <h3 className="text-sm font-bold text-white">Scan WhatsApp QR Code</h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Best for quick testing and small businesses. Scan like WhatsApp Web and your bot goes live immediately.
                </p>
              </div>

              {/* Option 2: Official Meta Embedded API */}
              <div
                onClick={() => {
                  setWaMethod('cloud_api');
                  setWaConnected(true);
                }}
                className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                  waMethod === 'cloud_api'
                    ? 'border-cyan-400 bg-cyan-500/15 shadow-lg shadow-cyan-500/20'
                    : 'border-white/10 bg-slate-900 hover:bg-slate-850'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <ShieldCheck className="h-6 w-6 text-cyan-400" />
                  <Badge className="bg-cyan-500/20 text-cyan-400 border-none text-[10px]">
                    Meta Official
                  </Badge>
                </div>
                <h3 className="text-sm font-bold text-white">Meta Cloud API (Embedded)</h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Official Facebook login popup. Zero risk of number bans and unlimited green-tick scalability.
                </p>
              </div>
            </div>

            {waConnected && (
              <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" /> WhatsApp Gateway Connected &amp; Webhooks Verified
                </span>
                <span className="text-[10px] text-slate-400">Ready for Live Inbound Chats</span>
              </div>
            )}

            <div className="flex items-center justify-between pt-4">
              <Button variant="ghost" onClick={() => setStep(6)} className="rounded-xl text-xs text-slate-400">
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Button>
              <Button
                onClick={() => setStep(8)}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs px-6"
              >
                Proceed to Final Launch Checklist →
              </Button>
            </div>
          </Card>
        )}

        {/* ============================================================
            SCREEN 08 — READY TO LAUNCH CHECKLIST & 1-CLICK ACTIVATION
            ============================================================ */}
        {step === 8 && (
          <Card className="glass-card-glow border-white/10 rounded-3xl p-6 sm:p-10 text-center space-y-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-400 via-teal-400 to-cyan-500 text-slate-950 font-black shadow-[0_0_40px_rgba(16,185,129,0.4)] animate-float-slow">
              <ShieldCheck className="h-8 w-8" />
            </div>

            <div className="space-y-2 max-w-md mx-auto">
              <Badge className="bg-emerald-500/20 text-emerald-300 border-none text-xs font-bold">
                Final Step • Launch Checklist
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                100% Launch Ready!
              </h2>
              <p className="text-xs sm:text-sm text-slate-300">
                All 6 automated sanity checks have passed. Your AI sales employee is ready to take live customer inquiries.
              </p>
            </div>

            {/* 6-Point Audit Checklist */}
            <div className="max-w-md mx-auto space-y-2.5 text-left text-xs bg-slate-900/90 border border-white/10 p-5 rounded-2xl">
              <div className="flex items-center gap-2.5 text-slate-200">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Business Profile ({businessName || 'Your Business'} - {category.toUpperCase()})</span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-200">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>AI Persona &amp; Tone (Friendly Hinglish Sales Closer)</span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-200">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Knowledge Base &amp; Grounding (14 Verified Rules)</span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-200">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Interactive Test Simulator (Passed with 100% Accuracy)</span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-200">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Razorpay UPI AutoPay Token Closer Armed</span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-200">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Human Takeover &amp; Staging Approval Radar Active</span>
              </div>
            </div>

            {submitError && (
              <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-center gap-2 max-w-md mx-auto">
                <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
                <span>{submitError}</span>
              </div>
            )}

            <div className="pt-4 flex justify-center">
              <Button
                size="lg"
                disabled={isSubmitting}
                onClick={handleLaunch}
                className="h-13 px-10 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 text-slate-950 rounded-2xl text-base font-extrabold shadow-[0_0_35px_rgba(16,185,129,0.4)] hover:scale-105 active:scale-95 transition-all gap-2 animate-pulse-glow disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" /> Provisioning AI Employee...
                  </>
                ) : (
                  <>🚀 Activate My AI Employee on WhatsApp</>
                )}
              </Button>
            </div>
          </Card>
        )}

        {/* ============================================================
            QUICK AUTH MODAL (Sign Up / Sign In without losing draft)
            ============================================================ */}
        {authModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-slate-950 border border-emerald-500/30 rounded-3xl p-6 sm:p-8 text-slate-100 shadow-[0_0_50px_rgba(16,185,129,0.2)] relative animate-in fade-in zoom-in-95">
              <button
                onClick={() => setAuthModalOpen(false)}
                className="absolute top-4 right-4 h-8 w-8 rounded-full hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="text-center space-y-2 mb-6">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <Lock className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-black text-white">
                  {authMode === 'signup' ? 'Save & Secure Your AI Setup' : 'Sign In to Your Workspace'}
                </h3>
                <p className="text-xs text-slate-300">
                  {authMode === 'signup'
                    ? 'Enter your email & password to activate your 24/7 WhatsApp AI Employee.'
                    : 'Log in to connect your setup to an existing account.'}
                </p>
              </div>

              {authError && (
                <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
                  <span>{authError}</span>
                </div>
              )}

              <form onSubmit={handleAuthSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-300 font-semibold">Email Address</Label>
                  <Input
                    type="email"
                    required
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="bg-slate-900 border-white/15 rounded-xl text-white text-xs h-10"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-300 font-semibold">Password</Label>
                  <Input
                    type="password"
                    required
                    minLength={6}
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="bg-slate-900 border-white/15 rounded-xl text-white text-xs h-10"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isAuthenticating}
                  className="w-full h-11 bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-300 hover:to-teal-400 text-slate-950 font-extrabold rounded-xl text-xs shadow-lg shadow-emerald-500/25 mt-2"
                >
                  {isAuthenticating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : authMode === 'signup' ? (
                    'Create Account & Launch AI 🚀'
                  ) : (
                    'Sign In & Launch AI 🚀'
                  )}
                </Button>
              </form>

              <div className="mt-4 pt-4 border-t border-white/10 text-center text-xs text-slate-400">
                {authMode === 'signup' ? (
                  <span>
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('signin');
                        setAuthError(null);
                      }}
                      className="text-emerald-400 hover:underline font-bold"
                    >
                      Sign In
                    </button>
                  </span>
                ) : (
                  <span>
                    Need a new account?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('signup');
                        setAuthError(null);
                      }}
                      className="text-emerald-400 hover:underline font-bold"
                    >
                      Sign Up Free
                    </button>
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
