<script lang="ts">
    import { onMount } from 'svelte';
    import { getClubs, createClub, type Club } from '../../api';
    import ClubCard from './ClubCard.svelte';
    import Cta from '../Cta.svelte';

    let { onSelectClub } = $props<{
        onSelectClub: (club: Club) => void;
    }>();

    let clubs = $state<Club[]>([]);
    let loading = $state(true);
    let error = $state<string | null>(null);

    // Filter state
    let searchQuery = $state('');
    const filteredClubs = $derived(
        clubs.filter(club => club.name.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    // Modal creation state
    let showCreateModal = $state(false);
    let newClubName = $state('');
    let newClubSlug = $state('');
    let newClubIsPublic = $state(true);
    let creating = $state(false);
    let createError = $state<string | null>(null);

    async function loadClubs() {
        loading = true;
        error = null;
        try {
            clubs = await getClubs();
        } catch (e: any) {
            error = e.message || 'Impossible de charger les grimoires de l\'alliance.';
        } finally {
            loading = false;
        }
    }

    async function handleCreateClub(e: Event) {
        e.preventDefault();
        if (!newClubName.trim()) return;

        creating = true;
        createError = null;
        try {
            const created = await createClub(newClubName, newClubSlug || undefined, newClubIsPublic);
            clubs = [...clubs, created];
            showCreateModal = false;
            newClubName = '';
            newClubSlug = '';
            newClubIsPublic = true;
        } catch (e: any) {
            createError = e.message || 'Erreur lors de la création du club.';
        } finally {
            creating = false;
        }
    }

    onMount(() => {
        loadClubs();
    });
</script>

<div class="w-full max-w-6xl mx-auto p-4 sm:p-6">
    <div class="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 border-b border-secondary/20 pb-6">
        <div>
            <h1 class="text-3xl sm:text-5xl font-title text-secondary tracking-wider mb-2">La Bibliothèque</h1>
            <p class="text-gray-400 font-text text-sm sm:text-base">Bienvenue dans la capitale du savoir d'Arthera : L'Héritage Silencieux</p>
        </div>

        <Cta 
            text="Ouvrir une bibliothèque"
            onClick={() => showCreateModal = true}
            dragon="Artrish"
            border="Yinva"
            class="!w-auto px-6 font-title text-[18px] uppercase tracking-wider !text-black hover:shadow-[0_0_15px_rgba(210,182,116,0.3)] self-start md:self-auto"
        />
    </div>

    <!-- Search bar -->
    <div class="mb-8 w-full max-w-md">
        <div class="relative">
            <input 
                type="text" 
                placeholder="Rechercher une bibliothèque..." 
                bind:value={searchQuery}
                class="w-full bg-Lada! text-black border border-foreground/30 focus:border-secondary rounded-(--radius) font-text"
            />
            {#if searchQuery}
                <button 
                    onclick={() => searchQuery = ''}
                    class="absolute right-3 top-1/2 -translate-y-1/2 text-Artrish hover:text-black font-text text-sm bg-Pestia px-2 rounded border border-Artrish cursor-pointer"
                >
                    Effacer
                </button>
            {/if}
        </div>
    </div>

    {#if loading}
        <div class="flex flex-col items-center justify-center py-20">
            <div class="w-12 h-12 rounded-full border-2 border-secondary border-t-transparent animate-spin mb-4"></div>
            <p class="text-secondary font-title text-xl animate-pulse">Dépoussièrement des rayons en cours...</p>
        </div>
    {:else if error}
        <div class="border border-Chronos/30 bg-Chronos/10 text-Chronos p-6 rounded-lg text-center max-w-md mx-auto my-10 font-text">
            <p class="mb-4">{error}</p>
            <button onclick={loadClubs} class="px-4 py-2 bg-Chronos text-white rounded font-title hover:bg-Chronos/85 transition-colors cursor-pointer">
                Tenter à nouveau
            </button>
        </div>
    {:else if filteredClubs.length === 0}
        <div class="text-center p-16 border border-dashed border-gray-800 rounded-lg max-w-md mx-auto my-10 font-text text-Artrish">
            <img src="/dragons_logos/normal/Shizari.svg" alt="" class="w-12 h-12 mx-auto mb-4 opacity-30 accent-svg" />
            <p class="mb-2 text-lg">Aucune bibliothèque n'a été trouvée</p>
            <p class="text-sm text-gray-500">Essayez de modifier votre recherche ou d'ouvrir votre propre bibliothèque.</p>
        </div>
    {:else}
        <!-- Grid list of clubs -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
            {#each filteredClubs as club (club.id)}
                <ClubCard {club} onSelect={onSelectClub} />
            {/each}
        </div>
    {/if}
</div>

<!-- Modal Create Club -->
{#if showCreateModal}
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/90 backdrop-blur-sm">
        <div class="w-full max-w-md bg-background border border-secondary/40 p-6 sm:p-8 rounded-lg shadow-2xl relative">
            <button 
                onclick={() => showCreateModal = false}
                class="absolute right-4 top-4 text-gray-400 hover:text-white text-xl cursor-pointer"
            >
                ✕
            </button>

            <h2 class="text-2xl font-title text-secondary mb-6 tracking-wider">Ouvrir une nouvelle bibliothèque</h2>
            
            <form onsubmit={handleCreateClub} class="space-y-6">
                <div>
                    <label for="club-name" class="block text-sm font-text text-gray-300 mb-2">Nom de la bibliothèque</label>
                    <input 
                        type="text" 
                        id="club-name" 
                        placeholder="Ex : Études sur les éternelles" 
                        bind:value={newClubName}
                        required
                        class="bg-primary text-black border border-foreground/30 focus:border-secondary"
                    />
                </div>

                <div>
                    <label for="club-slug" class="block text-sm font-text text-gray-300 mb-2">Slug URL (optionnel)</label>
                    <input 
                        type="text" 
                        id="club-slug" 
                        placeholder="etudes-sur-les-éternelles" 
                        bind:value={newClubSlug}
                        class="bg-primary text-black border border-foreground/30 focus:border-secondary"
                    />
                    <p class="text-sm text-Aqua font-text mt-1">* Si vide, il sera généré automatiquement à partir du nom.</p>
                </div>

                <div>
                    <span class="block text-sm font-text text-gray-300 mb-2">Type d'accès</span>
                    <div class="grid grid-cols-2 gap-4">
                        <button 
                            type="button"
                            onclick={() => newClubIsPublic = true}
                            class="p-4 rounded-lg border text-left transition-all cursor-pointer {newClubIsPublic ? 'bg-secondary/15 border-secondary text-secondary shadow-[0_0_15px_rgba(210,182,116,0.15)]' : 'bg-background/40 border-gray-800 text-gray-400 hover:border-gray-700'}"
                        >
                            <div class="font-title text-sm uppercase tracking-wider mb-1">Public</div>
                            <div class="text-[11px] font-text leading-snug text-gray-400 {newClubIsPublic ? 'text-secondary/80' : ''}">Tout le monde peut accéder librement à cette bibliothèque.</div>
                        </button>
                        <button 
                            type="button"
                            onclick={() => newClubIsPublic = false}
                            class="p-4 rounded-lg border text-left transition-all cursor-pointer {!newClubIsPublic ? 'bg-secondary/15 border-secondary text-secondary shadow-[0_0_15px_rgba(210,182,116,0.15)]' : 'bg-background/40 border-gray-800 text-gray-400 hover:border-gray-700'}"
                        >
                            <div class="font-title text-sm uppercase tracking-wider mb-1">Privé</div>
                            <div class="text-[11px] font-text leading-snug text-gray-400 {!newClubIsPublic ? 'text-secondary/80' : ''}">Les membres doivent demander l'accès pour rejoindre.</div>
                        </button>
                    </div>
                </div>

                {#if createError}
                    <p class="text-sm text-Chronos font-text">{createError}</p>
                {/if}

                <div class="flex space-x-3 pt-2">
                    <Cta 
                        text="Annuler"
                        onClick={() => showCreateModal = false}
                        dragon="none"
                        border="none"
                        class="w-1/2 font-title text-lg uppercase tracking-wider text-white border border-white/20 hover:bg-white/5"
                    />
                    <Cta 
                        type="submit"
                        disabled={creating}
                        text={creating ? 'Création...' : 'Créer'}
                        dragon="Artrish"
                        border="Yinva"
                        class="w-1/2 font-title text-lg uppercase tracking-wider !text-black"
                    />
                </div>
            </form>
        </div>
    </div>
{/if}
