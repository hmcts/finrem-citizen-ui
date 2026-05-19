import '../scss/main.scss';

import { initAll } from 'govuk-frontend';

import { initAutocomplete } from './autocomplete';
import { initUploadDocuments } from './upload-documents';

initAll();
initAutocomplete();
initUploadDocuments();
