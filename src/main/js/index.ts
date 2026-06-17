import '../assets/scss/main.scss';

import { initAll } from 'govuk-frontend';

import { initAutocomplete } from './autocomplete';
import { initDocumentTypeSelection } from './document-type-selection';
import { initUploadedDocuments, initUploadValidation } from './upload-documents';

initAll();
initAutocomplete();
initDocumentTypeSelection();
initUploadedDocuments();
initUploadValidation();
