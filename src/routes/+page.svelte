<script lang="ts">
    import AuthPage from '$lib/components/auth/AuthPage.svelte';
    import { signOut, type AuthSession } from '$lib/auth-client';

    let currentSession = $state<AuthSession | null>(null);

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
</script>

{#if !currentSession}
    <AuthPage onAuthenticated={handleAuthenticated} />
{:else}
    <!-- Main Application Interface (revealed after door opening transition) -->
    <main class="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 bg-[#1b1b1b] text-[#fff] font-text relative">
        <!-- Background Glow -->
        <div class="absolute inset-0 -z-10 bg-cover opacity-5 pointer-events-none" style="background-image: url('/soft-neige1B1B1B.png')"></div>

        <div class="w-full max-w-[600px] border border-[var(--color-secondary)]/30 bg-[#1b1b1b]/80 backdrop-blur-md p-5 sm:p-8 rounded-lg shadow-2xl flex flex-col items-center">
            <h1 class="text-2xl sm:text-4xl text-[var(--color-secondary)] mb-6 font-title tracking-widest text-center">
                Grimoire de l'Héritage
            </h1>

            <div class="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left space-y-4 sm:space-y-0 sm:space-x-4 mb-8 bg-[#1b1b1b]/50 p-5 sm:p-4 border border-[var(--color-primary)]/20 rounded-md w-full">
                {#if currentSession.user.image}
                    <img src={currentSession.user.image} alt={currentSession.user.name} class="w-16 h-16 rounded-full object-cover border border-[var(--color-secondary)]" />
                {:else}
                    <div class="w-16 h-16 rounded-full bg-[var(--color-primary)] text-black flex items-center justify-center font-title text-2xl font-bold uppercase shrink-0">
                        {currentSession.user.name.charAt(0)}
                    </div>
                {/if}
                <div class="flex flex-col items-center sm:items-start w-full min-w-0">
                    <p class="text-xs uppercase tracking-widest text-gray-400">Initié Connecté</p>
                    <h3 class="text-xl font-title text-[var(--color-accent)] truncate w-full">{currentSession.user.name}</h3>
                    <p class="text-sm text-gray-300 font-text break-all w-full">{currentSession.user.email}</p>
                </div>
            </div>

            <div class="text-center space-y-4 mb-8 font-text text-gray-300 leading-relaxed">
                <p>
                    "Le silence est le plus grand gardien du secret. Bienvenue parmi nous, initié de l'ordre."
                </p>
                <p class="text-sm italic text-gray-400">
                    Vous avez franchi le seuil avec succès. L'ensemble des livres de l'Alliance est désormais consultable.
                </p>
            </div>

            <button 
                onclick={handleLogout}
                class="w-full sm:w-auto px-6 h-12 rounded-[var(--radius)] font-title text-[18px] uppercase tracking-wider text-black bg-[var(--color-secondary)] hover:bg-[var(--color-secondary)]/90 transition-all duration-200 ease-in-out cursor-pointer hover:shadow-[0_0_15px_rgba(210,182,116,0.3)]"
            >
                Quitter l'Héritage
            </button>
        </div>
    </main>
{/if}
