<script>
	import tippy from "sveltejs-tippy";
	import Suggestions from "./Suggestions.svelte";
	import autoComplete from "./autoComplete.js";
	import isHotkey from "is-hotkey";
	import { placeCaretAtEnd, setSelectionRange, setCaretToPos } from "./helpers";
	import { tick } from "svelte";

	let offsetWidth;
	let tippyInstance;
	let focus;
	let text = "";

	let tippyProps = {
	  onCreate,
	  onShow: handleTippyShow,
	  onHide: handleTippyHide,
	  maxWidth: "none",
	  offsetWidth,
	  content: getContent,
	  placement: "bottom",
	  trigger: "click",
	  allowHTML: true,
	  theme: "light",
	  arrow: false,
	  interactive: true
	};

	function handleTippyShow() {
	  if (!$autoComplete.filterText || !$autoComplete.isFocused) return false;
	  $autoComplete.list = true;
	  return true;
	}

	function handleTippyHide() {
	  if ($autoComplete.isFocused && !$autoComplete.hideList) return false;
	  $autoComplete.list = false;
	  return true;
	}

	function getContent(node) {
	  const el = document.createElement("div");
	  new Suggestions({
	    target: el,
	    props: {
	      offsetWidth: offsetWidth
	    }
	  });
	  return el;
	}

	function onCreate(instance) {
	  tippyInstance = instance;
	}

	function handleSuggestionsDisplay(text) {
	  if (!text) tippyInstance.hide();
	  else tippyInstance.show();
	}

	function handleInputFocus() {
	  $autoComplete.isFocused = true;
	  $autoComplete.list = true;
	  tippyInstance.show();
	}

	function handleInputBlur() {
	  $autoComplete.isFocused = false;
	  setTimeout(() => tippyInstance.hide(), 200);
	}

	function handleFocus(isFocused) {
	  const inputRef = $autoComplete.inputRef;
	  if (inputRef) {
	    if (isFocused) {
	      inputRef.focus();
	    } else {
	      inputRef.blur();
	    }
	  }
	}

	function handleList(listOpen) {
	  if (tippyInstance) {
	    if (listOpen) {
	      tippyInstance.show();
	    } else {
	      tippyInstance.hide();
	    }
	  }
	}

	function handleKeydown(event) {
	  if (!$autoComplete.list) return;

	  if (isHotkey("up", event)) {
	    event.preventDefault();
	    event.stopImmediatePropagation();
	    autoComplete.highlightPrev();
	  }

	  if (isHotkey("down", event)) {
	    event.preventDefault();
	    event.stopImmediatePropagation();
	    autoComplete.highlightNext();
	  }

	  if (isHotkey("enter", event)) {
	    event.preventDefault();
	    event.stopImmediatePropagation();

	    autoComplete.select();
	    autoComplete.blur();
	  }
	}

	function getSuggestionText(text) {
	  const result = autoComplete.getSuggestionText(text);
	  const inputRef = $autoComplete.inputRef;
	  if (!inputRef) return text;
	  const selectionStart = inputRef.selectionStart;

	  if (typeof result === "string") return text;
	  const hintString = `${result.text}${result.hint}`;

	  console.log(selectionStart, hintString);
	  setTimeout(() => {
	    setSelectionRange(inputRef, selectionStart, hintString.length);
	  }, 1000);
	  return hintString;
	}

	async function handleInput(event) {
	  $autoComplete.filterText = event.target.value;
	}

	$: handleFocus($autoComplete.isFocused);
	$: handleList($autoComplete.handleList);
	$: autoComplete.tippyInstance = tippyInstance;
	$: tippyInstance && handleSuggestionsDisplay($autoComplete.filterText);
</script>

<div 
	style="width:200px"
	bind:offsetWidth={$autoComplete.width}  
	class=" border bg-gray-100 w-64 h-10 my-16 mx-auto">

	<input
		class="border p-1 w-full h-full"
		bind:value={$autoComplete.filterText}
		use:tippy={tippyProps} 
		on:keydown={handleKeydown}
		on:blur={handleInputBlur} on:focus={handleInputFocus} 
		bind:this={$autoComplete.inputRef}
	/>
</div>

<svelte:window on:keydown={handleKeydown}/>
