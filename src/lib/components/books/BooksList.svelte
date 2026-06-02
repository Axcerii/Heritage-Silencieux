<script lang="ts">
    import { onMount } from 'svelte';
    import { getBooks, createBook, exportLibraryCsv, type Book } from '../../api';
    import type { AuthSession } from '../../auth-client';

    let { clubSlug, userRole, session, onSelectBook } = $props<{
        clubSlug: string;
        userRole: 'OWNER' | 'EDITOR' | 'READER' | null;
        session: AuthSession;
        onSelectBook: (book: Book) => void;
    }>();

    let books = $state<Book[]>([]);
    let loading = $state(true);
    let error = $state<string | null>(null);

    // Filters
    let titleQuery = $state('');
    let authorQuery = $state('');
    let selectedGenre = $state('');
    
    // Unique genres for filter dropdown
    const genres = $derived([...new Set(books.map(b => b.genre))]);

    const filteredBooks = $derived(
        books.filter(book => {
            const matchesTitle = book.title.toLowerCase().includes(titleQuery.toLowerCase());
            const matchesAuthor = book.author.toLowerCase().includes(authorQuery.toLowerCase());
            const matchesGenre = !selectedGenre || book.genre === selectedGenre;
            return matchesTitle && matchesAuthor && matchesGenre;
        })
    );

    // Book Creation Modal
    let showAddModal = $state(false);
    let newBookTitle = $state('');
    let newBookAuthor = $state('');
    let newBookGenre = $state('');
    let newBookPages = $state<number>(100);
    let adding = $state(false);
    let addError = $state<string | null>(null);

    // User permissions
    const canManageBooks = $derived(
        session.user.role === 'ADMIN' || userRole === 'OWNER' || userRole === 'EDITOR'
    );

    async function loadBooks() {
        loading = true;
        error = null;
        try {
            books = await getBooks(clubSlug);
        } catch (e: any) {
            error = e.message || 'Impossible de charger la bibliothèque.';
        } finally {
            loading = false;
        }
    }

    async function handleCreateBook(e: Event) {
        e.preventDefault();
        if (!newBookTitle.trim() || !newBookAuthor.trim() || !newBookGenre.trim() || newBookPages <= 0) return;

        adding = true;
        addError = null;
        try {
            const created = await createBook(clubSlug, {
                title: newBookTitle,
                author: newBookAuthor,
                genre: newBookGenre,
                pages: newBookPages
            });
            books = [created, ...books];
            showAddModal = false;
            newBookTitle = '';
            newBookAuthor = '';
            newBookGenre = '';
            newBookPages = 100;
        } catch (e: any) {
            addError = e.message || 'Erreur lors de la création du livre.';
        } finally {
            adding = false;
        }
    }

    async function handleExportCsv() {
        try {
            const csvData = await exportLibraryCsv(clubSlug);
            const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.setAttribute('href', url);
            link.setAttribute('download', `bibliotheque-${clubSlug}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (e: any) {
            alert('Erreur lors de l\'exportation CSV: ' + e.message);
        }
    }

    function renderStars(rating: number | null) {
        if (rating === null) return 'Aucune évaluation';
        const fullStars = Math.round(rating);
        return '★'.repeat(fullStars) + '☆'.repeat(5 - fullStars);
    }

    onMount(() => {
        loadBooks();
    });
</script>

<div class="space-y-6">
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-800 pb-4 gap-4">
        <div>
            <h2 class="text-2xl font-title text-secondary tracking-wider">Bibliothèque du Cercle</h2>
            <p class="text-sm text-gray-400 font-text">Consultez, lisez et évaluez les manuscrits partagés.</p>
        </div>

        <div class="flex space-x-3 w-full sm:w-auto">
            <button 
                onclick={handleExportCsv}
                class="flex-1 sm:flex-none px-4 h-10 border border-secondary/40 rounded-[var(--radius)] font-title text-[15px] uppercase tracking-wider text-secondary hover:bg-secondary/10 transition-colors cursor-pointer"
            >
                Exporter (CSV)
            </button>
            {#if canManageBooks}
                <button 
                    onclick={() => showAddModal = true}
                    class="flex-1 sm:flex-none px-4 h-10 rounded-[var(--radius)] font-title text-[15px] uppercase tracking-wider text-black bg-secondary hover:bg-secondary/95 transition-colors cursor-pointer"
                >
                    Ajouter un Livre
                </button>
            {/if}
        </div>
    </div>

    <!-- Filters -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-background/40 p-4 border border-gray-800 rounded-lg">
        <div>
            <label for="filter-title" class="block text-xs font-text uppercase tracking-widest text-gray-400 mb-1">Titre</label>
            <input 
                id="filter-title"
                type="text" 
                placeholder="Filtrer par titre..." 
                bind:value={titleQuery}
                class="w-full bg-primary/20 text-white border border-gray-800 focus:border-secondary h-10 px-3 text-sm"
            />
        </div>
        <div>
            <label for="filter-author" class="block text-xs font-text uppercase tracking-widest text-gray-400 mb-1">Auteur</label>
            <input 
                id="filter-author"
                type="text" 
                placeholder="Filtrer par auteur..." 
                bind:value={authorQuery}
                class="w-full bg-primary/20 text-white border border-gray-800 focus:border-secondary h-10 px-3 text-sm"
            />
        </div>
        <div>
            <label for="filter-genre" class="block text-xs font-text uppercase tracking-widest text-gray-400 mb-1">Genre</label>
            <select 
                id="filter-genre"
                bind:value={selectedGenre}
                class="w-full bg-primary/20 text-white border border-gray-800 focus:border-secondary rounded-[var(--radius)] h-10 px-2 font-text text-sm cursor-pointer"
            >
                <option value="">Tous les genres</option>
                {#each genres as genre}
                    <option value={genre}>{genre}</option>
                {/each}
            </select>
        </div>
    </div>

    {#if loading}
        <div class="flex flex-col items-center justify-center py-12">
            <div class="w-10 h-10 rounded-full border-2 border-secondary border-t-transparent animate-spin mb-3"></div>
            <p class="text-secondary font-title text-lg">Déchiffrement des étagères...</p>
        </div>
    {:else if error}
        <p class="text-center py-8 text-Chronos font-text">{error}</p>
    {:else if filteredBooks.length === 0}
        <div class="text-center py-12 border border-dashed border-gray-800 rounded-lg text-gray-400 font-text">
            <p class="text-lg">Aucun ouvrage trouvé</p>
            <p class="text-xs text-gray-500 mt-1">Modifiez vos critères de filtrage ou ajoutez un nouveau livre.</p>
        </div>
    {:else}
        <!-- Books grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {#each filteredBooks as book (book.id)}
                <div class="bg-background/80 border border-gray-800 hover:border-secondary/40 rounded-lg p-5 flex flex-col justify-between transition-all duration-200 group">
                    <div>
                        <div class="flex items-center justify-between mb-2">
                            <span class="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded bg-secondary/15 text-secondary">{book.genre}</span>
                            <span class="text-xs text-gray-400 font-text">{book.pages} pages</span>
                        </div>
                        <h3 class="text-xl font-title text-white group-hover:text-secondary transition-colors leading-snug line-clamp-1">{book.title}</h3>
                        <p class="text-sm text-gray-400 font-text italic mt-1 mb-4">par {book.author}</p>
                    </div>

                    <div class="border-t border-gray-800/60 pt-4 flex items-center justify-between mt-4">
                        <div class="flex flex-col">
                            <span class="text-[10px] uppercase text-gray-500 font-text tracking-wider">Évaluation</span>
                            <span class="text-sm text-secondary font-text">{renderStars(book.averageRating)}</span>
                        </div>
                        <button 
                            onclick={() => onSelectBook(book)}
                            class="px-4 py-1.5 rounded-[var(--radius)] font-title text-xs uppercase tracking-wider text-black bg-secondary hover:bg-secondary/90 transition-colors cursor-pointer"
                        >
                            Ouvrir
                        </button>
                    </div>
                </div>
            {/each}
        </div>
    {/if}
</div>

<!-- Modal Add Book -->
{#if showAddModal}
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/90 backdrop-blur-sm">
        <div class="w-full max-w-md bg-background border border-secondary/40 p-6 sm:p-8 rounded-lg shadow-2xl relative">
            <button 
                onclick={() => showAddModal = false}
                class="absolute right-4 top-4 text-gray-400 hover:text-white text-xl cursor-pointer"
            >
                ✕
            </button>

            <h2 class="text-2xl font-title text-secondary mb-6 tracking-wider">Ajouter un Ouvrage</h2>
            
            <form onsubmit={handleCreateBook} class="space-y-4">
                <div>
                    <label for="book-title" class="block text-xs font-text text-gray-300 mb-1">Titre de l'ouvrage</label>
                    <input 
                        type="text" 
                        id="book-title" 
                        placeholder="Ex: Le Comte de Monte-Cristo" 
                        bind:value={newBookTitle}
                        required
                        class="bg-primary text-black border border-foreground/30 focus:border-secondary h-10 px-3 text-sm"
                    />
                </div>

                <div>
                    <label for="book-author" class="block text-xs font-text text-gray-300 mb-1">Auteur</label>
                    <input 
                        type="text" 
                        id="book-author" 
                        placeholder="Ex: Alexandre Dumas" 
                        bind:value={newBookAuthor}
                        required
                        class="bg-primary text-black border border-foreground/30 focus:border-secondary h-10 px-3 text-sm"
                    />
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label for="book-genre" class="block text-xs font-text text-gray-300 mb-1">Genre</label>
                        <input 
                            type="text" 
                            id="book-genre" 
                            placeholder="Ex: Aventure" 
                            bind:value={newBookGenre}
                            required
                            class="bg-primary text-black border border-foreground/30 focus:border-secondary h-10 px-3 text-sm"
                        />
                    </div>
                    <div>
                        <label for="book-pages" class="block text-xs font-text text-gray-300 mb-1">Nombre de Pages</label>
                        <input 
                            type="number" 
                            id="book-pages" 
                            bind:value={newBookPages}
                            min="1"
                            required
                            class="bg-primary text-black border border-foreground/30 focus:border-secondary h-10 px-3 text-sm"
                        />
                    </div>
                </div>

                {#if addError}
                    <p class="text-sm text-Chronos font-text">{addError}</p>
                {/if}

                <div class="flex space-x-3 pt-4">
                    <button 
                        type="button"
                        onclick={() => showAddModal = false}
                        class="w-1/2 h-10 rounded-[var(--radius)] font-title text-sm uppercase tracking-wider text-white border border-white/20 hover:bg-white/5 transition-colors cursor-pointer"
                    >
                        Annuler
                    </button>
                    <button 
                        type="submit"
                        disabled={adding}
                        class="w-1/2 h-10 rounded-[var(--radius)] font-title text-sm uppercase tracking-wider text-black bg-secondary hover:bg-secondary/90 transition-colors cursor-pointer disabled:opacity-50"
                    >
                        {adding ? 'Ajout...' : 'Ajouter'}
                    </button>
                </div>
            </form>
        </div>
    </div>
{/if}
