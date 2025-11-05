/**
 * Environment configuration
 * Centralizes access to environment variables
 */

export const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'https://platform.voxiflow.com/api/v1',
  backendUrl: import.meta.env.VITE_BACKEND_URL || 'https://platform.voxiflow.com/backend',
  webhookUrl: import.meta.env.VITE_WEBHOOK_URL || 'https://platform.voxiflow.com/backend/api/v1/webhook',
  env: import.meta.env.VITE_ENV || 'production',
  isDevelopment: import.meta.env.VITE_ENV === 'development',
  isProduction: import.meta.env.VITE_ENV === 'production',
} as const;

// Log config in development mode
if (config.isDevelopment) {
  console.log('🔧 Environment Configuration:', config);
}
