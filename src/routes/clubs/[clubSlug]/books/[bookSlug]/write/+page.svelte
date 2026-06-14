<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { page } from '$app/state';
    import { 
        getClubs, getBookDetails, getChapters, getChapter, 
        createChapter, updateChapter, getClubMembers, 
        type Club, type Book, type Chapter, BACKEND_BASE
    } from '$lib/api';
    import Cta from '$lib/components/Cta.svelte';
    import { breadcrumbs } from '$lib/breadcrumbs.svelte';
    
    import 'easymde/dist/easymde.min.css';

    let { data } = $props<{
        data: { clubSlug: string; bookSlug: string };
    }>();

    // Svelte 5 States
    let club = $state<Club | null>(null);
    let book = $state<Book | null>(null);

    // Register breadcrumbs when club and book load
    $effect(() => {
        if (club && book) {
            breadcrumbs.set([
                { label: 'Bibliothèques', href: '/' },
                { label: club.name, href: `/clubs/${club.slug}` },
                { label: book.title, href: `/clubs/${club.slug}/books/${book.slug}` },
                { label: isEditMode ? `Modifier le Chapitre ${editIndex}` : 'Nouveau Chapitre' }
            ]);
        }
    });
    let chapters = $state<Chapter[]>([]);
    let targetChapter = $state<Chapter | null>(null);
    
    let loading = $state(true);
    let error = $state<string | null>(null);

    // Form inputs
    let chapterTitle = $state('');
    let chapterIndex = $state(1);
    let saving = $state(false);
    let saveError = $state<string | null>(null);

    // EasyMDE instance reference
    let easyMDEInstance: any = null;

    // Derived states
    const session = $derived(page.data.session);
    const isEditMode = $derived(!!page.url.searchParams.get('index'));
    const editIndex = $derived(Number(page.url.searchParams.get('index')));

    // LocalStorage Draft states
    let restoredFromDraft = $state(false);
    const localStorageKey = $derived(`draft-chapter-${data.clubSlug}-${data.bookSlug}-${isEditMode ? editIndex : 'new'}`);

    function saveDraft(contentOverride?: string) {
        const content = contentOverride !== undefined ? contentOverride : (easyMDEInstance ? easyMDEInstance.value() : '');
        if (content.trim() || chapterTitle.trim()) {
            const draftData = {
                title: chapterTitle,
                index: chapterIndex,
                content: content
            };
            localStorage.setItem(localStorageKey, JSON.stringify(draftData));
        } else {
            localStorage.removeItem(localStorageKey);
        }
    }

    // Reactively save draft when title or index changes
    $effect(() => {
        const _title = chapterTitle;
        const _index = chapterIndex;
        if (!loading && easyMDEInstance) {
            saveDraft();
        }
    });

    async function loadDataAndInitEditor() {
        loading = true;
        error = null;
        try {
            // 1. Authenticate check
            if (!session) {
                error = "Vous devez être connecté pour accéder à cette page.";
                loading = false;
                return;
            }

            // 2. Fetch basic resources
            const allClubs = await getClubs();
            club = allClubs.find(c => c.slug === data.clubSlug) || null;
            if (!club) {
                error = "Bibliothèque introuvable.";
                loading = false;
                return;
            }

            // 3. Permission checks
            const members = await getClubMembers(data.clubSlug);
            const myMember = members.find(m => m.userId === session.user.id);
            const userRole = myMember?.role || null;
            const canManage = session.user.role === 'ADMIN' || userRole === 'OWNER' || userRole === 'EDITOR';

            if (!canManage) {
                error = "Vous n'avez pas la permission de modifier ce grimoire.";
                loading = false;
                return;
            }

            book = await getBookDetails(data.clubSlug, data.bookSlug);
            const chaptersResponse = await getChapters(data.clubSlug, data.bookSlug);
            chapters = chaptersResponse.data;

            let initialContent = '';
            const savedDraftJson = localStorage.getItem(localStorageKey);
            let savedDraft: { title?: string; index?: number; content?: string } | null = null;
            if (savedDraftJson) {
                try {
                    savedDraft = JSON.parse(savedDraftJson);
                } catch (e) {
                    console.error('Failed to parse draft JSON:', e);
                }
            }

            // 4. Load chapter context if in edit mode
            if (isEditMode) {
                try {
                    targetChapter = await getChapter(data.clubSlug, data.bookSlug, editIndex);
                    
                    const hasDifferences = savedDraft && (
                        (savedDraft.title !== undefined && savedDraft.title !== targetChapter.title) ||
                        (savedDraft.index !== undefined && savedDraft.index !== targetChapter.index) ||
                        (savedDraft.content !== undefined && savedDraft.content !== targetChapter.content)
                    );

                    if (savedDraft && hasDifferences) {
                        chapterTitle = savedDraft.title !== undefined ? savedDraft.title : targetChapter.title;
                        chapterIndex = savedDraft.index !== undefined ? savedDraft.index : targetChapter.index;
                        initialContent = savedDraft.content !== undefined ? savedDraft.content : targetChapter.content;
                        restoredFromDraft = true;
                    } else {
                        chapterTitle = targetChapter.title;
                        chapterIndex = targetChapter.index;
                        initialContent = targetChapter.content;
                    }
                } catch (e: any) {
                    error = `Chapitre d'index ${editIndex} introuvable pour ce livre.`;
                    loading = false;
                    return;
                }
            } else {
                // Pre-fill next index
                if (chapters.length > 0) {
                    chapterIndex = Math.max(...chapters.map(c => c.index)) + 1;
                } else {
                    chapterIndex = 1;
                }
                
                if (savedDraft) {
                    if (savedDraft.title !== undefined) chapterTitle = savedDraft.title;
                    if (savedDraft.index !== undefined) chapterIndex = savedDraft.index;
                    if (savedDraft.content !== undefined && savedDraft.content.trim()) {
                        initialContent = savedDraft.content;
                        restoredFromDraft = true;
                    } else {
                        initialContent = '';
                    }
                } else {
                    initialContent = '';
                }
            }

            loading = false;

            // 5. Initialize EasyMDE on client side inside a timeout to let Svelte render DOM
            setTimeout(async () => {
                const EasyMDE = (await import('easymde')).default;
                const textarea = document.getElementById('markdown-editor');
                if (!textarea) return;

                easyMDEInstance = new EasyMDE({
                    element: textarea,
                    initialValue: initialContent,
                    spellChecker: false,
                    placeholder: "Rédigez ou collez le récit mystique de ce chapitre...",
                    renderingConfig: {
                        singleLineBreaks: false,
                        codeSyntaxHighlighting: true
                    },
                    toolbar: [
                        "bold", "italic", "heading", "|",
                        "quote", "unordered-list", "ordered-list", "|",
                        "link", "upload-image", "table", "|",
                        "preview", "fullscreen", "|",
                        "guide"
                    ],
                    uploadImage: true,
                    imageUploadFunction: async (file: File, onSuccess: (url: string) => void, onError: (err: string) => void) => {
                        try {
                            const formData = new FormData();
                            formData.append('file', file);
                            const res = await fetch(`${BACKEND_BASE}/clubs/${data.clubSlug}/books/${data.bookSlug}/chapters/upload`, {
                                method: 'POST',
                                body: formData,
                                credentials: 'include'
                            });
                            if (!res.ok) throw new Error('Image upload failed');
                            const responseData = await res.json();
                            const fullUrl = `${BACKEND_BASE}${responseData.url}`;
                            onSuccess(fullUrl);
                        } catch (err: any) {
                            onError(err.message || 'Image upload failed');
                        }
                    }
                } as any);

                // Auto-save changes to localStorage
                easyMDEInstance.codemirror.on('change', () => {
                    saveDraft(easyMDEInstance.value());
                });
            }, 50);

        } catch (e: any) {
            error = e.message || "Erreur de chargement de l'éditeur.";
            loading = false;
        }
    }

    async function handleSave(e: Event) {
        e.preventDefault();
        if (!chapterTitle.trim() || chapterIndex <= 0) return;

        const content = easyMDEInstance ? easyMDEInstance.value() : '';
        if (!content.trim()) {
            saveError = "Le contenu du chapitre ne peut pas être vide.";
            return;
        }

        saving = true;
        saveError = null;

        try {
            if (isEditMode) {
                await updateChapter(data.clubSlug, data.bookSlug, editIndex, {
                    index: chapterIndex,
                    title: chapterTitle,
                    content: content
                });
            } else {
                await createChapter(data.clubSlug, data.bookSlug, {
                    index: chapterIndex,
                    title: chapterTitle,
                    content: content
                });
            }
            // Remove the auto-saved draft from localStorage upon successful save
            localStorage.removeItem(localStorageKey);
            // Navigate back to book details page
            goto(`/clubs/${data.clubSlug}/books/${book?.slug || data.bookSlug}`);
        } catch (e: any) {
            saveError = e.message || "Erreur lors de la sauvegarde.";
        } finally {
            saving = false;
        }
    }

    function handleCancel() {
        goto(`/clubs/${data.clubSlug}/books/${book?.slug || data.bookSlug}`);
    }

    onMount(() => {
        loadDataAndInitEditor();
        return () => {
            if (easyMDEInstance) {
                easyMDEInstance.toTextArea();
                easyMDEInstance = null;
            }
        };
    });
</script>

<svelte:head>
    <title>{isEditMode ? 'Modifier le Chapitre' : 'Écrire un Chapitre'} — Heritage Silencieux</title>
</svelte:head>

{#if loading}
    <div class="flex flex-col items-center justify-center py-20 flex-1">
        <div class="w-10 h-10 border-2 border-secondary border-t-transparent rounded-full animate-spin mb-3"></div>
        <p class="text-secondary font-title text-lg font-bold">Préparation de l'Atelier d'Écriture...</p>
    </div>
{:else if error || !club || !book}
    <div class="w-full max-w-md mx-auto my-12 p-6 border border-Chronos/30 bg-Chronos/10 text-Chronos rounded-lg text-center font-text">
        <p class="mb-4">{error || "Grimoire ou configuration introuvable."}</p>
        <a href="/clubs/{data.clubSlug}/books/{book?.slug || data.bookSlug}" class="px-4 py-2 bg-Chronos text-white rounded font-title hover:bg-Chronos/85 transition-colors inline-block">
            Retour à l'ouvrage
        </a>
    </div>
{:else}

    <main class="flex-1 p-4 sm:p-6 max-w-5xl w-full mx-auto space-y-6">
        <div class="flex justify-between items-center border-b border-gray-800 pb-4">
            <div>
                <h1 class="text-3xl font-title text-white">
                    {isEditMode ? `Modifier le Chapitre ${editIndex}` : 'Graver un Nouveau Chapitre'}
                </h1>
                <p class="text-sm text-gray-400 font-text italic">
                    Ouvrage : {book.title} — par {book.author}
                </p>
            </div>
            <button onclick={handleCancel} class="text-secondary font-title text-sm tracking-wider hover:underline cursor-pointer">
                ← Retour
            </button>
        </div>

        {#if restoredFromDraft}
            <div class="flex gap-4 items-center p-3.5 border border-secondary/30 bg-secondary/10 text-secondary rounded font-text text-sm shadow-[0_0_15px_rgba(210,182,116,0.05)] animate-in fade-in slide-in-from-top-2 duration-200">
                <img src="/dragons_logos/tampons/Chronos.svg" alt="Sablier" class="Artrish-svg w-12">Récit restauré depuis votre dernier brouillon enregistré localement.
            </div>
        {/if}

        <form onsubmit={handleSave} class="space-y-6">
            <!-- Index & Title Inputs -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4 bg-background/50 border border-gray-800 p-4 rounded-lg">
                <div class="md:col-span-1">
                    <label for="chapter-index" class="block text-xs font-text text-secondary mb-1 uppercase tracking-wider">Index</label>
                    <input 
                        type="number" 
                        id="chapter-index" 
                        bind:value={chapterIndex}
                        min="1"
                        required
                        class="bg-primary text-black border border-foreground/30 focus:border-secondary h-10 px-3 text-sm font-bold font-title"
                    />
                </div>
                <div class="md:col-span-3">
                    <label for="chapter-title" class="block text-xs font-text text-secondary mb-1 uppercase tracking-wider">Titre du chapitre</label>
                    <input 
                        type="text" 
                        id="chapter-title" 
                        placeholder="Ex: La chute de la maison Harkonnen" 
                        bind:value={chapterTitle}
                        required
                        class="bg-primary text-black border border-foreground/30 focus:border-secondary h-10 px-3 text-sm font-semibold"
                    />
                </div>
            </div>

            <!-- Editor Wrapper -->
            <div class="editor-container bg-[#1b1b1b]/80 border border-gray-800 rounded-lg p-1.5 focus-within:border-secondary transition-all">
                <label for="markdown-editor" class="sr-only">Contenu du chapitre</label>
                <textarea id="markdown-editor" class="hidden"></textarea>
            </div>

            {#if saveError}
                <div class="p-3 border border-Chronos/30 bg-Chronos/10 text-Chronos rounded font-text text-sm">
                    {saveError}
                </div>
            {/if}

            <!-- Action buttons -->
            <div class="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 pt-4 border-t border-gray-800">
                <Cta 
                    text="Annuler"
                    onClick={handleCancel}
                    dragon="none"
                    border="none"
                    class="w-full sm:w-1/3 h-12 font-title text-sm uppercase tracking-wider text-white border border-white/20 hover:bg-white/5"
                />
                <Cta 
                    type="submit"
                    disabled={saving}
                    text={saving ? 'Sauvegarde...' : (isEditMode ? 'Enregistrer les modifications' : 'Graver le chapitre')}
                    dragon="Artrish"
                    border="Yinva"
                    class="w-full sm:w-2/3 h-12 font-title text-sm uppercase tracking-wider !text-black"
                />
            </div>
        </form>
    </main>
{/if}

<style>
    /* Styling to make inputs and layout integrate with the theme system */
    :global(.editor-container .EasyMDEContainer) {
        background-color: transparent !important;
        border-radius: var(--radius);
        overflow: hidden;
    }
</style>
