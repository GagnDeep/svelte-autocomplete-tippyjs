<script>
  import autoComplete from "./autoComplete.js";
  import SuggestionItem from "./SuggestionItem.svelte";

  let items = [];

  $: items = autoComplete.suggestions || $autoComplete;
</script>
<div 
  class="overflow-y-auto overflow-x-hidden" 
  style="max-height: 500px; width: {$autoComplete.width ? $autoComplete.width - 15 : '200'}px">
   <div class="">
    {#each items as item, i}
      <SuggestionItem suggestion={item} isHighlighted={i === $autoComplete.highlightedIndex} />
    {/each}
   </div>
</div>
