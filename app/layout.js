import "./globals.css";
import "./core.css";
export const metadata={title:"utino chat",description:"پیام‌رسان خصوصی و سریع utino chat",robots:{index:false,follow:false}};
export const viewport={width:"device-width",initialScale:1,viewportFit:"cover",colorScheme:"light dark"};
export default function RootLayout({children}){return <html lang="fa" dir="rtl"><body>{children}</body></html>}
