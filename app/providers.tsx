// app/providers.tsx
"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, Suspense, useState } from "react";
import { usePostHog } from "posthog-js/react";
import { NextIntlClientProvider } from "next-intl";
import { ThemeProvider } from "next-themes";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";

function PostHogPageView() {
  const posthog = usePostHog();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Capture pageview
    posthog.capture("$pageview");
  }, [pathname, searchParams]);

  return null;
}

function SuspendedPostHogPageView() {
  return (
    <Suspense>
      <PostHogPageView />
    </Suspense>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<any>(null);
  const [locale, setLocale] = useState("en");

  useEffect(() => {
    // Initialize PostHog
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY as string, {
      api_host:
        process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
      person_profiles: "identified_only",
      capture_pageview: false,
    });

    // Get the user's language preference from localStorage
    const userLanguage = localStorage.getItem("user-language");
    if (userLanguage) {
      setLocale(userLanguage);
    }

    // Load messages for the current locale
    const loadMessages = async () => {
      try {
        const messages = await import(`../messages/${locale}/common.json`);
        setMessages(messages.default);
      } catch (error) {
        console.error("Error loading messages:", error);
        // Fallback to English if there's an error
        const messages = await import("../messages/en/common.json");
        setMessages(messages.default);
      }
    };

    loadMessages();
  }, [locale]);

  if (!messages) {
    return null; // or a loading spinner
  }

  return (
    <NextIntlClientProvider messages={messages} locale={locale}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <PHProvider client={posthog}>
          <SuspendedPostHogPageView />
          {children}
        </PHProvider>
      </ThemeProvider>
    </NextIntlClientProvider>
  );
}
