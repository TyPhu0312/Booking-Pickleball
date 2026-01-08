
import HeroSection from "@/components/features/HeroSection";
import Footer from "@/components/features/Footer";
import Navbar from "@/components/features/NavBar";
import ChatWidget from "@/components/features/ChatWidget";
import { Toaster } from "@/components/ui/sonner";



export default function RootLayout({
    children,
  }: {
    children: React.ReactNode;
  }) {
  return (
    <main className="bg-linear-to-b from-green-50 to-white min-h-screen flex flex-col">
      <Navbar />
      <HeroSection />
       <Toaster position="bottom-right" richColors />
      {children}
      <Footer />
      <ChatWidget />
    </main>
  );
}
