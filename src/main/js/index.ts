import '../assets/scss/main.scss';

import { initAll } from 'govuk-frontend';

import { initAutocomplete } from './autocomplete';
import { initDocumentTypeSelection } from './document-type-selection';
import { initGoogleAnalytics } from './google-analytics';
import { initUploadedDocuments, initUploadValidation } from './upload-documents';

initAll();
initGoogleAnalytics();
initAutocomplete();
initDocumentTypeSelection();
initUploadedDocuments();
initUploadValidation();
