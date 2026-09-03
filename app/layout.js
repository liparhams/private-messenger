import "./globals.css";

export const metadata = {
  title: "Messenger",
  description: "Messaging platform",
  robots: {
    index: false,
    follow: false,
    nocache: true
  }
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  colorScheme: "dark light"
};

export default function RootLayout({ children }) {
  return (
    <html lang="fa" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
