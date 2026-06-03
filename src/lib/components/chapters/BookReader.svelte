<script lang="ts">
    import { onMount } from 'svelte';
    import { getChapter, updateProgression, type Chapter } from '../../api';

    let { clubSlug, bookId, initialChapter, chapters, bookPages, onBack, onNavigateChapter } = $props<{
        clubSlug: string;
        bookId: string;
        initialChapter: Chapter;
        chapters: Chapter[];
        bookPages: number;
        onBack: () => void;
        onNavigateChapter?: (chapter: Chapter) => void;
    }>();

    let currentChapter = $state<Chapter>(initialChapter);
    
    $effect(() => {
        currentChapter = initialChapter;
    });

    let loading = $state(false);
    let error = $state<string | null>(null);

    // Font size setting for accessibility
    let fontSize = $state(18); // default px

    // Find previous and next chapters from the book's chapter list
    const currentIndex = $derived(chapters.findIndex((c: Chapter) => c.id === currentChapter.id));
    const prevChapter = $derived(currentIndex > 0 ? chapters[currentIndex - 1] : null);
    const nextChapter = $derived(currentIndex < chapters.length - 1 ? chapters[currentIndex + 1] : null);

    async function loadChapter(chapter: Chapter) {
        if (onNavigateChapter) {
            onNavigateChapter(chapter);
        } else {
            loading = true;
            error = null;
            try {
                // Fetch fresh content if needed
                currentChapter = await getChapter(clubSlug, bookId, chapter.index);
                // Scroll reader container to top
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } catch (e: any) {
                error = e.message || 'Impossible de charger le contenu de ce chapitre.';
            } finally {
                loading = false;
            }
        }
    }

    onMount(() => {
        // Initial fetch if no parent navigation callback is managing it
        if (!onNavigateChapter) {
            loadChapter(initialChapter);
        }
    });
</script>

<div class="w-full max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
    <!-- Header Tools -->
    <div class="flex items-center justify-between border-b border-gray-800 pb-4">
        <button onclick={onBack} class="text-secondary font-title text-sm tracking-wider hover:underline cursor-pointer">
            ← Fermer le Grimoire
        </button>

        <!-- Font sizing controls -->
        <div class="flex items-center space-x-3 bg-background/60 border border-gray-800 rounded px-3 py-1 font-text text-xs">
            <span class="text-gray-400">Taille de police :</span>
            <button 
                onclick={() => fontSize = Math.max(14, fontSize - 2)} 
                class="w-6 h-6 rounded bg-gray-800 text-white flex items-center justify-center hover:bg-gray-700 cursor-pointer"
            >
                A-
            </button>
            <span class="text-white font-semibold">{fontSize}px</span>
            <button 
                onclick={() => fontSize = Math.min(26, fontSize + 2)} 
                class="w-6 h-6 rounded bg-gray-800 text-white flex items-center justify-center hover:bg-gray-700 cursor-pointer"
            >
                A+
            </button>
        </div>
    </div>

    {#if loading}
        <div class="flex flex-col items-center justify-center py-24">
            <div class="w-12 h-12 rounded-full border-2 border-secondary border-t-transparent animate-spin mb-4"></div>
            <p class="text-secondary font-title text-xl animate-pulse">Transcription des parchemins...</p>
        </div>
    {:else if error}
        <div class="border border-Chronos/30 bg-Chronos/10 text-Chronos p-6 rounded-lg text-center font-text">
            <p class="mb-4">{error}</p>
            <button onclick={() => loadChapter(currentChapter)} class="px-4 py-2 bg-Chronos text-white rounded font-title hover:bg-Chronos/85 transition-colors cursor-pointer">
                Tenter à nouveau
            </button>
        </div>
    {:else}
        <!-- Reading Parchment Scroll -->
        <article class="bg-[#24211d] text-[#eadaab] border-2 border-[#b59e6c] shadow-[0_10px_35px_rgba(0,0,0,0.6)] p-8 sm:p-12 rounded-xl relative select-text transition-all duration-300">
            <!-- Ancient page corners -->
            <div class="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-[#b59e6c]/40"></div>
            <div class="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-[#b59e6c]/40"></div>
            <div class="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-[#b59e6c]/40"></div>
            <div class="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-[#b59e6c]/40"></div>

            <div class="text-center mb-8 border-b-2 border-[#b59e6c]/20 pb-6">
                <span class="text-xs uppercase tracking-[0.3em] text-[#b59e6c] font-title block mb-2">Chapitre {currentChapter.index}</span>
                <h1 class="text-3xl sm:text-5xl font-title text-[#d5c39c] tracking-wide leading-tight">{currentChapter.title}</h1>
            </div>

            <!-- Scroll content -->
            <div 
                style="font-size: {fontSize}px"
                class="font-text leading-relaxed text-justify space-y-6 max-w-2xl mx-auto break-words whitespace-pre-wrap selection:bg-[#b59e6c]/30 selection:text-white"
            >
                {currentChapter.content}
            </div>

            <!-- Chapter signature watermark -->
            <div class="flex justify-center mt-12 pt-6 border-t-2 border-[#b59e6c]/20">
                <img src="/dragons_logos/normal/Artrish.svg" alt="" class="w-12 h-12 opacity-15 secondary-svg" />
            </div>
        </article>

        <!-- Chapter Navigation -->
        <div class="flex justify-between items-center py-4 font-title text-sm">
            {#if prevChapter}
                <button 
                    onclick={() => loadChapter(prevChapter)}
                    class="px-4 py-2 border border-secondary/40 rounded text-secondary hover:bg-secondary/15 transition-colors cursor-pointer"
                >
                    ← Précédent : {prevChapter.title}
                </button>
            {:else}
                <div class="text-gray-600 italic">Début de l'ouvrage</div>
            {/if}

            {#if nextChapter}
                <button 
                    onclick={() => loadChapter(nextChapter)}
                    class="px-4 py-2 bg-secondary text-black rounded hover:bg-secondary/90 transition-colors cursor-pointer"
                >
                    Suivant : {nextChapter.title} →
                </button>
            {:else}
                <div class="text-gray-600 italic">Fin de l'ouvrage</div>
            {/if}
        </div>
    {/if}
</div>
