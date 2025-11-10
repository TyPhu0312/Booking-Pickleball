
import HeroSection from "@/components/features/HeroSection";
import Footer from "@/components/features/Footer";
import Navbar from "@/components/features/NavBar";



export default function RootLayout({
    children,
  }: {
    children: React.ReactNode;
  }) {
  return (
    <main className="bg-linear-to-b from-green-50 to-white min-h-screen flex flex-col">
      <Navbar />
      <HeroSection />
      {children}
      <Footer />
    </main>
  );
}
