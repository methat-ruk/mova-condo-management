import "axios";

declare module "axios" {
  interface AxiosRequestConfig {
    metadata?: {
      dedupeKey?: string;
      disableRetry?: boolean;
      disableRefresh?: boolean;
      queueWhenOffline?: boolean;
      retryCount?: number;
      retryAttempt?: number;
    };
  }
}
