<script lang="ts">
    import '../globals.css';
    import Cta from '$lib/components/Cta.svelte';
    import favicon from '$lib/assets/favicon.svg';
    import AuthPage from '$lib/components/auth/AuthPage.svelte';
    import { signOut, type AuthSession } from '$lib/auth-client';
    import { page } from '$app/state';

    let { data, children } = $props<{
        data: { session: AuthSession | null };
        children: any;
    }>();

    let currentSession = $state<AuthSession | null>(data.session);

    // Keep session state in sync with layout load data
    $effect(() => {
        currentSession = data.session;
    });

    function handleAuthenticated(session: AuthSession) {
        currentSession = session;
        // Reload to let load() re-run and load layout state
        window.location.reload();
    }

    async function handleLogout() {
        try {
            await signOut();
            currentSession = null;
            window.location.reload();
        } catch (e) {
            console.error('Error signing out:', e);
        }
    }
</script>

<svelte:head>
    <link rel="icon" href={favicon} />
    <title>Heritage Silencieux</title>
</svelte:head>

{#if !currentSession}
    <AuthPage onAuthenticated={handleAuthenticated} />
{:else}
    <div class="min-h-screen bg-background text-foreground font-text flex flex-col md:flex-row relative">
        <!-- Background Soft Neige Image -->
        <div class="absolute inset-0 -z-10 bg-cover opacity-5 pointer-events-none" style="background-image: url('/soft-neige1B1B1B.png')"></div>

        <!-- Sidebar Navigation -->
        <aside class="w-full md:w-64 bg-background/80 backdrop-blur-md border-b md:border-b-0 md:border-r border-gray-800 p-5 flex flex-col justify-between shrink-0 z-10 font-text">
            <div class="space-y-8">
                <!-- App Title Logo -->
                <a href="/" class="flex items-center space-x-3 cursor-pointer text-left focus:outline-none w-full">
                    <img src="/dragons_logos/normal/Artrish.svg" alt="" class="w-8 h-8 secondary-svg" />
                    <h1 class="text-base font-title text-secondary tracking-widest uppercase">Heritage Silencieux</h1>
                </a>

                <!-- Main Nav Links -->
                <nav class="space-y-2">
                    <a 
                        href="/"
                        class="w-full flex items-center space-x-3 px-4 py-3 rounded-[var(--radius)] font-title tracking-wider text-left transition-colors cursor-pointer block {page.url.pathname === '/' ? 'bg-secondary text-black font-bold' : 'text-gray-300 hover:bg-gray-800/50'}"
                    >
                        <span>🏰</span>
                        <span>Tous les Cercles</span>
                    </a>

                    {#if currentSession.user.role === 'ADMIN'}
                        <a 
                            href="/admin"
                            class="w-full flex items-center space-x-3 px-4 py-3 rounded-[var(--radius)] font-title tracking-wider text-left transition-colors cursor-pointer block {page.url.pathname.startsWith('/admin') ? 'bg-secondary text-black font-bold' : 'text-gray-300 hover:bg-gray-800/50'}"
                        >
                            <span>⚙️</span>
                            <span>Administration</span>
                        </a>
                    {/if}
                </nav>
            </div>

            <!-- User Session Details & Logout -->
            <div class="mt-8 pt-6 border-t border-gray-800 space-y-4">
                <div class="flex items-center space-x-3 font-text">
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

                <Cta 
                    text="Quitter l'Héritage"
                    onClick={handleLogout}
                    dragon="Chronos"
                    border="Chronos"
                    class="h-10 text-sm font-title uppercase tracking-wider text-white"
                />
            </div>
        </aside>

        <!-- Main Content Area -->
        <main class="flex-1 min-w-0 overflow-y-auto z-10 flex flex-col">
            {@render children()}
        </main>
    </div>
{/if}
