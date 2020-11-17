<script>
  import clsx from "clsx";

  export let suggestion;
  export let isHighlighted;
</script>

<div class={clsx('px-2 py-1 rounded', isHighlighted && 'bg-gray-700 text-gray-100')}>
  {@html suggestion.html($suggestion.label)}
</div>