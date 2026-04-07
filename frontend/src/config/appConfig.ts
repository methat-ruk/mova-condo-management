export const appConfig = {
  appName: "Condo Management Platform",
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000",
} as const;
