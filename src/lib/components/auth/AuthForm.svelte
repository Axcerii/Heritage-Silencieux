<script lang="ts">
    import { signInEmail, signUpEmail, signInGoogle } from '../../auth-client';
    import { fade } from 'svelte/transition';
    import Cta from '../Cta.svelte';


    let { onSuccess = () => {} } = $props();

    let isSignUp = $state(false);
    let name = $state('');
    let email = $state('');
    let password = $state('');
    let loading = $state(false);
    let error = $state('');

    let hasMinLength = $derived(password.length >= 12);
    let hasNumber = $derived(/\d/.test(password));
    let hasUppercase = $derived(/[A-Z]/.test(password));
    let hasLowercase = $derived(/[a-z]/.test(password));
    let hasSpecial = $derived(/[!@#$%^&*()_+={}\[\]|\\:;"'<>,.?/~`\-]/.test(password));
    let isPasswordValid = $derived(hasMinLength && hasNumber && hasUppercase && hasLowercase && hasSpecial);

    async function handleSubmit(e: SubmitEvent) {
        e.preventDefault();
        loading = true;
        error = '';

        try {
            if (isSignUp) {
                if (!name.trim()) throw new Error('Le nom est obligatoire.');
                if (!isPasswordValid) {
                    throw new Error('Le mot de passe ne respecte pas les critères de sécurité.');
                }
                await signUpEmail(name, email, password);
            } else {
                await signInEmail(email, password);
            }
            onSuccess();
        } catch (err: any) {
            error = err.message || "Une erreur est survenue lors de l'authentification.";
        } finally {
            loading = false;
        }
    }

    async function handleGoogleLogin() {
        loading = true;
        error = '';
        try {
            await signInGoogle();
        } catch (err: any) {
            error = err.message || "Une erreur est survenue lors de la connexion Google.";
            loading = false;
        }
    }
</script>

<div class="w-full max-w-[440px] px-4 z-10 transition-all duration-300">
    <!-- Form Card -->
    <div class="relative bg-[#1b1b1b]/70 border border-secondary backdrop-blur-md p-5 sm:p-8 rounded-lg shadow-[0_0_30px_rgba(210,182,116,0.15)] flex flex-col items-center">
        <!-- Logo -->
        <img src="/LeTout.svg" alt="" class="w-16 h-16 mb-4 secondary-svg opacity-90 animate-pulse" />

        <!-- Form Wrapper with CSS Grid overlay to prevent height collapse/scaling jump during transitions -->
        <div class="grid grid-cols-1 grid-rows-1 w-full items-start">
            {#if isSignUp}
                <div 
                    in:fade={{ duration: 200 }} 
                    out:fade={{ duration: 200 }} 
                    class="col-start-1 row-start-1 w-full flex flex-col items-center"
                >
                    <!-- Welcome Phrase -->
                    <h2 class="text-2xl sm:text-3xl text-center text-secondary mb-2 font-title tracking-wider">
                        Rejoindre l'Alliance
                    </h2>

                    <!-- Error Message -->
                    {#if error}
                        <div class="w-full bg-Chronos/10 border border-Chronos text-Chronos text-sm rounded p-3 mb-4 text-center font-text">
                            {error}
                        </div>
                    {/if}

                    <!-- Auth Form -->
                    <form onsubmit={handleSubmit} class="w-full space-y-4">
                        <div class="space-y-1">
                            <label for="signup-name" class="text-xs uppercase tracking-widest text-gray-400 font-text">Nom complet</label>
                            <input 
                                type="text" 
                                id="signup-name" 
                                placeholder="Serena Gaujes" 
                                bind:value={name} 
                                disabled={loading} 
                                class="text-[#1b1b1b] focus:ring-1 focus:ring-secondary focus:outline-none transition-all"
                                required
                            />
                        </div>

                        <div class="space-y-1">
                            <label for="signup-email" class="text-xs uppercase tracking-widest text-gray-400 font-text">Adresse Email</label>
                            <input 
                                type="email" 
                                id="signup-email" 
                                placeholder="serena.gaujes@gmail.com" 
                                bind:value={email} 
                                disabled={loading} 
                                class="text-[#1b1b1b] focus:ring-1 focus:ring-secondary focus:outline-none transition-all"
                                required
                            />
                        </div>

                        <div class="space-y-1">
                            <label for="signup-password" class="text-xs uppercase tracking-widest text-gray-400 font-text">Mot de passe</label>
                            <input 
                                type="password" 
                                id="signup-password" 
                                placeholder="••••••••••••••" 
                                bind:value={password} 
                                disabled={loading} 
                                class="text-[#1b1b1b] focus:ring-1 focus:ring-secondary focus:outline-none transition-all"
                                required
                            />
                            {#if password}
                                <div class="text-[11px] sm:text-xs space-y-2 mt-2 text-gray-400 font-text w-full transition-all duration-200 bg-black/20 p-2.5 rounded border border-secondary/20">
                                    <p class="font-semibold text-gray-300 mb-1">Critères de sécurité (RGPD) :</p>
                                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-2 gap-y-1">
                                        <div class="flex items-center space-x-2">
                                            <span class={hasMinLength ? "text-green-400 font-bold transition-colors duration-200" : "text-gray-500 transition-colors duration-200"}>
                                                {hasMinLength ? "✓" : "○"} 12 caractères min
                                            </span>
                                        </div>
                                        <div class="flex items-center space-x-2">
                                            <span class={hasUppercase ? "text-green-400 font-bold transition-colors duration-200" : "text-gray-500 transition-colors duration-200"}>
                                                {hasUppercase ? "✓" : "○"} 1 majuscule min
                                            </span>
                                        </div>
                                        <div class="flex items-center space-x-2">
                                            <span class={hasLowercase ? "text-green-400 font-bold transition-colors duration-200" : "text-gray-500 transition-colors duration-200"}>
                                                {hasLowercase ? "✓" : "○"} 1 minuscule min
                                            </span>
                                        </div>
                                        <div class="flex items-center space-x-2">
                                            <span class={hasNumber ? "text-green-400 font-bold transition-colors duration-200" : "text-gray-500 transition-colors duration-200"}>
                                                {hasNumber ? "✓" : "○"} 1 chiffre min
                                            </span>
                                        </div>
                                        <div class="flex items-center space-x-2 sm:col-span-2">
                                            <span class={hasSpecial ? "text-green-400 font-bold transition-colors duration-200" : "text-gray-500 transition-colors duration-200"}>
                                                {hasSpecial ? "✓" : "○"} 1 car. spécial min
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            {/if}
                        </div>

                        <Cta 
                            type="submit" 
                            disabled={loading}
                            dragon="Artrish"
                            border="Yinva"
                            class="w-full h-12 mt-6 font-title text-[20px] font-semibold uppercase tracking-wider !text-black hover:shadow-[0_0_15px_rgba(210,182,116,0.35)]"
                        >
                            {#if loading}
                                <div class="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                            {:else}
                                Prêter Serment
                            {/if}
                        </Cta>
                    </form>

                    <!-- Divider -->
                    <div class="w-full flex items-center my-5 pointer-events-none">
                        <div class="flex-grow border-t border-secondary/30"></div>
                        <span class="mx-3 text-xs uppercase tracking-widest text-gray-400 font-text">ou</span>
                        <div class="flex-grow border-t border-secondary/30"></div>
                    </div>

                    <!-- Google OAuth Button -->
                    <Cta 
                        type="button" 
                        onClick={handleGoogleLogin} 
                        disabled={loading}
                        dragon="none"
                        border="secondary"
                        class="w-full h-12 text-gray-100 font-text hover:bg-secondary/10 hover:text-secondary gap-2"
                    >
                        <img src="/extern_logos/google.svg" alt="" class="w-5 h-5 shrink-0" />
                        <span>Continuer avec Google</span>
                    </Cta>

                    <!-- Switch Link -->
                    <button 
                        type="button" 
                        onclick={() => { isSignUp = false; error = ''; }}
                        disabled={loading}
                        class="mt-6 text-xs tracking-wider text-gray-400 hover:text-secondary transition-colors font-text cursor-pointer underline underline-offset-4"
                    >
                        Déjà initié ? Se connecter
                    </button>
                </div>
            {:else}
                <div 
                    in:fade={{ duration: 200 }} 
                    out:fade={{ duration: 200 }} 
                    class="col-start-1 row-start-1 w-full flex flex-col items-center"
                >
                    <!-- Welcome Phrase -->
                    <h2 class="text-2xl sm:text-3xl text-center text-secondary mb-2 font-title tracking-wider">
                        Bienvenue, Voyageur
                    </h2>

                    <!-- Error Message -->
                    {#if error}
                        <div class="w-full bg-Chronos/10 border border-Chronos text-Chronos text-sm rounded p-3 mb-4 text-center font-text">
                            {error}
                        </div>
                    {/if}

                    <!-- Auth Form -->
                    <form onsubmit={handleSubmit} class="w-full space-y-4">
                        <div class="space-y-1">
                            <label for="signin-email" class="text-xs uppercase tracking-widest text-gray-400 font-text">Adresse Email</label>
                            <input 
                                type="email" 
                                id="signin-email" 
                                placeholder="serena.gaujes@gmail.com" 
                                bind:value={email} 
                                disabled={loading} 
                                class="text-[#1b1b1b] focus:ring-1 focus:ring-secondary focus:outline-none transition-all"
                                required
                            />
                        </div>

                        <div class="space-y-1">
                            <label for="signin-password" class="text-xs uppercase tracking-widest text-gray-400 font-text">Mot de passe</label>
                            <input 
                                type="password" 
                                id="signin-password" 
                                placeholder="••••••••••••••" 
                                bind:value={password} 
                                disabled={loading} 
                                class="text-[#1b1b1b] focus:ring-1 focus:ring-secondary focus:outline-none transition-all"
                                required
                            />
                        </div>

                        <Cta 
                            type="submit" 
                            disabled={loading}
                            dragon="Pestia"
                            border="Lada"
                            class="w-full h-12 mt-6 font-title text-[20px] font-semibold uppercase tracking-wider !text-white hover:shadow-[0_0_15px_rgba(210,182,116,0.35)]"
                        >
                            {#if loading}
                                <div class="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                            {:else}
                                Franchir le Seuil
                            {/if}
                        </Cta>
                    </form>

                    <!-- Divider -->
                    <div class="w-full flex items-center my-5 pointer-events-none">
                        <div class="flex-grow border-t border-secondary/30"></div>
                        <span class="mx-3 text-xs uppercase tracking-widest text-gray-400 font-text">ou</span>
                        <div class="flex-grow border-t border-secondary/30"></div>
                    </div>

                    <!-- Google OAuth Button -->
                    <Cta 
                        type="button" 
                        onClick={handleGoogleLogin} 
                        disabled={loading}
                        dragon="none"
                        border="secondary"
                        class="w-full h-12 text-gray-100 font-text hover:bg-secondary/10 hover:text-secondary gap-2"
                    >
                        <img src="/extern_logos/google.svg" alt="" class="w-5 h-5 shrink-0" />
                        <span>Continuer avec Google</span>
                    </Cta>

                    <!-- Switch Link -->
                    <button 
                        type="button" 
                        onclick={() => { isSignUp = true; error = ''; }}
                        disabled={loading}
                        class="mt-6 text-xs tracking-wider text-gray-400 hover:text-secondary transition-colors font-text cursor-pointer underline underline-offset-4"
                    >
                        Pas encore des nôtres ? Créer un compte
                    </button>
                </div>
            {/if}
        </div>
    </div>
</div>
