export function getCsrfToken(root: ParentNode = document): string | undefined {
  const tokenInput = root.querySelector<HTMLInputElement>('input[name="_csrf"]');
  const token = tokenInput?.value?.trim();
  return token || undefined;
}

export function getCsrfHeaders(root: ParentNode = document): Record<string, string> {
  const token = getCsrfToken(root);
  return token ? { 'x-csrf-token': token } : {};
}
