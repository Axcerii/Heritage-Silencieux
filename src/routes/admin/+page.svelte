<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { getSession } from '$lib/auth-client';
    import AdminDashboard from '$lib/components/admin/AdminDashboard.svelte';
    import type { AuthSession } from '$lib/auth-client';

    let { data } = $props<{
        data: { session: AuthSession | null };
    }>();

    let session = $state<AuthSession | null>(null);
    let loading = $state(true);

    onMount(async () => {
        try {
            console.log("Layout session data:", data.session);
            
            // Fail-safe: Fetch direct session from API to bypass layout caching
            let activeSession = data.session;
            if (!activeSession) {
                console.log("No layout session, fetching directly from API...");
                activeSession = await getSession();
                console.log("Direct API session response:", activeSession);
            }

            if (!activeSession) {
                console.warn("Authentication required. Redirecting to home...");
                await goto('/');
            } else if (activeSession.user.role !== 'ADMIN') {
                console.warn(`Access denied. Role: "${activeSession.user.role}" (expected: "ADMIN"). Redirecting to home...`);
                await goto('/');
            } else {
                session = activeSession;
                loading = false;
            }
        } catch (e) {
            console.error("Error during admin authentication verification:", e);
            await goto('/');
        }
    });
</script>

<svelte:head>
    <title>Administration — Heritage Silencieux</title>
</svelte:head>

{#if loading}
    <div class="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 select-none relative">
        <div class="absolute inset-0 -z-10 bg-cover opacity-5 pointer-events-none" style="background-image: url('/soft-neige1B1B1B.png')"></div>
        <div class="w-12 h-12 rounded-full border-2 border-secondary border-t-transparent animate-spin mb-4"></div>
        <p class="text-secondary font-title text-xl animate-pulse">Vérification de vos sceaux d'accès...</p>
    </div>
{:else if session}
    <div class="min-h-screen bg-background text-foreground font-text relative flex flex-col">
        <!-- Background Soft Neige Image -->
        <div class="absolute inset-0 -z-10 bg-cover opacity-5 pointer-events-none" style="background-image: url('/soft-neige1B1B1B.png')"></div>

        <!-- Breadcrumbs / Top Navigation Bar -->
        <header class="bg-background/45 backdrop-blur-sm border-b border-gray-800 px-6 py-4 flex items-center justify-between z-10 font-bold">
            <div class="flex items-center space-x-2 text-xs font-title tracking-wider text-gray-400 uppercase font-bold">
                <a href="/" class="hover:text-white transition-colors">← Retour au Dashboard</a>
                <span>/</span>
                <span class="text-secondary font-title">Administration</span>
            </div>
            <span class="text-[10px] tracking-widest text-gray-500 font-text uppercase font-bold">Session Admin</span>
        </header>

        <!-- Main dashboard content -->
        <main class="flex-1 overflow-y-auto z-10 py-6">
            <AdminDashboard {session} />
        </main>
    </div>
{/if}
