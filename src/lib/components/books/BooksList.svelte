<script lang="ts">
    import { onMount } from 'svelte';
    import { getBooks, createBook, type Book, type DragonTheme } from '../../api';
    import type { AuthSession } from '../../auth-client';
    import Cta from '../Cta.svelte';
    import BookCard from './BookCard.svelte';

    let { clubSlug, userRole, session, onSelectBook, showAddModal = $bindable(false) } = $props<{
        clubSlug: string;
        userRole: 'OWNER' | 'EDITOR' | 'READER' | null;
        session: AuthSession;
        onSelectBook: (book: Book) => void;
        showAddModal?: boolean;
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
    let newBookTitle = $state('');
    let newBookAuthor = $state('');
    let newBookGenre = $state('');
    let newBookTheme = $state<DragonTheme | ''>('');
    let adding = $state(false);
    let addError = $state<string | null>(null);

    const DRAGON_THEMES = [
        { name: 'Yinva', color: 'text-Yinva', bg: 'bg-Yinva', border: 'border-Yinva/30', hoverBorder: 'hover:border-Yinva', shadow: 'hover:shadow-[0_0_20px_rgba(229,184,204,0.25)]', logo: '/dragons_logos/normal/Yinva.svg', svgFilter: 'Yinva-svg' },
        { name: 'Guizamark', color: 'text-Guizamark', bg: 'bg-Guizamark', border: 'border-Guizamark/30', hoverBorder: 'hover:border-Guizamark', shadow: 'hover:shadow-[0_0_20px_rgba(207,223,196,0.25)]', logo: '/dragons_logos/normal/Guizamark.svg', svgFilter: 'Guizamark-svg' },
        { name: 'Pestia', color: 'text-Pestia', bg: 'bg-Pestia', border: 'border-Pestia/30', hoverBorder: 'hover:border-Pestia', shadow: 'hover:shadow-[0_0_20px_rgba(97,93,211,0.25)]', logo: '/dragons_logos/normal/Pestia.svg', svgFilter: 'Pestia-svg' },
        { name: 'Chronos', color: 'text-Chronos', bg: 'bg-Chronos', border: 'border-Chronos/30', hoverBorder: 'hover:border-Chronos', shadow: 'hover:shadow-[0_0_20px_rgba(202,68,68,0.25)]', logo: '/dragons_logos/normal/Chronos.svg', svgFilter: 'Chronos-svg' },
        { name: 'Aqua', color: 'text-Aqua', bg: 'bg-Aqua', border: 'border-Aqua/30', hoverBorder: 'hover:border-Aqua', shadow: 'hover:shadow-[0_0_20px_rgba(166,166,166,0.25)]', logo: '/dragons_logos/normal/Aqua.svg', svgFilter: 'Aqua-svg' },
        { name: 'Goliath', color: 'text-Goliath', bg: 'bg-Goliath', border: 'border-Goliath/30', hoverBorder: 'hover:border-Goliath', shadow: 'hover:shadow-[0_0_20px_rgba(132,88,60,0.25)]', logo: '/dragons_logos/normal/Goliath.svg', svgFilter: 'Goliath-svg' },
        { name: 'Drii', color: 'text-Drii', bg: 'bg-Drii', border: 'border-Drii/30', hoverBorder: 'hover:border-Drii', shadow: 'hover:shadow-[0_0_20px_rgba(128,48,132,0.25)]', logo: '/dragons_logos/normal/Drii.svg', svgFilter: 'Drii-svg' },
        { name: 'Lada', color: 'text-Lada', bg: 'bg-Lada', border: 'border-Lada/30', hoverBorder: 'hover:border-Lada', shadow: 'hover:shadow-[0_0_20px_rgba(243,240,158,0.25)]', logo: '/dragons_logos/normal/Lada.svg', svgFilter: 'Lada-svg' },
        { name: 'Pura', color: 'text-Pura', bg: 'bg-Pura', border: 'border-Pura/30', hoverBorder: 'hover:border-Pura', shadow: 'hover:shadow-[0_0_20px_rgba(210,182,116,0.25)]', logo: '/dragons_logos/normal/Pura.svg', svgFilter: 'Pura-svg' },
        { name: 'Artrish', color: 'text-Artrish', bg: 'bg-Artrish', border: 'border-Artrish/30', hoverBorder: 'hover:border-Artrish', shadow: 'hover:shadow-[0_0_20px_rgba(255,255,255,0.15)]', logo: '/dragons_logos/normal/Artrish.svg', svgFilter: 'Artrish-svg' },
        { name: 'Shizari', color: 'text-secondary', bg: 'bg-secondary', border: 'border-secondary/30', hoverBorder: 'hover:border-secondary', shadow: 'hover:shadow-[0_0_20px_rgba(210,182,116,0.25)]', logo: '/dragons_logos/normal/Shizari.svg', svgFilter: 'Shizari-svg' }
    ] as const;

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
        if (!newBookTitle.trim() || !newBookAuthor.trim() || !newBookGenre.trim()) return;

        adding = true;
        addError = null;
        try {
            const created = await createBook(clubSlug, {
                title: newBookTitle,
                author: newBookAuthor,
                genre: newBookGenre,
                theme: newBookTheme || undefined
            });
            books = [created, ...books];
            showAddModal = false;
            newBookTitle = '';
            newBookAuthor = '';
            newBookGenre = '';
            newBookTheme = '';
        } catch (e: any) {
            addError = e.message || 'Erreur lors de la création du livre.';
        } finally {
            adding = false;
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
    <!-- Filters -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-background/40 p-4 border border-gray-800 rounded-lg">
        <div>
            <label for="filter-title" class="block text-xs font-text uppercase tracking-widest text-gray-400 mb-1">Titre</label>
            <input 
                id="filter-title"
                type="text" 
                placeholder="Filtrer par titre..." 
                bind:value={titleQuery}
                class="w-full bg-Lada! text-background border border-Pestia! focus:border-accent! h-10 px-3 text-sm"
            />
        </div>
        <div>
            <label for="filter-author" class="block text-xs font-text uppercase tracking-widest text-gray-400 mb-1">Auteur</label>
            <input 
                id="filter-author"
                type="text" 
                placeholder="Filtrer par auteur..." 
                bind:value={authorQuery}
                class="w-full bg-Lada! text-background border border-Pestia! focus:border-accent! h-10 px-3 text-sm"
            />
        </div>
        <div>
            <label for="filter-genre" class="block text-xs font-text uppercase tracking-widest text-gray-400 mb-1">Genre</label>
            <select 
                id="filter-genre"
                bind:value={selectedGenre}
                class="w-full bg-primary/20 text-white border border-gray-800 focus:border-secondary rounded-[var(--radius)] h-10 px-2 font-text text-sm cursor-pointer"
            >
                <option value="" class="bg-background cursor-pointer">Tous les genres</option>
                {#each genres as genre}
                    <option value={genre} class="bg-background cursor-pointer">{genre}</option>
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
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {#each filteredBooks as book (book.id)}
                <BookCard {book} onSelect={onSelectBook} />
            {/each}
        </div>
    {/if}
</div>

<!-- Modal Add Book -->
{#if showAddModal}
    <div class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/90 backdrop-blur-sm">
        <div class="w-full max-w-md md:max-w-4xl max-h-[90vh] overflow-y-auto bg-background border border-secondary/40 p-6 sm:p-8 rounded-lg shadow-2xl relative transition-all duration-300">
            <button 
                onclick={() => showAddModal = false}
                class="absolute right-4 top-4 text-gray-400 hover:text-white text-xl cursor-pointer"
            >
                ✕
            </button>

            <h2 class="text-2xl font-title text-secondary mb-6 tracking-wider border-b border-secondary/20 pb-3">Ajouter un Ouvrage</h2>
            
            <form onsubmit={handleCreateBook} class="grid grid-cols-1 md:grid-cols-5 gap-6">
                <!-- Left Column: Inputs -->
                <div class="space-y-4 md:col-span-3">
                    <div>
                        <label for="book-title" class="block text-xs font-text text-gray-300 mb-1">Titre de l'ouvrage</label>
                        <input 
                            type="text" 
                            id="book-title" 
                            placeholder="Ex: Le Comte de Monte-Cristo" 
                            bind:value={newBookTitle}
                            required
                            class="w-full bg-primary text-black border border-foreground/30 focus:border-secondary h-10 px-3 text-sm rounded-[var(--radius)] font-text"
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
                            class="w-full bg-primary text-black border border-foreground/30 focus:border-secondary h-10 px-3 text-sm rounded-[var(--radius)] font-text"
                        />
                    </div>

                    <div>
                        <label for="book-genre" class="block text-xs font-text text-gray-300 mb-1">Genre</label>
                        <input 
                            type="text" 
                            id="book-genre" 
                            placeholder="Ex: Aventure" 
                            bind:value={newBookGenre}
                            required
                            class="w-full bg-primary text-black border border-foreground/30 focus:border-secondary h-10 px-3 text-sm rounded-[var(--radius)] font-text"
                        />
                    </div>
                </div>

                <!-- Right Column: Dragon Themes Grid & Buttons -->
                <div class="md:col-span-2 flex flex-col justify-between space-y-6">
                    <div>
                        <span class="block text-xs font-text text-gray-300 mb-2">Thème Dragon (optionnel)</span>
                        <div class="grid grid-cols-4 gap-1.5">
                            {#each DRAGON_THEMES as theme}
                                {@const isActive = newBookTheme === theme.name}
                                <button
                                    type="button"
                                    title={theme.name}
                                    onclick={() => {
                                        if (newBookTheme === theme.name) {
                                            newBookTheme = '';
                                        } else {
                                            newBookTheme = theme.name;
                                        }
                                    }}
                                    class="relative flex flex-col items-center justify-center p-1 rounded-lg border text-center transition-all cursor-pointer select-none h-11 {isActive ? `${theme.border} bg-background/80 shadow-[0_0_12px_rgba(255,255,255,0.05)]` : 'bg-background/40 border-gray-800 hover:border-gray-750'}"
                                    style={isActive ? `border-color: var(--color-${theme.name}); box-shadow: 0 0 10px var(--color-${theme.name}33);` : ''}
                                >
                                    <!-- Checkbox Indicator -->
                                    <div class="absolute top-0.5 right-0.5 w-2.5 h-2.5 rounded-sm border flex items-center justify-center {isActive ? `${theme.bg} border-transparent text-black` : 'border-gray-700 bg-transparent'}">
                                        {#if isActive}
                                            <svg class="w-1.5 h-1.5 fill-current text-background" viewBox="0 0 20 20">
                                                <path d="M0 11l2-2 5 5L18 3l2 2L7 18z"/>
                                            </svg>
                                        {/if}
                                    </div>

                                    <!-- Logo -->
                                    <div class="w-6 h-6 flex items-center justify-center">
                                        <img src={theme.logo} alt={theme.name} class="w-full h-full object-contain {theme.svgFilter} {isActive ? '' : 'opacity-60'}" />
                                    </div>
                                </button>
                            {/each}
                        </div>
                    </div>

                    <!-- Bottom Action Area -->
                    <div class="space-y-4 pt-4 border-t border-gray-800/80">
                        {#if addError}
                            <p class="text-sm text-Chronos font-text">{addError}</p>
                        {/if}

                        <div class="flex space-x-3">
                            <Cta 
                                text="Annuler"
                                onClick={() => showAddModal = false}
                                dragon="none"
                                border="none"
                                class="w-1/2 h-10 font-title text-sm uppercase tracking-wider text-white border border-white/20 hover:bg-white/5"
                            />
                            <Cta 
                                type="submit"
                                disabled={adding}
                                text={adding ? 'Ajout...' : 'Ajouter'}
                                dragon="Artrish"
                                border="Yinva"
                                class="w-1/2 h-10 font-title text-sm uppercase tracking-wider !text-black"
                            />
                        </div>
                    </div>
                </div>
            </form>
        </div>
    </div>
{/if}
