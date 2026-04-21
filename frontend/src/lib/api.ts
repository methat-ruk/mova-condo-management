import axios, {
  AxiosError,
  AxiosHeaders,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";
import { appConfig } from "@/config/appConfig";
import { clearAccessToken, getAccessToken, setAccessToken } from "@/lib/authSession";
import { useAuthStore } from "@/store/authStore";
import type { RefreshResponse } from "@/types/auth";
import type { ApiError } from "@/types";

type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE";

interface RequestOptions {
  method?: HttpMethod;
  body?: unknown;
  headers?: Record<string, string>;
}

interface RequestMetadata {
  dedupeKey?: string;
  disableRetry?: boolean;
  disableRefresh?: boolean;
  queueWhenOffline?: boolean;
  retryCount?: number;
  retryAttempt?: number;
}

interface ApiRequestConfig extends AxiosRequestConfig {
  metadata?: RequestMetadata;
}

interface OfflineQueueItem {
  url: string;
  method: Exclude<HttpMethod, "GET">;
  body?: unknown;
  headers?: Record<string, string>;
  queuedAt: string;
}

const OFFLINE_QUEUE_STORAGE_KEY = "mova-api-offline-queue";
const OFFLINE_QUEUED_ERROR = "OFFLINE_QUEUED";
const DEFAULT_ERROR_MESSAGE = "An unexpected error occurred";

const pendingRequests = new Map<string, Promise<unknown>>();

let refreshPromise: Promise<string> | null = null;
let isOfflineQueueListening = false;

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function getRetryDelay(attempt: number): number {
  return appConfig.apiRetryDelayMs * 2 ** Math.max(attempt - 1, 0);
}

function isAuthRoute(url?: string): boolean {
  return Boolean(url?.startsWith("/auth/"));
}

function serialize(value: unknown): string {
  if (value === undefined) {
    return "";
  }

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function buildDedupeKey(config: ApiRequestConfig): string {
  return [
    config.method ?? "get",
    config.url ?? "",
    serialize(config.params),
    serialize(config.data),
  ].join("|");
}

function toAxiosHeaders(headers?: AxiosRequestConfig["headers"]): AxiosHeaders {
  return headers instanceof AxiosHeaders
    ? headers
    : new AxiosHeaders((headers ?? undefined) as Record<string, string> | undefined);
}

function normalizeError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    const responseData = error.response?.data as Partial<ApiError> | undefined;

    return {
      message: responseData?.message ?? error.message ?? DEFAULT_ERROR_MESSAGE,
      statusCode: error.response?.status ?? 0,
      error:
        responseData?.error ??
        (error.code === "ERR_NETWORK" ? "NETWORK_ERROR" : (error.code ?? "UNKNOWN_ERROR")),
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      statusCode: 0,
      error: error.name,
    };
  }

  return {
    message: DEFAULT_ERROR_MESSAGE,
    statusCode: 0,
    error: "UNKNOWN_ERROR",
  };
}

function pause(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function readOfflineQueue(): OfflineQueueItem[] {
  if (!isBrowser()) {
    return [];
  }

  const stored = localStorage.getItem(OFFLINE_QUEUE_STORAGE_KEY);

  if (!stored) {
    return [];
  }

  try {
    const parsed = JSON.parse(stored) as OfflineQueueItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeOfflineQueue(queue: OfflineQueueItem[]): void {
  if (!isBrowser()) {
    return;
  }

  localStorage.setItem(OFFLINE_QUEUE_STORAGE_KEY, JSON.stringify(queue));
}

function enqueueOfflineRequest(item: OfflineQueueItem): void {
  const queue = readOfflineQueue();

  queue.push(item);
  writeOfflineQueue(queue);
}

function createOfflineQueuedError(): ApiError {
  return {
    message: "Request queued and will sync automatically when connection is restored",
    statusCode: 0,
    error: OFFLINE_QUEUED_ERROR,
  };
}

async function handleUnauthorizedRedirect(): Promise<void> {
  clearAccessToken();
  useAuthStore.getState().clearAuth();

  if (isBrowser() && window.location.pathname !== "/login") {
    window.location.href = "/login";
  }
}

function shouldRetryRequest(error: AxiosError, config: ApiRequestConfig): boolean {
  const retryLimit = config.metadata?.retryCount ?? appConfig.apiRetryCount;
  const retryAttempt = config.metadata?.retryAttempt ?? 0;

  if (config.metadata?.disableRetry || retryAttempt >= retryLimit) {
    return false;
  }

  if (!error.response) {
    return true;
  }

  return error.response.status === 429 || error.response.status >= 500;
}

function shouldQueueOffline(config: ApiRequestConfig): boolean {
  const method = (config.method ?? "get").toUpperCase();

  return (
    isBrowser() &&
    navigator.onLine === false &&
    method !== "GET" &&
    !isAuthRoute(config.url) &&
    config.metadata?.queueWhenOffline !== false
  );
}

const rawClient = axios.create({
  baseURL: appConfig.apiUrl,
  timeout: appConfig.apiTimeoutMs,
  withCredentials: true,
});

const client = axios.create({
  baseURL: appConfig.apiUrl,
  timeout: appConfig.apiTimeoutMs,
  withCredentials: true,
});

async function refreshAccessToken(): Promise<string> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = rawClient
    .post<RefreshResponse>("/auth/refresh")
    .then((response) => {
      const token = response.data.accessToken;

      setAccessToken(token);
      useAuthStore.getState().setAuth(response.data.user, token);

      return token;
    })
    .catch(async (error: unknown) => {
      await handleUnauthorizedRedirect();
      throw normalizeError(error);
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

async function replayOfflineQueue(): Promise<void> {
  if (!isBrowser() || navigator.onLine === false) {
    return;
  }

  const queue = readOfflineQueue();

  if (queue.length === 0) {
    return;
  }

  const remaining: OfflineQueueItem[] = [];

  for (const item of queue) {
    try {
      await client.request({
        url: item.url,
        method: item.method,
        data: item.body,
        headers: item.headers,
        metadata: {
          queueWhenOffline: false,
          disableRetry: false,
        },
      } satisfies ApiRequestConfig);
    } catch (error) {
      const apiError = normalizeError(error);

      if (apiError.statusCode === 0 || apiError.statusCode >= 500) {
        remaining.push(item);
      }
    }
  }

  writeOfflineQueue(remaining);
}

function ensureOfflineQueueListener(): void {
  if (!isBrowser() || isOfflineQueueListening) {
    return;
  }

  window.addEventListener("online", () => {
    void replayOfflineQueue();
  });

  if (navigator.onLine) {
    void replayOfflineQueue();
  }

  isOfflineQueueListening = true;
}

client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();
  const headers = toAxiosHeaders(config.headers);

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  config.headers = headers;

  return config;
});

client.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const config = (error.config ?? {}) as ApiRequestConfig;
    const statusCode = error.response?.status ?? 0;
    const authHeader = toAxiosHeaders(config.headers).get("Authorization");

    if (
      statusCode === 401 &&
      !config.metadata?.disableRefresh &&
      !isAuthRoute(config.url) &&
      authHeader !== "Bearer undefined"
    ) {
      try {
        const token = await refreshAccessToken();

        const headers = toAxiosHeaders(config.headers);
        headers.set("Authorization", `Bearer ${token}`);

        return client.request({
          ...config,
          headers,
          metadata: {
            ...config.metadata,
            disableRefresh: true,
          },
        });
      } catch (refreshError) {
        throw normalizeError(refreshError);
      }
    }

    if (shouldRetryRequest(error, config) && isBrowser()) {
      const nextAttempt = (config.metadata?.retryAttempt ?? 0) + 1;

      await pause(getRetryDelay(nextAttempt));

      return client.request({
        ...config,
        metadata: {
          ...config.metadata,
          retryAttempt: nextAttempt,
        },
      });
    }

    if (statusCode === 401) {
      await handleUnauthorizedRedirect();
    }

    throw normalizeError(error);
  },
);

async function executeRequest<T>(config: ApiRequestConfig): Promise<T> {
  ensureOfflineQueueListener();

  if (shouldQueueOffline(config)) {
    enqueueOfflineRequest({
      url: config.url ?? "",
      method: (config.method ?? "post").toUpperCase() as Exclude<HttpMethod, "GET">,
      body: config.data,
      headers:
        config.headers && !toAxiosHeaders(config.headers).has("Authorization")
          ? (config.headers as Record<string, string>)
          : undefined,
      queuedAt: new Date().toISOString(),
    });

    throw createOfflineQueuedError();
  }

  const dedupeKey = config.metadata?.dedupeKey ?? buildDedupeKey(config);

  if (pendingRequests.has(dedupeKey)) {
    return pendingRequests.get(dedupeKey) as Promise<T>;
  }

  const requestPromise = client
    .request<T>(config)
    .then((response) => response.data)
    .finally(() => {
      pendingRequests.delete(dedupeKey);
    });

  pendingRequests.set(dedupeKey, requestPromise);

  return requestPromise;
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, headers } = options;

  return executeRequest<T>({
    url: endpoint,
    method,
    data: body,
    headers,
  });
}

export const api = {
  get: <T>(
    endpoint: string,
    options?: { params?: Record<string, unknown>; headers?: Record<string, string> },
  ) =>
    executeRequest<T>({
      url: endpoint,
      method: "GET",
      params: options?.params,
      headers: options?.headers,
    }),

  post: <T>(endpoint: string, body?: unknown, headers?: Record<string, string>) =>
    request<T>(endpoint, { method: "POST", body, headers }),

  patch: <T>(endpoint: string, body?: unknown, headers?: Record<string, string>) =>
    request<T>(endpoint, { method: "PATCH", body, headers }),

  delete: <T>(endpoint: string, headers?: Record<string, string>) =>
    request<T>(endpoint, { method: "DELETE", headers }),
};
