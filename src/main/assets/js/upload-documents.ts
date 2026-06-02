import { getLogger } from './logger';

const logger = getLogger('upload-documents');

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
