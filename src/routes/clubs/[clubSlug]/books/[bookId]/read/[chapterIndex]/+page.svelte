<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { getClubs, getBookDetails, getChapters, getChapter, type Club, type Book, type Chapter } from '$lib/api';
    import type { AuthSession } from '$lib/auth-client';
    import BookReader from '$lib/components/chapters/BookReader.svelte';

    let { data } = $props<{
        data: { clubSlug: string; bookId: string; chapterIndex: number; session: AuthSession };
    }>();

    let club = $state<Club | null>(null);
    let book = $state<Book | null>(null);
    let chapters = $state<Chapter[]>([]);
    let activeChapter = $state<Chapter | null>(null);
    let loading = $state(true);
    let error = $state<string | null>(null);

    async function loadReaderData() {
        loading = true;
        error = null;
        try {
            const allClubs = await getClubs();
            club = allClubs.find(c => c.slug === data.clubSlug) || null;
            if (!club) {
                error = "Bibliothèque introuvable.";
                return;
            }

            book = await getBookDetails(data.clubSlug, data.bookId);
            const chaptersResponse = await getChapters(data.clubSlug, data.bookId);
            chapters = chaptersResponse.data;
            activeChapter = await getChapter(data.clubSlug, data.bookId, data.chapterIndex);
        } catch (e: any) {
            error = e.message || "Erreur lors du chargement du grimoire.";
        } finally {
            loading = false;
        }
    }

    function handleBackToBook() {
        goto(`/clubs/${data.clubSlug}/books/${data.bookId}`);
    }

    function handleNavigate(chapter: Chapter) {
        goto(`/clubs/${data.clubSlug}/books/${data.bookId}/read/${chapter.index}`);
    }

    // Reload chapter if URL index changes
    $effect(() => {
        if (data.chapterIndex) {
            loadReaderData();
        }
    });
</script>

<svelte:head>
    <title>{book ? `${book.title} - Chapitre ${data.chapterIndex}` : 'Lecture'} — Heritage Silencieux</title>
</svelte:head>

{#if loading}
    <div class="flex flex-col items-center justify-center py-20 flex-1">
        <div class="w-10 h-10 border-2 border-secondary border-t-transparent rounded-full animate-spin mb-3"></div>
        <p class="text-secondary font-title text-lg font-bold">Transcription des parchemins...</p>
    </div>
{:else if error || !club || !book || !activeChapter}
    <div class="w-full max-w-md mx-auto my-12 p-6 border border-Chronos/30 bg-Chronos/10 text-Chronos rounded-lg text-center font-text">
        <p class="mb-4">{error || "Chapitre introuvable."}</p>
        <a href="/clubs/{data.clubSlug}/books/{data.bookId}" class="px-4 py-2 bg-Chronos text-white rounded font-title hover:bg-Chronos/85 transition-colors inline-block">
            Retour à l'ouvrage
        </a>
    </div>
{:else}
    <main class="py-2 flex-1 flex flex-col justify-center">
        <BookReader 
            clubSlug={data.clubSlug}
            bookId={data.bookId}
            bookTitle={book.title}
            initialChapter={activeChapter}
            {chapters}
            bookPages={book.pages}
            onBack={handleBackToBook}
            onNavigateChapter={handleNavigate}
        />
    </main>
{/if}
