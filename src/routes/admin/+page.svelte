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
    <main class="w-full max-w-6xl mx-auto p-4 sm:p-6 py-6 flex-1">
        <AdminDashboard {session} />
    </main>
{/if}
