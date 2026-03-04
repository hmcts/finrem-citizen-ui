import accessibleAutocomplete from 'accessible-autocomplete';

interface AutocompleteResult {
  label: string;
  value: string;
}

function initAutocomplete(): void {
  const autocompleteElements = document.querySelectorAll('[data-autocomplete]');

  autocompleteElements.forEach(element => {
    const container = element.querySelector('[id$="-container"]') as HTMLElement;
    if (!container) {
      return;
    }

    const apiUrl = element.getAttribute('data-url') || '/autocomplete';
    const eventName = element.getAttribute('data-event') || 'autocomplete:selected';
    const inputId = element.getAttribute('data-input-id') || 'autocomplete';
    const inputName = element.getAttribute('data-input-name') || 'autocomplete';

    accessibleAutocomplete({
      element: container,
      id: inputId,
      name: inputName,
      source: async (query: string, populateResults: (results: string[]) => void) => {
        try {
          const response = await fetch(`${apiUrl}?q=${encodeURIComponent(query)}`);
          const results: AutocompleteResult[] = await response.json();
          populateResults(results.map(r => r.label));
        } catch {
          populateResults([]);
        }
      },
      onConfirm: (selectedLabel: string) => {
        if (selectedLabel) {
          const customEvent = new CustomEvent(eventName, {
            bubbles: true,
            detail: { label: selectedLabel },
          });
          element.dispatchEvent(customEvent);
        }
      },
      showNoOptionsFound: true,
      showAllValues: false,
      minLength: 1,
      defaultValue: '',
      displayMenu: 'overlay',
      placeholder: '',
      confirmOnBlur: true,
      autoselect: false,
    });
  });
}

export { initAutocomplete };
