<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { getClubs, getClubMembers, type Club, type Book } from '$lib/api';
    import type { AuthSession } from '$lib/auth-client';
    import BooksList from '$lib/components/books/BooksList.svelte';
    import MembersList from '$lib/components/members/MembersList.svelte';

    let { data } = $props<{
        data: { clubSlug: string; session: AuthSession };
    }>();

    let club = $state<Club | null>(null);
    let userRole = $state<'OWNER' | 'EDITOR' | 'READER' | null>(null);
    let loading = $state(true);
    let error = $state<string | null>(null);

    let activeClubTab = $state<'library' | 'members'>('library');

    async function loadClubData() {
        loading = true;
        error = null;
        try {
            const allClubs = await getClubs();
            club = allClubs.find(c => c.slug === data.clubSlug) || null;
            if (!club) {
                error = "Cercle introuvable.";
                return;
            }

            const members = await getClubMembers(data.clubSlug);
            const myMember = members.find(m => m.userId === data.session.user.id);
            if (myMember) {
                userRole = myMember.role;
            }
        } catch (e: any) {
            error = e.message || "Erreur lors du chargement du cercle.";
        } finally {
            loading = false;
        }
    }

    function handleSelectBook(book: Book) {
        goto(`/clubs/${data.clubSlug}/books/${book.id}`);
    }

    onMount(() => {
        loadClubData();
    });
</script>

<svelte:head>
    <title>{club ? club.name : 'Cercle'} — Heritage Silencieux</title>
</svelte:head>

{#if loading}
    <div class="flex flex-col items-center justify-center py-20 flex-1">
        <div class="w-10 h-10 border-2 border-secondary border-t-transparent rounded-full animate-spin mb-3"></div>
        <p class="text-secondary font-title text-lg">Déchiffrement des sceaux du cercle...</p>
    </div>
{:else if error || !club}
    <div class="w-full max-w-md mx-auto my-12 p-6 border border-Chronos/30 bg-Chronos/10 text-Chronos rounded-lg text-center font-text">
        <p class="mb-4">{error || "Cercle introuvable."}</p>
        <a href="/" class="px-4 py-2 bg-Chronos text-white rounded font-title hover:bg-Chronos/85 transition-colors inline-block">
            Retour aux cercles
        </a>
    </div>
{:else}
    <header class="bg-background/40 backdrop-blur-sm border-b border-gray-800 px-6 py-4 flex items-center justify-between font-bold z-10">
        <div class="flex items-center space-x-2 text-xs font-title tracking-wider text-gray-400 uppercase font-bold">
            <a href="/" class="hover:text-white transition-colors">Cercles</a>
            <span>/</span>
            <span class="text-secondary font-title">{club.name}</span>
        </div>
        <span class="text-[10px] tracking-widest text-gray-500 font-text uppercase font-bold">Initié Connecté</span>
    </header>

    <main class="w-full max-w-6xl mx-auto p-4 sm:p-6 space-y-6 flex-1">
        <!-- Club Detail Header -->
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-secondary/20 pb-6 gap-4">
            <div>
                <h1 class="text-3xl sm:text-5xl font-title text-secondary tracking-wider mb-2">{club.name}</h1>
                <p class="text-gray-400 font-text text-sm">
                    Cercle unique : <span class="text-white italic">/{club.slug}</span>
                </p>
            </div>
            
            <div class="flex flex-col sm:items-end">
                <span class="text-xs text-gray-400 font-text">Votre grade dans ce cercle :</span>
                <span class="text-sm font-title uppercase tracking-wider text-secondary mt-1">
                    {userRole === 'OWNER' ? 'Propriétaire' : userRole === 'EDITOR' ? 'Éditeur' : userRole === 'READER' ? 'Lecteur' : 'Visiteur'}
                </span>
            </div>
        </div>

        <!-- Tabs Menu -->
        <div class="flex border-b border-gray-800">
            <button 
                onclick={() => activeClubTab = 'library'}
                class="px-6 py-3 font-title text-lg uppercase tracking-wider border-b-2 transition-colors cursor-pointer {activeClubTab === 'library' ? 'border-secondary text-secondary' : 'border-transparent text-gray-400 hover:text-white'}"
            >
                Bibliothèque
            </button>
            <button 
                onclick={() => activeClubTab = 'members'}
                class="px-6 py-3 font-title text-lg uppercase tracking-wider border-b-2 transition-colors cursor-pointer {activeClubTab === 'members' ? 'border-secondary text-secondary' : 'border-transparent text-gray-400 hover:text-white'}"
            >
                Membres
            </button>
        </div>

        <!-- Tab Contents -->
        {#if activeClubTab === 'library'}
            <BooksList 
                clubSlug={club.slug} 
                userRole={userRole} 
                session={data.session} 
                onSelectBook={handleSelectBook} 
            />
        {:else}
            <MembersList 
                clubSlug={club.slug} 
                userRole={userRole} 
                session={data.session} 
            />
        {/if}
    </main>
{/if}
