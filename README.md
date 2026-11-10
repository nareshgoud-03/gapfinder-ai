# GapFinder AI – Find What the Student Doesn't Know

> **iGebra.ai AI Intern Hackathon 2026 Solution**  
> *Track: Problem Statement 2 (Ed-Tech AI)*  
> *Core Focus: A Diagnosis, Not Just Answers*

---

## 🌟 Executive Summary

Most study tools and chatbots wait for the student to ask a question. **A student cannot ask about a knowledge gap they do not know they have.**

**GapFinder AI** acts like an educational diagnostician. Instead of passively answering prompts, it:
1. **Indexes the student's actual curriculum:** Syllabus PDFs, textbook chapters, teacher revision notes, and past examination papers.
2. **Builds a hierarchical Topic Map:** Links syllabus topics with past examination frequency and weightage.
3. **Conducts Context-Grounded Diagnostic Quizzes:** Generates questions derived exclusively from the uploaded source text, accompanied by verifiable section and page citations.
4. **Produces a Deep Knowledge Gap Diagnosis:** Classifies every topic into 🔴 **Weak** (<50%), 🟡 **Medium** (50%–75%), and 🟢 **Strong** (>75%) with explicit diagnostic reasons (what the student missed) and treatment prescriptions.
5. **Generates an Adaptive Revision Plan:** Automatically schedules the weakest and most exam-critical topics first, tailored to the student's available days and daily study hours.
6. **Self-Updates dynamically:** As the student completes targeted practice and retakes diagnostic quizzes, the Gap Report and Revision Plan recalibrate automatically.
7. **Strict RAG "Explain This Topic" Tutor:** Answers conceptual questions solely from the uploaded materials, strictly refusing to hallucinate outside the text.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Lucide React, Recharts |
| **Styling & Design** | Modern EdTech SaaS design system inspired by Linear and Notion (Slate/Navy with Indigo/Purple accents) |
| **AI LLM Inference** | Groq API (`llama-3.3-70b-versatile` / `llama-3.1-8b-instant`), Vercel AI SDK |
| **Embeddings & Vector Search** | 384-dimensional dense semantic embeddings (`sentence-transformers/all-MiniLM-L6-v2` / Hugging Face Inference API / Local Cosine Vectorizer) |
| **Document Processing** | `pdf-parse`, recursive sliding-window text chunker (600 characters with 120 character overlap) |
| **Database & Auth** | Supabase PostgreSQL with `pgvector` extension, Row Level Security (RLS) policies |
| **Deployment** | Vercel, GitHub |

---

## 🧠 Transparent RAG Architecture

GapFinder AI enforces a strict architectural boundary between **Retrieval** and **Generation**:

```
[ Uploaded Documents ] (PDF / TXT: Syllabus, Textbooks, Past Papers)
        │
        ▼
[ Document Parser & Chunker ] (600-char sliding window with section headers)
        │
        ▼
[ 384-dim Dense Embeddings ] (Normalized vector space)
        │
        ▼
[ Vector Similarity Search ] (Top-K cosine similarity matching)
        │
        ├─────────────────────────────────────────────────┐
        ▼                                                 ▼
[ Diagnostic Question Generator ]            [ Explain-This-Topic RAG Tutor ]
(Generates questions grounded in text)        (Answers exclusively from passages)
        │                                                 │
        ▼                                                 ▼
[ Student Answer Evaluation ]                 [ Verifiable Citations ]
(Why right/wrong + source citations)          (e.g., "NCERT Vol 2, Sec 7.6, p. 320")
        │
        ▼
[ Topic-Level Gap Analysis ] (🔴 Weak, 🟡 Medium, 🟢 Strong)
        │
        ▼
[ Adaptive Revision Planner ] (Prioritized by weakness + exam frequency)
```

- **Where Retrieval is used:** Query embedding, cosine similarity calculation against document chunks, and retrieving relevant citations.
- **Where Generation is used:** LLM formulation of MCQ distractors, step-by-step diagnostic explanations, and structured revision plans.
- **How they are kept separate:** The LLM is never allowed to answer from general pre-training memory; if retrieved context has a similarity below the confidence threshold, the guardrail triggers: *"I couldn't find sufficient information about this topic in your uploaded materials."*

---

## 🚀 Quick Start & Local Setup

### 1. Clone the repository
```bash
git clone https://github.com/your-username/gapfinder-ai.git
cd gapfinder-ai
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Groq API (Free key from https://console.groq.com)
GROQ_API_KEY=gsk_your_groq_api_key_here
GROQ_MODEL=llama-3.3-70b-versatile

# Hugging Face Embeddings (Optional)
HUGGINGFACE_API_KEY=hf_your_huggingface_api_key_here

# Supabase (Optional for cloud vector storage, schema provided in schema.sql)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

> **Note for Evaluators:** The application includes a self-contained offline grounded vector engine and pre-seeded curriculum dataset. It runs out-of-the-box even before external API keys are configured!

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Production Build
```bash
npm run build
npm run start
```

---

## 🔑 Demo Credentials for Evaluators

For instant evaluation without creating an account:
- **Email:** `student.demo@gapfinder.ai`
- **Password:** `demo2026`
- Or simply click the **"One-Click Login as Demo Student"** or **"Explore Demo"** button on the landing page or login screen!

### Pre-Seeded Sample Curriculum:
- **Curriculum:** Class 12 CBSE & College Advanced Calculus & Differential Equations
- **Uploaded Documents:**
  1. `Class-12-Mathematics-Syllabus-2026.pdf` (Curriculum structure & exam weights)
  2. `NCERT-Calculus-Comprehensive-Textbook.pdf` (Theory, theorems, and solved examples)
  3. `Past-Board-Exam-Papers-2023-2025.pdf` (Past 3 years of board questions with mark schemes)
  4. `Teacher-Notes-Calculus-Pitfalls.txt` (Common student pitfalls and formula traps)
- **Pre-Diagnosed Gaps:**
  - 🔴 **Weak (33%):** *Linear Differential Equations (Integrating Factor)* – Error in $e^{-\ln x} = \frac{1}{x}$.
  - 🔴 **Weak (50%):** *Integration by Parts (ILATE)* – Recursive looping in $e^x \sin x$.
  - 🟡 **Medium (50%):** *Differentiation & Chain Rule* – Missing inner differentials in composite functions.
  - 🟡 **Medium (50%):** *Definite Integrals & King's Property* – Arithmetic error in the final $2I$ step.
  - 🟢 **Strong (100%):** *Limits & Continuity*, *Indefinite Integrals*, *Maxima & Minima*.

---

## 🗄️ Supabase Database Setup

To enable Supabase cloud storage:
1. Create a project at [supabase.com](https://supabase.com).
2. Go to **SQL Editor** in the Supabase dashboard.
3. Paste and run the entire contents of `schema.sql` (located in the project root).
   - Enables `vector` extension (`pgvector`).
   - Creates tables: `profiles`, `subjects`, `documents`, `document_chunks`, `topics`, `questions`, `quiz_attempts`, `student_answers`, `topic_mastery`, `revision_plans`, `revision_tasks`, and `chat_history`.
   - Creates the vector similarity search function `match_document_chunks`.
   - Enables Row Level Security (RLS) policies.
4. Copy your project URL and Anon key into `.env.local`.

---

## 🌐 Vercel Deployment Instructions

1. Push your repository to GitHub.
2. Sign in to [Vercel](https://vercel.com) and click **"Add New Project"**.
3. Import your `gapfinder-ai` repository.
4. Set the Framework Preset to **Next.js**.
5. Add the Environment Variables:
   - `GROQ_API_KEY`: Your Groq API key
   - `GROQ_MODEL`: `llama-3.3-70b-versatile`
   - `NEXT_PUBLIC_APP_URL`: Your Vercel production URL
   - `NEXT_PUBLIC_SUPABASE_URL`: (Optional)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: (Optional)
6. Click **Deploy**. Vercel will build and deploy the application in under 2 minutes.

---

## 📋 Hackathon Requirements Verification Checklist

- [x] **Material Upload:** PDF & TXT parser, chunking, and semantic embedding extraction.
- [x] **Topic Map:** Hierarchical subject-chapter-topic structure with past exam question frequency.
- [x] **Diagnostic Quiz:** Multiple-choice quiz (5/10/20 questions) grounded in source material with source citations.
- [x] **Gap Report (The Main Output):** Categorizes topics into 🔴 Weak, 🟡 Medium, 🟢 Strong with specific reasons and prescriptions.
- [x] **Personalized Revision Plan:** Adaptive daily schedule ordered by weakness and exam importance, updating when student retests.
- [x] **Strict RAG AI Tutor:** Answers strictly from uploaded material with citations; guardrails against unsupported queries.
- [x] **Progress Dashboard:** Tracks accuracy and mastery evolution across sequential attempts using Recharts.
- [x] **Demo Mode & Credentials:** One-click demo login with pre-loaded high-yield curriculum data for evaluators.
- [x] **Clean Architecture:** Zero private keys exposed to client; strict separation of retrieval vs generation.

---

*Developed for the iGebra.ai AI Intern Hackathon 2026.*
