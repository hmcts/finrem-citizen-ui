import '../assets/scss/main.scss';

import { initAll } from 'govuk-frontend';

import { initAutocomplete } from './autocomplete';
import { initCookieBanner } from './cookie';
import { initDocumentTypeSelection } from './document-type-selection';
import { initUploadedDocuments, initUploadValidation } from './upload-documents';

initAll();
initCookieBanner();
initAutocomplete();
initDocumentTypeSelection();
initUploadedDocuments();
initUploadValidation();
