<script lang="ts">
    import ClubsList from '$lib/components/clubs/ClubsList.svelte';
    import { goto } from '$app/navigation';
    import type { Club } from '$lib/api';

    function handleSelectClub(club: Club) {
        goto(`/clubs/${club.slug}`);
    }
</script>

<svelte:head>
    <title>Cercles de Lecture — Heritage Silencieux</title>
</svelte:head>

<header class="bg-background/40 backdrop-blur-sm border-b border-gray-800 px-6 py-4 flex items-center justify-between font-bold">
    <div class="flex items-center space-x-2 text-xs font-title tracking-wider text-gray-400 uppercase font-bold">
        <span class="text-secondary font-title">Cercles</span>
    </div>
    <span class="text-[10px] tracking-widest text-gray-500 font-text uppercase font-bold">Initié Connecté</span>
</header>

<main class="py-6">
    <ClubsList onSelectClub={handleSelectClub} />
</main>
