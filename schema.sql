-- ==============================================================================
-- GapFinder AI – Supabase PostgreSQL Schema with pgvector
-- Hackathon PS 2026: "Find What the Student Doesn't Know"
-- ==============================================================================

-- 1. Enable pgvector extension for semantic similarity search
create extension if not exists vector;

-- 2. User Profiles
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text not null,
  email text not null,
  target_exam text default 'Class 12 CBSE & JEE Mathematics',
  target_grade text default 'Target: 95%+',
  exam_date date default '2026-03-15',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Subjects
create table if not exists public.subjects (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Documents (Syllabus, Textbooks, Notes, Past Exam Papers)
create table if not exists public.documents (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  subject_id uuid references public.subjects(id) on delete cascade,
  name text not null,
  type text check (type in ('syllabus', 'textbook', 'notes', 'past_papers')) not null,
  file_size bigint not null default 0,
  chunk_count integer default 0,
  status text check (status in ('processing', 'ready', 'error')) default 'processing',
  summary text,
  extracted_text_length integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Document Chunks & Vector Embeddings
create table if not exists public.document_chunks (
  id uuid default gen_random_uuid() primary key,
  document_id uuid references public.documents(id) on delete cascade not null,
  content text not null,
  page_number integer,
  section_citation text not null,
  topic_id uuid,
  embedding vector(384), -- 384 dimensions for all-MiniLM-L6-v2 / HuggingFace or 1536 for OpenAI
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Index for fast cosine similarity search
create index if not exists document_chunks_embedding_idx
  on public.document_chunks
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- 6. Topics (Hierarchical map extracted from syllabus)
create table if not exists public.topics (
  id uuid default gen_random_uuid() primary key,
  subject_id uuid references public.subjects(id) on delete cascade not null,
  chapter text not null,
  name text not null,
  description text,
  subtopics text[] default '{}',
  past_exam_frequency integer default 0,
  exam_weight text check (exam_weight in ('High', 'Medium', 'Low')) default 'Medium',
  source_citation text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. Diagnostic Questions (Generated from retrieved document chunks)
create table if not exists public.questions (
  id uuid default gen_random_uuid() primary key,
  topic_id uuid references public.topics(id) on delete cascade not null,
  question_text text not null,
  options jsonb not null, -- array of 4 choices
  correct_answer integer not null, -- 0-3
  explanation text not null,
  difficulty text check (difficulty in ('Easy', 'Medium', 'Hard')) default 'Medium',
  source_document text not null,
  source_citation text not null,
  grounded_context_snippet text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 8. Quiz Attempts
create table if not exists public.quiz_attempts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  attempt_number integer not null default 1,
  quiz_mode text check (quiz_mode in ('quick_5', 'standard_10', 'deep_20', 'topic_targeted')) default 'standard_10',
  topic_id uuid references public.topics(id) on delete set null,
  score integer not null default 0,
  total_questions integer not null default 0,
  accuracy numeric(5, 2) not null default 0.00,
  started_at timestamp with time zone default timezone('utc'::text, now()) not null,
  completed_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 9. Student Answers
create table if not exists public.student_answers (
  id uuid default gen_random_uuid() primary key,
  attempt_id uuid references public.quiz_attempts(id) on delete cascade not null,
  question_id uuid references public.questions(id) on delete cascade not null,
  selected_answer integer not null,
  correct_answer integer not null,
  is_correct boolean not null,
  explanation text,
  source_citation text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 10. Topic Mastery (Aggregated diagnosis per topic: Weak / Medium / Strong)
create table if not exists public.topic_mastery (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  topic_id uuid references public.topics(id) on delete cascade not null,
  accuracy numeric(5, 2) not null default 0.00,
  questions_attempted integer not null default 0,
  correct_count integer not null default 0,
  incorrect_count integer not null default 0,
  status text check (status in ('weak', 'medium', 'strong')) not null default 'medium',
  diagnosis_reason text not null,
  recommended_action text not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (user_id, topic_id)
);

-- 11. Personalized Revision Plans
create table if not exists public.revision_plans (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  available_days integer not null default 5,
  hours_per_day numeric(4, 1) not null default 2.0,
  target_exam_date date,
  total_study_hours numeric(5, 1) not null default 10.0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 12. Revision Tasks (Prioritized scheduled items)
create table if not exists public.revision_tasks (
  id uuid default gen_random_uuid() primary key,
  plan_id uuid references public.revision_plans(id) on delete cascade not null,
  day_number integer not null,
  topic_id uuid references public.topics(id) on delete cascade not null,
  status text check (status in ('weak', 'medium', 'strong')) not null,
  priority text check (priority in ('High', 'Medium', 'Low')) not null,
  duration_minutes integer not null default 60,
  learning_objective text not null,
  source_sections text[] default '{}',
  practice_items text[] default '{}',
  completed boolean default false,
  completed_at timestamp with time zone
);

-- 13. RAG AI Tutor Chat History
create table if not exists public.chat_history (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  role text check (role in ('user', 'assistant')) not null,
  content text not null,
  citations jsonb default '[]',
  is_grounding_sufficient boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ==============================================================================
-- Vector Similarity Match RPC Function
-- ==============================================================================
create or replace function match_document_chunks (
  query_embedding vector(384),
  match_threshold float,
  match_count int,
  filter_topic_id uuid default null
)
returns table (
  id uuid,
  document_id uuid,
  content text,
  page_number int,
  section_citation text,
  topic_id uuid,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    document_chunks.id,
    document_chunks.document_id,
    document_chunks.content,
    document_chunks.page_number,
    document_chunks.section_citation,
    document_chunks.topic_id,
    1 - (document_chunks.embedding <=> query_embedding) as similarity
  from document_chunks
  where
    (filter_topic_id is null or document_chunks.topic_id = filter_topic_id)
    and 1 - (document_chunks.embedding <=> query_embedding) > match_threshold
  order by document_chunks.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- ==============================================================================
-- Row Level Security (RLS) Policies
-- ==============================================================================
alter table public.profiles enable row level security;
alter table public.subjects enable row level security;
alter table public.documents enable row level security;
alter table public.document_chunks enable row level security;
alter table public.topics enable row level security;
alter table public.questions enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.student_answers enable row level security;
alter table public.topic_mastery enable row level security;
alter table public.revision_plans enable row level security;
alter table public.revision_tasks enable row level security;
alter table public.chat_history enable row level security;

-- Profiles: students read and update their own profile
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Documents: students manage their own documents
create policy "Users can view own documents" on public.documents for select using (auth.uid() = user_id);
create policy "Users can insert own documents" on public.documents for insert with check (auth.uid() = user_id);
create policy "Users can delete own documents" on public.documents for delete using (auth.uid() = user_id);

-- Quiz Attempts: students view and insert own attempts
create policy "Users can view own attempts" on public.quiz_attempts for select using (auth.uid() = user_id);
create policy "Users can insert own attempts" on public.quiz_attempts for insert with check (auth.uid() = user_id);

-- Topic Mastery: students view and update own mastery
create policy "Users can view own mastery" on public.topic_mastery for select using (auth.uid() = user_id);
create policy "Users can update own mastery" on public.topic_mastery for all using (auth.uid() = user_id);

-- Revision Plans: students manage own plans
create policy "Users can view own plans" on public.revision_plans for select using (auth.uid() = user_id);
create policy "Users can modify own plans" on public.revision_plans for all using (auth.uid() = user_id);

-- Chat History: students view and add to own chat history
create policy "Users can view own chats" on public.chat_history for select using (auth.uid() = user_id);
create policy "Users can insert own chats" on public.chat_history for insert with check (auth.uid() = user_id);
