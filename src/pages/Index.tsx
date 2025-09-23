import { useRef } from "react";
import { HeroSection } from "@/components/HeroSection";
import { GallerySection } from "@/components/GallerySection";
import { MissionSection } from "@/components/MissionSection";
import { DonationForm } from "@/components/DonationForm";

const Index = () => {
  const formRef = useRef<HTMLDivElement>(null);

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-background font-montserrat">
      <HeroSection onScrollToForm={scrollToForm} />
      <GallerySection onScrollToForm={scrollToForm} />
      <MissionSection />
      <div ref={formRef}>
        <DonationForm />
      </div>
      <footer className="w-full bg-unne-green py-2 mt-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-xs text-white">
            Desenvolvido por{" "}
            <a 
              href="https://apresentacao.pensadoria.com.br/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-white hover:underline"
            >
              Pensadoria
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;