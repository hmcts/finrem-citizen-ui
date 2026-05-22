import '../scss/main.scss';

import { initAll } from 'govuk-frontend';

import { initDocumentTypeSelection } from '../../DocumentType/document-type-selection';
import { initAutocomplete } from './autocomplete';

initAll();
initAutocomplete();
initDocumentTypeSelection();
