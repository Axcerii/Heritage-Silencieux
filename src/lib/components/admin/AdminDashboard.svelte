<script lang="ts">
    import { onMount } from 'svelte';
    import { 
        getAdminUsers, deactivateUser, reactivateUser, 
        getClubs, updateClub, deleteClub,
        type AdminUser, type Club 
    } from '../../api';
    import type { AuthSession } from '../../auth-client';

    let { session } = $props<{
        session: AuthSession;
    }>();

    // Svelte 5 States
    let activeTab = $state<'users' | 'clubs'>('users');
    
    // Users state
    let users = $state<AdminUser[]>([]);
    let loadingUsers = $state(true);
    let userError = $state<string | null>(null);

    // Clubs state
    let clubs = $state<Club[]>([]);
    let loadingClubs = $state(true);
    let clubError = $state<string | null>(null);

    async function loadUsers() {
        loadingUsers = true;
        userError = null;
        try {
            users = await getAdminUsers();
        } catch (e: any) {
            userError = e.message || 'Erreur lors du chargement des utilisateurs.';
        } finally {
            loadingUsers = false;
        }
    }

    async function loadClubs() {
        loadingClubs = true;
        clubError = null;
        try {
            clubs = await getClubs();
        } catch (e: any) {
            clubError = e.message || 'Erreur lors du chargement des bibliothèques.';
        } finally {
            loadingClubs = false;
        }
    }

    async function handleToggleUserStatus(user: AdminUser) {
        const action = user.isActive ? 'désactiver' : 'réactiver';
        if (!confirm(`Êtes-vous sûr de vouloir ${action} cet initié ?`)) return;

        try {
            if (user.isActive) {
                await deactivateUser(user.id);
            } else {
                await reactivateUser(user.id);
            }
            // Update local state
            const index = users.findIndex(u => u.id === user.id);
            if (index !== -1) {
                users[index].isActive = !user.isActive;
            }
        } catch (e: any) {
            alert(`Erreur: ${e.message}`);
        }
    }

    async function handleToggleClubStatus(club: Club) {
        const nextStatus = !club.isActive;
        const action = nextStatus ? 'réactiver' : 'désactiver';
        if (!confirm(`Êtes-vous sûr de vouloir ${action} cette bibliothèque ?`)) return;

        try {
            await updateClub(club.id, { isActive: nextStatus });
            const index = clubs.findIndex(c => c.id === club.id);
            if (index !== -1) {
                clubs[index].isActive = nextStatus;
            }
        } catch (e: any) {
            alert(`Erreur: ${e.message}`);
        }
    }

    async function handleDeleteClub(club: Club) {
        if (!confirm(`ATTENTION: Voulez-vous vraiment détruire définitivement la bibliothèque "${club.name}" ? Cette action effacera tous ses livres et progressions associés.`)) return;

        try {
            await deleteClub(club.id);
            clubs = clubs.filter(c => c.id !== club.id);
        } catch (e: any) {
            alert(`Erreur: ${e.message}`);
        }
    }

    onMount(() => {
        loadUsers();
        loadClubs();
    });
</script>

<div class="w-full max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
    <div class="border-b border-secondary/20 pb-6">
        <h1 class="text-3xl sm:text-5xl font-title text-secondary tracking-wider mb-2">Panneau d'Administration</h1>
        <p class="text-gray-400 font-text text-sm sm:text-base">Gérez les initiés de l'ordre et régulez les bibliothèques de l'alliance.</p>
    </div>

    <!-- Admin Tabs Menu -->
    <div class="flex border-b border-gray-800 w-full">
        <button 
            onclick={() => activeTab = 'users'}
            class="flex-1 sm:flex-initial text-center px-4 sm:px-6 py-2.5 sm:py-3 font-title text-sm sm:text-lg uppercase tracking-wider border-b-2 transition-colors cursor-pointer {activeTab === 'users' ? 'border-secondary text-secondary' : 'border-transparent text-gray-400 hover:text-white'}"
        >
            Initiés ({users.length})
        </button>
        <button 
            onclick={() => activeTab = 'clubs'}
            class="flex-1 sm:flex-initial text-center px-4 sm:px-6 py-2.5 sm:py-3 font-title text-sm sm:text-lg uppercase tracking-wider border-b-2 transition-colors cursor-pointer {activeTab === 'clubs' ? 'border-secondary text-secondary' : 'border-transparent text-gray-400 hover:text-white'}"
        >
            Bibliothèques ({clubs.length})
        </button>
    </div>

    <!-- Users Administration Tab -->
    {#if activeTab === 'users'}
        <div class="space-y-4">
            <h2 class="text-xl font-title text-white">Gestion des Comptes Utilisateurs</h2>
            
            {#if loadingUsers}
                <div class="flex justify-center py-12">
                    <div class="w-10 h-10 border-2 border-secondary border-t-transparent rounded-full animate-spin"></div>
                </div>
            {:else if userError}
                <p class="text-Chronos font-text">{userError}</p>
            {:else}
                <div class="border border-gray-800 rounded-lg overflow-x-auto bg-background/60">
                    <table class="w-full text-left border-collapse">
                        <thead>
                            <tr class="border-b border-gray-800 text-[10px] uppercase tracking-widest text-gray-500 font-text">
                                <th class="p-4">Utilisateur</th>
                                <th class="p-4">Email</th>
                                <th class="p-4">Rôle</th>
                                <th class="p-4">Statut</th>
                                <th class="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-800/40 text-sm font-text">
                            {#each users as user (user.id)}
                                <tr class="hover:bg-background/40 transition-colors">
                                    <td class="p-4 font-semibold text-white">{user.name || 'Anonyme'}</td>
                                    <td class="p-4 text-gray-400">{user.email}</td>
                                    <td class="p-4">
                                        <span class="text-xs uppercase tracking-wider font-semibold px-2 py-0.5 rounded {user.role === 'ADMIN' ? 'bg-secondary/15 text-secondary border border-secondary/20' : 'bg-gray-800 text-gray-400'}">
                                            {user.role}
                                        </span>
                                    </td>
                                    <td class="p-4">
                                        {#if user.isActive}
                                            <span class="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded bg-Guizamark/10 text-Guizamark border border-Guizamark/20">Actif</span>
                                        {:else}
                                            <span class="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded bg-Chronos/10 text-Chronos border border-Chronos/20">Désactivé</span>
                                        {/if}
                                    </td>
                                    <td class="p-4 text-right">
                                        {#if user.id !== session.user.id}
                                            <button 
                                                onclick={() => handleToggleUserStatus(user)}
                                                class="px-3 py-1 rounded text-xs uppercase tracking-wider transition-colors cursor-pointer border {user.isActive ? 'bg-Chronos/10 text-Chronos border-Chronos/20 hover:bg-Chronos hover:text-white' : 'bg-Guizamark/10 text-Guizamark border-Guizamark/20 hover:bg-Guizamark hover:text-black'}"
                                            >
                                                {user.isActive ? 'Désactiver' : 'Réactiver'}
                                            </button>
                                        {:else}
                                            <span class="text-xs text-gray-500 italic">Vous-même</span>
                                        {/if}
                                    </td>
                                </tr>
                            {/each}
                        </tbody>
                    </table>
                </div>
            {/if}
        </div>
    {/if}

    <!-- Clubs Administration Tab -->
    {#if activeTab === 'clubs'}
        <div class="space-y-4">
            <h2 class="text-xl font-title text-white">Régulation Globale des Bibliothèques</h2>

            {#if loadingClubs}
                <div class="flex justify-center py-12">
                    <div class="w-10 h-10 border-2 border-secondary border-t-transparent rounded-full animate-spin"></div>
                </div>
            {:else if clubError}
                <p class="text-Chronos font-text">{clubError}</p>
            {:else}
                <div class="border border-gray-800 rounded-lg overflow-x-auto bg-background/60">
                    <table class="w-full text-left border-collapse">
                        <thead>
                            <tr class="border-b border-gray-800 text-[10px] uppercase tracking-widest text-gray-500 font-text">
                                <th class="p-4">Bibliothèque</th>
                                <th class="p-4">Slug</th>
                                <th class="p-4">Statut</th>
                                <th class="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-800/40 text-sm font-text">
                            {#each clubs as club (club.id)}
                                <tr class="hover:bg-background/40 transition-colors">
                                    <td class="p-4 font-semibold text-white">{club.name}</td>
                                    <td class="p-4 text-gray-400 italic">/{club.slug}</td>
                                    <td class="p-4">
                                        {#if club.isActive}
                                            <span class="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded bg-Guizamark/10 text-Guizamark border border-Guizamark/20">Actif</span>
                                        {:else}
                                            <span class="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded bg-Chronos/10 text-Chronos border border-Chronos/20">Désactivé</span>
                                        {/if}
                                    </td>
                                    <td class="p-4 text-right space-x-2">
                                        <button 
                                            onclick={() => handleToggleClubStatus(club)}
                                            class="px-2.5 py-1 rounded text-xs uppercase tracking-wider transition-colors cursor-pointer border {club.isActive ? 'bg-Chronos/10 text-Chronos border-Chronos/20 hover:bg-Chronos hover:text-white' : 'bg-Guizamark/10 text-Guizamark border-Guizamark/20 hover:bg-Guizamark hover:text-black'}"
                                        >
                                            {club.isActive ? 'Désactiver' : 'Activer'}
                                        </button>
                                        <button 
                                            onclick={() => handleDeleteClub(club)}
                                            class="px-2.5 py-1 rounded text-xs uppercase tracking-wider bg-red-950/20 text-red-400 border border-red-900/35 hover:bg-red-650 hover:text-white transition-colors cursor-pointer"
                                        >
                                            Supprimer
                                        </button>
                                    </td>
                                </tr>
                            {/each}
                        </tbody>
                    </table>
                </div>
            {/if}
        </div>
    {/if}
</div>
