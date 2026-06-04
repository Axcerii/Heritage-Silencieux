<script lang="ts">
    import type { Snippet } from 'svelte';

    let { 
        dragon = 'Artrish', 
        border = 'Yinva', 
        text = '', 
        onClick = undefined,
        children,
        disabled = false,
        type = 'button',
        class: customClass = ''
    } = $props<{
        dragon?: string;
        border?: string;
        text?: string;
        onClick?: (e: MouseEvent) => void;
        children?: Snippet;
        disabled?: boolean;
        type?: 'button' | 'submit' | 'reset';
        class?: string;
    }>();

    // Helper to generate classes without specificity conflicts
    const buttonClass = $derived([
        'font-text relative flex cursor-pointer items-center justify-center rounded-[var(--radius)] border text-center transition-all duration-200 ease-in-out hover:opacity-80 disabled:opacity-50',
        customClass.includes('h-') ? '' : 'h-12',
        customClass.includes('w-') ? '' : 'w-full',
        customClass.includes('text-') ? '' : 'text-[20px]',
        customClass
    ].filter(Boolean).join(' '));
</script>

<button 
    {type}
    {disabled}
    style="{dragon !== 'none' ? `background-color: var(--color-${dragon});` : ''} {border !== 'none' ? `border-color: var(--color-${border});` : ''}" 
    onclick={onClick}
    class={buttonClass}
>
    {#if dragon && dragon !== 'none'}
        <img src="/dragons_logos/normal/{dragon}.svg" alt="" class="absolute right-[20%] top-0 h-full w-auto opacity-30 pointer-events-none" />
    {/if}
    {#if children}
        {@render children()}
    {:else}
        {text}
    {/if}
</button>