<script lang="ts">
    import { onMount } from 'svelte';
    import AuthPage from '$lib/components/auth/AuthPage.svelte';
    import { signOut, type AuthSession } from '$lib/auth-client';
    
    // Import API and Types
    import { getClubMembers, getChapters, type Club, type Book, type Chapter } from '$lib/api';
    
    // Import Subcomponents
    import ClubsList from '$lib/components/clubs/ClubsList.svelte';
    import BooksList from '$lib/components/books/BooksList.svelte';
    import BookDetails from '$lib/components/books/BookDetails.svelte';
    import BookReader from '$lib/components/chapters/BookReader.svelte';
    import MembersList from '$lib/components/members/MembersList.svelte';

    let currentSession = $state<AuthSession | null>(null);

    // View Routing State
    let currentView = $state<'clubs' | 'club-details' | 'book-details' | 'reader'>('clubs');
    let selectedClub = $state<Club | null>(null);
    let selectedBook = $state<Book | null>(null);
    let selectedChapter = $state<Chapter | null>(null);
    let userRoleInSelectedClub = $state<'OWNER' | 'EDITOR' | 'READER' | null>(null);
    let clubChapters = $state<Chapter[]>([]);
    
    // Club sub-view tab inside club details ('library' | 'members')
    let activeClubTab = $state<'library' | 'members'>('library');

    function handleAuthenticated(session: AuthSession) {
        currentSession = session;
    }

    async function handleLogout() {
        try {
            await signOut();
            currentSession = null;
            // Force refresh to reload initial state
            window.location.reload();
        } catch (e) {
            console.error('Error signing out:', e);
        }
    }

    async function handleSelectClub(club: Club) {
        selectedClub = club;
        currentView = 'club-details';
        activeClubTab = 'library';
        selectedBook = null;
        selectedChapter = null;
        userRoleInSelectedClub = null;
        
        if (currentSession) {
            try {
                const members = await getClubMembers(club.slug);
                const member = members.find(m => m.userId === currentSession!.user.id);
                if (member) {
                    userRoleInSelectedClub = member.role;
                }
            } catch (e) {
                console.error('Error getting member role:', e);
            }
        }
    }

    async function handleSelectBook(book: Book) {
        selectedBook = book;
        currentView = 'book-details';
        selectedChapter = null;
        
        if (selectedClub) {
            try {
                clubChapters = await getChapters(selectedClub.slug, book.id);
            } catch (e) {
                console.error('Error pre-loading chapters:', e);
            }
        }
    }

    function handleReadChapter(chapter: Chapter) {
        selectedChapter = chapter;
        currentView = 'reader';
    }

    function handleBackToLibrary() {
        currentView = 'club-details';
        activeClubTab = 'library';
        selectedBook = null;
        selectedChapter = null;
    }

    function handleBackToBook() {
        currentView = 'book-details';
        selectedChapter = null;
    }

    function handleBackToClubs() {
        currentView = 'clubs';
        selectedClub = null;
        selectedBook = null;
        selectedChapter = null;
        userRoleInSelectedClub = null;
    }
</script>

{#if !currentSession}
    <AuthPage onAuthenticated={handleAuthenticated} />
{:else}
    <div class="min-h-screen bg-background text-foreground font-text flex flex-col md:flex-row relative">
        <!-- Background Soft Neige Image -->
        <div class="absolute inset-0 -z-10 bg-cover opacity-5 pointer-events-none" style="background-image: url('/soft-neige1B1B1B.png')"></div>

        <!-- Sidebar Navigation -->
        <aside class="w-full md:w-64 bg-background/80 backdrop-blur-md border-b md:border-b-0 md:border-r border-gray-800 p-5 flex flex-col justify-between shrink-0 z-10">
            <div class="space-y-8">
                <!-- App Title Logo -->
                <button type="button" class="flex items-center space-x-3 cursor-pointer text-left focus:outline-none w-full" onclick={handleBackToClubs}>
                    <img src="/dragons_logos/normal/Artrish.svg" alt="" class="w-8 h-8 secondary-svg" />
                    <h1 class="text-xl font-title text-secondary tracking-widest uppercase">ReaDBrary</h1>
                </button>

                <!-- Main Nav Links -->
                <nav class="space-y-2">
                    <button 
                        onclick={handleBackToClubs}
                        class="w-full flex items-center space-x-3 px-4 py-3 rounded-[var(--radius)] font-title tracking-wider text-left transition-colors cursor-pointer {currentView === 'clubs' ? 'bg-secondary text-black' : 'text-gray-300 hover:bg-gray-800/50'}"
                    >
                        <span>🏰</span>
                        <span>Tous les Cercles</span>
                    </button>

                    {#if selectedClub}
                        <button 
                            onclick={() => handleSelectClub(selectedClub!)}
                            class="w-full flex items-center space-x-3 px-4 py-3 rounded-[var(--radius)] font-title tracking-wider text-left transition-colors cursor-pointer {currentView === 'club-details' ? 'bg-secondary text-black' : 'text-gray-300 hover:bg-gray-800/50'}"
                        >
                            <span>📖</span>
                            <span class="truncate">{selectedClub.name}</span>
                        </button>
                    {/if}

                    {#if selectedBook}
                        <button 
                            onclick={() => handleSelectBook(selectedBook!)}
                            class="w-full flex items-center space-x-3 px-4 py-3 rounded-[var(--radius)] font-title tracking-wider text-left transition-colors cursor-pointer {currentView === 'book-details' ? 'bg-secondary text-black' : 'text-gray-300 hover:bg-gray-800/50'}"
                        >
                            <span>📜</span>
                            <span class="truncate">{selectedBook.title}</span>
                        </button>
                    {/if}
                </nav>
            </div>

            <!-- User Session Details & Logout -->
            <div class="mt-8 pt-6 border-t border-gray-800 space-y-4">
                <div class="flex items-center space-x-3">
                    {#if currentSession.user.image}
                        <img src={currentSession.user.image} alt="" class="w-10 h-10 rounded-full object-cover border border-secondary" />
                    {:else}
                        <div class="w-10 h-10 rounded-full bg-primary text-black flex items-center justify-center font-title text-lg font-bold uppercase shrink-0">
                            {currentSession.user.name.charAt(0)}
                        </div>
                    {/if}
                    <div class="min-w-0 flex-1">
                        <h4 class="text-sm font-title text-secondary truncate">{currentSession.user.name}</h4>
                        <p class="text-xs text-gray-500 truncate">{currentSession.user.email}</p>
                    </div>
                </div>

                <button 
                    onclick={handleLogout}
                    class="w-full px-4 h-10 rounded-[var(--radius)] font-title text-sm uppercase tracking-wider text-black bg-secondary hover:bg-secondary/90 transition-colors cursor-pointer"
                >
                    Quitter l'Héritage
                </button>
            </div>
        </aside>

        <!-- Main Content Area -->
        <main class="flex-1 min-w-0 overflow-y-auto z-10">
            <!-- Breadcrumbs / Top Navigation Bar -->
            <header class="bg-background/40 backdrop-blur-sm border-b border-gray-800 px-6 py-4 flex items-center justify-between">
                <div class="flex items-center space-x-2 text-xs font-title tracking-wider text-gray-400 uppercase">
                    <button onclick={handleBackToClubs} class="hover:text-white transition-colors cursor-pointer">Cercles</button>
                    
                    {#if selectedClub}
                        <span>/</span>
                        <button onclick={() => handleSelectClub(selectedClub!)} class="hover:text-white transition-colors cursor-pointer truncate max-w-[150px]">{selectedClub.name}</button>
                    {/if}

                    {#if selectedBook}
                        <span>/</span>
                        <button onclick={() => handleSelectBook(selectedBook!)} class="hover:text-white transition-colors cursor-pointer truncate max-w-[150px]">{selectedBook.title}</button>
                    {/if}

                    {#if selectedChapter}
                        <span>/</span>
                        <span class="text-secondary truncate max-w-[150px]">Chapitre {selectedChapter.index}</span>
                    {/if}
                </div>

                <span class="text-[10px] tracking-widest text-gray-500 font-text uppercase">Initié Connecté</span>
            </header>

            <!-- Dynamic View Routing -->
            {#if currentView === 'clubs'}
                <ClubsList onSelectClub={handleSelectClub} />
            {:else if currentView === 'club-details' && selectedClub}
                <div class="w-full max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
                    <!-- Club Detail Header -->
                    <div class="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-secondary/20 pb-6 gap-4">
                        <div>
                            <h1 class="text-3xl sm:text-5xl font-title text-secondary tracking-wider mb-2">{selectedClub.name}</h1>
                            <p class="text-gray-400 font-text text-sm">
                                Cercle unique : <span class="text-white italic">/{selectedClub.slug}</span>
                            </p>
                        </div>
                        
                        <div class="flex flex-col sm:items-end">
                            <span class="text-xs text-gray-400 font-text">Votre grade dans ce cercle :</span>
                            <span class="text-sm font-title uppercase tracking-wider text-secondary mt-1">
                                {userRoleInSelectedClub === 'OWNER' ? 'Propriétaire' : userRoleInSelectedClub === 'EDITOR' ? 'Éditeur' : userRoleInSelectedClub === 'READER' ? 'Lecteur' : 'Visiteur'}
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
                            clubSlug={selectedClub.slug} 
                            userRole={userRoleInSelectedClub} 
                            session={currentSession} 
                            onSelectBook={handleSelectBook} 
                        />
                    {:else if activeClubTab === 'members'}
                        <MembersList 
                            clubSlug={selectedClub.slug} 
                            userRole={userRoleInSelectedClub} 
                            session={currentSession} 
                        />
                    {/if}
                </div>
            {:else if currentView === 'book-details' && selectedClub && selectedBook}
                <BookDetails 
                    clubSlug={selectedClub.slug} 
                    book={selectedBook} 
                    userRole={userRoleInSelectedClub} 
                    session={currentSession} 
                    onBack={handleBackToLibrary} 
                    onReadChapter={handleReadChapter} 
                />
            {:else if currentView === 'reader' && selectedClub && selectedBook && selectedChapter}
                <BookReader 
                    clubSlug={selectedClub.slug} 
                    bookId={selectedBook.id} 
                    initialChapter={selectedChapter} 
                    chapters={clubChapters} 
                    bookPages={selectedBook.pages} 
                    onBack={handleBackToBook} 
                />
            {/if}
        </main>
    </div>
{/if}

