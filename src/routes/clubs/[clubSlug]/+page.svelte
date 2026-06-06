<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { getClubs, getJoinStatus, joinClub, type Club, type Book } from '$lib/api';
    import type { AuthSession } from '$lib/auth-client';
    import BooksList from '$lib/components/books/BooksList.svelte';
    import MembersList from '$lib/components/members/MembersList.svelte';
    import { breadcrumbs } from '$lib/breadcrumbs.svelte';
    import Cta from '$lib/components/Cta.svelte';

    let { data } = $props<{
        data: { clubSlug: string; session: AuthSession };
    }>();

    let club = $state<Club | null>(null);
    let userRole = $state<'OWNER' | 'EDITOR' | 'READER' | null>(null);
    let hasPendingRequest = $state(false);
    let loading = $state(true);
    let error = $state<string | null>(null);

    let joining = $state(false);
    let joinError = $state<string | null>(null);

    // Register breadcrumbs when club loads
    $effect(() => {
        if (club) {
            breadcrumbs.set([
                { label: 'Cercles', href: '/' },
                { label: club.name }
            ]);
        }
    });

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

            const status = await getJoinStatus(data.clubSlug);
            if (status.isMember) {
                userRole = status.role;
            } else {
                userRole = null;
                hasPendingRequest = status.hasPendingRequest;
            }
        } catch (e: any) {
            error = e.message || "Erreur lors du chargement du cercle.";
        } finally {
            loading = false;
        }
    }

    async function handleJoinClub() {
        if (!club || joining) return;
        joining = true;
        joinError = null;
        try {
            const res = await joinClub(club.slug);
            if (res.status === 'JOINED') {
                userRole = 'READER';
                hasPendingRequest = false;
            } else if (res.status === 'PENDING') {
                hasPendingRequest = true;
            }
        } catch (e: any) {
            joinError = e.message || "Impossible de rejoindre le cercle.";
        } finally {
            joining = false;
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

        {#if userRole === null}
            <div class="max-w-2xl mx-auto my-12 p-8 bg-background/40 backdrop-blur-md border border-secondary/30 rounded-lg text-center shadow-xl space-y-6">
                <div class="w-16 h-16 bg-secondary/10 text-secondary border border-secondary/30 rounded-full flex items-center justify-center mx-auto text-3xl">
                    {#if club.isPublic}🔓{:else}🔒{/if}
                </div>
                
                <div class="space-y-2">
                    <h2 class="text-2xl font-title text-secondary tracking-wider">
                        {#if club.isPublic}Cercle de lecture Public{:else}Cercle de lecture Privé{/if}
                    </h2>
                    <p class="text-gray-400 font-text text-sm sm:text-base leading-relaxed">
                        {#if club.isPublic}
                            Ce cercle est public. Rejoignez la communauté des lecteurs pour accéder à sa bibliothèque, partager vos avis, et suivre votre progression.
                        {:else}
                            Ce cercle de lecture est privé. Vous devez envoyer une demande d'adhésion pour que le propriétaire valide votre entrée.
                        {/if}
                    </p>
                </div>

                {#if joinError}
                    <p class="text-sm text-Chronos font-text bg-Chronos/10 border border-Chronos/20 p-3 rounded">{joinError}</p>
                {/if}

                <div class="pt-4 flex justify-center">
                    {#if club.isPublic}
                        <Cta 
                            text={joining ? "Rejointement..." : "Rejoindre le cercle"}
                            disabled={joining}
                            onClick={handleJoinClub}
                            dragon="Artrish"
                            border="Yinva"
                            class="!w-auto px-8 py-3 font-title text-base uppercase tracking-wider !text-black hover:shadow-[0_0_15px_rgba(210,182,116,0.3)] transition-all cursor-pointer"
                        />
                    {:else if hasPendingRequest}
                        <div class="px-6 py-3 border border-secondary/30 bg-secondary/10 text-secondary rounded-lg font-title uppercase tracking-widest text-sm animate-pulse">
                            ⏳ Demande d'adhésion en attente
                        </div>
                    {:else}
                        <Cta 
                            text={joining ? "Envoi..." : "Demander à rejoindre"}
                            disabled={joining}
                            onClick={handleJoinClub}
                            dragon="Artrish"
                            border="Yinva"
                            class="!w-auto px-8 py-3 font-title text-base uppercase tracking-wider !text-black hover:shadow-[0_0_15px_rgba(210,182,116,0.3)] transition-all cursor-pointer"
                        />
                    {/if}
                </div>
            </div>
        {:else}
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
        {/if}
    </main>
{/if}
