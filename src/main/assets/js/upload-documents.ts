import { getLogger } from './logger';

const logger = getLogger('upload-documents');

const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024; // 100MB

export function initUploadValidation(): void {
  document.querySelectorAll<HTMLFormElement>('[data-upload-form]').forEach(form => {
    const input = form.querySelector<HTMLInputElement>('input[type="file"]');
    if (!input) {
      return;
    }

    // Validate on file selection
    input.addEventListener('change', () => {
      const file = input.files?.[0];
      if (file && file.size > MAX_FILE_SIZE_BYTES) {
        const fileSizeMB = Math.round(file.size / 1024 / 1024);
        logger.warn(`File too large: ${fileSizeMB}MB (max 100MB)`);
        alert(`Your file must be smaller than 100MB. The selected file is ${fileSizeMB}MB.`);
        // Clear the input so the oversized file is never sent
        input.value = '';
      }
    });

    // Validate on form submission as a fallback
    form.addEventListener('submit', (e: Event) => {
      const file = input.files?.[0];
      if (file && file.size > MAX_FILE_SIZE_BYTES) {
        e.preventDefault();
        const fileSizeMB = Math.round(file.size / 1024 / 1024);
        alert(`Your file must be smaller than 100MB. The selected file is ${fileSizeMB}MB.`);
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
