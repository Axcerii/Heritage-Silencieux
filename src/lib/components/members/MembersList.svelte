<script lang="ts">
    import { onMount } from 'svelte';
    import { getClubMembers, addClubMember, updateClubMemberRole, removeClubMember, type ClubMember } from '../../api';
    import type { AuthSession } from '../../auth-client';

    let { clubSlug, userRole, session } = $props<{
        clubSlug: string;
        userRole: 'OWNER' | 'EDITOR' | 'READER' | null;
        session: AuthSession;
    }>();

    let members = $state<ClubMember[]>([]);
    let loading = $state(true);
    let error = $state<string | null>(null);

    // Invite state
    let inviteEmail = $state('');
    let inviting = $state(false);
    let inviteError = $state<string | null>(null);
    let inviteSuccess = $state(false);

    // Permissions
    const canManageMembers = $derived(
        session.user.role === 'ADMIN' || userRole === 'OWNER'
    );

    async function loadMembers() {
        loading = true;
        error = null;
        try {
            members = await getClubMembers(clubSlug);
        } catch (e: any) {
            error = e.message || 'Impossible de charger la liste des membres.';
        } finally {
            loading = false;
        }
    }

    async function handleInviteMember(e: Event) {
        e.preventDefault();
        if (!inviteEmail.trim()) return;

        inviting = true;
        inviteError = null;
        inviteSuccess = false;
        try {
            await addClubMember(clubSlug, inviteEmail);
            inviteSuccess = true;
            inviteEmail = '';
            // Reload member list
            await loadMembers();
        } catch (e: any) {
            inviteError = e.message || 'Erreur lors de l\'ajout du membre.';
        } finally {
            inviting = false;
        }
    }

    async function handleRoleChange(userId: string, newRole: 'OWNER' | 'EDITOR' | 'READER') {
        try {
            await updateClubMemberRole(clubSlug, userId, newRole);
            const index = members.findIndex(m => m.userId === userId);
            if (index !== -1) {
                members[index].role = newRole;
            }
        } catch (e: any) {
            alert('Erreur lors du changement de rôle: ' + e.message);
            // Revert by reloading
            loadMembers();
        }
    }

    async function handleRemoveMember(userId: string) {
        if (!confirm('Êtes-vous sûr de vouloir retirer ce membre de l\'alliance ?')) return;

        try {
            await removeClubMember(clubSlug, userId);
            members = members.filter(m => m.userId !== userId);
        } catch (e: any) {
            alert('Erreur lors du retrait du membre: ' + e.message);
        }
    }

    onMount(() => {
        loadMembers();
    });
</script>

<div class="space-y-6">
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-800 pb-4 gap-4">
        <div>
            <h2 class="text-2xl font-title text-secondary tracking-wider">Membres de l'Alliance</h2>
            <p class="text-sm text-gray-400 font-text">Gérez les initiés ayant accès à ce cercle de lecture.</p>
        </div>
    </div>

    <!-- Invite Section (only for OWNER or ADMIN) -->
    {#if canManageMembers}
        <form onsubmit={handleInviteMember} class="bg-background/40 border border-gray-800 p-5 rounded-lg space-y-4 max-w-xl">
            <h3 class="text-sm font-title text-white uppercase tracking-wider">Recruter un Initié</h3>
            
            <div class="flex flex-col sm:flex-row gap-3">
                <input 
                    type="email" 
                    placeholder="Adresse email de l'initié..." 
                    bind:value={inviteEmail}
                    required
                    class="bg-primary text-black border border-foreground/30 focus:border-secondary h-10 px-3 text-sm flex-1"
                />
                <button 
                    type="submit" 
                    disabled={inviting}
                    class="h-10 px-5 rounded-[var(--radius)] font-title text-xs uppercase tracking-wider text-black bg-secondary hover:bg-secondary/90 transition-colors disabled:opacity-50 cursor-pointer shrink-0"
                >
                    {inviting ? 'Recrutement...' : 'Ajouter au cercle'}
                </button>
            </div>

            {#if inviteError}
                <p class="text-xs text-Chronos font-text">{inviteError}</p>
            {/if}
            {#if inviteSuccess}
                <p class="text-xs text-Guizamark font-text">L'initié a été ajouté avec succès au cercle !</p>
            {/if}
        </form>
    {/if}

    {#if loading}
        <div class="flex flex-col items-center justify-center py-12">
            <div class="w-10 h-10 rounded-full border-2 border-secondary border-t-transparent animate-spin mb-3"></div>
            <p class="text-secondary font-title text-lg">Appel de l'assemblée...</p>
        </div>
    {:else if error}
        <p class="text-center py-8 text-Chronos font-text">{error}</p>
    {:else}
        <!-- Members List -->
        <div class="border border-gray-800 rounded-lg overflow-hidden bg-background/60">
            <table class="w-full text-left border-collapse">
                <thead>
                    <tr class="border-b border-gray-800 text-[10px] uppercase tracking-widest text-gray-500 font-text">
                        <th class="p-4">Initié</th>
                        <th class="p-4">Email</th>
                        <th class="p-4">Rôle</th>
                        {#if canManageMembers}
                            <th class="p-4 text-right">Actions</th>
                        {/if}
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-800/40 text-sm font-text">
                    {#each members as member (member.userId)}
                        <tr class="hover:bg-background/40 transition-colors">
                            <td class="p-4 flex items-center space-x-3">
                                {#if member.user.image}
                                    <img src={member.user.image} alt="" class="w-8 h-8 rounded-full object-cover" />
                                {:else}
                                    <div class="w-8 h-8 rounded-full bg-primary text-black flex items-center justify-center font-bold text-sm">
                                        {member.user.name?.charAt(0) || 'U'}
                                    </div>
                                {/if}
                                <span class="text-white font-semibold">{member.user.name || 'Utilisateur'}</span>
                            </td>
                            <td class="p-4 text-gray-400 font-text">{member.user.email}</td>
                            <td class="p-4">
                                {#if canManageMembers && member.userId !== session.user.id}
                                    <select 
                                        value={member.role}
                                        onchange={(e) => handleRoleChange(member.userId, (e.target as HTMLSelectElement).value as any)}
                                        class="bg-primary text-black border border-foreground/30 rounded px-2 py-1 text-xs font-semibold cursor-pointer"
                                    >
                                        <option value="READER">LECTEUR</option>
                                        <option value="EDITOR">ÉDITEUR</option>
                                        <option value="OWNER">PROPRIÉTAIRE</option>
                                    </select>
                                {:else}
                                    <span class="text-xs uppercase tracking-wider font-semibold px-2.5 py-1 rounded bg-secondary/10 text-secondary border border-secondary/20">
                                        {member.role === 'OWNER' ? 'Propriétaire' : member.role === 'EDITOR' ? 'Éditeur' : 'Lecteur'}
                                    </span>
                                {/if}
                            </td>
                            {#if canManageMembers}
                                <td class="p-4 text-right">
                                    {#if member.userId !== session.user.id}
                                        <button 
                                            onclick={() => handleRemoveMember(member.userId)}
                                            class="px-2.5 py-1 rounded bg-Chronos/10 hover:bg-Chronos text-Chronos hover:text-white border border-Chronos/20 text-xs transition-colors cursor-pointer"
                                        >
                                            Retirer
                                        </button>
                                    {/if}
                                </td>
                            {/if}
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>
    {/if}
</div>
