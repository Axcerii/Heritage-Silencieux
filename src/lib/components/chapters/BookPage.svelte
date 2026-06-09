<script lang="ts">
    let { 
        content, 
        pageNumber, 
        headerText, 
        isLeft, 
        direction,
        fontSize,
        turnPage,
        isDesktop = true,
        inDuration = 300,
        inDelay = 300,
        outDuration = 300,
        outDelay = 0
    } = $props<{
        content: string;
        pageNumber: number | string;
        headerText: string;
        isLeft: boolean;
        direction: number;
        fontSize: number;
        turnPage: any;
        isDesktop?: boolean;
        inDuration?: number;
        inDelay?: number;
        outDuration?: number;
        outDelay?: number;
    }>();

</script>

<div 
    in:turnPage={{ direction, isLeft, incoming: true, duration: inDuration, delay: inDelay }} 
    out:turnPage={{ direction, isLeft, incoming: false, duration: outDuration, delay: outDelay }}
    class="absolute inset-0 flex flex-col justify-between p-6 sm:p-8 select-text bg-[#faf4eb] {isLeft ? 'border-r border-black/5 rounded-l-lg' : 'border-l border-black/5 rounded-r-lg'} {!isDesktop ? 'rounded-lg' : ''} min-h-0"
>
    <!-- Page corner decorations -->
    <div class="absolute top-2 left-2 w-3 h-3 border-t border-l border-black/10 pointer-events-none"></div>
    <div class="absolute top-2 right-2 w-3 h-3 border-t border-r border-black/10 pointer-events-none"></div>
    <div class="absolute bottom-2 left-2 w-3 h-3 border-b border-l border-black/10 pointer-events-none"></div>
    <div class="absolute bottom-2 right-2 w-3 h-3 border-b border-r border-black/10 pointer-events-none"></div>

    <!-- Header (e.g. Chapitre X or Chapter Title) -->
    <div class="text-center text-[10px] uppercase tracking-widest text-[#524332] font-semibold font-title mb-4 border-b border-[#ebdcb9] pb-1 select-none shrink-0">
        {headerText}
    </div>

    <!-- Page Body -->
    <div 
        style="font-size: {fontSize}px; max-height: {isDesktop ? '480px' : '420px'};" 
        class="prose prose-stone text-justify leading-relaxed break-words text-sm sm:text-base md:text-lg flex-1 min-h-0 select-text max-w-none prose-p:my-2 prose-p:text-[#2c251e] prose-strong:text-[#2c251e] prose-em:text-[#2c251e] prose-li:text-[#2c251e] prose-headings:text-[#524332] prose-headings:font-title prose-headings:my-2 prose-img:rounded-[var(--radius)] prose-img:border prose-img:border-secondary/20 prose-img:my-3 prose-img:mx-auto prose-img:max-h-[340px] md:prose-img:max-h-[400px] prose-img:object-contain"
    >
        {@html content || ''}
    </div>

    <!-- Footer Page Number -->
    <div class="text-center font-title text-xs tracking-wider text-[#524332]/85 pt-4 mt-auto select-none shrink-0">
        {pageNumber}
    </div>
</div>
