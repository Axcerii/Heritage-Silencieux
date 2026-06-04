<script lang="ts">
    import { onMount } from 'svelte';
    import { fly } from 'svelte/transition';
    import { getChapter, updateProgression, type Chapter } from '../../api';
    import Cta from '../Cta.svelte';

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
    let loading = $state(false);
    let error = $state<string | null>(null);

    // Font size setting for accessibility
    let fontSize = $state(18); // default px

    // Pagination states
    let pages = $state<string[]>(['']);
    let currentPageIndex = $state(0);
    let bookContainerWidth = $state(800);
    let direction = $state(1); // 1 for next, -1 for prev
    let shouldStartAtEnd = $state(false);

    // DOM references
    let offscreenMeasurer = $state<HTMLElement | null>(null);

    // Responsive derived values
    const isDesktop = $derived(bookContainerWidth >= 768);
    const pageWidth = $derived(isDesktop ? (bookContainerWidth / 2) : bookContainerWidth);

    // Find previous and next chapters from the book's chapter list
    const currentIndex = $derived(chapters.findIndex((c: Chapter) => c.id === currentChapter.id));
    const prevChapter = $derived(currentIndex > 0 ? chapters[currentIndex - 1] : null);
    const nextChapter = $derived(currentIndex < chapters.length - 1 ? chapters[currentIndex + 1] : null);

    // Debounced pagination trigger to prevent lag during active resizing
    let paginationTimeout: any;
    function debouncedPagination() {
        clearTimeout(paginationTimeout);
        paginationTimeout = setTimeout(() => {
            runPagination();
        }, 150);
    }

    $effect(() => {
        // Track reactive dependencies automatically
        const _title = currentChapter.title;
        const _text = currentChapter.content;
        const _size = fontSize;
        const _width = pageWidth;
        const _measurer = offscreenMeasurer;

        if (_measurer && _text) {
            debouncedPagination();
        }
        return () => clearTimeout(paginationTimeout);
    });

    function runPagination() {
        if (!offscreenMeasurer || !currentChapter?.content) {
            pages = [currentChapter?.content || ''];
            return;
        }

        const maxContentHeight = 350; // fixed page content height (excl headers/padding/page-numbers)
        const text = currentChapter.content;
        const paragraphs = text.split('\n');
        const paginatedPages: string[] = [];
        let currentPageText = '';

        for (let i = 0; i < paragraphs.length; i++) {
            const para = paragraphs[i];
            const testText = currentPageText 
                ? currentPageText + '\n\n' + para 
                : para;
            
            offscreenMeasurer.innerText = testText;

            if (offscreenMeasurer.scrollHeight <= maxContentHeight) {
                currentPageText = testText;
            } else {
                const words = para.split(' ');
                let addedWordsCount = 0;
                let paraBuffer = '';

                while (addedWordsCount < words.length) {
                    const nextWord = words[addedWordsCount];
                    const nextParaBuffer = paraBuffer 
                        ? paraBuffer + ' ' + nextWord 
                        : nextWord;
                    const nextTestText = currentPageText 
                        ? currentPageText + '\n\n' + nextParaBuffer 
                        : nextParaBuffer;

                    offscreenMeasurer.innerText = nextTestText;

                    if (offscreenMeasurer.scrollHeight <= maxContentHeight) {
                        paraBuffer = nextParaBuffer;
                        addedWordsCount++;
                    } else {
                        break;
                    }
                }

                if (currentPageText || paraBuffer) {
                    paginatedPages.push(currentPageText ? currentPageText + (paraBuffer ? '\n\n' + paraBuffer : '') : paraBuffer);
                }

                const remainingWords = words.slice(addedWordsCount).join(' ');
                if (i < paragraphs.length - 1 && remainingWords) {
                    paragraphs[i] = remainingWords;
                    i--;
                    currentPageText = '';
                } else if (remainingWords) {
                    currentPageText = remainingWords;
                } else {
                    currentPageText = '';
                }
            }
        }

        if (currentPageText) {
            paginatedPages.push(currentPageText);
        }

        pages = paginatedPages.length > 0 ? paginatedPages : [''];

        // Align page index bounds
        if (shouldStartAtEnd) {
            const lastIdx = pages.length - 1;
            currentPageIndex = isDesktop ? (lastIdx - (lastIdx % 2)) : lastIdx;
            shouldStartAtEnd = false;
        } else {
            if (currentPageIndex >= pages.length) {
                currentPageIndex = Math.max(0, pages.length - (isDesktop ? 2 : 1));
            } else if (isDesktop && currentPageIndex % 2 !== 0) {
                currentPageIndex = Math.max(0, currentPageIndex - 1);
            }
        }
    }

    async function loadChapter(chapter: Chapter, startAtEnd = false) {
        if (onNavigateChapter) {
            shouldStartAtEnd = startAtEnd;
            onNavigateChapter(chapter);
        } else {
            loading = true;
            error = null;
            try {
                currentChapter = await getChapter(clubSlug, bookId, chapter.index);
                shouldStartAtEnd = startAtEnd;
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } catch (e: any) {
                error = e.message || 'Impossible de charger le contenu de ce chapitre.';
            } finally {
                loading = false;
            }
        }
    }

    function nextPage() {
        direction = 1;
        const step = isDesktop ? 2 : 1;
        if (currentPageIndex + step < pages.length) {
            currentPageIndex += step;
        } else if (nextChapter) {
            loadChapter(nextChapter, false);
        }
    }

    function prevPage() {
        direction = -1;
        const step = isDesktop ? 2 : 1;
        if (currentPageIndex - step >= 0) {
            currentPageIndex -= step;
        } else if (prevChapter) {
            loadChapter(prevChapter, true);
        }
    }

    function handleKeyDown(e: KeyboardEvent) {
        if (e.key === 'ArrowLeft') {
            prevPage();
        } else if (e.key === 'ArrowRight') {
            nextPage();
        }
    }

    onMount(() => {
        if (!onNavigateChapter) {
            loadChapter(initialChapter);
        }
    });
</script>

<svelte:window onkeydown={handleKeyDown} />

<!-- Offscreen measurer to dynamically paginate the text -->
<div 
    bind:this={offscreenMeasurer}
    class="font-text text-justify leading-relaxed whitespace-pre-wrap break-words select-none pointer-events-none absolute left-[-9999px] top-[-9999px]"
    style="font-size: {fontSize}px; width: {pageWidth - 64}px; padding: 0;"
></div>

<div class="w-full max-w-5xl mx-auto p-4 sm:p-6 space-y-6 select-none">
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
            <Cta 
                text="Tenter à nouveau"
                onClick={() => loadChapter(currentChapter)}
                dragon="Chronos"
                border="Chronos"
                class="!w-auto px-4 h-10 font-title text-sm uppercase tracking-wider !text-white"
            />
        </div>
    {:else}
        <!-- Interactive Visual 3D Book Layout -->
        <div class="relative w-full py-4 select-none">
            <!-- Book Container Frame -->
            <div class="bg-[#2a241e] border-4 border-[#3e342b] sm:border-8 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.7)] relative p-1.5 sm:p-3 overflow-visible">
                
                <!-- Inner pages container -->
                <div 
                    bind:clientWidth={bookContainerWidth}
                    class="bg-[#faf4eb] text-[#2c251e] rounded-lg shadow-[inset_0_0_40px_rgba(0,0,0,0.15)] relative min-h-[500px] max-h-[500px] overflow-hidden flex flex-col md:flex-row transition-all duration-300"
                >
                    <!-- Book spine divider/shadow (Desktop only) -->
                    {#if isDesktop}
                        <div class="absolute left-1/2 top-0 bottom-0 w-[2px] bg-black/10 shadow-[0_0_12px_1px_rgba(0,0,0,0.4)] z-20 pointer-events-none"></div>
                        <div class="absolute left-1/2 top-0 bottom-0 w-[24px] -translate-x-1/2 bg-gradient-to-r from-black/5 via-transparent to-black/5 z-10 pointer-events-none"></div>
                    {/if}

                    <!-- Page corner decorations -->
                    <div class="absolute top-2 left-2 w-3 h-3 border-t border-l border-black/10 pointer-events-none"></div>
                    <div class="absolute top-2 right-2 w-3 h-3 border-t border-r border-black/10 pointer-events-none"></div>
                    <div class="absolute bottom-2 left-2 w-3 h-3 border-b border-l border-black/10 pointer-events-none"></div>
                    <div class="absolute bottom-2 right-2 w-3 h-3 border-b border-r border-black/10 pointer-events-none"></div>

                    <!-- Left / Single Page -->
                    <div class="flex-1 flex flex-col justify-between p-6 sm:p-8 relative min-h-0">
                        <div class="text-center text-[10px] uppercase tracking-widest text-[#8a7657] font-title mb-4 border-b border-[#ebdcb9] pb-1 select-none">
                            Chapitre {currentChapter.index}
                        </div>
                        {#key currentPageIndex}
                            <div 
                                in:fly={{ x: direction * 50, duration: 250, delay: 100 }} 
                                out:fly={{ x: -direction * 50, duration: 250 }}
                                class="flex-1 flex flex-col justify-between min-h-0 select-text"
                            >
                                <div 
                                    style="font-size: {fontSize}px; line-height: 1.8;" 
                                    class="font-text text-justify leading-relaxed whitespace-pre-wrap break-words overflow-hidden text-sm sm:text-base md:text-lg flex-1 select-text"
                                >
                                    {pages[currentPageIndex] || ''}
                                </div>
                                <div class="text-center font-title text-xs tracking-wider text-[#8a7657]/70 pt-4 mt-auto select-none">
                                    Page {currentPageIndex + 1}
                                </div>
                            </div>
                        {/key}
                    </div>

                    <!-- Right Page (Desktop only) -->
                    {#if isDesktop}
                        <div class="flex-1 flex flex-col justify-between p-6 sm:p-8 border-l border-black/5 relative min-h-0">
                            <div class="text-center text-[10px] uppercase tracking-widest text-[#8a7657] font-title mb-4 border-b border-[#ebdcb9] pb-1 select-none">
                                {currentChapter.title}
                            </div>
                            {#key currentPageIndex}
                                <div 
                                    in:fly={{ x: direction * 50, duration: 250, delay: 100 }} 
                                    out:fly={{ x: -direction * 50, duration: 250 }}
                                    class="flex-1 flex flex-col justify-between min-h-0 select-text"
                                >
                                    {#if currentPageIndex + 1 < pages.length}
                                        <div 
                                            style="font-size: {fontSize}px; line-height: 1.8;" 
                                            class="font-text text-justify leading-relaxed whitespace-pre-wrap break-words overflow-hidden text-sm sm:text-base md:text-lg flex-1 select-text"
                                        >
                                            {pages[currentPageIndex + 1] || ''}
                                        </div>
                                        <div class="text-center font-title text-xs tracking-wider text-[#8a7657]/70 pt-4 mt-auto select-none">
                                            Page {currentPageIndex + 2}
                                        </div>
                                    {:else}
                                        <!-- Empty page content with elegant watermark -->
                                        <div class="flex-1 flex flex-col items-center justify-center opacity-15 select-none my-auto">
                                            <img src="/dragons_logos/normal/Artrish.svg" alt="" class="w-16 h-16 secondary-svg" />
                                            <span class="text-xs uppercase tracking-widest mt-2 font-title text-[#8a7657]">Fin du Chapitre</span>
                                        </div>
                                        <div class="text-center font-title text-xs tracking-wider text-[#8a7657]/70 pt-4 mt-auto select-none">
                                            -
                                        </div>
                                    {/if}
                                </div>
                            {/key}
                        </div>
                    {/if}
                </div>

                <!-- Floating Page Flip Buttons on the edges -->
                <button 
                    onclick={prevPage}
                    disabled={currentPageIndex === 0 && !prevChapter}
                    class="absolute left-[-15px] sm:left-[-25px] top-1/2 -translate-y-1/2 w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-[#D2B674] hover:bg-[#c2a665] text-black shadow-[0_4px_15px_rgba(0,0,0,0.5)] flex items-center justify-center cursor-pointer transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed z-30"
                    title="Page Précédente"
                >
                    <span class="text-lg sm:text-2xl font-bold">←</span>
                </button>

                <button 
                    onclick={nextPage}
                    disabled={currentPageIndex + (isDesktop ? 2 : 1) >= pages.length && !nextChapter}
                    class="absolute right-[-15px] sm:right-[-25px] top-1/2 -translate-y-1/2 w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-[#D2B674] hover:bg-[#c2a665] text-black shadow-[0_4px_15px_rgba(0,0,0,0.5)] flex items-center justify-center cursor-pointer transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed z-30"
                    title="Page Suivante"
                >
                    <span class="text-lg sm:text-2xl font-bold">→</span>
                </button>
            </div>
        </div>

        <!-- Pagination Controls and Progress Slider -->
        <div class="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4 select-none">
            <Cta 
                text="← Chapitre Précédent"
                onClick={() => loadChapter(prevChapter)}
                disabled={!prevChapter}
                dragon="none"
                border="Pura"
                class="h-10 w-full sm:w-auto px-4 text-secondary disabled:opacity-30"
            />
            
            <div class="flex items-center space-x-3 bg-background/60 border border-gray-800 rounded px-4 py-2 text-xs w-full sm:w-auto justify-center">
                <span class="text-gray-400 font-text font-bold">
                    Page {currentPageIndex + 1}{isDesktop && currentPageIndex + 1 < pages.length ? `-${currentPageIndex + 2}` : ''} / {pages.length}
                </span>
                <input 
                    type="range" 
                    min="0" 
                    max={pages.length - 1} 
                    step={isDesktop ? 2 : 1}
                    bind:value={currentPageIndex} 
                    class="w-32 accent-secondary cursor-pointer"
                />
            </div>

            <Cta 
                text="Chapitre Suivant →"
                onClick={() => loadChapter(nextChapter)}
                disabled={!nextChapter}
                dragon="Pura"
                border="Pura"
                class="h-10 w-full sm:w-auto px-4 !text-black disabled:opacity-30"
            />
        </div>
    {/if}
</div>
