<script lang="ts">
    let { dragon = 'Artrish', border = 'Yinva', text, onClick = defaultClick } = $props();

    function defaultClick() {
    }
</script>

<button 
    style="background-color: var(--color-{dragon}); border-color: var(--color-{border});" 
    onclick={onClick}
    class="font-text relative flex h-12 w-full cursor-pointer items-center justify-center rounded-[var(--radius)] border text-[20px] text-center transition-all duration-200 ease-in-out hover:opacity-80"
>
    <img src="/dragons_logos/normal/{dragon}.svg" alt="" class="absolute right-[20%] top-0 h-full w-auto opacity-30" />
    {text}
</button>