<script lang="ts">
    import { onMount } from 'svelte';
    import { 
        getChapters, createChapter, 
        getProgression, updateProgression, getGlobalProgressions,
        getReviews, createReview, 
        type Book, type Chapter, type Review, type Progression, type MemberProgression 
    } from '../../api';
    import type { AuthSession } from '../../auth-client';

    let { clubSlug, book, userRole, session, onBack, onReadChapter } = $props<{
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

    // User inputs
    let currentPageInput = $state(0);
    let savingProgression = $state(false);

    // Review form inputs
    let newReviewRating = $state(5);
    let newReviewComment = $state('');
    let submittingReview = $state(false);
    let reviewError = $state<string | null>(null);

    // Chapter form inputs
    let showAddChapterModal = $state(false);
    let newChapterTitle = $state('');
    let newChapterIndex = $state(1);
    let newChapterContent = $state('');
    let addingChapter = $state(false);
    let chapterError = $state<string | null>(null);

    // Permissions
    const canManageChapters = $derived(
        session.user.role === 'ADMIN' || userRole === 'OWNER' || userRole === 'EDITOR'
    );
    const canViewGlobalProgress = $derived(
        session.user.role === 'ADMIN' || userRole === 'OWNER' || userRole === 'EDITOR'
    );

    async function loadData() {
        // Chapters
        try {
            chapters = await getChapters(clubSlug, book.id);
            // Default next chapter index
            if (chapters.length > 0) {
                newChapterIndex = Math.max(...chapters.map(c => c.index)) + 1;
            }
        } catch (e) {
            console.error('Failed to load chapters:', e);
        } finally {
            loadingChapters = false;
        }

        // Progression
        try {
            progression = await getProgression(clubSlug, book.id);
            if (progression) {
                currentPageInput = progression.currentPage;
            }
        } catch (e) {
            console.error('Failed to load progression:', e);
        } finally {
            loadingProgression = false;
        }

        // Reviews
        try {
            reviews = await getReviews(clubSlug, book.id);
        } catch (e) {
            console.error('Failed to load reviews:', e);
        } finally {
            loadingReviews = false;
        }

        // Global progressions (if permitted)
        if (canViewGlobalProgress) {
            try {
                globalProgressions = await getGlobalProgressions(clubSlug, book.id);
            } catch (e) {
                console.error('Failed to load global progressions:', e);
            }
        }
    }

    async function handleUpdateProgression() {
        if (currentPageInput < 0 || currentPageInput > book.pages) return;
        savingProgression = true;
        try {
            const updated = await updateProgression(clubSlug, book.id, currentPageInput);
            progression = updated;
            // Refresh global progressions if visible
            if (canViewGlobalProgress) {
                globalProgressions = await getGlobalProgressions(clubSlug, book.id);
            }
        } catch (e: any) {
            alert('Erreur de progression: ' + e.message);
        } finally {
            savingProgression = false;
        }
    }

    async function handleAddReview(e: Event) {
        e.preventDefault();
        submittingReview = true;
        reviewError = null;
        try {
            const created = await createReview(clubSlug, book.id, newReviewRating, newReviewComment || undefined);
            
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
            newReviewComment = '';
        } catch (e: any) {
            reviewError = e.message || 'Erreur lors de la soumission de la critique.';
        } finally {
            submittingReview = false;
        }
    }

    async function handleAddChapter(e: Event) {
        e.preventDefault();
        if (!newChapterTitle.trim() || !newChapterContent.trim() || newChapterIndex <= 0) return;

        addingChapter = true;
        chapterError = null;
        try {
            const created = await createChapter(clubSlug, book.id, {
                index: newChapterIndex,
                title: newChapterTitle,
                content: newChapterContent
            });
            chapters = [...chapters, created].sort((a, b) => a.index - b.index);
            showAddChapterModal = false;
            newChapterTitle = '';
            newChapterContent = '';
            newChapterIndex = Math.max(...chapters.map(c => c.index)) + 1;
        } catch (e: any) {
            chapterError = e.message || 'Erreur lors de la création du chapitre.';
        } finally {
            addingChapter = false;
        }
    }

    onMount(() => {
        loadData();
    });

    const progressPercentage = $derived(
        book.pages > 0 ? Math.round((currentPageInput / book.pages) * 100) : 0
    );
</script>

<div class="w-full max-w-5xl mx-auto p-4 sm:p-6 space-y-8">
    <!-- Back Button & Header -->
    <div class="flex flex-col sm:flex-row justify-between items-start gap-4 border-b border-gray-800 pb-6">
        <div>
            <button onclick={onBack} class="text-secondary font-title text-sm tracking-wider hover:underline mb-2 block cursor-pointer">
                ← Retour à la bibliothèque
            </button>
            <h1 class="text-3xl sm:text-4xl font-title text-white leading-tight">{book.title}</h1>
            <p class="text-gray-400 font-text italic">par {book.author} — <span class="text-secondary">{book.genre}</span></p>
        </div>

        <div class="bg-background/60 border border-secondary/20 p-4 rounded-lg flex flex-col justify-center sm:text-right min-w-[150px]">
            <span class="text-[10px] uppercase text-gray-400 font-text tracking-widest">Note Moyenne</span>
            <span class="text-2xl text-secondary font-title mt-1">
                {book.averageRating !== null ? `${book.averageRating.toFixed(1)} / 5` : 'N/A'}
            </span>
            <span class="text-xs text-gray-500 font-text mt-0.5">{reviews.length} critiques</span>
        </div>
    </div>

    <!-- Reading Progress Tracker -->
    <div class="bg-background/80 border border-gray-800 p-6 rounded-lg space-y-4">
        <h3 class="text-lg font-title text-secondary tracking-wider">Votre Grimoire & Progression</h3>
        
        {#if loadingProgression}
            <div class="h-6 bg-gray-800/40 animate-pulse rounded"></div>
        {:else}
            <div class="flex flex-col sm:flex-row items-center justify-between gap-4 font-text">
                <div class="flex items-center space-x-3 w-full sm:w-auto">
                    <span class="text-sm text-gray-300">Page actuelle :</span>
                    <input 
                        type="number" 
                        bind:value={currentPageInput}
                        min="0"
                        max={book.pages}
                        class="w-20 bg-primary text-black text-center h-8 font-title"
                    />
                    <span class="text-sm text-gray-400">sur {book.pages}</span>
                    <button 
                        onclick={handleUpdateProgression}
                        disabled={savingProgression}
                        class="px-4 py-1 rounded bg-secondary hover:bg-secondary/90 text-black font-title text-xs uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50"
                    >
                        {savingProgression ? 'Enregistrement...' : 'Mettre à jour'}
                    </button>
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
                    <button 
                        onclick={() => showAddChapterModal = true}
                        class="px-3 py-1 border border-secondary/40 rounded text-secondary font-title text-xs uppercase tracking-wider hover:bg-secondary/10 transition-colors cursor-pointer"
                    >
                        Écrire un Chapitre
                    </button>
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
                            <div>
                                <span class="text-xs text-secondary font-title tracking-wider mr-3">INDEX {chapter.index}</span>
                                <span class="text-sm text-gray-200 group-hover:text-secondary transition-colors font-semibold">{chapter.title}</span>
                            </div>
                            <button 
                                onclick={() => onReadChapter(chapter)}
                                class="px-3 py-1 rounded-[var(--radius)] font-title text-xs uppercase tracking-wider text-black bg-secondary hover:bg-secondary/90 transition-colors cursor-pointer"
                            >
                                Lire
                            </button>
                        </div>
                    {/each}
                </div>
            {/if}

            <!-- Reviews Section -->
            <div class="space-y-6 pt-6">
                <div class="border-b border-gray-850 pb-3">
                    <h3 class="text-xl font-title text-secondary tracking-wider">Critiques des Initiés</h3>
                </div>

                <!-- Write review form -->
                <form onsubmit={handleAddReview} class="bg-background/40 border border-gray-800 p-5 rounded-lg space-y-4">
                    <h4 class="text-sm font-title text-white uppercase tracking-wider">Laisser une critique</h4>
                    
                    <div class="flex items-center space-x-4">
                        <span class="text-xs font-text text-gray-400">Votre note :</span>
                        <div class="flex space-x-1">
                            {#each Array(5) as _, i}
                                <button 
                                    type="button" 
                                    onclick={() => newReviewRating = i + 1}
                                    class="text-xl focus:outline-none cursor-pointer"
                                >
                                    <span class={newReviewRating > i ? 'text-secondary' : 'text-gray-600'}>★</span>
                                </button>
                            {/each}
                        </div>
                    </div>

                    <div>
                        <textarea 
                            bind:value={newReviewComment}
                            placeholder="Partagez vos impressions sur cet ouvrage avec le cercle..."
                            rows="3"
                            class="w-full bg-primary/20 text-white border border-gray-800 focus:border-secondary p-3 rounded font-text text-sm focus:outline-none focus:ring-0"
                        ></textarea>
                    </div>

                    {#if reviewError}
                        <p class="text-xs text-Chronos font-text">{reviewError}</p>
                    {/if}

                    <button 
                        type="submit" 
                        disabled={submittingReview}
                        class="px-4 py-2 bg-secondary text-black font-title text-xs uppercase tracking-wider rounded transition-colors disabled:opacity-50 cursor-pointer"
                    >
                        {submittingReview ? 'Envoi...' : 'Publier la critique'}
                    </button>
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
                                            <img src={review.user.image} alt="" class="w-6 h-6 rounded-full object-cover" />
                                        {:else}
                                            <div class="w-6 h-6 rounded-full bg-primary text-black flex items-center justify-center font-bold text-xs">
                                                {review.user.name?.charAt(0) || 'U'}
                                            </div>
                                        {/if}
                                        <span class="text-xs text-gray-300 font-semibold">{review.user.name || 'Utilisateur anonyme'}</span>
                                    </div>
                                    <span class="text-secondary text-sm">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
                                </div>
                                {#if review.comment}
                                    <p class="text-sm text-gray-300 leading-relaxed font-text italic">
                                        « {review.comment} »
                                    </p>
                                {/if}
                            </div>
                        {/each}
                    </div>
                {/if}
            </div>
        </div>

        <!-- Sidebar (Other members' progress) -->
        <div class="space-y-6">
            {#if canViewGlobalProgress}
                <div class="border-b border-gray-850 pb-3">
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
                                        <span class="text-gray-300 font-semibold">{memberProg.user.name || 'Anonyme'}</span>
                                        <span class="text-secondary">{memberProg.currentPage} / {book.pages} p.</span>
                                    </div>
                                    <div class="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                                        <div 
                                            class="bg-secondary h-full" 
                                            style="width: {book.pages > 0 ? Math.round((memberProg.currentPage / book.pages) * 100) : 0}%"
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
</div>

<!-- Modal Add Chapter -->
{#if showAddChapterModal}
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/90 backdrop-blur-sm">
        <div class="w-full max-w-2xl bg-background border border-secondary/40 p-6 sm:p-8 rounded-lg shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button 
                onclick={() => showAddChapterModal = false}
                class="absolute right-4 top-4 text-gray-400 hover:text-white text-xl cursor-pointer"
            >
                ✕
            </button>

            <h2 class="text-2xl font-title text-secondary mb-6 tracking-wider">Écrire un Chapitre</h2>
            
            <form onsubmit={handleAddChapter} class="space-y-4">
                <div class="grid grid-cols-3 gap-4">
                    <div class="col-span-1">
                        <label for="chapter-index" class="block text-xs font-text text-gray-300 mb-1">Index</label>
                        <input 
                            type="number" 
                            id="chapter-index" 
                            bind:value={newChapterIndex}
                            min="1"
                            required
                            class="bg-primary text-black border border-foreground/30 focus:border-secondary h-10 px-3 text-sm"
                        />
                    </div>
                    <div class="col-span-2">
                        <label for="chapter-title" class="block text-xs font-text text-gray-300 mb-1">Titre du chapitre</label>
                        <input 
                            type="text" 
                            id="chapter-title" 
                            placeholder="Ex: La chute de la maison Harkonnen" 
                            bind:value={newChapterTitle}
                            required
                            class="bg-primary text-black border border-foreground/30 focus:border-secondary h-10 px-3 text-sm"
                        />
                    </div>
                </div>

                <div>
                    <label for="chapter-content" class="block text-xs font-text text-gray-300 mb-1">Contenu (Texte / Récit)</label>
                    <textarea 
                        id="chapter-content" 
                        placeholder="Rédigez ou collez le récit mystique de ce chapitre..." 
                        bind:value={newChapterContent}
                        required
                        rows="8"
                        class="w-full bg-primary/20 text-white border border-gray-800 focus:border-secondary p-3 rounded font-text text-sm focus:outline-none focus:ring-0"
                    ></textarea>
                </div>

                {#if chapterError}
                    <p class="text-sm text-Chronos font-text">{chapterError}</p>
                {/if}

                <div class="flex space-x-3 pt-4">
                    <button 
                        type="button"
                        onclick={() => showAddChapterModal = false}
                        class="w-1/2 h-10 rounded-[var(--radius)] font-title text-sm uppercase tracking-wider text-white border border-white/20 hover:bg-white/5 transition-colors cursor-pointer"
                    >
                        Annuler
                    </button>
                    <button 
                        type="submit"
                        disabled={addingChapter}
                        class="w-1/2 h-10 rounded-[var(--radius)] font-title text-sm uppercase tracking-wider text-black bg-secondary hover:bg-secondary/90 transition-colors cursor-pointer disabled:opacity-50"
                    >
                        {addingChapter ? 'Création...' : 'Graver le chapitre'}
                    </button>
                </div>
            </form>
        </div>
    </div>
{/if}
