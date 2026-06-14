<script lang="ts">
    import { page } from '$app/state';
    import { fade, fly } from 'svelte/transition';
    import { getRandomErrorSentence } from '$lib/errorSentences';
    import { goto } from '$app/navigation';
    import Cta from '$lib/components/Cta.svelte';

    const DRAGONS = [
        'Aqua',
        'Artrish',
        'Chronos',
        'Drii',
        'Goliath',
        'Guizamark',
        'Lada',
        'Pestia',
        'Pura',
        'Shizari',
        'Yinva'
    ];

    function getRandomDragon(exclude?: string): string {
        const pool = exclude ? DRAGONS.filter((d) => d !== exclude) : DRAGONS;
        return pool[Math.floor(Math.random() * pool.length)];
    }

    let currentSentence = $state<string>(getRandomErrorSentence());
    let currentDragon = $state<string>(getRandomDragon());
</script>

<div class="flex-1 flex flex-col items-center justify-center px-6 py-12 relative overflow-hidden min-h-[70vh]">
    <!-- Dynamic Dragon Watermark Backdrop -->
    {#key currentDragon}
        <div 
            in:fade={{ duration: 700 }}
            out:fade={{ duration: 450 }}
            class="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden select-none -z-10"
        >
            <img 
                src="/dragons_logos/tampons/{currentDragon}.svg" 
                alt="" 
                class="w-[85vw] h-[85vw] max-w-[480px] max-h-[480px] opacity-[0.06] transform scale-110 rotate-6 transition-all duration-700 ease-in-out {currentDragon}-svg"
            />
        </div>
    {/key}

    <!-- Main Content Card -->
    <div class="flex flex-col items-center text-center max-w-2xl z-10">
        <!-- Error Status Code -->
        <h1 
            class="text-8xl md:text-9xl font-title tracking-wider text-secondary filter drop-shadow-[0_0_15px_rgba(210,182,116,0.25)] select-none"
            style="margin-bottom: 1rem;"
        >
            {page.status || '404'}
        </h1>

        <!-- Lore Title -->
        <h2 
            class="text-xs font-title tracking-[0.2em] uppercase text-gray-400 select-none"
            style="margin-top: 0.5rem; margin-bottom: 1rem;"
        >
            Page Perdue dans l'Oubli
        </h2>

        <!-- Traditional Medieval Divider Line -->
        <div 
            class="w-24 h-[1px] bg-gradient-to-r from-transparent via-secondary/40 to-transparent select-none"
            style="margin-top: 2rem; margin-bottom: 2rem;"
        ></div>

        <!-- The Randomly Selected Sentence -->
        <div 
            class="min-h-[120px] flex items-center justify-center px-4"
            style="margin-top: 2rem; margin-bottom: 2rem;"
        >
            {#key currentSentence}
                <div 
                    in:fly={{ y: 12, duration: 500 }}
                    out:fade={{ duration: 250 }}
                >
                    <p class="text-secondary">
                        Le saviez vous ?
                    </p>
                    <p class="text-2xl font-title text-gray-200 leading-relaxed font-semibold text-left">
                        {currentSentence} 
                    </p>
                </div>
            {/key}
        </div>

        <!-- Action Links & Buttons -->
        <div 
            class="flex flex-col sm:flex-row items-center justify-center gap-4 w-full"
            style="margin-top: 2.5rem;"
        >
            <Cta 
                text="Retourner à l'Héritage"
                onClick={() => goto('/')}
                dragon="Drii"
                border="Chronos"
                class="!w-auto px-8 font-title text-[18px] uppercase tracking-wider hover:shadow-[0_0_15px_rgba(210,182,116,0.3)]"
            />
        </div>
    </div>
</div>
