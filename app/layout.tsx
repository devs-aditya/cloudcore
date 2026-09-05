import "./globals.css";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Navbar />

        <div className="app-container">
          <Sidebar />

          <main>
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}