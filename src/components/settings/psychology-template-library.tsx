'use client';

import { useMemo, useState } from 'react';
import { Sparkles, Search, CheckCircle2, Zap } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import templatesData from '@/data/psychology_100_templates.json';

export interface PsychologyTemplateItem {
  category_id: string;
  industry: string;
  name: string;
  category: 'UTILITY' | 'MARKETING';
  language: string;
  header?: string;
  body: string;
  footer?: string;
  buttons?: Array<{ type: 'QUICK_REPLY'; text: string }>;
  example?: { body_text?: string[][] };
}

const INDUSTRIES = [
  { id: 'all', label: 'All Industries (100)' },
  { id: 'kirana', label: 'Kirana & Grocery' },
  { id: 'clothing', label: 'Clothing & Fashion' },
  { id: 'jewellery', label: 'Jewellery & Gold' },
  { id: 'clinic', label: 'Clinic & Healthcare' },
  { id: 'salon', label: 'Salon & Beauty' },
  { id: 'restaurant', label: 'Restaurant & Sweets' },
  { id: 'realestate', label: 'Real Estate' },
  { id: 'education', label: 'Education & Coaching' },
  { id: 'automobile', label: 'Automobile & Garage' },
  { id: 'b2b', label: 'B2B Wholesale' },
] as const;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectTemplate: (tpl: PsychologyTemplateItem) => void;
}

export function PsychologyTemplateLibraryDialog({
  open,
  onOpenChange,
  onSelectTemplate,
}: Props) {
  const [industry, setIndustry] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'UTILITY' | 'MARKETING'>('ALL');
  const [search, setSearch] = useState('');

  const items = templatesData as PsychologyTemplateItem[];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((t) => {
      if (industry !== 'all' && t.category_id !== industry) return false;
      if (categoryFilter !== 'ALL' && t.category !== categoryFilter) return false;
      if (!q) return true;
      return (
        t.name.toLowerCase().includes(q) ||
        t.body.toLowerCase().includes(q) ||
        (t.header || '').toLowerCase().includes(q) ||
        t.industry.toLowerCase().includes(q)
      );
    });
  }, [items, industry, categoryFilter, search]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden bg-background">
        <DialogHeader className="px-6 pt-6 pb-3 border-b border-border">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="size-5 text-emerald-500" />
            100 Ready-to-Send Indian Business Templates
          </DialogTitle>
          <DialogDescription className="text-xs">
            Curated customer-psychology scripts engineered for high engagement and 11-paise Meta Utility approval. Click any template to load and submit to your WhatsApp Business Account.
          </DialogDescription>
        </DialogHeader>

        {/* Controls */}
        <div className="px-6 py-3 border-b border-border space-y-3 bg-muted/20">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search templates (e.g. order, khata, gold, appointment)..."
                className="pl-9 h-9 bg-background"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <Button
                size="sm"
                variant={categoryFilter === 'ALL' ? 'default' : 'outline'}
                onClick={() => setCategoryFilter('ALL')}
                className="h-8 text-xs"
              >
                All ({items.length})
              </Button>
              <Button
                size="sm"
                variant={categoryFilter === 'UTILITY' ? 'default' : 'outline'}
                onClick={() => setCategoryFilter('UTILITY')}
                className="h-8 text-xs"
              >
                <Zap className="size-3.5 mr-1 text-emerald-400" />
                Utility (11p)
              </Button>
              <Button
                size="sm"
                variant={categoryFilter === 'MARKETING' ? 'default' : 'outline'}
                onClick={() => setCategoryFilter('MARKETING')}
                className="h-8 text-xs"
              >
                Marketing
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {INDUSTRIES.map((ind) => (
              <button
                key={ind.id}
                type="button"
                onClick={() => setIndustry(ind.id)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors border ${
                  industry === ind.id
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background text-muted-foreground border-border hover:text-foreground'
                }`}
              >
                {ind.label}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-6 grid gap-3 sm:grid-cols-2">
          {filtered.length === 0 ? (
            <div className="col-span-full py-12 text-center text-sm text-muted-foreground">
              No templates matched your filter. Try clearing the search box.
            </div>
          ) : (
            filtered.map((tpl) => (
              <div
                key={tpl.name}
                className="flex flex-col justify-between rounded-xl border border-border bg-card p-4 gap-3 hover:border-primary/50 transition-colors"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[11px] font-mono text-muted-foreground break-all">
                      {tpl.name}
                    </span>
                    <Badge
                      variant="outline"
                      className={
                        tpl.category === 'UTILITY'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shrink-0 text-[10px]'
                          : 'bg-purple-500/10 text-purple-400 border-purple-500/30 shrink-0 text-[10px]'
                      }
                    >
                      {tpl.category === 'UTILITY' ? 'UTILITY • 11p' : 'MARKETING'}
                    </Badge>
                  </div>
                  {tpl.header && (
                    <p className="text-xs font-semibold text-foreground">{tpl.header}</p>
                  )}
                  <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {tpl.body}
                  </p>
                  {tpl.buttons && tpl.buttons.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {tpl.buttons.map((b, idx) => (
                        <span
                          key={idx}
                          className="rounded-md bg-muted px-2 py-0.5 text-[10px] text-foreground border border-border"
                        >
                          ↩ {b.text}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border/60">
                  <span className="text-[10px] text-muted-foreground">{tpl.industry}</span>
                  <Button
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => {
                      onSelectTemplate(tpl);
                      onOpenChange(false);
                    }}
                  >
                    <CheckCircle2 className="size-3.5 mr-1" />
                    Use Template
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
