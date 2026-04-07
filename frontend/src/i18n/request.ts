import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";
import { defaultLocale, cookieName, type Locale, locales } from "./config";

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const stored = cookieStore.get(cookieName)?.value as Locale | undefined;
  const locale: Locale = stored && locales.includes(stored) ? stored : defaultLocale;

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
