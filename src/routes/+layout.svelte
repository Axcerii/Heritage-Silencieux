<script lang="ts">
    import '../globals.css';
    import Cta from '$lib/components/Cta.svelte';
    import favicon from '$lib/assets/favicon.svg';
    import AuthPage from '$lib/components/auth/AuthPage.svelte';
    import { signOut, type AuthSession } from '$lib/auth-client';
    import { page } from '$app/state';
    import { breadcrumbs } from '$lib/breadcrumbs.svelte';
    import { censorEmail, getImageUrl } from '$lib';

    let { data, children } = $props<{
        data: { session: AuthSession | null };
        children: any;
    }>();

    let currentSession = $state<AuthSession | null>(data.session);
    let isProfileDropdownOpen = $state(false);
    let uploadingProfilePic = $state(false);

    let triggerButton = $state<HTMLElement | null>(null);
    let dropdownContainer = $state<HTMLElement | null>(null);

    function handleWindowClick(e: MouseEvent) {
        if (!isProfileDropdownOpen) return;
        const target = e.target as HTMLElement;
        if (
            triggerButton && !triggerButton.contains(target) &&
            dropdownContainer && !dropdownContainer.contains(target)
        ) {
            isProfileDropdownOpen = false;
        }
    }

    // Keep session state in sync with layout load data
    $effect(() => {
        currentSession = data.session;
    });

    // Reset custom breadcrumbs when navigating between pages
    $effect(() => {
        const _path = page.url.pathname;
        breadcrumbs.set(null);
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

    async function handleProfilePictureUpload(e: Event) {
        const target = e.target as HTMLInputElement;
        if (!target.files || target.files.length === 0) return;
        
        const file = target.files[0];
        const formData = new FormData();
        formData.append('file', file);
        
        uploadingProfilePic = true;
        try {
            const response = await fetch('http://localhost:3000/api/users/profile-picture', {
                method: 'POST',
                body: formData,
                credentials: 'include'
            });
            if (!response.ok) {
                throw new Error('Upload failed');
            }
            const result = await response.json();
            if (result.success && result.image && currentSession) {
                currentSession.user.image = result.image;
            }
        } catch (err) {
            console.error('Error uploading profile picture:', err);
            alert('Impossible de mettre à jour la photo de profil.');
        } finally {
            uploadingProfilePic = false;
        }
    }
</script>

<svelte:window onclick={handleWindowClick} />

<svelte:head>
    <link rel="icon" href={favicon} />
    <title>Heritage Silencieux</title>
</svelte:head>

{#if !currentSession}
    <AuthPage onAuthenticated={handleAuthenticated} />
{:else}
    <div class="min-h-screen bg-background text-foreground font-text flex flex-col relative overflow-x-hidden">
        <!-- Background Soft Neige Image -->
        <div class="absolute inset-0 -z-10 bg-cover opacity-5 pointer-events-none" style="background-image: url('/soft-neige1B1B1B.png')"></div>

        <!-- Sticky Header Navigation -->
        <header class="bg-background/80 backdrop-blur-md border-b border-gray-800 px-6 py-4 flex items-center justify-between z-20 sticky top-0">
            <!-- Left: Logo & Title & Breadcrumbs -->
            <div class="flex items-center space-x-4 min-w-0">
                <!-- App Title Logo -->
                <a href="/" class="flex items-center space-x-3 cursor-pointer shrink-0 focus:outline-none">
                    <img src="/dragons_logos/normal/Artrish.svg" alt="" class="w-8 h-8 secondary-svg" />
                    <h1 class="text-base font-title text-secondary tracking-widest uppercase hidden md:block select-none">Heritage Silencieux</h1>
                </a>

                <!-- Divider -->
                <div class="h-4 w-[1px] bg-gray-800 shrink-0"></div>

                <!-- Breadcrumbs -->
                <nav class="flex items-center space-x-2 text-xs font-title tracking-wider text-gray-400 uppercase font-bold min-w-0">
                    {#each breadcrumbs.items as item, i}
                        {#if i > 0}
                            <span class="text-gray-600 shrink-0">/</span>
                        {/if}
                        {#if item.href && i < breadcrumbs.items.length - 1}
                            <a href={item.href} class="hover:text-white transition-colors truncate max-w-[100px] sm:max-w-[180px]">
                                {item.label}
                            </a>
                        {:else}
                            <span class="text-secondary font-title truncate max-w-[100px] sm:max-w-[180px]">
                                {item.label}
                            </span>
                        {/if}
                    {/each}
                </nav>
            </div>

            <!-- Right: User Session Details & Logout Dropdown -->
            <div class="relative flex items-center shrink-0">
                <button 
                    bind:this={triggerButton}
                    onclick={() => isProfileDropdownOpen = !isProfileDropdownOpen}
                    class="flex items-center space-x-2 focus:outline-none group cursor-pointer"
                    aria-label="Menu utilisateur"
                >
                    {#if currentSession.user.image}
                        <img src={getImageUrl(currentSession.user.image)} alt="" class="w-8 h-8 rounded-full object-cover border border-secondary group-hover:border-primary transition-colors" />
                    {:else}
                        <div class="w-8 h-8 rounded-full bg-primary text-black flex items-center justify-center font-title text-sm font-bold uppercase shrink-0 group-hover:bg-secondary transition-colors">
                            {currentSession.user.name.charAt(0)}
                        </div>
                    {/if}
                    <span class="hidden sm:inline text-sm font-title text-gray-300 group-hover:text-secondary transition-colors truncate max-w-[120px]">{currentSession.user.name}</span>
                    <span class="text-gray-500 group-hover:text-secondary text-[8px] transition-transform duration-200 {isProfileDropdownOpen ? 'rotate-180' : ''}">▼</span>
                </button>

                {#if isProfileDropdownOpen}
                    <!-- Dropdown Menu -->
                    <div 
                        bind:this={dropdownContainer}
                        class="absolute right-0 top-full mt-3 w-56 bg-background/95 backdrop-blur-md border border-gray-850 rounded-lg shadow-xl py-3 px-4 z-30 space-y-3"
                    >
                        <!-- Profile Card with Avatar & Clickable Upload -->
                        <div class="border-b border-gray-800 pb-3 flex flex-col items-center space-y-2">
                            <button 
                                type="button"
                                onclick={() => document.getElementById('profile-pic-input')?.click()}
                                class="relative group cursor-pointer w-16 h-16 rounded-full overflow-hidden border border-secondary/40 focus:outline-none focus:border-secondary transition-all"
                                disabled={uploadingProfilePic}
                                aria-label="Modifier la photo de profil"
                            >
                                {#if currentSession.user.image}
                                    <img src={getImageUrl(currentSession.user.image)} alt="" class="w-full h-full object-cover" />
                                {:else}
                                    <div class="w-full h-full bg-primary text-black flex items-center justify-center font-title text-2xl font-bold uppercase">
                                        {currentSession.user.name.charAt(0)}
                                    </div>
                                {/if}
                                <div class="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                    <span class="text-[10px] font-title uppercase tracking-wider text-white">
                                        {uploadingProfilePic ? '...' : 'Éditer'}
                                    </span>
                                </div>
                            </button>
                            <div class="text-center w-full min-w-0">
                                <h4 class="text-sm font-title text-secondary truncate">{currentSession.user.name}</h4>
                                <p class="text-xs text-gray-500 truncate">{censorEmail(currentSession.user.email)}</p>
                            </div>
                        </div>

                        <!-- Hidden File Input for Avatar Upload -->
                        <input 
                            type="file" 
                            id="profile-pic-input" 
                            accept="image/*" 
                            class="hidden" 
                            onchange={handleProfilePictureUpload} 
                        />

                        <div class="space-y-1">
                            <button 
                                onclick={() => document.getElementById('profile-pic-input')?.click()}
                                class="w-full text-left text-xs font-title tracking-wider uppercase text-secondary hover:text-primary transition-colors cursor-pointer py-1.5 flex items-center space-x-2"
                                disabled={uploadingProfilePic}
                            >
                                <span>Changer de photo</span>
                            </button>

                            <button 
                                onclick={() => {
                                    isProfileDropdownOpen = false;
                                    handleLogout();
                                }}
                                class="w-full text-left text-xs font-title tracking-wider uppercase text-red-400 hover:text-red-300 transition-colors cursor-pointer py-1.5 flex items-center space-x-2"
                            >
                                <span>Quitter l'Héritage</span>
                            </button>
                        </div>
                    </div>
                {/if}
            </div>
        </header>

        <!-- Main Content Area -->
        <main class="flex-1 min-w-0 overflow-y-auto overflow-x-hidden z-10 flex flex-col relative">
            {@render children()}
        </main>

        <!-- Floating Admin FAB (Yinva) -->
        {#if currentSession.user.role === 'ADMIN' && page.url.pathname !== '/admin'}
            <a 
                href="/admin"
                class="fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full bg-background/60 hover:bg-background/90 border border-Yinva/25 hover:border-Yinva/80 flex items-center justify-center transition-all duration-300 shadow-[0_4px_20px_rgba(0,0,0,0.5)] group backdrop-blur-md"
                title="Administration"
            >
                <img src="/dragons_logos/normal/Yinva.svg" alt="Admin" class="w-6 h-6 opacity-40 group-hover:opacity-95 transition-opacity duration-300 accent-svg" />
            </a>
        {/if}
    </div>
{/if}

