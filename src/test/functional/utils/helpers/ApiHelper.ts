import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';

/**
 * Wrapper around axios for consistent API requests with error handling
 */
export async function axiosRequest<T = unknown>(config: AxiosRequestConfig): Promise<AxiosResponse<T>> {
  try {
    const response = await axios(config);
    return response;
  } catch (error: unknown) {
    const axiosError = error as AxiosError;
    if (axiosError.response) {
      // Server responded with error status
      const { status, data } = axiosError.response;
      const errorMessage = typeof data === 'string' 
        ? data 
        : JSON.stringify(data, null, 2);
      
      throw new Error(
        `API request failed with status ${status}:\n` +
        `URL: ${config.method?.toUpperCase()} ${config.url}\n` +
        `Response: ${errorMessage}`
      );
    } else if (axiosError.request) {
      // Request made but no response received
      throw new Error(
        `No response received from ${config.url}:\n` +
        `Error: ${axiosError.message}`
      );
    } else {
      // Error in request setup
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Request setup failed: ${message}`);
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
