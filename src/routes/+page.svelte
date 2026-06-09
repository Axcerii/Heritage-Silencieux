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


<main class="py-6">
    <ClubsList onSelectClub={handleSelectClub} />
</main>
