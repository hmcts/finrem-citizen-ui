declare module 'accessible-autocomplete' {
  interface AccessibleAutocompleteOptions {
    element: HTMLElement;
    id: string;
    name?: string;
    source: (query: string, populateResults: (results: string[]) => void) => void;
    onConfirm?: (selected: string) => void;
    showNoOptionsFound?: boolean;
    showAllValues?: boolean;
    minLength?: number;
    defaultValue?: string;
    displayMenu?: 'inline' | 'overlay';
    placeholder?: string;
    confirmOnBlur?: boolean;
    autoselect?: boolean;
    required?: boolean;
    tNoResults?: () => string;
    tStatusQueryTooShort?: (minQueryLength: number) => string;
    tStatusNoResults?: () => string;
    tStatusSelectedOption?: (selectedOption: string, length: number, index: number) => string;
    tStatusResults?: (length: number, contentSelectedOption: string) => string;
    tAssistiveHint?: () => string;
  }

  function accessibleAutocomplete(options: AccessibleAutocompleteOptions): void;

  export default accessibleAutocomplete;
}
