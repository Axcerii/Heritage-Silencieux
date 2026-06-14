<script lang="ts">
    import { onMount } from 'svelte';
    import { 
        getChapters, 
        getProgression, getGlobalProgressions, toggleChapterRead,
        getReviews, createReview, deleteReviewAdmin,
        updateBook, deleteBook, deleteChapter,
        type Book, type Chapter, type Review, type Progression, type MemberProgression 
    } from '../../api';
    import type { AuthSession } from '../../auth-client';
    import { goto } from '$app/navigation';
    import Cta from '../Cta.svelte';
    import { getImageUrl, getUserAvatarDragon } from '$lib';
    import { sidebarState } from '../../sidebar.svelte';

    let { clubSlug, book = $bindable(), userRole, session, onBack, onReadChapter } = $props<{
        clubSlug: string;
        book: Book;
        userRole: 'OWNER' | 'EDITOR' | 'READER' | null;
        session: AuthSession;
        onBack: () => void;
        onReadChapter: (chapter: Chapter) => void;
    }>();

    // Svelte 5 States
    let chapters = $state<Chapter[]>([]);
    let reviews = $state<Review[]>([]);
    let progression = $state<Progression | null>(null);
    let globalProgressions = $state<MemberProgression[]>([]);
    
    let loadingChapters = $state(true);
    let loadingReviews = $state(true);
    let loadingProgression = $state(true);

    // Admin tab states
    let activeTab = $state<'lecture' | 'critique' | 'admin'>('lecture');

    // Book edit form inputs
    let editTitle = $state(book.title);
    let editAuthor = $state(book.author);
    let editGenre = $state(book.genre);
    let editSlug = $state(book.slug);
    let editTheme = $state(book.theme || '');
    let updatingBook = $state(false);
    let updateBookError = $state<string | null>(null);
    let updateBookSuccess = $state(false);

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

    // Book deletion states
    let deletingBook = $state(false);
    let deleteBookError = $state<string | null>(null);

    // Chapter deletion states
    let deletingChapters = $state<Record<number, boolean>>({});

    // Sync form inputs with book updates
    $effect(() => {
        if (book) {
            editTitle = book.title;
            editAuthor = book.author;
            editGenre = book.genre;
            editSlug = book.slug;
            editTheme = book.theme || '';
        }
    });

    // Review form inputs & derived states
    let newReviewRating = $state(5);
    let newReviewComment = $state('');
    let submittingReview = $state(false);
    let reviewError = $state<string | null>(null);

    // Derive user's own review
    const myReview = $derived(reviews.find(r => r.userId === session.user.id));

    // Calculate dynamic average rating based on current reviews in state
    const averageRating = $derived(
        reviews.length > 0
            ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
            : null
    );



    // Chapter form inputs (Redirected to write page)

    // Permissions
    const canManageChapters = $derived(
        session.user.role === 'ADMIN' || userRole === 'OWNER' || userRole === 'EDITOR'
    );

    async function handleUpdateBook(e: Event) {
        e.preventDefault();
        if (!editTitle.trim() || !editAuthor.trim() || !editGenre.trim()) return;
        updatingBook = true;
        updateBookError = null;
        updateBookSuccess = false;
        try {
            const oldSlug = book.slug;
            const updated = await updateBook(clubSlug, book.id, {
                title: editTitle.trim(),
                author: editAuthor.trim(),
                genre: editGenre.trim(),
                theme: (editTheme as any) || null,
                slug: editSlug.trim() || undefined
            });
            const slugChanged = oldSlug !== updated.slug;
            book = updated;
            updateBookSuccess = true;
            setTimeout(() => {
                updateBookSuccess = false;
            }, 3000);
            if (slugChanged) {
                goto(`/clubs/${clubSlug}/books/${updated.slug}`, { replaceState: true });
            }
        } catch (err: any) {
            updateBookError = err.message || 'Erreur lors de la mise à jour du livre.';
        } finally {
            updatingBook = false;
        }
    }

    async function handleDeleteBook() {
        const confirmed = confirm(`Voulez-vous vraiment détruire définitivement le grimoire "${book.title}" ? Cette action effacera également tous les chapitres et les critiques de ce livre.`);
        if (!confirmed) return;

        deletingBook = true;
        deleteBookError = null;
        try {
            await deleteBook(clubSlug, book.id);
            onBack();
        } catch (err: any) {
            deleteBookError = err.message || 'Erreur lors de la suppression du livre.';
            deletingBook = false;
        }
    }

    async function handleDeleteChapter(index: number, title: string) {
        const confirmed = confirm(`Voulez-vous vraiment supprimer définitivement le chapitre ${index} "${title}" ? Les chapitres suivants seront automatiquement réindexés.`);
        if (!confirmed) return;

        deletingChapters = { ...deletingChapters, [index]: true };
        try {
            await deleteChapter(clubSlug, book.slug, index);
            await loadData();
        } catch (err: any) {
            alert(`Erreur lors de la suppression du chapitre : ${err.message}`);
        } finally {
            const updated = { ...deletingChapters };
            delete updated[index];
            deletingChapters = updated;
        }
    }
    const canViewGlobalProgress = $derived(
        session.user.role === 'ADMIN' || userRole === 'OWNER' || userRole === 'EDITOR'
    );

    async function loadData() {
        // Chapters
        try {
            const response = await getChapters(clubSlug, book.slug);
            chapters = response.data;

        } catch (e) {
            console.error('Failed to load chapters:', e);
        } finally {
            loadingChapters = false;
        }

        // Progression
        try {
            progression = await getProgression(clubSlug, book.slug);
        } catch (e) {
            console.error('Failed to load progression:', e);
        } finally {
            loadingProgression = false;
        }

        // Reviews
        try {
            reviews = await getReviews(clubSlug, book.slug);
            const existingReview = reviews.find(r => r.userId === session.user.id);
            if (existingReview) {
                newReviewRating = existingReview.rating;
                newReviewComment = existingReview.comment || '';
            }
        } catch (e) {
            console.error('Failed to load reviews:', e);
        } finally {
            loadingReviews = false;
        }

        // Global progressions (if permitted)
        if (canViewGlobalProgress) {
            try {
                globalProgressions = await getGlobalProgressions(clubSlug, book.slug);
            } catch (e) {
                console.error('Failed to load global progressions:', e);
            }
        }
    }

    async function handleToggleChapterRead(chapter: Chapter) {
        const newReadState = !chapter.isRead;
        chapter.isRead = newReadState;
        try {
            await toggleChapterRead(clubSlug, book.slug, chapter.index, newReadState);
            progression = await getProgression(clubSlug, book.slug);
            if (canViewGlobalProgress) {
                globalProgressions = await getGlobalProgressions(clubSlug, book.slug);
            }
        } catch (e: any) {
            chapter.isRead = !newReadState;
            alert('Erreur de progression: ' + e.message);
        }
    }

    async function handleAddReview(e: Event) {
        e.preventDefault();
        submittingReview = true;
        reviewError = null;
        try {
            const created = await createReview(clubSlug, book.slug, newReviewRating, newReviewComment || undefined);
            
            // Add or replace the user's review in state
            const existingIndex = reviews.findIndex(r => r.userId === session.user.id);
            if (existingIndex !== -1) {
                reviews[existingIndex] = {
                    ...created,
                    user: {
                        id: session.user.id,
                        name: session.user.name,
                        image: session.user.image || null
                    }
                };
            } else {
                reviews = [
                    {
                        ...created,
                        user: {
                            id: session.user.id,
                            name: session.user.name,
                            image: session.user.image || null
                        }
                    },
                    ...reviews
                ];
            }
        } catch (e: any) {
            reviewError = e.message || 'Erreur lors de la soumission de la critique.';
        } finally {
            submittingReview = false;
        }
    }

    async function handleDeleteReviewAdmin(reviewId: string) {
        if (!confirm('Voulez-vous vraiment supprimer cette critique au titre de la modération ?')) return;
        try {
            await deleteReviewAdmin(reviewId);
            reviews = reviews.filter(r => r.id !== reviewId);
            // Reset form if the user's own review was deleted by admin moderation
            const hasMyReview = reviews.some(r => r.userId === session.user.id);
            if (!hasMyReview) {
                newReviewRating = 5;
                newReviewComment = '';
            }
        } catch (e: any) {
            alert('Erreur lors de la suppression: ' + e.message);
        }
    }

    // handleAddChapter is now handled by the dedicated write page

    onMount(() => {
        loadData();
    });

    const readChaptersCount = $derived(chapters.filter(c => c.isRead).length);
    const progressPercentage = $derived(
        chapters.length > 0 ? Math.round((readChaptersCount / chapters.length) * 100) : 0
    );
</script>

{#if userRole !== null || session.user.role === 'ADMIN'}
    <!-- Sidebar on Desktop (viewport fixed on left) -->
    <aside class="hidden md:flex flex-col w-64 fixed top-[73px] bottom-0 left-0 bg-[#1b1b1b]/80 backdrop-blur-md border-r border-secondary/20 p-6 z-10 space-y-6 overflow-y-auto transition-transform duration-300 lg:translate-x-0 {sidebarState.isOpen ? 'md:translate-x-0' : 'md:-translate-x-full'}">
        <!-- Back Button to Club/Library -->
        <button 
            onclick={onBack}
            class="flex items-center justify-center gap-2 font-title text-sm tracking-wider text-secondary hover:text-white hover:underline rounded transition-all duration-200 cursor-pointer bg-transparent border-0 outline-none mt-8"
        >
            ← Retour à la bibliothèque
        </button>

        <div class="space-y-2">
            <span class="text-xs font-text uppercase tracking-widest text-gray-400">Sections</span>
            <nav class="flex flex-col gap-2">
                <button 
                    onclick={() => activeTab = 'lecture'}
                    class="w-full text-left px-4 py-2.5 font-title text-base uppercase tracking-wider rounded border-l-2 transition-all cursor-pointer flex items-center gap-3 {activeTab === 'lecture' ? 'border-secondary bg-secondary/10 text-secondary' : 'border-transparent text-gray-400 hover:text-white hover:bg-white/5'}"
                >
                    <img src="/dragons_logos/normal/Lada.svg" alt="" class="w-8 h-8 secondary-svg">
                    Lecture
                </button>
                <button 
                    onclick={() => activeTab = 'critique'}
                    class="w-full text-left px-4 py-2.5 font-title text-base uppercase tracking-wider rounded border-l-2 transition-all cursor-pointer flex items-center gap-3 {activeTab === 'critique' ? 'border-secondary bg-secondary/10 text-secondary' : 'border-transparent text-gray-400 hover:text-white hover:bg-white/5'}"
                >
                    <img src="/dragons_logos/normal/Pestia.svg" alt="" class="w-8 h-8 secondary-svg">
                    Critique
                </button>
                {#if canManageChapters}
                    <button 
                        onclick={() => activeTab = 'admin'}
                        class="w-full text-left px-4 py-2.5 font-title text-base uppercase tracking-wider rounded border-l-2 transition-all cursor-pointer flex items-center gap-3 {activeTab === 'admin' ? 'border-secondary bg-secondary/10 text-secondary' : 'border-transparent text-gray-400 hover:text-white hover:bg-white/5'}"
                    >
                        <img src="/dragons_logos/normal/Yinva.svg" alt="" class="w-8 h-8 secondary-svg">
                        Admin
                    </button>
                {/if}
            </nav>
        </div>

        {#if activeTab === 'lecture' && canManageChapters}
            <div class="space-y-3 pt-4 border-t border-secondary/20">
                <span class="text-xs font-text uppercase tracking-widest text-gray-400">Actions</span>
                <div class="flex flex-col gap-2">
                    <Cta 
                        text="Écrire un Chapitre"
                        onClick={() => goto(`/clubs/${clubSlug}/books/${book.slug}/write`)}
                        dragon="Artrish"
                        border="Yinva"
                        class="h-9 px-4 font-title text-[13px] uppercase tracking-wider !text-black w-full flex items-center justify-center cursor-pointer"
                    />
                </div>
            </div>
        {/if}
    </aside>

    <!-- Sidebar Toggle Button (Tablet Drawer Control) -->
    <button 
        onclick={() => sidebarState.isOpen = !sidebarState.isOpen}
        class="hidden md:flex lg:hidden fixed top-[88px] z-20 w-8 h-8 bg-[#1b1b1b]/90 backdrop-blur-md border border-secondary/30 hover:border-secondary/70 text-secondary hover:text-white rounded-full items-center justify-center transition-all duration-300 shadow-md hover:shadow-[0_0_15px_rgba(210,182,116,0.25)] hover:scale-105 active:scale-95 cursor-pointer {sidebarState.isOpen ? 'left-[240px]' : 'left-4'}"
        title={sidebarState.isOpen ? "Masquer le menu" : "Afficher le menu"}
    >
        {#if sidebarState.isOpen}
            <svg class="w-4.5 h-4.5 text-secondary" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
        {:else}
            <svg class="w-4.5 h-4.5 text-secondary" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
        {/if}
    </button>
{/if}

<div class="w-full {userRole !== null || session.user.role === 'ADMIN' ? 'space-y-8' : 'max-w-5xl mx-auto p-4 sm:p-6 space-y-8'}">
    {#if userRole !== null || session.user.role === 'ADMIN'}
        <!-- Mobile Actions / Tabs (Mobile Only) -->
        <div class="md:hidden w-full flex flex-col gap-3 border-b border-gray-800 pb-2">
            <!-- Top Row: Back Button & Write CTA -->
            <div class="flex items-center justify-between w-full">
                <button 
                    onclick={onBack}
                    class="w-8 h-8 text-secondary font-title text-lg border border-secondary/35 bg-secondary/15 rounded-full transition-all flex items-center justify-center cursor-pointer shrink-0 hover:bg-secondary/25 active:scale-95 duration-200 outline-none"
                >
                    ←
                </button>

                {#if activeTab === 'lecture' && canManageChapters}
                    <div>
                        <Cta 
                            text="Écrire"
                            onClick={() => goto(`/clubs/${clubSlug}/books/${book.slug}/write`)}
                            dragon="Artrish"
                            border="Yinva"
                            class="h-8 px-3 font-title text-xs uppercase tracking-wider !text-black flex items-center justify-center cursor-pointer"
                        />
                    </div>
                {/if}
            </div>
            
            <!-- Bottom Row: Tabs -->
            <div class="flex gap-1 overflow-x-auto scrollbar-none flex-nowrap w-full">
                <button 
                    onclick={() => activeTab = 'lecture'}
                    class="flex-1 min-w-[70px] text-center py-2 font-title text-xs uppercase tracking-wider border-b-2 transition-colors cursor-pointer {activeTab === 'lecture' ? 'border-secondary text-secondary' : 'border-transparent text-gray-400'}"
                >
                    Lecture
                </button>
                <button 
                    onclick={() => activeTab = 'critique'}
                    class="flex-1 min-w-[70px] text-center py-2 font-title text-xs uppercase tracking-wider border-b-2 transition-colors cursor-pointer {activeTab === 'critique' ? 'border-secondary text-secondary' : 'border-transparent text-gray-400'}"
                >
                    Critique
                </button>
                {#if canManageChapters}
                    <button 
                        onclick={() => activeTab = 'admin'}
                        class="flex-1 min-w-[70px] text-center py-2 font-title text-xs uppercase tracking-wider border-b-2 transition-colors cursor-pointer {activeTab === 'admin' ? 'border-secondary text-secondary' : 'border-transparent text-gray-400'}"
                    >
                        Admin
                    </button>
                {/if}
            </div>
        </div>
    {/if}

    <!-- Back Button & Header -->
    <div class="flex flex-col sm:flex-row justify-between items-start gap-4 border-b border-gray-800 pb-6">
        <div>
            <h1 class="text-3xl sm:text-4xl font-title text-white leading-tight">{book.title}</h1>
            <p class="text-gray-400 font-text italic">par {book.author} — <span class="text-secondary">{book.genre}</span></p>
            {#if activeTab === 'lecture' && !loadingChapters && chapters.length > 0}
                <div class="mt-4">
                    <Cta 
                        text={readChaptersCount > 0 ? (readChaptersCount === chapters.length ? "Recommencer la lecture" : "Continuer la lecture") : "Commencer la lecture"}
                        onClick={() => {
                            const nextChapter = chapters.find(c => !c.isRead) || chapters[0];
                            onReadChapter(nextChapter);
                        }}
                        dragon="Lada"
                        border="Pestia"
                        class="h-10 w-full sm:w-auto px-6 font-title text-sm uppercase tracking-wider !text-black"
                    />
                </div>
            {/if}
        </div>

        <div class="bg-background/60 border border-secondary/20 p-4 rounded-lg flex flex-col justify-center sm:text-right min-w-[150px]">
            <span class="text-[10px] uppercase text-gray-400 font-text tracking-widest">Note Moyenne</span>
            <span class="text-2xl text-secondary font-title mt-1">
                {averageRating !== null ? `${averageRating.toFixed(1)} / 5` : 'N/A'}
            </span>
            <span class="text-xs text-gray-500 font-text mt-0.5">{reviews.length} critiques</span>
        </div>
    </div>

    {#if activeTab === 'lecture'}
        <!-- Reading Progress Tracker -->
        <div class="bg-background/80 px-6 rounded-lg space-y-4">
            
            {#if loadingProgression || loadingChapters}
                <div class="h-6 bg-gray-800/40 animate-pulse rounded"></div>
            {:else}
                <div class="flex flex-col sm:flex-row items-center justify-between gap-4 font-text">
                    <div class="flex w-full sm:w-auto">
                        <span class="text-white font-semibold text-lg">{readChaptersCount}</span>
                        <span class="text-lg text-gray-400">&nbsp;/&nbsp;{chapters.length}</span>
                    </div>
                    <div class="text-sm text-secondary font-title font-bold">
                        {progressPercentage}% Complété
                    </div>
                </div>

                <!-- Progress Bar -->
                <div class="w-full bg-gray-800 h-2.5 rounded-full overflow-hidden">
                    <div class="bg-secondary h-full transition-all duration-300" style="width: {progressPercentage}%"></div>
                </div>
            {/if}
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <!-- Chapters Section -->
            <div class="lg:col-span-2 space-y-6">
                <div class="flex justify-between items-center border-b border-gray-850 pb-3">
                    <h3 class="text-xl font-title text-secondary tracking-wider">Chapitres</h3>
                    {#if canManageChapters}
                        <Cta 
                            text="Écrire un Chapitre"
                            onClick={() => goto(`/clubs/${clubSlug}/books/${book.slug}/write`)}
                            dragon="Artrish"
                            border="Yinva"
                            class="h-8 w-auto px-3 font-title text-xs uppercase tracking-wider !text-black"
                        />
                    {/if}
                </div>

                {#if loadingChapters}
                    <div class="space-y-3">
                        <div class="h-10 bg-gray-800/40 animate-pulse rounded"></div>
                        <div class="h-10 bg-gray-800/40 animate-pulse rounded"></div>
                    </div>
                {:else if chapters.length === 0}
                    <div class="text-center py-10 border border-dashed border-gray-800 rounded font-text text-gray-500">
                        Aucun chapitre n'a encore été déchiffré dans cet ouvrage.
                    </div>
                {:else}
                    <div class="divide-y divide-gray-800/60">
                        {#each chapters as chapter (chapter.id)}
                            <div class="py-3 flex justify-between items-center group font-text">
                                <div class="flex items-center space-x-3">
                                    <button 
                                        onclick={() => handleToggleChapterRead(chapter)}
                                        class="w-5 h-5 rounded border border-secondary/40 flex items-center justify-center cursor-pointer transition-all hover:bg-secondary/20 bg-transparent focus:outline-none"
                                        title={chapter.isRead ? "Marquer comme non lu" : "Marquer comme lu"}
                                    >
                                        {#if chapter.isRead}
                                            <span class="text-secondary text-[11px] font-bold">✓</span>
                                        {/if}
                                    </button>
                                    <div>
                                        <span class="text-xs text-secondary font-title tracking-wider mr-3">INDEX {chapter.index}</span>
                                        <span class="text-sm text-gray-200 group-hover:text-secondary transition-colors font-semibold">{chapter.title}</span>
                                    </div>
                                </div>
                                <div class="flex items-center space-x-2">
                                    <Cta 
                                        text="Lire"
                                        onClick={() => onReadChapter(chapter)}
                                        dragon="Lada"
                                        border="Pestia"
                                        class="h-8 w-auto px-4 font-title text-xs uppercase tracking-wider !text-black"
                                    />
                                </div>
                            </div>
                        {/each}
                    </div>
                {/if}
            </div>

            <!-- Sidebar (Other members' progress) -->
            <div class="space-y-6">
                {#if canViewGlobalProgress}
                    <div class="border-b border-gray-855 pb-3">
                        <h3 class="text-lg font-title text-secondary tracking-wider">Progression des membres</h3>
                    </div>

                    <div class="bg-background/50 border border-gray-800 p-4 rounded-lg space-y-4 max-h-[400px] overflow-y-auto">
                        {#if globalProgressions.length === 0}
                            <p class="text-xs text-gray-500 font-text italic">Aucun autre membre n'a enregistré sa progression.</p>
                        {:else}
                            <div class="space-y-4 font-text">
                                {#each globalProgressions as memberProg}
                                    <div class="space-y-1">
                                        <div class="flex justify-between text-xs">
                                            <span class="text-gray-300 font-semibold">{memberProg.userName || 'Anonyme'}</span>
                                            <span class="text-secondary">{memberProg.currentPage} / {chapters.length} chap.</span>
                                        </div>
                                        <div class="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                                            <div 
                                                class="bg-secondary h-full" 
                                                style="width: {chapters.length > 0 ? Math.round((memberProg.currentPage / chapters.length) * 100) : 0}%"
                                            ></div>
                                        </div>
                                    </div>
                                {/each}
                            </div>
                        {/if}
                    </div>
                {/if}
            </div>
        </div>

    {:else if activeTab === 'critique'}
        <!-- Reviews Section -->
        <div class="space-y-6 max-w-4xl">
            <div class="border-b border-gray-850 pb-3">
                <h3 class="text-xl font-title text-secondary tracking-wider">Critiques des Initiés</h3>
            </div>

            <!-- Write review form -->
            <form onsubmit={handleAddReview} class="bg-background/40 border border-gray-800 p-5 rounded-lg space-y-4">
                <h4 class="text-sm font-title text-white uppercase tracking-wider">{myReview ? 'Modifier votre critique' : 'Laisser une critique'}</h4>
                
                <div class="flex items-center space-x-4">
                    <span class="text-xs font-text text-gray-400">Votre note :</span>
                    <div class="flex space-x-1">
                        {#each Array(5) as _, i}
                            <button 
                                type="button" 
                                onclick={() => newReviewRating = i + 1}
                                class="text-xl focus:outline-none cursor-pointer bg-transparent border-0"
                            >
                                <span class={newReviewRating > i ? 'text-secondary' : 'text-gray-600'}>★</span>
                            </button>
                        {/each}
                    </div>
                </div>

                <div>
                    <textarea 
                        bind:value={newReviewComment}
                        placeholder="Partagez vos impressions sur cet ouvrage avec la bibliothèque..."
                        rows="3"
                        class="w-full bg-primary/20 text-white border border-gray-800 focus:border-secondary p-3 rounded font-text text-sm focus:outline-none focus:ring-0"
                    ></textarea>
                </div>

                {#if reviewError}
                    <p class="text-xs text-Chronos font-text">{reviewError}</p>
                {/if}

                <Cta 
                    type="submit" 
                    disabled={submittingReview}
                    text={submittingReview ? 'Envoi...' : (myReview ? 'Modifier la critique' : 'Publier la critique')}
                    dragon="Drii"
                    border="Chronos"
                    class="h-10 !w-auto px-4 font-title text-xs uppercase tracking-wider !text-white"
                />
            </form>

            <!-- Reviews list -->
            {#if loadingReviews}
                <div class="h-12 bg-gray-800/40 animate-pulse rounded"></div>
            {:else if reviews.length === 0}
                <p class="text-sm text-gray-500 font-text italic">Aucune critique n'a encore été publiée.</p>
            {:else}
                <div class="space-y-4">
                    {#each reviews as review (review.id)}
                        <div class="border border-gray-800 bg-background/30 p-4 rounded-lg space-y-2 font-text">
                            <div class="flex justify-between items-center">
                                <div class="flex items-center space-x-2">
                                    {#if review.user.image}
                                        <img src={getImageUrl(review.user.image)} alt="" class="w-6 h-6 rounded-full object-cover" />
                                    {:else}
                                        {@const avatar = getUserAvatarDragon(review.userId)}
                                        <div class="w-6 h-6 rounded-full flex items-center justify-center border border-secondary/30 p-0.5 {avatar.bgClass}">
                                            <img src={avatar.logo} alt="" class="w-full h-full object-contain {avatar.svgClass}" />
                                        </div>
                                    {/if}
                                    <span class="text-xs text-gray-300 font-semibold">{review.user.name || 'Utilisateur anonyme'}</span>
                                    {#if review.userId === session.user.id}
                                        <span class="px-2 py-0.5 rounded bg-secondary/20 text-secondary text-[10px] uppercase font-bold tracking-wider">Votre critique</span>
                                    {/if}
                                </div>
                                <span class="text-secondary text-sm">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
                            </div>
                            {#if review.comment}
                                <p class="text-sm text-gray-300 leading-relaxed font-text italic">
                                    « {review.comment} »
                                </p>
                            {/if}
                            {#if session.user.role === 'ADMIN'}
                                <div class="pt-2 flex justify-end">
                                    <button 
                                        onclick={() => handleDeleteReviewAdmin(review.id)}
                                        class="text-xs text-Chronos hover:underline bg-transparent border-0 cursor-pointer"
                                    >
                                        Supprimer (Modération)
                                    </button>
                                </div>
                            {/if}
                        </div>
                    {/each}
                </div>
            {/if}
        </div>

    {:else if activeTab === 'admin' && canManageChapters}
        <!-- Administration view -->
        <div class="space-y-6 font-text max-w-4xl">
            <!-- Edit Book details card -->
            <div class="bg-background/60 border border-gray-800 p-4 sm:p-6 rounded-lg space-y-4">
                <h3 class="text-xl font-title text-secondary tracking-wider border-b border-gray-800 pb-2">Modifier l'ouvrage</h3>
                
                <form onsubmit={handleUpdateBook} class="grid grid-cols-1 md:grid-cols-5 gap-6">
                    <!-- Left pane (fields) -->
                    <div class="space-y-4 md:col-span-3">
                        <div>
                            <label for="edit-title" class="block text-xs font-text text-gray-300 mb-1">Titre du grimoire</label>
                            <input 
                                type="text" 
                                id="edit-title" 
                                bind:value={editTitle}
                                required
                                class="w-full bg-primary/10 text-white border border-gray-800 focus:border-secondary focus:ring-1 focus:ring-secondary/30 rounded-[var(--radius)] h-11 px-3 text-sm transition-all focus:outline-none"
                            />
                        </div>

                        <div>
                            <label for="edit-author" class="block text-xs font-text text-gray-300 mb-1">Auteur</label>
                            <input 
                                type="text" 
                                id="edit-author" 
                                bind:value={editAuthor}
                                required
                                class="w-full bg-primary/10 text-white border border-gray-800 focus:border-secondary focus:ring-1 focus:ring-secondary/30 rounded-[var(--radius)] h-11 px-3 text-sm transition-all focus:outline-none"
                            />
                        </div>

                        <div>
                            <label for="edit-genre" class="block text-xs font-text text-gray-300 mb-1">Genre</label>
                            <input 
                                type="text" 
                                id="edit-genre" 
                                bind:value={editGenre}
                                required
                                class="w-full bg-primary/10 text-white border border-gray-800 focus:border-secondary focus:ring-1 focus:ring-secondary/30 rounded-[var(--radius)] h-11 px-3 text-sm transition-all focus:outline-none"
                            />
                        </div>

                        <div>
                            <label for="edit-slug" class="block text-xs font-text text-gray-300 mb-1">Slug URL</label>
                            <input 
                                type="text" 
                                id="edit-slug" 
                                bind:value={editSlug}
                                required
                                class="w-full bg-primary/10 text-white border border-gray-800 focus:border-secondary focus:ring-1 focus:ring-secondary/30 rounded-[var(--radius)] h-11 px-3 text-sm transition-all focus:outline-none"
                            />
                        </div>
                    </div>

                    <!-- Right pane (dragon checkboxes grid) -->
                    <div class="md:col-span-2 flex flex-col justify-between space-y-6">
                        <div>
                            <span class="block text-xs font-text text-gray-300 mb-2">Thème Dragon (optionnel)</span>
                            <div class="grid grid-cols-4 gap-1.5">
                                {#each DRAGON_THEMES as theme}
                                    {@const isActive = editTheme === theme.name}
                                    <button
                                        type="button"
                                        title={theme.name}
                                        onclick={() => {
                                            if (editTheme === theme.name) {
                                                editTheme = '';
                                            } else {
                                                editTheme = theme.name;
                                            }
                                        }}
                                        class="relative flex flex-col items-center justify-center p-1 rounded-lg border text-center transition-all cursor-pointer select-none h-11 {isActive ? `${theme.border} bg-background/80 shadow-[0_0_12px_rgba(255,255,255,0.05)]` : 'bg-background/40 border-gray-850 hover:border-gray-750'}"
                                        style={isActive ? `border-color: var(--color-${theme.name}); box-shadow: 0 0 10px var(--color-${theme.name}33);` : ''}
                                    >
                                        <!-- Checkbox Indicator -->
                                        <div class="absolute top-0.5 right-0.5 w-2.5 h-2.5 rounded-sm border flex items-center justify-center {isActive ? `${theme.bg} border-transparent text-black` : 'border-gray-850 bg-transparent'}">
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

                        <!-- Save / Success Area -->
                        <div class="space-y-3 pt-4 border-t border-gray-800/80">
                            {#if updateBookError}
                                <p class="text-xs text-Chronos">{updateBookError}</p>
                            {/if}

                            {#if updateBookSuccess}
                                <p class="text-xs text-Guizamark">Le grimoire a été mis à jour avec succès.</p>
                            {/if}

                            <Cta 
                                type="submit"
                                disabled={updatingBook}
                                text={updatingBook ? 'Enregistrement...' : 'Enregistrer'}
                                dragon="Yinva"
                                border="Artrish"
                                class="h-10 w-full font-title text-xs uppercase tracking-wider !text-black"
                            />
                        </div>
                    </div>
                </form>
            </div>

            <!-- Chapters administration -->
            <div class="bg-background/60 border border-gray-800 p-4 sm:p-6 rounded-lg space-y-4">
                <div class="flex justify-between items-center border-b border-gray-800 pb-2">
                    <h3 class="text-xl font-title text-secondary tracking-wider">Gestion des Chapitres</h3>
                    <Cta 
                        text="Écrire un Chapitre"
                        onClick={() => goto(`/clubs/${clubSlug}/books/${book.slug}/write`)}
                        dragon="Artrish"
                        border="Yinva"
                        class="h-8 w-auto px-3 font-title text-xs uppercase tracking-wider !text-black"
                    />
                </div>

                {#if loadingChapters}
                    <div class="space-y-3">
                        <div class="h-10 bg-gray-800/40 animate-pulse rounded"></div>
                        <div class="h-10 bg-gray-800/40 animate-pulse rounded"></div>
                    </div>
                {:else if chapters.length === 0}
                    <div class="text-center py-10 text-gray-500 text-sm">
                        Aucun chapitre n'a encore été rédigé.
                    </div>
                {:else}
                    <div class="divide-y divide-gray-800/60 max-h-[500px] overflow-y-auto pr-2">
                        {#each chapters as chapter (chapter.id)}
                            <div class="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group">
                                <div>
                                    <span class="text-xs text-secondary font-title tracking-wider mr-3">INDEX {chapter.index}</span>
                                    <span class="text-sm text-gray-200 group-hover:text-secondary transition-colors font-semibold">{chapter.title}</span>
                                </div>
                                <div class="flex items-center space-x-2 w-full sm:w-auto justify-end">
                                    <Cta 
                                        text="Modifier"
                                        onClick={() => goto(`/clubs/${clubSlug}/books/${book.slug}/write?index=${chapter.index}`)}
                                        dragon="none"
                                        border="Yinva"
                                        class="h-8 w-auto px-3 font-title text-xs uppercase tracking-wider !text-secondary border border-secondary/30 hover:bg-secondary/10"
                                    />
                                    <Cta 
                                        text={deletingChapters[chapter.index] ? 'Suppression...' : 'Supprimer'}
                                        onClick={() => handleDeleteChapter(chapter.index, chapter.title)}
                                        disabled={deletingChapters[chapter.index]}
                                        dragon="none"
                                        border="Chronos"
                                        class="h-8 w-auto px-3 font-title text-xs uppercase tracking-wider !text-Chronos border border-Chronos/30 hover:bg-Chronos/10"
                                    />
                                </div>
                            </div>
                        {/each}
                    </div>
                {/if}
            </div>

            <!-- Danger Zone card -->
            <div class="border border-Chronos/30 bg-Chronos/5 p-4 sm:p-6 rounded-lg space-y-4">
                <h3 class="text-xl font-title text-Chronos tracking-wider border-b border-Chronos/10 pb-2">Zone de Danger</h3>
                <p class="text-xs text-gray-400 leading-relaxed">
                    La destruction de cet ouvrage est définitive. Tous les chapitres rédigés ainsi que les critiques et progressions associées seront définitivement perdus.
                </p>
                {#if deleteBookError}
                    <p class="text-xs text-Chronos">{deleteBookError}</p>
                {/if}
                <Cta 
                    onClick={handleDeleteBook}
                    disabled={deletingBook}
                    text={deletingBook ? 'Destruction...' : 'Détruire le grimoire'}
                    dragon="Chronos"
                    border="Chronos"
                    class="h-10 text-xs uppercase tracking-wider text-white font-title"
                />
            </div>
        </div>
    {/if}
</div>


