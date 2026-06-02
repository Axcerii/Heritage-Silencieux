<script lang="ts">
    import { onMount } from 'svelte';
    import { fade } from 'svelte/transition';
    import { getSession, type AuthSession } from '../../auth-client';
    import { getRandomQuote } from '$lib/quotes';
    import PulsingBackground from './PulsingBackground.svelte';
    import DoorTransition from './DoorTransition.svelte';
    import AuthForm from './AuthForm.svelte';

    const loadingQuote = getRandomQuote();

    let { onAuthenticated = (session: AuthSession) => {} } = $props();

    let session = $state<AuthSession | null>(null);
    let checkingSession = $state(true);
    let triggerDoorOpen = $state(false);
    let showForm = $state(true);

    onMount(async () => {
        const startTime = Date.now();
        const activeSession = await getSession();
        
        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(0, 2000 - elapsedTime);
        
        setTimeout(() => {
            if (activeSession) {
                session = activeSession;
                // If already logged in, we trigger the door opening immediately
                triggerDoorOpen = true;
                showForm = false;
            } else {
                checkingSession = false;
            }
        }, remainingTime);
    });

    function handleAuthSuccess() {
        // First fade out the form
        showForm = false;
        
        // Wait for the form fade transition to complete (600ms) before opening the doors
        setTimeout(() => {
            triggerDoorOpen = true;
        }, 600);
        
        // Fetch session info to pass back to the parent component
        getSession().then(activeSession => {
            if (activeSession) {
                session = activeSession;
            }
        });
    }

    function handleTransitionComplete() {
        if (session) {
            onAuthenticated(session);
        }
        checkingSession = false;
    }
</script>

<!-- Doors overlay (renders at z-40) -->
{#if triggerDoorOpen || !checkingSession}
    <DoorTransition open={triggerDoorOpen} onComplete={handleTransitionComplete} />
{/if}

{#if checkingSession && !triggerDoorOpen}
    <!-- Loading screen with mystical quote (z-50) -->
    <div transition:fade={{ duration: 400 }} class="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#1b1b1b] p-6 text-center select-none">
        <div class="quote-dezoom max-w-[600px] flex flex-col items-center">
            <!-- Mystical Logo -->
            <img src="/dragons_logos/normal/Artrish.svg" alt="" class="w-16 h-16 mb-6 secondary-svg opacity-40 animate-pulse" />
            
            <p class="text-2xl sm:text-3xl text-secondary font-title italic tracking-wide leading-relaxed">
                « {loadingQuote.text} »
            </p>
            <span class="text-xs uppercase tracking-[0.3em] text-gray-500 font-text mt-4">
                — {loadingQuote.author}
            </span>
        </div>
    </div>
{:else if !session || showForm}
    <!-- Full-screen Auth page container (z-50 on top of the doors at z-40) -->
    <div class="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-y-auto p-4 sm:p-6 bg-transparent">
        <!-- Pulsing secondary-colored light heart pulse background -->
        {#if showForm}
            <div transition:fade={{ duration: 800 }}>
                <PulsingBackground />
            </div>
        {/if}

        <!-- Auth Form Card -->
        {#if showForm}
            <div transition:fade={{ duration: 600 }} class="flex items-center justify-center w-full z-10 my-auto">
                <AuthForm onSuccess={handleAuthSuccess} />
            </div>
        {/if}
    </div>
{/if}

<style>
    .quote-dezoom {
        animation: dezoom-animation 3.5s cubic-bezier(0.1, 0.8, 0.2, 1) forwards;
    }

    @keyframes dezoom-animation {
        0% {
            transform: scale(1.35);
            opacity: 0;
            filter: blur(8px);
        }
        15% {
            transform: scale(1.2);
            opacity: 1;
            filter: blur(0);
        }
        100% {
            transform: scale(0.95);
            opacity: 0.85;
        }
    }
</style>
