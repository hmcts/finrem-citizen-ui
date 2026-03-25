import { envTestData } from './EnvTestDataConfig';

/**
 * Replace environment variable placeholders in JSON data
 * Placeholders follow the pattern: ${ENV_VAR_NAME}
 * Falls back to envTestData values if env var not set
 */
export function updateJsonFileWithEnvValues(jsonString: string): unknown {
  // Replace placeholders with environment values
  const updatedString = jsonString.replace(
    /\$\{([^}]+)\}/g,
    (match, envVar) => {
      // Check process.env first, then fall back to envTestData
      const value = process.env[envVar] ?? (envTestData as Record<string, string>)[envVar];
      if (value === undefined) {
        // eslint-disable-next-line no-console
        console.warn(`Environment variable ${envVar} is not defined, using empty string`);
        return '';
      }
      return value;
    }
  );

  try {
    return JSON.parse(updatedString) as unknown;
  } catch {
    // If it's not valid JSON, return as string (for non-JSON templates)
    return updatedString;
  }
}
