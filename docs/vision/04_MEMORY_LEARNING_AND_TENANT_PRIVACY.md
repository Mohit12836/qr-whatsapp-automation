---
title: "Multi-Tier Memory Architecture, RAG Learning & Tenant Privacy"
document_id: "04_MEMORY_LEARNING_AND_TENANT_PRIVACY"
version: "1.0.0"
last_updated: "2026-10-03"
status: "APPROVED"
author: "Founder Vision Preservation"
tags: ["memory-architecture", "pgvector", "rag", "tenant-privacy", "data-isolation", "gdpr"]
---

# 🧠 04. Multi-Tier Memory Architecture, RAG Learning & Tenant Privacy

This document defines the deep relational memory engine, vector RAG retrieval, continuous learning loops, and strict multi-tenant privacy boundaries in Vismart AI SaaS.

---

## 🏛️ 1. Multi-Tier Memory Taxonomy

Vismart agents do not suffer from amnesia. They maintain a 4-tier cognitive memory model:

```mermaid
flowchart TD
    subgraph "Tier 1: Active Context (Working Memory)"
        T1["Immediate Chat Buffer<br/>(Last 10-15 messages in active session)"]
    end

    subgraph "Tier 2: Episodic Memory (Events & Conversations)"
        T2["Historical Chat Summaries & Milestones<br/>(pgvector chunks: 'Inquired about 3BHK flat on 15 Aug')"]
    end

    subgraph "Tier 3: Semantic & Preference Memory (Extracted Facts)"
        T3["Structured Profile Attributes<br/>(Budget: ₹45L, Preferred Size: Large, Vegetarian: Yes)"]
    end

    subgraph "Tier 4: Relational & Community Memory (Human Bond)"
        T4["Empathy & Lifecycle Data<br/>(City: Bhopal, Birthday: Oct 12, Festival Greetings, Tone: Formal)"]
    end

    T1 --> Engine["Cognitive Retrieval & Assembly Engine"]
    T2 --> Engine
    T3 --> Engine
    T4 --> Engine
    Engine --> AgentPrompt["Context-Enriched Agent System Prompt"]
```

---

## 🔍 2. Two-Stage RAG & Vector Retrieval Pipeline

When a customer messages the WhatsApp bot or web widget, the memory engine executes a high-speed (<150ms) context injection pipeline:

```mermaid
sequenceDiagram
    autonumber
    actor Customer
    participant Webhook as Inbound Webhook
    participant VectorDB as Supabase pgvector Store
    participant RelationalDB as PostgreSQL Profile
    participant LLM as Inference Gateway

    Customer->>Webhook: "Bhaiya pichli baar jo shirt dekhi thi usme blue color hai kya?"
    Webhook->>RelationalDB: Fetch Customer Profile (Contact ID, Lifecycle Stage, Tags)
    Webhook->>VectorDB: Query embeddings with Filter: account_id = X AND contact_id = Y
    VectorDB-->>Webhook: Returns top-3 relevant episodic chunks (e.g. "Browsed Linen Cotton Shirt, Size M")
    Webhook->>LLM: Injects Past Context + Catalog Availability
    LLM-->>Customer: "Haan Rahul ji! Pichli baar jo Linen Cotton Shirt aapne dekhi thi, usme Blue M size abhi stock mein hai. Razorpay link bhejoon?"
```

### Technical Implementation Standards:
- **Vector Storage:** Supabase `pgvector` with HNSW (Hierarchical Navigable Small World) index for sub-10ms search over millions of chunks.
- **Embedding Generation:** Compact, cost-effective embeddings (e.g., `text-embedding-3-small` or local BGE embeddings via LiteLLM).
- **Background Memory Condensation:** When a chat session closes, an asynchronous background worker condenses the dialogue into 1 semantic summary chunk and updates extracted profile tags.

---

## 🔒 3. Strict Multi-Tenant Privacy & Data Isolation

Data privacy is non-negotiable. Vismart operates under a **Zero-Leakage Guarantee**:

```mermaid
flowchart LR
    subgraph "Tenant A (Jewelry Store Jaipur)"
        A_Data[("PostgreSQL Rows & pgvector<br/>account_id: A101")]
        A_RLS["Row Level Security (RLS) Policy"]
        A_Data --- A_RLS
    end

    subgraph "Tenant B (Real Estate Indore)"
        B_Data[("PostgreSQL Rows & pgvector<br/>account_id: B202")]
        B_RLS["Row Level Security (RLS) Policy"]
        B_Data --- B_RLS
    end

    subgraph "Global Anonymized Insights (No PII)"
        MetaPlaybook["Meta Conversion Playbook<br/>(Aggregated conversion timings, non-PII metrics)"]
    end

    A_RLS -.->|Hard Barrier| B_Data
    B_RLS -.->|Hard Barrier| A_Data
    A_Data -->|Strictly Anonymized Pattern| MetaPlaybook
    B_Data -->|Strictly Anonymized Pattern| MetaPlaybook
```

### Privacy Rules:
1. **Row Level Security (RLS) Enforcement:** Every vector search query MUST include a hard SQL predicate `WHERE account_id = auth.account_id()`. No agent can ever query outside its tenant boundary.
2. **No Model Training on Private Tenant Data:** Customer conversations, contact numbers, and private catalogs are NEVER sent to third parties for fine-tuning or shared model training.
3. **Global Learning Abstraction:** Only abstract structural heuristics (e.g., *"Prompting with urgency 24 hours after pricing inquiry yields 22% higher response"*) are recorded in global best-practice playbooks. Zero PII, phone numbers, or private pricing are ever stored globally.

---

## 🗑️ 4. Data Ownership, Export & Right-to-be-Forgotten (GDPR / DPDP)

- **1-Click Export:** Business owners can export their entire customer list, chat history, and vector embeddings in standard JSON / CSV format at any time.
- **Permanent Deletion:** When an account or contact requests deletion, a cascading database purge deletes all relational records, message logs, and vector embeddings permanently.
- **Audit Logs:** Every export and purge action is permanently logged in the tenant's security audit register.
