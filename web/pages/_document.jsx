import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Use SVG favicon (no “favicon render error”) */}
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <meta name="theme-color" content="#0ea5e9" />
      </Head>
      <body style={{ margin: 0, background: "#f7fafc", color: "#111827" }}>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
