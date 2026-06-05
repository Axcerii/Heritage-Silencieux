<script lang="ts">
    import { onMount } from 'svelte';
    import { getChapter, toggleChapterRead, type Chapter } from '../../api';
    import Cta from '../Cta.svelte';
    import { marked } from 'marked';
    import BookPage from './BookPage.svelte';

    let { clubSlug, bookId, bookTitle, initialChapter, chapters, bookPages, onBack, onNavigateChapter } = $props<{
        clubSlug: string;
        bookId: string;
        bookTitle?: string;
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
    const horizontalPadding = $derived(isDesktop ? 64 : 48);

    // Dynamic max content height based on device view height
    const maxContentHeight = $derived(isDesktop ? 480 : 420);

    // Derived progress percentage through the current chapter
    const progressPercent = $derived(
        pages.length > 0
            ? Math.min(100, Math.max(0, ((currentPageIndex + (isDesktop ? (currentPageIndex + 1 < pages.length ? 2 : 1) : 1)) / pages.length) * 100))
            : 0
    );

    // Helper to identify if currently viewing the last page of this chapter
    const isLastPageOfChapter = $derived(pages.length > 0 && currentPageIndex + (isDesktop ? 2 : 1) >= pages.length);

    // Helper to identify if currently viewing the first page of this chapter
    const isFirstPageOfChapter = $derived(currentPageIndex === 0);

    // Derived transition timing parameters
    const DURATION = 250;
    const OVERLAP = 50;
    const DELAY = DURATION - OVERLAP; // 200

    const leftInDuration = $derived(direction === 1 ? DURATION : 0);
    const leftInDelay = $derived(direction === 1 ? DELAY : 0);
    const leftOutDuration = $derived(direction === 1 ? 0 : DURATION);
    const leftOutDelay = $derived(direction === 1 ? DELAY : 0);

    const rightInDuration = $derived(direction === -1 ? DURATION : 0);
    const rightInDelay = $derived(direction === -1 ? DELAY : 0);
    const rightOutDuration = $derived(direction === -1 ? 0 : DURATION);
    const rightOutDelay = $derived(direction === -1 ? DELAY : 0);

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
        const measurer = offscreenMeasurer as HTMLElement;
        if (typeof window === 'undefined' || !measurer || !currentChapter?.content) {
            pages = [currentChapter?.content || ''];
            return;
        }

        // Parse markdown to HTML
        const htmlContent = marked.parse(currentChapter.content) as string;
        
        // Create a temporary container to extract block-level elements
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlContent;
        const elements = Array.from(tempDiv.children) as HTMLElement[];

        // Helper function to recursively split an element by height
        function splitElement(element: HTMLElement, maxHeight: number, currentPrefixHtml: string) {
            const fitClone = element.cloneNode(false) as HTMLElement;
            const remainingClone = element.cloneNode(false) as HTMLElement;
            
            let hasRemaining = false;

            function fits() {
                measurer.innerHTML = currentPrefixHtml + fitClone.outerHTML;
                return measurer.scrollHeight <= maxHeight;
            }

            function process(node: Node, fitParent: Node, remainingParent: Node) {
                if (hasRemaining) {
                    remainingParent.appendChild(node.cloneNode(true));
                    return;
                }

                if (node.nodeType === Node.TEXT_NODE) {
                    const text = node.nodeValue || '';
                    const words = text.split(/(\s+)/);
                    
                    let currentText = '';
                    let fitTextNode = document.createTextNode('');
                    fitParent.appendChild(fitTextNode);

                    for (let i = 0; i < words.length; i++) {
                        const word = words[i];
                        fitTextNode.nodeValue = currentText + word;
                        
                        if (fits()) {
                            currentText += word;
                        } else {
                            // Prevent infinite loop if a single word is taller than the page
                            if (currentPrefixHtml === '' && currentText === '' && i === 0) {
                                currentText += word;
                                fitTextNode.nodeValue = currentText;
                                continue;
                            }
                            
                            hasRemaining = true;
                            fitTextNode.nodeValue = currentText;
                            
                            const remainingText = words.slice(i).join('');
                            if (remainingText) {
                                remainingParent.appendChild(document.createTextNode(remainingText));
                            }
                            break;
                        }
                    }
                } else if (node.nodeType === Node.ELEMENT_NODE) {
                    const childFitClone = node.cloneNode(false) as HTMLElement;
                    const childRemainingClone = node.cloneNode(false) as HTMLElement;
                    
                    fitParent.appendChild(childFitClone);
                    
                    const children = Array.from(node.childNodes);
                    for (let i = 0; i < children.length; i++) {
                        process(children[i], childFitClone, childRemainingClone);
                    }
                    
                    if (hasRemaining) {
                        if (childRemainingClone.childNodes.length > 0) {
                            remainingParent.appendChild(childRemainingClone);
                        }
                        if (childFitClone.childNodes.length === 0) {
                            fitParent.removeChild(childFitClone);
                        }
                    }
                }
            }

            const childNodes = Array.from(element.childNodes);
            for (let i = 0; i < childNodes.length; i++) {
                process(childNodes[i], fitClone, remainingClone);
            }

            return {
                fitHtml: fitClone.outerHTML,
                remainingHtml: hasRemaining ? remainingClone.outerHTML : null,
                fitHasNodes: fitClone.childNodes.length > 0
            };
        }

        const paginatedPages: string[] = [];
        let currentPageHtml = '';

        for (let i = 0; i < elements.length; i++) {
            const element = elements[i];
            
            // Check if this element is or contains an image
            const hasImage = element.tagName === 'IMG' || element.querySelector('img') !== null;
            
            if (hasImage) {
                // End current page first
                if (currentPageHtml) {
                    paginatedPages.push(currentPageHtml);
                    currentPageHtml = '';
                }
                // Push the image element as its own page
                paginatedPages.push(element.outerHTML);
                continue;
            }

            const elementHtml = element.outerHTML;
            const testHtml = currentPageHtml 
                ? currentPageHtml + elementHtml 
                : elementHtml;
            
            measurer.innerHTML = testHtml;

            if (measurer.scrollHeight <= maxContentHeight) {
                currentPageHtml = testHtml;
            } else {
                // The element doesn't fit as a whole. Split it!
                const { fitHtml, remainingHtml, fitHasNodes } = splitElement(element, maxContentHeight, currentPageHtml);
                
                if (fitHasNodes) {
                    paginatedPages.push(currentPageHtml ? currentPageHtml + fitHtml : fitHtml);
                    currentPageHtml = '';
                } else {
                    if (currentPageHtml) {
                        paginatedPages.push(currentPageHtml);
                        currentPageHtml = '';
                    }
                }
                
                if (remainingHtml) {
                    const tempDiv2 = document.createElement('div');
                    tempDiv2.innerHTML = remainingHtml;
                    const remainingElement = tempDiv2.firstElementChild as HTMLElement;
                    if (remainingElement) {
                        elements.splice(i + 1, 0, remainingElement);
                    }
                }
            }
        }

        if (currentPageHtml) {
            paginatedPages.push(currentPageHtml);
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

    function handlePageInputChange(e: Event) {
        const val = parseInt((e.currentTarget as HTMLInputElement).value);
        if (!isNaN(val) && val >= 1 && val <= pages.length) {
            const targetIdx = val - 1;
            const alignedIdx = isDesktop ? (targetIdx - (targetIdx % 2)) : targetIdx;
            direction = alignedIdx >= currentPageIndex ? 1 : -1;
            currentPageIndex = alignedIdx;
        }
    }

    let isMarkingRead = false;
    async function markCurrentChapterAsRead() {
        if (currentChapter.isRead || isMarkingRead) return;
        isMarkingRead = true;
        try {
            await toggleChapterRead(clubSlug, bookId, currentChapter.index, true);
            currentChapter.isRead = true;
        } catch (e) {
            console.error('Failed to mark chapter as read:', e);
        } finally {
            isMarkingRead = false;
        }
    }

    $effect(() => {
        // Automatically mark chapter as read when viewing the last page(s)
        if (pages.length > 0 && currentPageIndex + (isDesktop ? 2 : 1) >= pages.length) {
            markCurrentChapterAsRead();
        }
    });

    // Sync external initialChapter prop to currentChapter state and reset page index on navigation
    $effect(() => {
        if (initialChapter) {
            if (currentChapter.id !== initialChapter.id) {
                currentChapter = initialChapter;
                if (!shouldStartAtEnd) {
                    currentPageIndex = 0;
                }
            }
        }
    });

    function turnPage(node: HTMLElement, { duration = 300, delay = 0, direction = 1, isLeft = true, incoming = true }) {
        const origin = isLeft ? 'right' : 'left';
        node.style.transformOrigin = origin;
        node.style.backfaceVisibility = 'hidden';
        
        return {
            duration,
            delay,
            css: (t: number) => {
                let angle = 0;
                if (incoming) {
                    if (direction === 1) {
                        if (isLeft) angle = (1 - t) * 90;
                    } else {
                        if (!isLeft) angle = (1 - t) * -90;
                    }
                } else {
                    if (direction === 1) {
                        if (!isLeft) angle = (t - 1) * 90;
                    } else {
                        if (isLeft) angle = (1 - t) * 90;
                    }
                }
                
                const isFlippingSheet = (direction === 1 && ((!isLeft && !incoming) || (isLeft && incoming))) || 
                                        (direction === -1 && ((isLeft && !incoming) || (!isLeft && incoming)));
                const zIndex = isFlippingSheet ? 30 : 20;

                if (angle === 0) {
                    return `opacity: ${t}; z-index: ${zIndex};`;
                }
                
                const shadow = Math.max(0, 1 - t) * 0.45;
                return `
                    transform: perspective(3000px) rotateY(${angle}deg);
                    opacity: ${t > 0.35 ? 1 : 0};
                    box-shadow: inset ${isLeft ? '-' : ''}${t * 15}px 0 25px rgba(0,0,0,${shadow});
                    background-color: color-mix(in srgb, #faf4eb, #000 ${shadow * 100}%);
                    z-index: ${zIndex};
                `;
            }
        };
    }

    onMount(() => {
        if (!onNavigateChapter) {
            loadChapter(initialChapter);
        }
    });
</script>

<svelte:window onkeydown={handleKeyDown} />

<!-- Offscreen measurer to dynamically paginate the text -->
<div class="w-0 h-0 overflow-hidden absolute left-0 top-0 pointer-events-none select-none">
    <div 
        bind:this={offscreenMeasurer}
        class="prose prose-stone text-justify leading-relaxed break-words text-sm sm:text-base md:text-lg min-h-0 max-w-none prose-p:my-2 prose-p:text-[#2c251e] prose-strong:text-[#2c251e] prose-em:text-[#2c251e] prose-li:text-[#2c251e] prose-headings:text-[#524332] prose-headings:font-title prose-headings:my-2 prose-img:rounded-[var(--radius)] prose-img:border prose-img:border-secondary/20 prose-img:my-3 prose-img:mx-auto prose-img:max-h-[340px] md:prose-img:max-h-[400px] prose-img:object-contain"
        style="font-size: {fontSize}px; width: {pageWidth - horizontalPadding}px; padding: 0; max-height: {maxContentHeight}px;"
    ></div>
</div>

<div class="w-full max-w-6xl mx-auto px-10 sm:px-12 py-2 sm:py-4 space-y-3 sm:space-y-4 select-none">
    <!-- Header Tools -->
    <div class="flex items-center justify-between border-b border-gray-800 pb-2">
        <div class="flex items-center space-x-3">
            <button onclick={onBack} class="text-secondary font-title text-sm tracking-wider hover:underline cursor-pointer">
                ← Fermer le Grimoire
            </button>
            {#if bookTitle}
                <span class="text-gray-600">|</span>
                <span class="text-gray-300 font-title text-sm tracking-wider uppercase font-semibold truncate max-w-[200px] sm:max-w-none">{bookTitle}</span>
            {/if}
        </div>

        <!-- Read status badge -->
        <div class="flex items-center space-x-2">
            <span class="text-xs font-text uppercase tracking-widest text-gray-400">Statut :</span>
            {#if currentChapter.isRead}
                <span class="text-xs bg-secondary/20 text-secondary border border-secondary/30 px-2 py-0.5 rounded font-text font-bold">Lu</span>
            {:else}
                <span class="text-xs bg-gray-800 text-gray-400 border border-gray-700 px-2 py-0.5 rounded font-text">En cours</span>
            {/if}
        </div>

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
                    class="bg-[#faf4eb] text-[#2c251e] rounded-lg shadow-[inset_0_0_40px_rgba(0,0,0,0.15)] relative min-h-[600px] max-h-[600px] md:min-h-[650px] md:max-h-[650px] overflow-visible flex flex-col md:flex-row transition-all duration-300"
                    style="perspective: 3000px; transform-style: preserve-3d;"
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
                    <div 
                        class="flex-1 relative min-h-0" 
                        style="z-index: {!isDesktop ? 1 : (direction === -1 ? 10 : 1)}; transform-style: preserve-3d;"
                    >
                        {#key `left-${currentPageIndex}`}
                            <BookPage 
                                content={pages[currentPageIndex]} 
                                pageNumber={`Page ${currentPageIndex + 1}`}
                                headerText={`Chapitre ${currentChapter.index}`}
                                isLeft={true}
                                {direction}
                                {fontSize}
                                {turnPage}
                                {isDesktop}
                                inDuration={leftInDuration}
                               inDelay={leftInDelay}
                                outDuration={leftOutDuration}
                                outDelay={leftOutDelay}
                            />
                        {/key}
                    </div>
 
                    <!-- Right Page (Desktop only) -->
                    {#if isDesktop}
                        <div 
                            class="flex-1 relative min-h-0" 
                            style="z-index: {direction === 1 ? 10 : 1}; transform-style: preserve-3d;"
                        >
                            {#key `right-${currentPageIndex}`}
                                <BookPage 
                                    content={currentPageIndex + 1 < pages.length 
                                        ? pages[currentPageIndex + 1] 
                                        : `<div class="flex-1 flex flex-col items-center justify-center opacity-15 select-none my-auto shrink-0"><img src="/dragons_logos/normal/Artrish.svg" alt="" class="w-16 h-16 secondary-svg" /><span class="text-xs uppercase tracking-widest mt-2 font-title font-semibold text-[#524332]">Fin du Chapitre</span></div>`} 
                                    pageNumber={currentPageIndex + 1 < pages.length 
                                        ? `Page ${currentPageIndex + 2}` 
                                        : "-"}
                                    headerText={currentChapter.title}
                                    isLeft={false}
                                    {direction}
                                    {fontSize}
                                    {turnPage}
                                    {isDesktop}
                                    inDuration={rightInDuration}
                                    inDelay={rightInDelay}
                                    outDuration={rightOutDuration}
                                    outDelay={rightOutDelay}
                                />
                            {/key}
                        </div>
                    {/if}

                    <!-- Progression bar at the bottom of the pages -->
                    <div class="absolute bottom-0 left-0 right-0 h-1.5 bg-[#ebdcb9]/40 z-20 overflow-hidden rounded-b-lg">
                        <div 
                            class="bg-[#D2B674] h-full transition-all duration-300" 
                            style="width: {progressPercent}%"
                        ></div>
                    </div>
                </div>

                <!-- Floating Page Flip Buttons on the edges -->
                <div class="absolute left-[-15px] sm:left-[-25px] top-1/2 -translate-y-1/2 z-30 flex flex-col items-center">
                    {#if isFirstPageOfChapter && prevChapter}
                        <div class="absolute bottom-full mb-2 bg-Yinva/80 text-background text-[9px] sm:text-[10px] font-title uppercase tracking-widest px-2.5 py-1 rounded shadow-lg whitespace-nowrap animate-bounce">
                            Chapitre Précédent
                        </div>
                    {/if}
                    <button 
                        onclick={prevPage}
                        disabled={currentPageIndex === 0 && !prevChapter}
                        class="w-8 h-8 sm:w-12 sm:h-12 rounded-full flex items-center justify-center cursor-pointer transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed
                            {isFirstPageOfChapter && prevChapter
                                ? 'bg-Yinva hover:bg-Chronos text-background shadow-[0_0_15px_rgba(202,68,68,0.6)]' 
                                : 'bg-Pura hover:bg-[#c2a665] text-black shadow-[0_4px_15px_rgba(0,0,0,0.5)]'}"
                        title={isFirstPageOfChapter && prevChapter ? "Chapitre Précédent" : "Page Précédente"}
                    >
                        <span class="text-lg sm:text-2xl font-bold">←</span>
                    </button>
                </div>

                <div class="absolute right-[-15px] sm:right-[-25px] top-1/2 -translate-y-1/2 z-30 flex flex-col items-center">
                    {#if isLastPageOfChapter && nextChapter}
                        <div class="absolute bottom-full mb-2 bg-Yinva/80 text-background text-[9px] sm:text-[10px] font-title uppercase tracking-widest px-2.5 py-1 rounded shadow-lg whitespace-nowrap animate-bounce">
                            Chapitre Suivant
                        </div>
                    {/if}
                    <button 
                        onclick={nextPage}
                        disabled={currentPageIndex + (isDesktop ? 2 : 1) >= pages.length && !nextChapter}
                        class="w-8 h-8 sm:w-12 sm:h-12 rounded-full flex items-center justify-center cursor-pointer transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed
                            {isLastPageOfChapter && nextChapter
                                ? 'bg-Yinva hover:bg-Chronos text-background shadow-[0_0_15px_rgba(202,68,68,0.6)]' 
                                : 'bg-Pura hover:bg-[#c2a665] text-black shadow-[0_4px_15px_rgba(0,0,0,0.5)]'}"
                        title={isLastPageOfChapter && nextChapter ? "Chapitre Suivant" : "Page Suivante"}
                    >
                        <span class="text-lg sm:text-2xl font-bold">→</span>
                    </button>
                </div>
            </div>
        </div>

        <!-- Pagination Controls and Progress Slider -->
        <div class="flex flex-col sm:flex-row justify-between items-center mt-3 gap-2 select-none">
            <Cta 
                text="← Chapitre Précédent"
                onClick={() => {
                    direction = -1;
                    loadChapter(prevChapter);
                }}
                disabled={!prevChapter}
                dragon={isFirstPageOfChapter ? "Chronos" : "Lada"}
                border={isFirstPageOfChapter ? "Chronos" : "Lada"}
                class="h-10 w-full sm:w-auto px-4 {isFirstPageOfChapter ? '!text-white' : '!text-Shizari'} disabled:opacity-30"
            />
            
            <div class="flex items-center space-x-2 bg-background/60 border border-gray-800 rounded px-3 py-1.5 text-xs w-40 sm:w-34 justify-center">
                <span class="text-Guizamark font-text font-bold font-semibold">Page&nbsp;:</span>
                <input 
                    type="number" 
                    min="1" 
                    max={pages.length} 
                    value={currentPageIndex + 1}
                    onchange={handlePageInputChange}
                    class="w-12 h-6 px-1.5 text-center bg-gray-900 border border-gray-700 text-white rounded font-bold focus:border-secondary focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span class="text-gray-400 font-text font-bold">/&nbsp;{pages.length}</span>
            </div>

            <Cta 
                text="Chapitre Suivant →"
                onClick={() => {
                    direction = 1;
                    loadChapter(nextChapter);
                }}
                disabled={!nextChapter}
                dragon={isLastPageOfChapter ? "Chronos" : "Lada"}
                border={isLastPageOfChapter ? "Chronos" : "Lada"}
                class="h-10 w-full sm:w-auto px-4 {isLastPageOfChapter ? '!text-white' : '!text-black'} disabled:opacity-30"
            />
        </div>
    {/if}
</div>
