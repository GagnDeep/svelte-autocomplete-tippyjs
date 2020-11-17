import { Writable } from "svelte-advanced-store";
import exampleData from "./exampleData";
import Fuse from "fuse.js";
import { first, isArray, isFunction, noop, times } from "lodash";
import tinyEmitter from "tiny-emitter";

class Suggestion extends Writable {
  constructor(options = {}, parent, _parentThis) {
    options = {
      value: "",
      label: "",
      children: [],
      component: null,
      parent: parent,
      labelParser: null,
      ...options
    };
    super(options);
    this._parentThis = _parentThis;
  }
  hasChildren() {
    return this.children && this.children.length;
  }
  html() {
    if (!this.label) return "";

    let filterText = "";

    if (this._parentThis) {
      filterText = this._parentThis.filterText;
    }

    if (this.parseLabel) {
      return this.parseLabel(this, filterText);
    } else {
      return this.highlightText(this.label, filterText);
    }
  }

  highlightText(string = "", highlightText = "") {
    return string
      .toLowerCase()
      .replace(
        highlightText,
        `<span class="bg-yellow-400 text-gray-800">${highlightText}</span>`
      );
  }
}

const contextTypes = {
  autocomplete: "autocomplete",
  question: "question",
  notification: "notification"
};

class Context extends Writable {
  constructor(items = [], options = {}, _parentThis) {
    options = {
      value: "",
      type: contextTypes.autocomplete,
      trigger: noop,
      ...options
    };
    super(options);

    this.searchOptions = {
      keys: ["value", "label"]
    };

    if (isFunction(items)) {
      this._queryFunction = items;
    } else {
      this._items = this.filterItems(items);
    }
    this._parentThis = _parentThis;
  }

  get items() {
    if (isFunction(this._queryFunction)) {
      const items = this._queryFunction(this.filterText, this);

      if (isArray(items)) {
        return this.filterItems(items) || [];
      }
      return [];
    } else {
      return this._items;
    }
  }

  set items(value) {
    this._queryFunction = null;
    if (isFunction(value)) {
      this._queryFuntion = value;
    } else {
      this._items = this.filterItems(value);
    }
  }

  get filterText() {
    if (this._parentThis) {
      return this._parentThis.filterText;
    }
    return "";
  }

  findItem(value) {
    return this.items.find((item) => item.value === value);
  }

  activate() {
    if (this._parentThis) {
      this._parentThis.activateContext(this.value);
    }
  }

  deactivate() {
    if (this._parentThis) {
      this._parentThis.deactivateContext(this.value);
    }
  }

  filterItems(items = [], parent) {
    return items
      .map((item) => {
        if (item) {
          const suggestion = new Suggestion(item, parent, this);
          if (suggestion.hasChildren()) {
            suggestion.children = this.filterItems(
              suggestion.children,
              suggestion
            );
          }

          return suggestion;
        }
        return null;
      })
      .filter((item) => item && item.value);
  }
}

class AutoComplete extends Writable {
  constructor(options = {}, searchOptions = {}) {
    const { items, ..._options } = options;

    options = {
      context: "autocomplete",
      containerRef: null,
      inputRef: null,
      filterText: "",
      itemComponent: null,
      contexts: [],
      active: null,
      isFocused: false,
      list: false,
      highlightedIndex: -1,
      width: 0,
      filter: null,
      searchFunction: null,
      selectedItem: null,
      tippyInstance: null,
      ..._options
    };
    super(options);

    this.defaultContext = new Context(
      [],
      {
        value: "default"
      },
      this
    );
    this.active = this.defaultContext;

    this.searchOptions = {
      keys: ["value", "label"],
      ...searchOptions
    };

    const emitter = new tinyEmitter();

    this.on = emitter.on;
    this.emit = emitter.emit;
  }

  resetHighlightedIndex() {
    this.highlightedIndex = -1;
  }

  getSuggestionText(text) {
    const suggestions = this.suggestions;
    const suggestion = first(
      suggestions.filter((item) => item.label.startsWith(text))
    );

    if (!suggestion) return text;

    const hint = suggestion.label.replace(text, "");

    let startIndex = suggestion.label.search(hint);

    if (startIndex === 0) return text;
    else if (startIndex < text.length - 1) startIndex = text.length - 1;
    return {
      hint,
      startIndex,
      text
    };
  }

  get suggestions() {
    const suggestions = this.getSuggestions();
    return suggestions || [];
  }

  get highlightedItem() {
    return this.active.items[this.highlightedIndex];
  }

  select() {
    this.selectedItem = this.highlightedItem;
    console.log(this.active.current);
    this.active.trigger(this.highlightedItem);

    this.emit("select", { context: this.active, item: this.highlightedItem });
    return this.selectedItem;
  }

  highlightNext() {
    const items = this.suggestions;
    const currentIndex = this.highlightedIndex;

    if (currentIndex < items.length - 1) {
      this.highlightedIndex = currentIndex + 1;
    }
    return this.highlightedItem;
  }

  highlightPrev() {
    const currentIndex = this.highlightedIndex;

    if (currentIndex > -1) {
      this.highlightedIndex = currentIndex - 1;
    }
    return this.highlightedItem;
  }

  addContext(value, { items, type, trigger } = {}) {
    const context = new Context(items, { value, type, trigger }, this);

    this.contexts = [...this.contexts, context];
    return context;
  }

  findContext(value) {
    return this.contexts.find((context) => context.value === value);
  }

  activateContext(value) {
    let context = this.findContext(value);

    if (!context) {
      context = this.defaultContext;
    }
    this.active = context;
    return context;
  }

  deactivateContext() {
    this.active = this.defaultContext;
  }

  getSuggestions(options = {}) {
    options = {
      ...this.searchOptions,
      ...options
    };

    if (this.searchFunction) {
      return this.searchFunction(this.active.items, this.filterText) || [];
    }
    const fuse = new Fuse(this.active.items || [], options);

    const result = fuse.search(this.filterText || "") || [];

    return result.map(({ item }) => item);
  }

  focus() {
    this.isFocused = true;
    this.list = true;
  }

  blur() {
    this.isFocused = false;
    this.list = false;
  }
}

const autoComplete = new AutoComplete();

const context = autoComplete.addContext("v1", {
  items: exampleData,
  trigger: () => exampleData
});
context.activate();

autoComplete.on("select", (e) => console.log(e));

autoComplete.select();
export default autoComplete;
