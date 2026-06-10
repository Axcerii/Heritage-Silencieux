<script lang="ts">
    import type { Book } from '../../api';

    let { book, onSelect } = $props<{
        book: Book;
        onSelect: (book: Book) => void;
    }>();

    // Map genres to themes matching design system
    const DRAGON_THEMES = [
        { name: 'Yinva', logo: '/dragons_logos/normal/Yinva.svg', svgFilter: 'Yinva-svg' },
        { name: 'Guizamark', logo: '/dragons_logos/normal/Guizamark.svg', svgFilter: 'Guizamark-svg' },
        { name: 'Pestia', logo: '/dragons_logos/normal/Pestia.svg', svgFilter: 'Pestia-svg' },
        { name: 'Chronos', logo: '/dragons_logos/normal/Chronos.svg', svgFilter: 'Chronos-svg' },
        { name: 'Aqua', logo: '/dragons_logos/normal/Aqua.svg', svgFilter: 'Aqua-svg' },
        { name: 'Goliath', logo: '/dragons_logos/normal/Goliath.svg', svgFilter: 'Goliath-svg' },
        { name: 'Drii', logo: '/dragons_logos/normal/Drii.svg', svgFilter: 'Drii-svg' },
        { name: 'Lada', logo: '/dragons_logos/normal/Lada.svg', svgFilter: 'Lada-svg' },
        { name: 'Pura', logo: '/dragons_logos/normal/Pura.svg', svgFilter: 'Pura-svg' },
        { name: 'Artrish', logo: '/dragons_logos/normal/Artrish.svg', svgFilter: 'Artrish-svg' },
        { name: 'Shizari', logo: '/dragons_logos/normal/Shizari.svg', svgFilter: 'Shizari-svg' }
    ];

    function getTheme(genre: string, explicitTheme?: string) {
        if (explicitTheme) {
            const found = DRAGON_THEMES.find(t => t.name === explicitTheme);
            if (found) return found;
        }
        const normalized = genre.toLowerCase().trim();
        
        if (normalized.includes('science-fiction') || normalized.includes('sf') || normalized.includes('dystopie') || normalized.includes('cyberpunk') || normalized.includes('yinva')) {
            return DRAGON_THEMES.find(t => t.name === 'Yinva')!;
        }
        if (normalized.includes('aventure') || normalized.includes('action') || normalized.includes('guizamark')) {
            return DRAGON_THEMES.find(t => t.name === 'Guizamark')!;
        }
        if (normalized.includes('classique') || normalized.includes('littérature') || normalized.includes('drame') || normalized.includes('pura')) {
            return DRAGON_THEMES.find(t => t.name === 'Pura')!;
        }
        if (normalized.includes('thriller') || normalized.includes('policier') || normalized.includes('horreur') || normalized.includes('chronos')) {
            return DRAGON_THEMES.find(t => t.name === 'Chronos')!;
        }
        if (normalized.includes('fantasy') || normalized.includes('fantastique') || normalized.includes('magie') || normalized.includes('pestia')) {
            return DRAGON_THEMES.find(t => t.name === 'Pestia')!;
        }
        if (normalized.includes('poésie') || normalized.includes('théâtre') || normalized.includes('lada')) {
            return DRAGON_THEMES.find(t => t.name === 'Lada')!;
        }
        if (normalized.includes('historique') || normalized.includes('histoire') || normalized.includes('goliath')) {
            return DRAGON_THEMES.find(t => t.name === 'Goliath')!;
        }
        if (normalized.includes('romance') || normalized.includes('drii')) {
            return DRAGON_THEMES.find(t => t.name === 'Drii')!;
        }
        if (normalized.includes('philosophie') || normalized.includes('essai') || normalized.includes('aqua')) {
            return DRAGON_THEMES.find(t => t.name === 'Aqua')!;
        }
        if (normalized.includes('artrish')) {
            return DRAGON_THEMES.find(t => t.name === 'Artrish')!;
        }
        
        // Deterministic hash based on genre name as fallback
        let hash = 0;
        for (let i = 0; i < normalized.length; i++) {
            hash = normalized.charCodeAt(i) + ((hash << 5) - hash);
        }
        const index = Math.abs(hash) % DRAGON_THEMES.length;
        return DRAGON_THEMES[index];
    }

    const theme = $derived(getTheme(book.genre, book.theme));

    function renderStars(rating: number | null) {
        if (rating === null) return '';
        const fullStars = Math.round(rating);
        return '★'.repeat(fullStars);
    }
</script>

<div class="w-full [perspective:1200px] flex justify-center">
    <button 
        onclick={() => onSelect(book)}
        class="relative w-full aspect-[70/99] max-w-[300px] group cursor-pointer text-left block [transform-style:preserve-3d]"
        style="--theme-color: var(--color-{theme.name});"
    >
        <!-- Stacked 3D Pages Block (behind the cover) -->
        <div class="absolute right-[4px] top-[4px] bottom-[4px] left-[10px] bg-[#FAF6EE] border-y border-r border-[#D9D1C3]/65 rounded-r shadow-inner z-0 transition-transform duration-500 ease-out origin-left group-hover:scale-x-[1.03] book-pages"></div>

        <!-- Front Cover of the Book -->
        <div class="absolute inset-y-0 left-0 right-[6px] rounded-r-md rounded-l-[3px] bg-gradient-to-b from-[#282828] via-[#1E1E1E] to-[#121212] border border-gray-800/80 shadow-lg transition-all duration-500 ease-out origin-left group-hover:[transform:rotateY(-24deg)] group-hover:shadow-[25px_20px_35px_rgba(0,0,0,0.65)] z-10 flex flex-col justify-between p-4 overflow-hidden book-cover">
            
            <!-- Spine shadow & fold markings -->
            <div class="absolute left-0 top-0 bottom-0 w-[11px] bg-gradient-to-r from-black/55 to-transparent z-20 pointer-events-none"></div>
            <div class="absolute left-[11px] top-0 bottom-0 w-[1px] bg-white/5 z-20 pointer-events-none"></div>
            <div class="absolute left-[12px] top-0 bottom-0 w-[1px] bg-black/45 z-20 pointer-events-none"></div>

            <!-- Glossy sweep reflection on hover -->
            <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out pointer-events-none z-20"></div>

            <!-- Cover decorative inner frame (themed) -->
            <div class="absolute inset-2.5 border rounded-r-[4px] rounded-l-[2px] pointer-events-none z-10 book-frame"></div>

            <!-- Bookmark Genre flag (themed) -->
            <div 
                class="absolute top-0 right-3.5 w-6 pb-3.5 pt-1 flex flex-col items-center shadow-md z-20 group-hover:pb-5 transition-all duration-300 book-bookmark"
                style="clip-path: polygon(0% 0%, 100% 0%, 100% 100%, 50% 85%, 0% 100%);"
            >
                <span 
                    class="text-[10px] uppercase tracking-widest font-text font-bold whitespace-nowrap" 
                    style="writing-mode: vertical-rl;"
                >
                    {book.genre}
                </span>
            </div>

            <!-- Watermark Dragon Logo (themed) -->
            <div class="absolute inset-0 flex items-center justify-center opacity-20 group-hover:opacity-[0.09] group-hover:scale-105 transition-all duration-500 pointer-events-none z-0">
                <img src={theme.logo} alt="" class="w-24 h-24 object-contain {theme.svgFilter}" />
            </div>

            <!-- Empty header height layout filler -->
            <div class="h-2"></div>

            <!-- Centered book contents -->
            <div class="my-auto flex flex-col items-center justify-center text-center w-full z-10 px-1">
                <h3 class="text-sm sm:text-2xl font-title text-white transition-colors duration-300 leading-snug line-clamp-3 mb-1 font-bold book-title">
                    {book.title}
                </h3>
                
                <p class="text-[9.5px] sm:text-sm text-gray-400 font-text italic">
                    {book.author}
                </p>
            </div>

            <!-- Rating stars stamped on cover (themed) -->
            <div class="flex flex-col items-center w-full z-10 pb-0.5">
                <span class="text-[10px] tracking-wider transition-all duration-300 font-text book-stars">
                    {renderStars(book.averageRating)}
                </span>
            </div>
        </div>
    </button>
</div>

<style>
    /* 3D Pages Styling */
    .book-pages {
        background-image: repeating-linear-gradient(
            to bottom,
            #faf6ee,
            #faf6ee 2px,
            #d5c9b4 3px,
            #faf6ee 4px
        );
        box-shadow: 
            inset -3px 0 6px rgba(0,0,0,0.1),
            2px 3px 8px rgba(0,0,0,0.3);
    }

    /* Book cover default border tint */
    .book-cover {
        border-color: color-mix(in srgb, var(--theme-color) 20%, #2b2b2b);
    }
    .group:hover .book-cover {
        border-color: color-mix(in srgb, var(--theme-color) 45%, #2b2b2b);
    }

    /* Decorative cover frame */
    .book-frame {
        border-color: color-mix(in srgb, var(--theme-color) 12%, transparent);
        transition: border-color 0.3s ease;
    }
    .group:hover .book-frame {
        border-color: color-mix(in srgb, var(--theme-color) 35%, transparent);
    }

    /* Genre bookmark ribbon */
    .book-bookmark {
        background-color: color-mix(in srgb, var(--theme-color) 18%, transparent);
        border-left: 1px solid color-mix(in srgb, var(--theme-color) 30%, transparent);
        border-right: 1px solid color-mix(in srgb, var(--theme-color) 30%, transparent);
        border-bottom: 1px solid color-mix(in srgb, var(--theme-color) 30%, transparent);
        transition: background-color 0.3s ease, border-color 0.3s ease, padding-bottom 0.3s ease;
    }
    .group:hover .book-bookmark {
        background-color: color-mix(in srgb, var(--theme-color) 30%, transparent);
        border-color: color-mix(in srgb, var(--theme-color) 60%, transparent);
    }
    .book-bookmark span {
        color: color-mix(in srgb, var(--theme-color) 85%, #fff);
        transition: color 0.3s ease;
    }
    .group:hover .book-bookmark span {
        color: var(--theme-color);
    }

    /* Divider line */
    .book-divider {
        background-color: color-mix(in srgb, var(--theme-color) 25%, transparent);
        width: 1.5rem;
    }
    .group:hover .book-divider {
        background-color: var(--theme-color);
        width: 2.5rem;
    }

    /* Title */
    .book-title {
        transition: color 0.3s ease;
    }
    .group:hover .book-title {
        color: var(--theme-color);
    }

    /* Rating Stars */
    .book-stars {
        color: color-mix(in srgb, var(--theme-color) 60%, transparent);
    }
    .group:hover .book-stars {
        color: var(--theme-color);
        transform: scale(1.08);
    }
</style>
