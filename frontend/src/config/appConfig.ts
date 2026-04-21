export const appConfig = {
  appName: "Mova Condo",
  apiUrl: `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/api`,
  apiTimeoutMs: Number(process.env.NEXT_PUBLIC_API_TIMEOUT_MS ?? 15000),
  apiRetryCount: Number(process.env.NEXT_PUBLIC_API_RETRY_COUNT ?? 2),
  apiRetryDelayMs: Number(process.env.NEXT_PUBLIC_API_RETRY_DELAY_MS ?? 500),
} as const;
