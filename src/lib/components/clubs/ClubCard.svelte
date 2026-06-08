<script lang="ts">
    import type { Club } from '../../api';

    let { club, onSelect } = $props<{
        club: Club;
        onSelect: (club: Club) => void;
    }>();

    // Map club slug to a specific dragon theme for rich visuals
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
        { name: 'Artrish', color: 'text-Artrish', bg: 'bg-Artrish', border: 'border-Artrish/30', hoverBorder: 'hover:border-Artrish', shadow: 'hover:shadow-[0_0_20px_rgba(255,255,255,0.15)]', logo: '/dragons_logos/normal/Artrish.svg', svgFilter: 'Artrish-svg' }
    ];

    function getTheme(slug: string) {
        if (slug.includes('classiques')) {
            return DRAGON_THEMES.find(t => t.name === 'Pura')!;
        }
        if (slug.includes('science-fiction') || slug.includes('sf')) {
            return DRAGON_THEMES.find(t => t.name === 'Yinva')!;
        }
        if (slug.includes('inactif') || slug.includes('secret')) {
            return DRAGON_THEMES.find(t => t.name === 'Goliath')!;
        }
        // Determinisitc selection for others
        let hash = 0;
        for (let i = 0; i < slug.length; i++) {
            hash = slug.charCodeAt(i) + ((hash << 5) - hash);
        }
        const index = Math.abs(hash) % DRAGON_THEMES.length;
        return DRAGON_THEMES[index];
    }

    const theme = $derived(getTheme(club.slug));
</script>

<button 
    onclick={() => onSelect(club)}
    class="group text-left w-full relative overflow-hidden bg-background/60 backdrop-blur-md border {theme.border} {theme.hoverBorder} {theme.shadow} p-6 rounded-lg transition-all duration-300 ease-out cursor-pointer hover:-translate-y-1 flex flex-col justify-between min-h-[160px]"
>
    <!-- Background Dragon Watermark -->
    <div class="absolute right-[-20px] bottom-[-20px] w-36 h-36 opacity-20 group-hover:opacity-30 group-hover:scale-110 transition-all duration-500 pointer-events-none">
        <img src={theme.logo} alt="" class="w-full h-full object-contain {theme.svgFilter}" />
    </div>

    <!-- Background Bookshelf -->
    <div class="absolute top-[-50%] left-0 h-[200%] opacity-5 group-hover:opacity-10 group-hover:scale-110 transition-all duration-500 pointer-events-none">
        <img src="/Bookshelf.svg" alt="" class="w-full h-full object-contain {theme.svgFilter}" />
    </div>

    <div>
        <div class="flex items-center justify-between mb-2">

                {#if club.isPublic}
                    <span class="text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded bg-accent/20 text-accent border border-accent/30">Public</span>
                {:else}
                    <span class="text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded bg-primary/20 text-primary border border-primary/30">Privé</span>
                {/if}
            {#if !club.isActive}
                <span class="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded bg-Chronos/20 text-Chronos border border-Chronos/30">Inactif</span>
            {/if}
        </div>
        <h3 class="text-xl sm:text-2xl font-title {theme.color} leading-tight mb-1 group-hover:text-shadow transition-all duration-300">
            {club.name}
        </h3>
        <p class="text-xs text-gray-400 font-text italic">
            /{club.slug}
        </p>
    </div>

    <div class="mt-4 pt-4 border-t border-gray-800/50 flex items-center justify-end">
        <span class="text-xl {theme.color} font-title tracking-wider group-hover:translate-x-1 transition-transform duration-200">Consulter →</span>
    </div>
</button>
