---
title: "Master Decisions Register, Taxonomy, Documentation Gap Review & Open Questions"
document_id: "10_DECISIONS_REGISTER_AND_OPEN_QUESTIONS"
version: "5.0.0"
last_updated: "2026-10-05"
status: "Founder Confirmed"
author: "Founder & Engineering Governance"
tags: ["decisions-register", "taxonomy", "gap-review", "open-questions", "superadmin-rules", "multi-expert-ceo", "multi-brand-engine"]
---

# 📋 10. Master Decisions Register, Taxonomy & Documentation Gap Review

This document serves as the permanent governance record for all architectural, economic, and product decisions in Vismart AI SaaS. It enforces a strict **6-State Status Taxonomy** and provides an honest, rigorous **Documentation Gap Review**.

---

## 🏷️ 1. Mandatory 6-State Status Taxonomy

Every architectural component, pricing model, technical proposal, and policy in Vismart MUST carry one of the following exact statuses:

| Status Label | Formal Definition | Authority / Criteria |
|---|---|---|
| `Founder Confirmed` | Explicitly stated and mandated by the Founder as core vision, philosophy, or rule. | Founder Direct Instruction |
| `Technical Recommendation` | Best-practice engineering or architectural approach proposed by the engineering team. | Lead Engineer / Architect |
| `Proposed` | Business feature, monetization model, or workflow candidate submitted for founder review. | Product / AI Proposal |
| `Open Question` | Unresolved tradeoff, dilemma, or policy requiring explicit founder decision. | Requires Founder Clarification |
| `Implemented` | Fully coded, integrated, and present in the codebase. | Coded in `src/` or `supabase/` |
| `Verified` | Validated through automated test suites (e.g. Vitest 90/90 passing) and end-to-end proofs. | Passing CI / Test Suite |

---

## 🏛️ 2. Master Status Registry of Architectural & Business Decisions

| Decision / Feature Item | Category | Status | Rationale / Source |
|---|---|:---:|---|
| **Multi-Brand Vertical Generator (1 Engine $\to$ 10 Brands)** | Go-To-Market & Growth | `Founder Confirmed` | Founder can command Admin AI CEO to spawn niche brands (e.g. `ClinicSmart.ai`, `TextileBot.ai`, `EstatesCloser.ai`) on custom domains with tailored landing pages and industry AI agents. |
| **Dedicated Dynamic Landing Pages & Custom Domains** | Omnichannel & Web | `Founder Confirmed` | Every client/vertical gets an instant auto-generated Landing Page on `client.vismart.ai` or custom domain (`chat.brand.com`) with embedded 24/7 AI chatbot. |
| **Flexible SuperAdmin Business Rule Engine** | Admin Architecture | `Founder Confirmed` | Zero hardcoded rules. Founder can switch between B2B Wholesale and B2C Retail, adjust pricing, MOQ, and limits via Admin or Chat. |
| **Private AI CEO as Multi-Expert Advisory Council** | Executive Ops | `Founder Confirmed` | 24/7 monitoring acting across 5 expert personas (Sales, Pricing, Risk, Factory, Strategy) with 1-tap plain-language approvals. |
| **Autonomous AI Workforce Platform (Not dumb chatbot)** | Core Identity | `Founder Confirmed` | Founder explicit vision: Goal-driven agents that close sales and run workflows. |
| **Growth Partner Model (*"Grahak kamayega to hum kamayenge"* )** | Business Ethos | `Founder Confirmed` | Win-Win alignment; mutual prosperity rather than parasitic extraction. |
| **High-Ticket B2B Manufacturer & Wholesaler Strategy** | Target Market | `Founder Confirmed` | Priority focus on B2B hubs (Surat, Morbi, Rajkot, etc.) with tiered volume pricing and MOQ gatekeeping. |
| **Truth Over Flattery (AI provides honest facts & critique)** | AI Behavior | `Founder Confirmed` | AI must challenge flawed assumptions with data, logic, and respectful honesty. |
| **Founder Sovereign Approval (Simple Hindi/English 1-Tap)** | Governance | `Founder Confirmed` | Founder retains ultimate veto and direction without being bogged in micro-tasks. |
| **Customer Sovereignty (Freely build, train & control their AI)** | Customer Rights | `Founder Confirmed` | Customers own their data and control their agents without technical lock-in. |
| **Official WhatsApp Cloud API (WACA) Exclusivity** | Infrastructure | `Technical Recommendation` | Eliminates number ban risks associated with unofficial web scrapers. |
| **Supabase `pgvector` HNSW Memory Architecture** | Data & Memory | `Technical Recommendation` | Sub-15ms semantic retrieval with native PostgreSQL Row Level Security (RLS). |
| **7-Tier Autonomy Matrix (Level 0 to Level 6)** | Safety & Auth | `Technical Recommendation` | Structured guardrails preventing unauthorized financial mutations. |
| **Prepaid Transparent Recharge Wallet (Jio Style)** | Monetization | `Technical Recommendation` | Direct deduction of Meta fees and token costs with zero hidden debt. |
| **Prohibited Categories Automated Shield** | Ethics & Safety | `Proposed` | Filters against harmful domains (slaughter/meat, gambling, fraud) per ethical guidance. |
| **Core IP Prompt Shielding (Server-side vault)** | Security & IP | `Technical Recommendation` | Protects system prompts and reasoning logic from client-side inspection. |
| **Zero-Limit Gateway Proxy (Port 4000 LiteLLM)** | Infrastructure | `Implemented` | Multi-key load balancing across free/low-cost LLMs with automatic fallbacks. |
| **100% Passing Vitest Test Suite (90/90 suites, 1089 tests)** | Quality & QA | `Verified` | Automated end-to-end regression and concurrency verification. |

---

## 🔍 3. Documentation Gap Review & Resolution

All capabilities—from Multi-Brand Niche Vertical generation to Custom Domain Landing Pages, Flexible SuperAdmin, and Multi-Expert AI CEO—are now recorded as canonical Founder-Confirmed pillars.
