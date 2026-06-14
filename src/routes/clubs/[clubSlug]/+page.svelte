<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { getClubs, getJoinStatus, joinClub, exportLibraryCsv, updateClub, type Club, type Book, type DragonTheme } from '$lib/api';
    import type { AuthSession } from '$lib/auth-client';
    import BooksList from '$lib/components/books/BooksList.svelte';
    import MembersList from '$lib/components/members/MembersList.svelte';
    import { breadcrumbs } from '$lib/breadcrumbs.svelte';
    import Cta from '$lib/components/Cta.svelte';
    import { sidebarState } from '$lib/sidebar.svelte';

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
                { label: 'Bibliothèques', href: '/' },
                { label: club.name }
            ]);
        }
    });

    let activeClubTab = $state<'library' | 'members' | 'admin'>('library');

    // Club Edit Form Inputs (for OWNER only)
    let editClubName = $state('');
    let editClubSlug = $state('');
    let editClubIsPublic = $state(true);
    let editClubTheme = $state<DragonTheme | ''>('');
    let updatingClub = $state(false);
    let updateClubError = $state<string | null>(null);
    let updateClubSuccess = $state(false);

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
        { name: 'Artrish', color: 'text-Artrish', bg: 'bg-Artrish', border: 'border-Artrish/30', hoverBorder: 'hover:border-Artrish', shadow: 'hover:shadow-[0_0_20px_rgba(255,255,255,0.15)]', logo: '/dragons_logos/normal/Artrish.svg', svgFilter: 'Artrish-svg' },
        { name: 'Shizari', color: 'text-secondary', bg: 'bg-secondary', border: 'border-secondary/30', hoverBorder: 'hover:border-secondary', shadow: 'hover:shadow-[0_0_20px_rgba(210,182,116,0.25)]', logo: '/dragons_logos/normal/Shizari.svg', svgFilter: 'Shizari-svg' }
    ] as const;

    $effect(() => {
        if (club) {
            editClubName = club.name;
            editClubSlug = club.slug;
            editClubIsPublic = club.isPublic;
            editClubTheme = club.theme || '';
        }
    });

    async function handleUpdateClub(e: Event) {
        e.preventDefault();
        if (!club || updatingClub) return;
        if (!editClubName.trim() || !editClubSlug.trim()) return;

        updatingClub = true;
        updateClubError = null;
        updateClubSuccess = false;
        try {
            const updated = await updateClub(club.id, {
                name: editClubName,
                slug: editClubSlug,
                isPublic: editClubIsPublic,
                theme: editClubTheme || undefined
            });
            club = updated;
            updateClubSuccess = true;
            
            // If the slug changed, navigate to the new URL
            if (updated.slug !== data.clubSlug) {
                goto(`/clubs/${updated.slug}`);
            }
        } catch (e: any) {
            updateClubError = e.message || 'Impossible de mettre à jour la bibliothèque.';
        } finally {
            updatingClub = false;
        }
    }

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

    <main class="w-full space-y-6 flex-1 transition-all duration-300 {userRole !== null || data.session?.user?.role === 'ADMIN' ? (sidebarState.isOpen ? 'p-4 sm:p-8 md:pl-72 lg:pl-72' : 'p-4 sm:p-8 md:pl-8 lg:pl-72') : 'max-w-6xl mx-auto p-4 sm:p-6'}">
        <!-- Club Detail Header -->
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-secondary/20 pb-6 gap-4">
            <div>
                <h1 class="text-3xl sm:text-5xl font-title text-secondary tracking-wider mb-2">{club.name}</h1>
            </div>
            
            <div class="flex flex-col sm:items-end gap-2">
                <span class="text-sm font-title uppercase tracking-wider text-secondary mt-1">
                    {data.session?.user?.role === 'ADMIN' ? 'Administrateur' : userRole === 'OWNER' ? 'Propriétaire' : userRole === 'EDITOR' ? 'Éditeur' : userRole === 'READER' ? 'Lecteur' : 'Visiteur'}
                </span>
                {#if data.session?.user?.role === 'ADMIN' && userRole === null}
                    <button 
                        onclick={handleJoinClub}
                        disabled={joining}
                        class="px-3 py-1 text-xs border border-secondary/40 hover:bg-secondary/15 rounded text-secondary hover:text-white transition-all cursor-pointer"
                    >
                        {joining ? 'Rejoindre...' : 'Rejoindre la bibliothèque'}
                    </button>
                {/if}
            </div>
        </div>

        {#if userRole === null && data.session?.user?.role !== 'ADMIN'}
            <div class="max-w-2xl mx-auto my-12 p-4 sm:p-8 bg-background/40 backdrop-blur-md border border-secondary/30 rounded-lg text-center shadow-xl space-y-6">
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
                <aside class="hidden md:flex flex-col w-64 fixed top-[73px] bottom-0 left-0 bg-[#1b1b1b]/80 backdrop-blur-md border-r border-secondary/20 p-6 z-10 space-y-6 overflow-y-auto transition-transform duration-300 lg:translate-x-0 {sidebarState.isOpen ? 'md:translate-x-0' : 'md:-translate-x-full'}">
                    <!-- Back Button to Circle List -->
                    <a 
                        href="/" 
                        class="flex items-center justify-center gap-2 font-title text-sm tracking-wider text-secondary hover:text-white hover:underline rounded transition-all duration-200 cursor-pointer mt-8"
                    >
                        ← Retour à l'entrée
                    </a>

                    <div class="space-y-2">
                        <span class="text-xs font-text uppercase tracking-widest text-gray-400">Sections</span>
                        <nav class="flex flex-col gap-2">
                            <button 
                                onclick={() => activeClubTab = 'library'}
                                class="w-full text-left px-4 py-2.5 font-title text-base uppercase tracking-wider rounded border-l-2 transition-all cursor-pointer flex items-center gap-3 {activeClubTab === 'library' ? 'border-secondary bg-secondary/10 text-secondary' : 'border-transparent text-gray-400 hover:text-white hover:bg-white/5'}"
                            >
                                <img src="/dragons_logos/normal/Lada.svg" alt="" class="w-8 h-8 secondary-svg">
                                Livres
                            </button>
                            <button 
                                onclick={() => activeClubTab = 'members'}
                                class="w-full text-left px-4 py-2.5 font-title text-base uppercase tracking-wider rounded border-l-2 transition-all cursor-pointer flex items-center gap-3 {activeClubTab === 'members' ? 'border-secondary bg-secondary/10 text-secondary' : 'border-transparent text-gray-400 hover:text-white hover:bg-white/5'}"
                            >
                                <img src="/dragons_logos/normal/Pestia.svg" alt="" class="w-8 h-8 secondary-svg">
                                Membres
                            </button>
                            {#if userRole === 'OWNER' || data.session?.user?.role === 'ADMIN'}
                                <button 
                                    onclick={() => activeClubTab = 'admin'}
                                    class="w-full text-left px-4 py-2.5 font-title text-base uppercase tracking-wider rounded border-l-2 transition-all cursor-pointer flex items-center gap-3 {activeClubTab === 'admin' ? 'border-secondary bg-secondary/10 text-secondary' : 'border-transparent text-gray-400 hover:text-white hover:bg-white/5'}"
                                >
                                    <img src="/dragons_logos/normal/Yinva.svg" alt="" class="w-8 h-8 secondary-svg">
                                    Admin
                                </button>
                            {/if}
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
                                        dragon="Artrish"
                                        border="Yinva"
                                        class="h-9 px-4 font-title text-[13px] uppercase tracking-wider !text-black w-full flex items-center justify-center cursor-pointer"
                                    />
                                {/if}
                                {#if canExportCsv}
                                    <Cta 
                                        text="Exporter (CSV)"
                                        onClick={handleExportCsv}
                                        dragon="Shizari"
                                        border="Guizamark"
                                        class="h-9 px-4 font-title text-[13px] uppercase tracking-wider text-white w-full flex items-center justify-center cursor-pointer"
                                    />
                                {/if}
                            </div>
                        </div>
                    {/if}
                </aside>

                <!-- Sidebar Toggle Button (Tablet Drawer Control) -->
                <button 
                    onclick={() => sidebarState.isOpen = !sidebarState.isOpen}
                    class="hidden md:flex lg:hidden fixed top-[88px] z-20 w-8 h-8 bg-[#1b1b1b]/90 backdrop-blur-md border border-secondary/30 hover:border-secondary/70 text-secondary hover:text-white rounded-full items-center justify-center transition-all duration-300 shadow-md hover:shadow-[0_0_15px_rgba(210,182,116,0.25)] hover:scale-105 active:scale-95 cursor-pointer {sidebarState.isOpen ? 'left-[240px]' : 'left-4'}"
                    title={sidebarState.isOpen ? "Masquer le menu" : "Afficher le menu"}
                >
                    {#if sidebarState.isOpen}
                        <svg class="w-4.5 h-4.5 text-secondary" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                        </svg>
                    {:else}
                        <svg class="w-4.5 h-4.5 text-secondary" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                        </svg>
                    {/if}
                </button>

                <!-- Mobile Actions / Tabs (Mobile Only) -->
                <div class="md:hidden w-full flex flex-col gap-3 border-b border-gray-800 pb-2">
                    <!-- Top Row: Back Button & Actions Dropdown -->
                    <div class="flex items-center justify-between w-full">
                        <a 
                            href="/" 
                            class="w-8 h-8 text-secondary font-title text-lg border border-secondary/35 bg-secondary/15 rounded-full transition-all flex items-center justify-center cursor-pointer shrink-0 hover:bg-secondary/25 active:scale-95 duration-200 flex items-center justify-center"
                        >
                            ←
                        </a>
                        
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

                    <!-- Bottom Row: Tabs -->
                    <div class="flex gap-1 overflow-x-auto scrollbar-none flex-nowrap w-full">
                        <button 
                            onclick={() => activeClubTab = 'library'}
                            class="flex-1 min-w-[70px] text-center py-2 font-title text-xs uppercase tracking-wider border-b-2 transition-colors cursor-pointer {activeClubTab === 'library' ? 'border-secondary text-secondary' : 'border-transparent text-gray-400'}"
                        >
                            Livres
                        </button>
                        <button 
                            onclick={() => activeClubTab = 'members'}
                            class="flex-1 min-w-[70px] text-center py-2 font-title text-xs uppercase tracking-wider border-b-2 transition-colors cursor-pointer {activeClubTab === 'members' ? 'border-secondary text-secondary' : 'border-transparent text-gray-400'}"
                        >
                            Membres
                        </button>
                        {#if userRole === 'OWNER' || data.session?.user?.role === 'ADMIN'}
                            <button 
                                onclick={() => activeClubTab = 'admin'}
                                class="flex-1 min-w-[70px] text-center py-2 font-title text-xs uppercase tracking-wider border-b-2 transition-colors cursor-pointer {activeClubTab === 'admin' ? 'border-secondary text-secondary' : 'border-transparent text-gray-400'}"
                            >
                                Admin
                            </button>
                        {/if}
                    </div>
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
                    {:else if activeClubTab === 'members'}
                        <MembersList 
                            clubSlug={club.slug} 
                            userRole={userRole} 
                            session={data.session} 
                        />
                    {:else if activeClubTab === 'admin' && (userRole === 'OWNER' || data.session?.user?.role === 'ADMIN')}
                        <!-- Club Administration (OWNER only) -->
                        <div class="space-y-6 font-text max-w-4xl">
                            <div class="bg-background/60 border border-gray-800 p-4 sm:p-6 rounded-lg space-y-4">
                                <h3 class="text-xl font-title text-secondary tracking-wider border-b border-gray-800 pb-2 font-semibold">Modifier la bibliothèque</h3>
                                
                                <form onsubmit={handleUpdateClub} class="grid grid-cols-1 md:grid-cols-5 gap-6">
                                    <!-- Left pane (fields) -->
                                    <div class="space-y-4 md:col-span-3">
                                        <div>
                                            <label for="edit-club-name" class="block text-xs font-text text-gray-300 mb-1">Nom de la bibliothèque</label>
                                            <input 
                                                type="text" 
                                                id="edit-club-name" 
                                                bind:value={editClubName}
                                                required
                                                class="w-full bg-primary/10 text-white border border-gray-800 focus:border-secondary focus:ring-1 focus:ring-secondary/30 rounded-[var(--radius)] h-11 px-3 text-sm transition-all focus:outline-none"
                                            />
                                        </div>

                                        <div>
                                            <label for="edit-club-slug" class="block text-xs font-text text-gray-300 mb-1">Slug URL</label>
                                            <input 
                                                type="text" 
                                                id="edit-club-slug" 
                                                bind:value={editClubSlug}
                                                required
                                                class="w-full bg-primary/10 text-white border border-gray-800 focus:border-secondary focus:ring-1 focus:ring-secondary/30 rounded-[var(--radius)] h-11 px-3 text-sm transition-all focus:outline-none"
                                            />
                                        </div>

                                        <div>
                                            <span class="block text-xs font-text text-gray-300 mb-1">Type d'accès</span>
                                            <div class="grid grid-cols-2 gap-4">
                                                <button 
                                                    type="button"
                                                    onclick={() => editClubIsPublic = true}
                                                    class="p-4 rounded-lg border text-left transition-all cursor-pointer {editClubIsPublic ? 'bg-secondary/15 border-secondary text-secondary shadow-[0_0_15px_rgba(210,182,116,0.15)]' : 'bg-background/40 border-gray-800 text-gray-400 hover:border-gray-750'}"
                                                >
                                                    <div class="font-title text-sm uppercase tracking-wider mb-1">Public</div>
                                                    <div class="text-[11px] font-text leading-snug text-gray-400 {editClubIsPublic ? 'text-secondary/80' : ''}">Accès libre.</div>
                                                </button>
                                                <button 
                                                    type="button"
                                                    onclick={() => editClubIsPublic = false}
                                                    class="p-4 rounded-lg border text-left transition-all cursor-pointer {!editClubIsPublic ? 'bg-secondary/15 border-secondary text-secondary shadow-[0_0_15px_rgba(210,182,116,0.15)]' : 'bg-background/40 border-gray-800 text-gray-400 hover:border-gray-750'}"
                                                >
                                                    <div class="font-title text-sm uppercase tracking-wider mb-1">Privé</div>
                                                    <div class="text-[11px] font-text leading-snug text-gray-400 {!editClubIsPublic ? 'text-secondary/80' : ''}">Demande requise.</div>
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Right pane (dragon checkboxes grid) -->
                                    <div class="md:col-span-2 flex flex-col justify-between space-y-6">
                                        <div>
                                            <span class="block text-xs font-text text-gray-300 mb-2">Thème Dragon (optionnel)</span>
                                            <div class="grid grid-cols-4 gap-1.5">
                                                {#each DRAGON_THEMES as theme}
                                                    {@const isActive = editClubTheme === theme.name}
                                                    <button
                                                        type="button"
                                                        title={theme.name}
                                                        onclick={() => {
                                                            if (editClubTheme === theme.name) {
                                                                editClubTheme = '';
                                                            } else {
                                                                editClubTheme = theme.name;
                                                            }
                                                        }}
                                                        class="relative flex flex-col items-center justify-center p-1 rounded-lg border text-center transition-all cursor-pointer select-none h-11 {isActive ? `${theme.border} bg-background/80 shadow-[0_0_12px_rgba(255,255,255,0.05)]` : 'bg-background/40 border-gray-855 hover:border-gray-750'}"
                                                        style={isActive ? `border-color: var(--color-${theme.name}); box-shadow: 0 0 10px var(--color-${theme.name}33);` : ''}
                                                    >
                                                        <!-- Checkbox Indicator -->
                                                        <div class="absolute top-0.5 right-0.5 w-2.5 h-2.5 rounded-sm border flex items-center justify-center {isActive ? `${theme.bg} border-transparent text-black` : 'border-gray-800 bg-transparent'}">
                                                            {#if isActive}
                                                                <svg class="w-1.5 h-1.5 fill-current text-background" viewBox="0 0 20 20">
                                                                    <path d="M0 11l2-2 5 5L18 3l2 2L7 18z"/>
                                                                </svg>
                                                            {/if}
                                                        </div>

                                                        <!-- Logo -->
                                                        <div class="w-6 h-6 flex items-center justify-center">
                                                            <img src={theme.logo} alt={theme.name} class="w-full h-full object-contain {theme.svgFilter} {isActive ? '' : 'opacity-60'}" />
                                                        </div>
                                                    </button>
                                                {/each}
                                            </div>
                                        </div>

                                        <!-- Save / Success Area -->
                                        <div class="space-y-3 pt-4 border-t border-gray-800/80">
                                            {#if updateClubError}
                                                <p class="text-xs text-Chronos">{updateClubError}</p>
                                            {/if}

                                            {#if updateClubSuccess}
                                                <p class="text-xs text-Guizamark font-text">La bibliothèque a été mise à jour avec succès.</p>
                                            {/if}

                                            <Cta 
                                                type="submit"
                                                disabled={updatingClub}
                                                text={updatingClub ? 'Enregistrement...' : 'Enregistrer'}
                                                dragon="Yinva"
                                                border="Artrish"
                                                class="h-10 w-full font-title text-xs uppercase tracking-wider !text-black"
                                            />
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </div>
                    {/if}
                </div>
            </div>
        {/if}
    </main>
{/if}
