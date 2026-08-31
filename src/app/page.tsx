import { Nav } from "@/components/landing/Nav";
import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { Footer } from "@/components/landing/Footer";

export default function LandingPage() {
  return (
    <div>
      <Nav />
      <Hero />
      <Features />
      <Footer />
    </div>
  );
}
