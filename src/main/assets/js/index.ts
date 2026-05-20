import '../scss/main.scss';

import { initAll } from 'govuk-frontend';

import { initAutocomplete } from './autocomplete';
import { initDocumentSelection } from './document-selection';

initAll();
initAutocomplete();
initDocumentSelection();
