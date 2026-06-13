<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { getClubs, getBookDetails, getClubMembers, type Club, type Book, type Chapter } from '$lib/api';
    import type { AuthSession } from '$lib/auth-client';
    import BookDetails from '$lib/components/books/BookDetails.svelte';
    import { breadcrumbs } from '$lib/breadcrumbs.svelte';
    import { sidebarState } from '$lib/sidebar.svelte';

    let { data } = $props<{
        data: { clubSlug: string; bookId: string; session: AuthSession };
    }>();

    let club = $state<Club | null>(null);
    let book = $state<Book | null>(null);
    let userRole = $state<'OWNER' | 'EDITOR' | 'READER' | null>(null);
    let loading = $state(true);
    let error = $state<string | null>(null);

    // Register breadcrumbs when club and book load
    $effect(() => {
        if (club && book) {
            breadcrumbs.set([
                { label: 'Cercles', href: '/' },
                { label: club.name, href: `/clubs/${club.slug}` },
                { label: book.title }
            ]);
        }
    });

    async function loadBookData() {
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

            book = await getBookDetails(data.clubSlug, data.bookId);
        } catch (e: any) {
            error = e.message || "Erreur lors du chargement du livre.";
        } finally {
            loading = false;
        }
    }

    function handleBackToLibrary() {
        goto(`/clubs/${data.clubSlug}`);
    }

    function handleReadChapter(chapter: Chapter) {
        goto(`/clubs/${data.clubSlug}/books/${data.bookId}/read/${chapter.index}`);
    }

    onMount(() => {
        loadBookData();
    });
</script>

<svelte:head>
    <title>{book ? book.title : 'Livre'} — Heritage Silencieux</title>
</svelte:head>

{#if loading}
    <div class="flex flex-col items-center justify-center py-20 flex-1">
        <div class="w-10 h-10 border-2 border-secondary border-t-transparent rounded-full animate-spin mb-3"></div>
        <p class="text-secondary font-title text-lg">Déchiffrement de l'ouvrage...</p>
    </div>
{:else if error || !club || !book}
    <div class="w-full max-w-md mx-auto my-12 p-6 border border-Chronos/30 bg-Chronos/10 text-Chronos rounded-lg text-center font-text">
        <p class="mb-4">{error || "Grimoire introuvable."}</p>
        <a href="/clubs/{data.clubSlug}" class="px-4 py-2 bg-Chronos text-white rounded font-title hover:bg-Chronos/85 transition-colors inline-block">
            Retour à la bibliothèque
        </a>
    </div>
{:else}

    <main class="w-full space-y-6 flex-1 transition-all duration-300 {userRole !== null || data.session?.user?.role === 'ADMIN' ? (sidebarState.isOpen ? 'p-4 sm:p-8 md:pl-72 lg:pl-72' : 'p-4 sm:p-8 md:pl-8 lg:pl-72') : 'max-w-6xl mx-auto p-4 sm:p-6'}">
        <BookDetails 
            clubSlug={data.clubSlug}
            {book}
            {userRole}
            session={data.session}
            onBack={handleBackToLibrary}
            onReadChapter={handleReadChapter}
        />
    </main>
{/if}
