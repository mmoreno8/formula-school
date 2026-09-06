import type { Metadata } from "next";
import Script from "next/script";
import { IBM_Plex_Mono, Public_Sans } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";

const sans = Public_Sans({
  variable: "--font-public-sans",
  subsets: ["latin"],
  display: "swap",
});

const mono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Formula School",
    template: "%s · Formula School",
  },
  description:
    "Practical Excel formulas and SQL, taught through short interactive exercises. No spreadsheet clone.",
};

/** Applies a saved theme before first paint, so there is no flash of the wrong
 *  one. No stored value means follow the system setting. This runs before
 *  hydration and stamps an attribute on <html>, which is why the element below
 *  carries suppressHydrationWarning. */
const THEME_SCRIPT = `try{var d=document.documentElement;var t=localStorage.getItem('formula-school.theme');if(t==='dark'||t==='light'){d.setAttribute('data-theme',t)}var f=localStorage.getItem('formula-school.focus');if(f==='on'){d.setAttribute('data-focus','on')}}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${sans.variable} ${mono.variable} antialiased`}
    >
      <body className="min-h-dvh">
        <Script
          id="theme"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }}
        />
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:border focus:border-line focus:bg-card focus:px-3 focus:py-2 focus:text-sm"
        >
          Skip to content
        </a>
        <div className="lg:flex">
          <Sidebar />
          <main
            id="main"
            data-chrome="main"
            className="min-w-0 flex-1 px-5 py-6 sm:px-7 lg:px-9 lg:py-7"
          >
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
