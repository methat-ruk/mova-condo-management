import { appConfig } from "@/config/appConfig";
import type { ApiError } from "@/types";

type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE";

interface RequestOptions {
  method?: HttpMethod;
  body?: unknown;
  headers?: Record<string, string>;
}

function buildUrl(endpoint: string, params: Record<string, unknown>): string {
  const qs = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join("&");
  return qs ? `${endpoint}?${qs}` : endpoint;
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, headers: extraHeaders = {} } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...extraHeaders,
  };

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${appConfig.apiUrl}${endpoint}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorData = (await response.json().catch(() => ({}))) as Partial<ApiError>;

    if (response.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        document.cookie = "AUTH_TOKEN=; path=/; max-age=0";
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
      }
    }

    const error: ApiError = {
      message: errorData.message ?? "An unexpected error occurred",
      statusCode: response.status,
      error: errorData.error ?? response.statusText,
    };

    throw error;
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export const api = {
  get: <T>(
    endpoint: string,
    options?: { params?: Record<string, unknown>; headers?: Record<string, string> },
  ) => {
    const url = options?.params ? buildUrl(endpoint, options.params) : endpoint;
    return request<T>(url, { method: "GET", headers: options?.headers });
  },

  post: <T>(endpoint: string, body?: unknown, headers?: Record<string, string>) =>
    request<T>(endpoint, { method: "POST", body, headers }),

  patch: <T>(endpoint: string, body?: unknown, headers?: Record<string, string>) =>
    request<T>(endpoint, { method: "PATCH", body, headers }),

  delete: <T>(endpoint: string, headers?: Record<string, string>) =>
    request<T>(endpoint, { method: "DELETE", headers }),
};
