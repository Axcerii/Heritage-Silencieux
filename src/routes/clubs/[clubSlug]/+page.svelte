<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { getClubs, getJoinStatus, joinClub, exportLibraryCsv, type Club, type Book } from '$lib/api';
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

    let showAddModal = $state(false);
    let showMobileMenu = $state(false);

    const canManageBooks = $derived(
        data.session?.user?.role === 'ADMIN' || userRole === 'OWNER' || userRole === 'EDITOR'
    );
    const canExportCsv = $derived(
        userRole !== null || data.session?.user?.role === 'ADMIN'
    );

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
                error = "Bibliothèque introuvable.";
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
            error = e.message || "Erreur lors du chargement de la bibliothèque.";
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
            joinError = e.message || "Impossible de rejoindre la bibliothèque.";
        } finally {
            joining = false;
        }
    }

    function handleSelectBook(book: Book) {
        goto(`/clubs/${data.clubSlug}/books/${book.id}`);
    }

    async function handleExportCsv() {
        if (!club) return;
        try {
            const csvData = await exportLibraryCsv(club.slug);
            const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.setAttribute('href', url);
            link.setAttribute('download', `bibliotheque-${club.slug}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (e: any) {
            alert('Erreur lors de l\'exportation CSV: ' + e.message);
        }
    }

    onMount(() => {
        loadClubData();
    });
</script>

<svelte:head>
    <title>{club ? club.name : 'Bibliothèque'} — Heritage Silencieux</title>
</svelte:head>

{#if loading}
    <div class="flex flex-col items-center justify-center py-20 flex-1">
        <div class="w-10 h-10 border-2 border-secondary border-t-transparent rounded-full animate-spin mb-3"></div>
        <p class="text-secondary font-title text-lg">Déchiffrement des sceaux du bibliothèque...</p>
    </div>
{:else if error || !club}
    <div class="w-full max-w-md mx-auto my-12 p-6 border border-Chronos/30 bg-Chronos/10 text-Chronos rounded-lg text-center font-text">
        <p class="mb-4">{error || "Bibliothèque introuvable."}</p>
        <a href="/" class="px-4 py-2 bg-Chronos text-white rounded font-title hover:bg-Chronos/85 transition-colors inline-block">
            Retour à la liste des bibliothèques
        </a>
    </div>
{:else}

    <main class="w-full space-y-6 flex-1 transition-all duration-300 {userRole !== null ? 'p-4 sm:p-8 md:pl-72' : 'max-w-6xl mx-auto p-4 sm:p-6'}">
        <!-- Club Detail Header -->
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-secondary/20 pb-6 gap-4">
            <div>
                <h1 class="text-3xl sm:text-5xl font-title text-secondary tracking-wider mb-2">{club.name}</h1>
            </div>
            
            <div class="flex flex-col sm:items-end">
                <span class="text-sm font-title uppercase tracking-wider text-secondary mt-1">
                    {userRole === 'OWNER' ? 'Propriétaire' : userRole === 'EDITOR' ? 'Éditeur' : userRole === 'READER' ? 'Lecteur' : 'Visiteur'}
                </span>
            </div>
        </div>

        {#if userRole === null}
            <div class="max-w-2xl mx-auto my-12 p-8 bg-background/40 backdrop-blur-md border border-secondary/30 rounded-lg text-center shadow-xl space-y-6">
                <div class="absolute w-full top-0 left-0 z-[-1] secondary-svg opacity-20 pointer-events-none">
                    <img src="/Envelope.svg" alt="" class="w-full h-full object-contain primary-svg">
                </div>
                <div class="w-16 h-16 bg-secondary/10 text-secondary border border-secondary/30 rounded-full flex items-center justify-center mx-auto text-3xl">
                    {#if club.isPublic}
                    <img src="/dragons_logos/normal/Pestia.svg" alt="" class="w-full h-full object-contain primary-svg">
                    {:else}
                    <img src="/dragons_logos/normal/Shizari.svg" alt="" class="w-full h-full object-contain primary-svg">
                    {/if}
                </div>
                
                <div class="space-y-2">
                    <h2 class="text-2xl font-title text-secondary tracking-wider">
                        {#if club.isPublic}Bibliothèque de lecture publique{:else}Bibliothèque de lecture privée{/if}
                    </h2>
                    <p class="text-gray-400 font-text text-sm sm:text-base leading-relaxed">
                        {#if club.isPublic}
                            Cette bibliothèque est publique. Rejoignez la communauté des lecteurs pour y accéder, partager vos avis, et suivre votre progression.
                        {:else}
                            Cette bibliothèque est privée. Vous devez envoyer une demande d'adhésion pour que le propriétaire valide votre entrée.
                        {/if}
                    </p>
                </div>

                {#if joinError}
                    <p class="text-sm text-Chronos font-text bg-Chronos/10 border border-Chronos/20 p-3 rounded">{joinError}</p>
                {/if}

                <div class="pt-4 flex justify-center">
                    {#if club.isPublic}
                        <Cta 
                            text={joining ? "Demande en cours..." : "Rejoindre la bibliothèque"}
                            disabled={joining}
                            onClick={handleJoinClub}
                            dragon="Pestia"
                            border="Lada"
                            class="!w-auto px-8 py-3 font-title text-base uppercase tracking-wider text-foreground hover:shadow-[0_0_15px_rgba(210,182,116,0.3)] transition-all cursor-pointer"
                        />
                    {:else if hasPendingRequest}
                        <div class="px-6 py-3 border border-secondary/30 bg-secondary/10 text-secondary rounded-lg font-title uppercase tracking-widest text-sm animate-pulse">
                            Demande d'adhésion envoyée...
                        </div>
                    {:else}
                        <Cta 
                            text={joining ? "Envoi..." : "Demander à rejoindre"}
                            disabled={joining}
                            onClick={handleJoinClub}
                            dragon="Pestia"
                            border="Lada"
                            class="!w-auto px-8 py-3 font-title text-base uppercase tracking-wider text-foreground hover:shadow-[0_0_15px_rgba(210,182,116,0.3)] transition-all cursor-pointer"
                        />
                    {/if}
                </div>
            </div>
        {:else}
            <div class="flex flex-col md:flex-row gap-8 items-start">
                <!-- Sidebar on Desktop (viewport fixed on left) -->
                <aside class="hidden md:flex flex-col w-64 fixed top-[73px] bottom-0 left-0 bg-[#1b1b1b]/80 backdrop-blur-md border-r border-secondary/20 p-6 z-10 space-y-6 overflow-y-auto">
                    <div class="space-y-2">
                        <span class="text-xs font-text uppercase tracking-widest text-gray-400">Sections</span>
                        <nav class="flex flex-col gap-2">
                            <button 
                                onclick={() => activeClubTab = 'library'}
                                class="w-full text-left px-4 py-2.5 font-title text-base uppercase tracking-wider rounded border-l-2 transition-all cursor-pointer flex items-center gap-3 {activeClubTab === 'library' ? 'border-secondary bg-secondary/10 text-secondary' : 'border-transparent text-gray-400 hover:text-white hover:bg-white/5'}"
                            >
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" /></svg>
                                Bibliothèque
                            </button>
                            <button 
                                onclick={() => activeClubTab = 'members'}
                                class="w-full text-left px-4 py-2.5 font-title text-base uppercase tracking-wider rounded border-l-2 transition-all cursor-pointer flex items-center gap-3 {activeClubTab === 'members' ? 'border-secondary bg-secondary/10 text-secondary' : 'border-transparent text-gray-400 hover:text-white hover:bg-white/5'}"
                            >
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.109A11.386 11.386 0 0 1 10.089 20.4H9.91a11.386 11.386 0 0 1-4.828-1.163v-.109a9.38 9.38 0 0 1 2.625-.372 9.337 9.337 0 0 1 4.121-.952 4.125 4.125 0 0 1 7.533 2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.109A11.386 11.386 0 0 1 10.089 20.4H9.91a11.386 11.386 0 0 1-4.828-1.163v-.109a9.38 9.38 0 0 1 2.625-.372 9.337 9.337 0 0 1 4.121-.952 4.125 4.125 0 0 1 7.533 2.493M9 4a3 3 0 1 1 0 6 3 3 0 0 1 0-6Zm-5.7 12.1a3 3 0 1 1-2.4 0m5.7-12.1a3 3 0 1 1 0 6 3 3 0 0 1 0-6Zm8.4 0a3 3 0 1 1 0 6 3 3 0 0 1 0-6Z" /></svg>
                                Membres
                            </button>
                        </nav>
                    </div>

                    {#if canManageBooks || canExportCsv}
                        <div class="space-y-3 pt-4 border-t border-secondary/20">
                            <span class="text-xs font-text uppercase tracking-widest text-gray-400">Actions</span>
                            <div class="flex flex-col gap-2">
                                {#if canManageBooks}
                                    <Cta 
                                        text="Ajouter un Livre"
                                        onClick={() => { activeClubTab = 'library'; showAddModal = true; }}
                                        dragon="Pura"
                                        border="Pura"
                                        class="h-9 px-4 font-title text-[13px] uppercase tracking-wider !text-black w-full flex items-center justify-center cursor-pointer"
                                    />
                                {/if}
                                {#if canExportCsv}
                                    <Cta 
                                        text="Exporter (CSV)"
                                        onClick={handleExportCsv}
                                        dragon="Aqua"
                                        border="Aqua"
                                        class="h-9 px-4 font-title text-[13px] uppercase tracking-wider text-white w-full flex items-center justify-center cursor-pointer"
                                    />
                                {/if}
                            </div>
                        </div>
                    {/if}
                </aside>

                <!-- Mobile Actions / Tabs (Mobile Only) -->
                <div class="md:hidden w-full flex items-center justify-between border-b border-gray-800 pb-2">
                    <div class="flex gap-1 border-b border-transparent">
                        <button 
                            onclick={() => activeClubTab = 'library'}
                            class="px-2.5 py-1.5 font-title text-sm uppercase tracking-wider border-b-2 transition-colors cursor-pointer {activeClubTab === 'library' ? 'border-secondary text-secondary' : 'border-transparent text-gray-400'}"
                        >
                            Bibliothèque
                        </button>
                        <button 
                            onclick={() => activeClubTab = 'members'}
                            class="px-2.5 py-1.5 font-title text-sm uppercase tracking-wider border-b-2 transition-colors cursor-pointer {activeClubTab === 'members' ? 'border-secondary text-secondary' : 'border-transparent text-gray-400'}"
                        >
                            Membres
                        </button>
                    </div>

                    {#if canManageBooks || canExportCsv}
                        <div class="relative">
                            <button 
                                onclick={() => showMobileMenu = !showMobileMenu}
                                class="px-2.5 py-1.5 bg-secondary/15 text-secondary border border-secondary/30 rounded font-title text-xs uppercase tracking-wider hover:bg-secondary/20 transition-all flex items-center gap-1.5 cursor-pointer"
                            >
                                <span>Actions</span>
                                <svg class="w-3 h-3 transition-transform duration-200 {showMobileMenu ? 'rotate-180' : ''}" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
                            </button>

                            {#if showMobileMenu}
                                <!-- Backdrop to close dropdown -->
                                <button 
                                    type="button" 
                                    class="fixed inset-0 z-40 bg-transparent cursor-default" 
                                    onclick={() => showMobileMenu = false}
                                    aria-label="Fermer le menu"
                                ></button>
                                
                                <!-- Glassmorphic Dropdown Menu -->
                                <div class="absolute right-0 mt-2 w-48 bg-[#1b1b1b]/95 backdrop-blur-md border border-secondary/30 rounded-lg shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                                    {#if canManageBooks}
                                        <button 
                                            onclick={() => { showMobileMenu = false; activeClubTab = 'library'; showAddModal = true; }}
                                            class="w-full text-left px-4 py-2 text-sm font-text hover:bg-secondary/10 hover:text-secondary transition-colors cursor-pointer flex items-center gap-2"
                                        >
                                            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                                            Ajouter un livre
                                        </button>
                                    {/if}
                                    {#if canExportCsv}
                                        <button 
                                            onclick={() => { showMobileMenu = false; handleExportCsv(); }}
                                            class="w-full text-left px-4 py-2 text-sm font-text hover:bg-secondary/10 hover:text-secondary transition-colors cursor-pointer flex items-center gap-2"
                                        >
                                            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                                            Exporter CSV
                                        </button>
                                    {/if}
                                </div>
                            {/if}
                        </div>
                    {/if}
                </div>

                <!-- Main Content Pane -->
                <div class="flex-1 w-full min-w-0 max-w-5xl">
                    {#if activeClubTab === 'library'}
                        <BooksList 
                            clubSlug={club.slug} 
                            userRole={userRole} 
                            session={data.session} 
                            onSelectBook={handleSelectBook}
                            bind:showAddModal={showAddModal}
                        />
                    {:else}
                        <MembersList 
                            clubSlug={club.slug} 
                            userRole={userRole} 
                            session={data.session} 
                        />
                    {/if}
                </div>
            </div>
        {/if}
    </main>
{/if}
