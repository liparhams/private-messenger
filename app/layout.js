import "./globals.css";

export const metadata = {
  title: "Messenger",
  description: "Messenger platform"
};

export default function RootLayout({ children }) {
  return (
    <html lang="fa" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
