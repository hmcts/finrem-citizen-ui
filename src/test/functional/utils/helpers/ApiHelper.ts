import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';

const SENSITIVE_KEY_PATTERN = /(secret|password|token|authorization|oneTimePassword|client_secret|access_token|refresh_token)/i;
const BEARER_PATTERN = /Bearer\s+[A-Za-z0-9\-._~+/]+=*/gi;

function sanitizeString(value: string): string {
  return value.replace(BEARER_PATTERN, 'Bearer [REDACTED]');
}

function sanitizeObject(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sanitizeObject);
  }

  if (value && typeof value === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      sanitized[key] = SENSITIVE_KEY_PATTERN.test(key)
        ? '[REDACTED]'
        : sanitizeObject(nested);
    }
    return sanitized;
  }

  if (typeof value === 'string') {
    return sanitizeString(value);
  }

  return value;
}

function formatSanitizedErrorPayload(data: unknown): string {
  if (typeof data === 'string') {
    return sanitizeString(data);
  }

  return JSON.stringify(sanitizeObject(data), null, 2);
}

const TRANSIENT_STATUS_CODES = new Set([502, 503, 504]);
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

/**
 * Wrapper around axios for consistent API requests with error handling.
 * Automatically retries on transient 5xx errors (502, 503, 504).
 */
export async function axiosRequest<T = unknown>(config: AxiosRequestConfig, attempt = 1): Promise<AxiosResponse<T>> {
  try {
    const response = await axios(config);
    return response;
  } catch (error: unknown) {
    const axiosError = error as AxiosError;
    if (axiosError.response) {
      const { status, data } = axiosError.response;

      // Retry on transient infrastructure errors
      if (TRANSIENT_STATUS_CODES.has(status) && attempt < MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS * attempt));
        return axiosRequest<T>(config, attempt + 1);
      }

      const errorMessage = formatSanitizedErrorPayload(data);
      throw new Error(
        `API request failed with status ${status}:\n` +
        `URL: ${config.method?.toUpperCase()} ${config.url}\n` +
        `Response: ${errorMessage}`
      );
    } else if (axiosError.request) {
      // Request made but no response received
      throw new Error(
        `No response received from ${config.url}:\n` +
        `Error: ${sanitizeString(axiosError.message)}`
      );
    } else {
      // Error in request setup
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Request setup failed: ${sanitizeString(message)}`);
    }
  }
}

/**
 * Convenience method for GET requests
 */
export async function apiGet<T = unknown>(
  url: string, 
  headers?: Record<string, string>
): Promise<AxiosResponse<T>> {
  return axiosRequest<T>({
    method: 'get',
    url,
    headers,
  });
}

/**
 * Convenience method for POST requests
 */
export async function apiPost<T = unknown>(
  url: string,
  data?: unknown,
  headers?: Record<string, string>
): Promise<AxiosResponse<T>> {
  return axiosRequest<T>({
    method: 'post',
    url,
    data,
    headers,
  });
}
