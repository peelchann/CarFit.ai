import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CarFit Studio",
  description: "AI Car Customization Fitting Room",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-black text-white antialiased">
        {children}
      </body>
    </html>
  );
}
