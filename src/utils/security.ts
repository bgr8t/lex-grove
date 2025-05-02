/**
 * Security utilities for handling sensitive data and environment variables
 */

/**
 * Masks sensitive data for logging
 * @param value The sensitive value to mask
 * @param showLength Whether to show the length of the masked value
 * @returns A masked version of the value
 */
export const maskSensitiveData = (value: string | undefined | null, showLength = false): string => {
  if (!value) return 'not-configured';
  const length = value.length;
  const prefix = value.substring(0, 4);
  const suffix = value.substring(length - 4);
  return `${prefix}...${suffix}${showLength ? ` (${length} chars)` : ''}`;
};

/**
 * Requires an environment variable to be set
 * @param name The name of the environment variable
 * @param defaultValue Optional default value for development mode
 * @returns The value of the environment variable
 * @throws Error if the environment variable is not set in production
 */
export const requireEnvVar = (name: string, defaultValue?: string): string => {
  const value = process.env[name] || import.meta.env[name];
  
  if (!value) {
    if (import.meta.env.MODE === 'development' && defaultValue) {
      console.warn(`Using default value for ${name} in development mode`);
      return defaultValue;
    }
    throw new Error(`Required environment variable ${name} is not set`);
  }
  
  return value;
};

/**
 * Logs environment variable status securely
 * @param vars Array of environment variable names to check
 * @returns Object containing the status of each variable
 */
export const checkEnvVars = (vars: string[]): Record<string, string> => {
  const status: Record<string, string> = {};
  vars.forEach(name => {
    const value = process.env[name] || import.meta.env[name];
    status[name] = value ? 'configured' : 'not-configured';
  });
  return status;
};

/**
 * Logs sensitive data securely
 * @param data The data to log
 * @param sensitiveKeys Keys of sensitive data to mask
 */
export const secureLog = (data: Record<string, any>, sensitiveKeys: string[] = []): void => {
  const maskedData = { ...data };
  sensitiveKeys.forEach(key => {
    if (key in maskedData) {
      maskedData[key] = maskSensitiveData(maskedData[key]);
    }
  });
  console.log('Secure Log:', maskedData);
}; 