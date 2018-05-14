// Number of search results to render immediately.
const SEARCH_RENDER_COUNT = 50;

class SearchComponent {
  constructor() {
    this.element = document.createElement('search-component');

    this.input = document.createElement('input');
    this.input.setAttribute('type', 'search');
    this.input.setAttribute('autocomplete', 'off');
    this.input.setAttribute('autocapitalize', 'off');
    this.input.setAttribute('spellcheck', 'false');
    this.input.setAttribute('placeholder', 'start typing to search...');

    this._contentElement = document.createElement('search-results');
    this.element.appendChild(this._contentElement);
    this._items = [];
    this._visible = false;

    this._defaultValue = '';

    this._gotoHomeItem = document.createElement('search-item-custom');
    this._gotoHomeItem.textContent = 'Navigate Home';

    this._showOtherItem = document.createElement('search-item-custom');

    this._selectedElement = null;

    this.input.addEventListener('keydown', event => {
      if (event.key === 'Escape' || event.keyCode === 27) {
        event.preventDefault();
        this.cancelSearch();
      } else if (event.key === 'ArrowDown') {
        this._selectNext(event);
      } else if (event.key === 'ArrowUp') {
        this._selectPrevious(event);
      } else if (event.key === 'Enter') {
        event.preventDefault();
        if (this._selectedElement);
          this._selectedElement.click();
      }
    }, false);
    this.input.addEventListener('input', () => {
      this.search(this.input.value);
    }, false);
    this.input.addEventListener('focus', () => {
      this._defaultValue = this.input.value;
    }, false);

    // Activate search on any keypress
    document.addEventListener('keypress', event => {
      if (this.input === document.activeElement)
        return;
      if (/\S/.test(event.key)) {
        this.input.focus();
        if (event.key !== '.')
          this.input.value = '';
      }
    }, false);
    // Activate search on backspace
    document.addEventListener('keydown', event => {
      if (this.input === document.activeElement)
        return;
      if (event.keyCode === 8 || event.keyCode === 46)
        this.input.focus();
    }, false);
    // Activate on paste
    document.addEventListener('paste', event => {
      if (this.input === document.activeElement)
        return;
      this.input.focus();
    }, false);

    document.addEventListener('click', event => {
      if (!this._visible)
        return;
      if (this.input.contains(event.target))
        return;
      let item = event.target;
      while (item && item.parentElement !== this._contentElement)
        item = item.parentElement;
      if (!item) {
        this.cancelSearch();
        return;
      }
      if (item === this._gotoHomeItem) {
        event.preventDefault();
        this.cancelSearch();
        app.navigateHome();
      } else if (item === this._showOtherItem) {
        // Render the rest.
        for (const result of this._remainingResults) {
          const element = this._renderResult(result);
          this._contentElement.appendChild(element);
        }
        this._selectElement(this._showOtherItem.nextSibling);
        this._showOtherItem.remove();
        this.input.focus();
        event.preventDefault();
      } else {
        event.preventDefault();
        this.cancelSearch();
        app.navigateURL(item[SearchComponent._symbol].url());
      }
    }, false);
  }

  setItems(items) {
    this._items = items;
  }

  setInputValue(value) {
    this.input.value = value;

    // Focus the input so that we can control its selection.
    this.input.focus();
    this.input.selectionStart = value.length;
    this.input.selectionEnd = value.length;
    this._defaultValue = value;
  }

  search(query) {
    this.setVisible(true);
    const results = []
    this._remainingResults = [];

    if (query) {
      const fuzzySearch = new FuzzySearch(query);
      for (const item of this._items) {
        let matches = [];
        let score = fuzzySearch.score(item.text(), matches);
        if (score !== 0) {
          results.push({item, score, matches});
        }
      }
      if (results.length === 0) {
        this._contentElement.innerHTML = `<search-item-custom>No Results</search-item-custom>`;
        return;
      }
      results.sort((a, b) => {
        const scoreDiff = b.score - a.score;
        if (scoreDiff)
          return scoreDiff;
        // Prefer left-most search results.
        const startDiff = a.matches[0] - b.matches[0];
        if (startDiff)
          return startDiff;
        return a.item.text().length - b.item.text().length;
      });
    } else {
      for (const item of this._items)
        results.push({item, score: 0, matches: []});
    }
    this._contentElement.innerHTML = '';
    if (!query)
      this._contentElement.appendChild(this._gotoHomeItem);

    for (let i = 0; i < Math.min(results.length, SEARCH_RENDER_COUNT); ++i) {
      const item = this._renderResult(results[i]);
      this._contentElement.appendChild(item);
    }

    this._remainingResults = results.slice(SEARCH_RENDER_COUNT);
    if (this._remainingResults.length > 0) {
      this._showOtherItem.textContent = `Show Remaining ${this._remainingResults.length} Results.`;
      this._contentElement.appendChild(this._showOtherItem);
    }
    this._selectElement(this._contentElement.firstChild);
  }

  cancelSearch() {
    this.input.blur();
    this.setVisible(false);
    this.input.value = this._defaultValue;
    app.focusContent();
  }

  _selectNext(event) {
    if (!this._selectedElement)
      return;
    event.preventDefault();
    let next = this._selectedElement.nextSibling;
    if (!next)
      next = this._contentElement.firstChild;
    this._selectElement(next);
  }

  _selectPrevious(event) {
    if (!this._selectedElement)
      return;
    event.preventDefault();
    let previous = this._selectedElement.previousSibling;
    if (!previous)
      previous = this._contentElement.lastChild;
    this._selectElement(previous);
  }

  _selectElement(item) {
    if (this._selectedElement)
      this._selectedElement.classList.remove('selected');
    this._selectedElement = item;
    if (this._selectedElement) {
      this._selectedElement.scrollIntoViewIfNeeded(false);
      this._selectedElement.classList.add('selected');
    }
  }

  _renderResult(result) {
    const item = document.createElement('search-item');

    const iconElement = result.item.iconElement();
    if (iconElement) {
      const itemIcon = document.createElement('search-item-icon');
      itemIcon.appendChild(result.item.iconElement());
      item.appendChild(itemIcon);
    }
    const itemTitle = document.createElement('search-item-title');
    itemTitle.appendChild(result.item.titleElement(result.matches));
    item[SearchComponent._symbol] = result.item;
    item.appendChild(itemTitle);

    const subtitleElement = result.item.subtitleElement();
    if (subtitleElement) {
      const itemSubtitle = document.createElement('search-item-subtitle');
      itemSubtitle.appendChild(result.item.subtitleElement());
      item.appendChild(itemSubtitle);
    } else {
      item.classList.add('no-subtitle');
    }
    return item;
  }

  setVisible(visible) {
    if (visible === this._visible)
      return;
    this._visible = visible;
    if (visible) {
      document.body.appendChild(this.element);
    } else {
      this.element.remove();
    }
  }
}

SearchComponent._symbol = Symbol('SearchComponent._symbol');

SearchComponent.Item = class {
  text() {}

  url() {}

  iconElement() { }

  titleElement(matches) {}

  subtitleElement() {}
}
