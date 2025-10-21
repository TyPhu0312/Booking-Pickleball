import Footer from "@/components/features/Footer";
import Navbar from "@/components/features/NavBar";

export default function AuthLayout({
    children,
  }: {
    children: React.ReactNode;
  }) {
    return (
      <html lang="en">
        <body className=" bg-gray-100">
          <Navbar/>
          {children}
          <Footer/>
        </body>
      </html>
    );
  }