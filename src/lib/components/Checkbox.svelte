<script lang="ts">
    let {
        svg = "dragons_logos/normal/Artrish.svg",
        checked = false,
        id = "",
        type = "radio",
        name = "",
    } = $props();
</script>

<label class="group relative flex w-[100px] h-[100px] max-[600px]:w-[67px] max-[600px]:h-[67px] box-border p-0.5 cursor-pointer border border-[var(--color-accent)] rounded-[var(--radius)]">
    <input {type} {id} {checked} {name} class="peer hidden" />
    <img 
        src={svg} 
        alt="" 
        class="w-full h-full object-cover transition-all duration-200 ease-in-out [filter:invert(90%)_sepia(13%)_saturate(311%)_hue-rotate(52deg)_brightness(101%)_contrast(81%)] peer-checked:[filter:invert(78%)_sepia(52%)_saturate(214%)_hue-rotate(293deg)_brightness(95%)_contrast(88%)] group-hover:[filter:invert(78%)_sepia(52%)_saturate(214%)_hue-rotate(293deg)_brightness(95%)_contrast(88%)]" 
    />
</label>
