/// <reference path="../types/accessible-autocomplete.d.ts" />

import accessibleAutocomplete from 'accessible-autocomplete';

import { PublicRoutes } from '../common-constants';

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
    apiUrl: element.getAttribute('data-url') || PublicRoutes.autocomplete,
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

function createSourceFunction(
  apiUrl: string,
  resultsMap: Map<string, AutocompleteResult>
): (query: string, populateResults: (results: string[]) => void) => Promise<void> {
  return async (query: string, populateResults: (results: string[]) => void) => {
    try {
      const results = await fetchAutocompleteResults(apiUrl, query);
      
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

function initAutocomplete(): void {
  const autocompleteElements = document.querySelectorAll('[data-autocomplete]');

  autocompleteElements.forEach(element => {
    const container = element.querySelector('[id$="-container"]') as HTMLElement;
    if (!container) {
      return;
    }

    const config = getAutocompleteConfig(element);
    const resultsMap = new Map<string, AutocompleteResult>();

    accessibleAutocomplete({
      element: container,
      id: config.inputId,
      name: config.inputName,
      source: createSourceFunction(config.apiUrl, resultsMap),
      onConfirm: createConfirmHandler(element, config.eventName, resultsMap),
      showNoOptionsFound: true,
      showAllValues: true,
      minLength: 0,
    });
  });
}

export { initAutocomplete };
