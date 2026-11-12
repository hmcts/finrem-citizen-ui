/// <reference path="../types/accessible-autocomplete.d.ts" />

import accessibleAutocomplete from 'accessible-autocomplete';

import { PrivateRoutes } from '../constants';

interface AutocompleteResult {
  id: number;
  label: string;
  value: string;
}

interface AutocompleteConfig {
  apiUrl: string;
  eventName: string;
  inputId: string;
  inputName: string;
}

function getAutocompleteConfig(element: Element): AutocompleteConfig {
  return {
    apiUrl: element.getAttribute('data-url') || PrivateRoutes.autocomplete,
    eventName: element.getAttribute('data-event') || 'autocomplete:selected',
    inputId: element.getAttribute('data-input-id') || 'autocomplete',
    inputName: element.getAttribute('data-input-name') || 'autocomplete',
  };
}

async function fetchAutocompleteResults(apiUrl: string, query: string): Promise<AutocompleteResult[]> {
  const response = await fetch(`${apiUrl}?q=${encodeURIComponent(query)}`);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  return response.json();
}

function normalizeQuery(query: string): string {
  return query.trim().toLowerCase();
}

function createSourceFunction(
  apiUrl: string,
  resultsMap: Map<string, AutocompleteResult>,
  queryCache: Map<string, AutocompleteResult[]>
): (query: string, populateResults: (results: string[]) => void) => Promise<void> {
  return async (query: string, populateResults: (results: string[]) => void) => {
    const normalizedQuery = normalizeQuery(query);
    const shouldUseQueryCache = normalizedQuery === '';

    try {
      const cachedResults = shouldUseQueryCache
        ? queryCache.get(normalizedQuery)
        : undefined;

      const results = cachedResults || await fetchAutocompleteResults(apiUrl, query);

      if (shouldUseQueryCache && !cachedResults) {
        queryCache.set(normalizedQuery, results);
      }

      resultsMap.clear();
      results.forEach(result => {
        resultsMap.set(result.label, result);
      });

      populateResults(results.map(r => r.label));
    } catch {
      populateResults([]);
    }
  };
}

function createConfirmHandler(
  element: Element,
  eventName: string,
  resultsMap: Map<string, AutocompleteResult>
): (selectedLabel: string) => void {
  return (selectedLabel: string) => {
    if (selectedLabel) {
      const selectedResult = resultsMap.get(selectedLabel);
      const customEvent = new CustomEvent(eventName, {
        bubbles: true,
        detail: selectedResult || { label: selectedLabel },
      });
      element.dispatchEvent(customEvent);
    }
  };
}

function preserveInputDescriptions(input: HTMLInputElement, descriptionIds: string): void {
  const updateDescription = () => {
    const current = input.getAttribute('aria-describedby');
    const ids = new Set(`${descriptionIds} ${current ?? ''}`.trim().split(/\s+/));
    const description = [...ids].join(' ');

    if (description !== current) {
      input.setAttribute('aria-describedby', description);
    }
  };

  updateDescription();

  const observer = new MutationObserver(updateDescription);
  observer.observe(input, { attributes: true, attributeFilter: ['aria-describedby'] });
}

function initAutocomplete(): void {
  const autocompleteElements = document.querySelectorAll('[data-autocomplete]');

  autocompleteElements.forEach(element => {
    const container = element.querySelector('[id$="-container"]') as HTMLElement;
    if (!container) {
      return;
    }

    const config = getAutocompleteConfig(element);
    const resultsMap = new Map<string, AutocompleteResult>();
    const queryCache = new Map<string, AutocompleteResult[]>();

    document.addEventListener('document-types:changed', () => {
      queryCache.clear();
    });

    accessibleAutocomplete({
      element: container,
      id: config.inputId,
      name: config.inputName,
      source: createSourceFunction(config.apiUrl, resultsMap, queryCache),
      onConfirm: createConfirmHandler(element, config.eventName, resultsMap),
      showNoOptionsFound: true,
      showAllValues: true,
      minLength: 0,
    });

    const input = container.querySelector(`#${config.inputId}`) as HTMLInputElement;
    const menu = container.querySelector(`#${config.inputId}__listbox`) as HTMLElement;

    if (input) {
      const descriptionIds = element.getAttribute('data-describedby');
      if (descriptionIds) {
        preserveInputDescriptions(input, descriptionIds);
      }

      input.addEventListener('focus', () => {
        if (menu && menu.style.display === 'none') {
          menu.style.display = '';
        }
      });

      input.addEventListener('autocomplete:close', () => {
        if (menu) {
          menu.style.display = 'none';
        }
      });
    }
  });
}

export { initAutocomplete };
