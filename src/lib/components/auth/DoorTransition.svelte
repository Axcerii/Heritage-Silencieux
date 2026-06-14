<script lang="ts">
    let { open = false, onComplete = () => {} } = $props();
    let showDoors = $state(true);

    $effect(() => {
        if (open) {
            const timer = setTimeout(() => {
                showDoors = false;
                onComplete();
            }, 1300); // slightly longer than transition to guarantee completion
            return () => clearTimeout(timer);
        }
    });
</script>

{#if showDoors}
<div class="fixed inset-0 z-40 flex overflow-hidden perspective-[1200px] pointer-events-none">
    <!-- Left Door -->
    <div 
        class="relative w-1/2 h-full bg-[#1b1b1b] border-r border-[var(--color-secondary)] transition-all duration-[1200ms] ease-in-out origin-left flex items-center justify-end pointer-events-auto shadow-2xl shadow-[inset_-8px_0_12px_-6px_rgba(210,182,116,0.4)]"
        class:open-left={open}
    >
        <!-- Background texture overlay -->
        <div class="absolute inset-0 bg-cover opacity-[0.03] pointer-events-none" style="background-image: url('/soft-neige1B1B1B.png')"></div>
        <!-- Left half of the logo -->
        <div class="relative w-[150px] h-[300px] sm:w-[220px] sm:h-[440px] overflow-hidden pointer-events-none">
            <img 
                src="/LeTout.svg" 
                alt="" 
                class="absolute max-w-none h-full w-[300px] sm:w-[440px] left-0 top-0 object-contain secondary-svg opacity-60" 
            />
        </div>
    </div>

    <!-- Right Door -->
    <div 
        class="relative w-1/2 h-full bg-[#1b1b1b] border-l border-[var(--color-secondary)] transition-all duration-[1200ms] ease-in-out origin-right flex items-center justify-start pointer-events-auto shadow-2xl shadow-[inset_8px_0_12px_-6px_rgba(210,182,116,0.4)]"
        class:open-right={open}
    >
        <!-- Background texture overlay -->
        <div class="absolute inset-0 bg-cover opacity-[0.03] pointer-events-none" style="background-image: url('/soft-neige1B1B1B.png')"></div>
        <!-- Right half of the logo -->
        <div class="relative w-[150px] h-[300px] sm:w-[220px] sm:h-[440px] overflow-hidden pointer-events-none">
            <img 
                src="/LeTout.svg" 
                alt="" 
                class="absolute max-w-none h-full w-[300px] sm:w-[440px] right-0 top-0 object-contain secondary-svg opacity-60" 
            />
        </div>
    </div>
</div>
{/if}

<style>
    .open-left {
        transform: rotateY(-105deg);
        opacity: 0;
        pointer-events: none;
    }
    .open-right {
        transform: rotateY(105deg);
        opacity: 0;
        pointer-events: none;
    }
    .perspective-\[1200px\] {
        perspective: 1200px;
    }
</style>
