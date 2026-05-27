import type { Metadata } from "next";
import "./globals.css";
import "./animations.css";
import { AuthProvider } from "@/components/providers/auth-provider";
import { BillingProvider } from "@/components/providers/billing-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { PageViewTracker } from "@/components/analytics/page-view-tracker";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL, buildOgImageUrl } from "@/lib/seo/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_NAME,
    type: "website",
    images: [
      {
        url: buildOgImageUrl(SITE_NAME, SITE_DESCRIPTION),
        width: 1200,
        height: 630,
        alt: SITE_NAME,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: [buildOgImageUrl(SITE_NAME, SITE_DESCRIPTION)],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans text-foreground">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <AuthProvider>
            <BillingProvider>
              <PageViewTracker />
              {children}
            </BillingProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}