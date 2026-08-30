import React, { useRef } from 'react';
import { useAppStore } from '../../stores/app-store';
import { useAuthStore } from '../../stores/auth-store';
import { BookOpen, Search, X, LayoutGrid, List, Filter, Settings, Plus, Cloud, CheckCircle, RefreshCw } from 'lucide-react';

interface LibraryHeaderProps {
  onImportBooks?: (files: File[]) => void;
}

export const LibraryHeader: React.FC<LibraryHeaderProps> = ({ onImportBooks }) => {
  const {
    searchQuery,
    setSearchQuery,
    viewMode,
    setViewMode,
    filterMode,
    setFilterMode,
    toggleSidebar,
  } = useAppStore();

  const { user, syncStatus, setAuthModalOpen } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filterLabels: Record<string, string> = {
    all: 'Todos',
    reading: 'Lendo',
    unread: 'Não Lidos',
    completed: 'Concluídos',
  };

  return (
    <header className="sticky top-0 z-30 bg-[var(--color-surface)]/90 backdrop-blur-md border-b border-[var(--color-border)] shrink-0">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <div className="flex items-center gap-2 text-[var(--color-accent)] shrink-0">
          <BookOpen className="w-6 h-6" />
          <h1 className="text-xl font-bold hidden sm:block">Leitor</h1>
        </div>

        {/* Search */}
        <div className="flex-1 max-w-xl">
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-[var(--color-text-secondary)]" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-10 py-2 border border-[var(--color-border)] rounded-full leading-5 bg-[var(--color-bg)] text-[var(--color-text)] placeholder-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)] sm:text-sm transition-colors"
              placeholder="Buscar livros, autores..."
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Cloud Sync Button */}
          <button
            onClick={() => setAuthModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-bg)] hover:bg-[var(--color-surface)] text-[var(--color-text)] transition-colors text-xs font-medium"
            title="Sincronização em Nuvem (Supabase)"
          >
            {syncStatus === 'syncing' ? (
              <RefreshCw size={14} className="text-[var(--color-accent)] animate-spin" />
            ) : user ? (
              <CheckCircle size={14} className="text-green-500" />
            ) : (
              <Cloud size={14} className="text-[var(--color-text-secondary)]" />
            )}
            <span className="hidden md:inline">
              {syncStatus === 'syncing'
                ? 'Sincronizando'
                : user
                ? user.email?.split('@')[0]
                : 'Nuvem'}
            </span>
          </button>

          {/* View toggle */}
          <div className="hidden md:flex items-center bg-[var(--color-bg)] rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'grid'
                  ? 'bg-[var(--color-surface)] shadow-sm text-[var(--color-accent)]'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
              }`}
              title="Visualização em Grade"
            >
              <LayoutGrid size={18} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'list'
                  ? 'bg-[var(--color-surface)] shadow-sm text-[var(--color-accent)]'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
              }`}
              title="Visualização em Lista"
            >
              <List size={18} />
            </button>
          </div>

          {/* Filter dropdown */}
          <div className="relative group">
            <button
              className="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg)] rounded-full transition-colors"
              title="Filtrar livros"
            >
              <Filter size={20} />
            </button>
            <div className="absolute right-0 mt-2 w-48 bg-[var(--color-surface)] rounded-lg shadow-lg border border-[var(--color-border)] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
              <div className="py-1">
                {(['all', 'reading', 'unread', 'completed'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setFilterMode(mode)}
                    className={`block w-full text-left px-4 py-2 text-sm transition-colors ${
                      filterMode === mode
                        ? 'bg-[var(--color-accent)]/10 text-[var(--color-accent)] font-medium'
                        : 'text-[var(--color-text)] hover:bg-[var(--color-bg)]'
                    }`}
                  >
                    {filterLabels[mode]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Settings */}
          <button
            onClick={toggleSidebar}
            className="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg)] rounded-full transition-colors"
            title="Configurações"
          >
            <Settings size={20} />
          </button>

          {/* Import button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1 bg-[var(--color-accent)] hover:opacity-90 text-white px-3 py-2 rounded-lg font-medium text-sm transition-opacity ml-1 shadow-sm"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">Importar</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => {
              if (e.target.files && onImportBooks) {
                onImportBooks(Array.from(e.target.files));
              }
              e.target.value = '';
            }}
            className="hidden"
            multiple
            accept=".epub,.pdf,.txt"
          />
        </div>
      </div>
    </header>
  );
};
