const AUTH_COOKIE = "AUTH_TOKEN";
const ACCESS_TOKEN_STORAGE_KEY = "token";

export function getAccessToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
}

export function setAccessToken(token: string): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, token);
  document.cookie = `${AUTH_COOKIE}=${token}; path=/; SameSite=Lax`;
}

export function clearAccessToken(): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
  document.cookie = `${AUTH_COOKIE}=; path=/; max-age=0`;
}
