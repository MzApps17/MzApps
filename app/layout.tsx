import "./globals.css";
import Footer from "@/components/Footer";

export const metadata = {
  title: "MZ Apps",
  description: "Mizoram Bazar & Jobs",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-white text-black">
        <div className="pb-[60px]">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
