import "./globals.css";

export const metadata = {
  title: "Private Messenger",
  description: "پیام‌رسان خصوصی"
};

export default function RootLayout({ children }) {
  return (
    <html lang="fa" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
