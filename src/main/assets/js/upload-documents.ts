import { getLogger } from './logger';

const logger = getLogger('upload-documents');

const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024; // 100MB
const ERROR_MESSAGE = 'Your file must be smaller than 100MB';

function showErrorSummary(documentType: string, inputId: string): void {
  // Remove any existing error summary
  document.querySelector('[data-client-error-summary]')?.remove();
  
  // Create error summary box
  const errorSummary = document.createElement('div');
  errorSummary.className = 'govuk-error-summary';
  errorSummary.setAttribute('data-client-error-summary', 'true');
  errorSummary.setAttribute('role', 'alert');
  errorSummary.setAttribute('aria-labelledby', 'error-summary-title');
  errorSummary.setAttribute('tabindex', '-1');
  
  errorSummary.innerHTML = `
    <h2 class="govuk-error-summary__title" id="error-summary-title">
      There is a problem
    </h2>
    <div class="govuk-error-summary__body">
      <ul class="govuk-list govuk-error-summary__list">
        <li>
          <a href="#${inputId}">${ERROR_MESSAGE}</a>
        </li>
      </ul>
    </div>
  `;
  
  // Insert at the top of the main content area (before the h1)
  const mainHeading = document.querySelector('h1.govuk-heading-l');
  if (mainHeading) {
    mainHeading.before(errorSummary);
    errorSummary.focus();
  }
}

function clearErrorSummary(): void {
  document.querySelector('[data-client-error-summary]')?.remove();
}

function showClientError(form: HTMLFormElement, input: HTMLInputElement): void {
  const documentType = form.dataset.uploadForm;
  const inputId = input.id;
  
  // Remove any existing client-side error
  form.querySelector('[data-client-error]')?.remove();
  
  // Show error summary at top
  showErrorSummary(documentType || '', inputId);
  
  // Create GOV.UK-styled inline error message
  const errorEl = document.createElement('p');
  errorEl.className = 'govuk-error-message';
  errorEl.setAttribute('data-client-error', documentType || '');
  errorEl.innerHTML = `<span class="govuk-visually-hidden">Error:</span> ${ERROR_MESSAGE}`;
  
  // Insert error before the file input
  input.before(errorEl);
  
  // Add error styling to form group and input
  const formGroup = input.closest('.govuk-form-group');
  formGroup?.classList.add('govuk-form-group--error');
  input.classList.add('govuk-file-upload--error');
}

function clearClientError(form: HTMLFormElement, input: HTMLInputElement): void {
  form.querySelector('[data-client-error]')?.remove();
  clearErrorSummary();
  
  const formGroup = input.closest('.govuk-form-group');
  formGroup?.classList.remove('govuk-form-group--error');
  input.classList.remove('govuk-file-upload--error');
}

export function initUploadValidation(): void {
  document.querySelectorAll<HTMLFormElement>('[data-upload-form]').forEach(form => {
    const input = form.querySelector<HTMLInputElement>('input[type="file"]');
    if (!input) {
      return;
    }

    // Validate on file selection
    input.addEventListener('change', () => {
      const file = input.files?.[0];
      
      if (!file) {
        clearClientError(form, input);
        return;
      }
      
      if (file.size > MAX_FILE_SIZE_BYTES) {
        const fileSizeMB = Math.round(file.size / 1024 / 1024);
        logger.warn(`File too large: ${fileSizeMB}MB (max 100MB)`);
        showClientError(form, input);
        // Clear the input so the oversized file is never sent
        input.value = '';
      } else {
        clearClientError(form, input);
      }
    });

    // Validate on form submission as a fallback
    form.addEventListener('submit', (e: Event) => {
      const file = input.files?.[0];
      
      if (file && file.size > MAX_FILE_SIZE_BYTES) {
        e.preventDefault();
        const fileSizeMB = Math.round(file.size / 1024 / 1024);
        logger.warn(`File too large on submit: ${fileSizeMB}MB (max 100MB)`);
        showClientError(form, input);
        input.value = '';
      }
    });
  });
}

export function initUploadedDocuments(): void {
  document.querySelectorAll('[data-remove-file]').forEach(button => {
    button.addEventListener('click', async (e) => {
      e.preventDefault();
      
      const fileId = button.getAttribute('data-remove-file');
      const documentType = button.getAttribute('data-document-type');
      
      if (!fileId || !documentType) {
        return;
      }
      
      try {
        const response = await fetch(`/documents/remove/${fileId}`, {
          method: 'DELETE',
        });
        
        if (!response.ok) {
          throw new Error('Failed to remove file');
        }
        
        // Remove from UI
        button.closest('li')?.remove();
        
        // Show "No files uploaded yet" message if list is empty
        const container = document.querySelector(`[data-uploaded-files="${documentType}"]`);
        const filesList = container?.querySelector('ul');
        if (filesList && filesList.children.length === 0) {
          filesList.remove();
          if (container) {
            container.innerHTML = '<p class="govuk-body govuk-hint">No files uploaded yet.</p>';
          }
        }
      } catch (error) {
        logger.error('Error removing file:', error);
      }
    });
  });
}
