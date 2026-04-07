import accessibleAutocomplete from 'accessible-autocomplete';

interface AutocompleteResult {
  id: number;
  label: string;
  value: string;
}

function initAutocomplete(): void {
  const autocompleteElements = document.querySelectorAll('[data-autocomplete]');

  autocompleteElements.forEach(element => {
    const container = element.querySelector('[id$="-container"]') as HTMLElement;
    if (!container) {
      console.error('Autocomplete: Container element not found for', element);
      return;
    }

    const apiUrl = element.getAttribute('data-url') || '/autocomplete';
    const eventName = element.getAttribute('data-event') || 'autocomplete:selected';
    const inputId = element.getAttribute('data-input-id') || 'autocomplete';
    const inputName = element.getAttribute('data-input-name') || 'autocomplete';

    let resultsMap = new Map<string, AutocompleteResult>();

    accessibleAutocomplete({
      element: container,
      id: inputId,
      name: inputName,
      source: async (query: string, populateResults: (results: string[]) => void) => {
        try {
          const response = await fetch(`${apiUrl}?q=${encodeURIComponent(query)}`);
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          const results: AutocompleteResult[] = await response.json();
          
          resultsMap.clear();
          results.forEach(result => {
            resultsMap.set(result.label, result);
          });
          
          populateResults(results.map(r => r.label));
        } catch (error) {
          console.error('Autocomplete: Failed to fetch results', error);
          populateResults([]);
        }
      },
      onConfirm: (selectedLabel: string) => {
        if (selectedLabel) {
          const selectedResult = resultsMap.get(selectedLabel);
          const customEvent = new CustomEvent(eventName, {
            bubbles: true,
            detail: selectedResult || { label: selectedLabel },
          });
          element.dispatchEvent(customEvent);
        }
      },
      showNoOptionsFound: true,
      minLength: 1,
    });
  });
}

export { initAutocomplete };
