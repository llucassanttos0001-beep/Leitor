-- ==============================================================================
-- SCHEMA SUPABASE: LEITOR (LEITURA IMERSIVA COM CLOUD SYNC)
-- Execute este script no "SQL Editor" do seu painel do Supabase.
-- ==============================================================================

-- 1. Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tabela de Livros do Usuário
CREATE TABLE IF NOT EXISTS public.books (
    id TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    author TEXT DEFAULT 'Autor Desconhecido',
    genre TEXT DEFAULT '',
    tags TEXT[] DEFAULT '{}',
    cover_url TEXT DEFAULT '',
    file_url TEXT DEFAULT '',
    file_hash TEXT DEFAULT '',
    format TEXT DEFAULT 'epub',
    total_chapters INTEGER DEFAULT 1,
    estimated_pages INTEGER DEFAULT 1,
    status TEXT DEFAULT 'unread',
    date_added BIGINT NOT NULL,
    last_accessed BIGINT NOT NULL,
    collections TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (user_id, id)
);

-- 3. Tabela de Progresso de Leitura
CREATE TABLE IF NOT EXISTS public.reading_progress (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    book_id TEXT NOT NULL,
    current_chapter INTEGER DEFAULT 0,
    current_page INTEGER DEFAULT 0,
    current_line INTEGER DEFAULT -1,
    overall_percentage DOUBLE PRECISION DEFAULT 0,
    total_reading_time_ms BIGINT DEFAULT 0,
    last_position TEXT DEFAULT '',
    updated_at BIGINT NOT NULL,
    PRIMARY KEY (user_id, book_id)
);

-- 4. Tabela de Marcadores (Bookmarks)
CREATE TABLE IF NOT EXISTS public.bookmarks (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    book_id TEXT NOT NULL,
    chapter INTEGER DEFAULT 0,
    page INTEGER DEFAULT 0,
    line INTEGER DEFAULT 0,
    excerpt TEXT NOT NULL,
    note TEXT,
    created_at BIGINT NOT NULL
);

-- 5. Tabela de Vocabulário (Dicionário Salvo)
CREATE TABLE IF NOT EXISTS public.vocabulary (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    book_id TEXT NOT NULL,
    word TEXT NOT NULL,
    definition TEXT NOT NULL,
    context TEXT DEFAULT '',
    saved_at BIGINT NOT NULL
);

-- 6. Tabela de Configurações do Usuário (Preferências e Tipografia)
CREATE TABLE IF NOT EXISTS public.user_settings (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- SEGURANÇA: ROW LEVEL SECURITY (RLS)
-- Garante que cada usuário acesse exclusivamente seus próprios registros.
-- ==============================================================================

ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vocabulary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Políticas para Books
CREATE POLICY "Usuário pode gerenciar seus próprios livros" ON public.books
    FOR ALL USING (auth.uid() = user_id);

-- Políticas para Reading Progress
CREATE POLICY "Usuário pode gerenciar seu próprio progresso" ON public.reading_progress
    FOR ALL USING (auth.uid() = user_id);

-- Políticas para Bookmarks
CREATE POLICY "Usuário pode gerenciar seus próprios marcadores" ON public.bookmarks
    FOR ALL USING (auth.uid() = user_id);

-- Políticas para Vocabulary
CREATE POLICY "Usuário pode gerenciar seu vocabulário" ON public.vocabulary
    FOR ALL USING (auth.uid() = user_id);

-- Políticas para User Settings
CREATE POLICY "Usuário pode gerenciar suas configurações" ON public.user_settings
    FOR ALL USING (auth.uid() = user_id);

-- ==============================================================================
-- STORAGE: BUCKET PARA ARQUIVOS EPUB E CAPAS (OPCIONAL)
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('books', 'books', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Usuários autenticados podem fazer upload de livros"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'books');

CREATE POLICY "Qualquer pessoa pode ler arquivos de livros com link"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'books');
