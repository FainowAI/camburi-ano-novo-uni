import { useRef } from "react";
import { HeroSection } from "@/components/HeroSection";
import { GallerySection } from "@/components/GallerySection";
import { MissionSection } from "@/components/MissionSection";
import { DonationForm } from "@/components/DonationForm";
import CircularText from "@/components/CircularText";

const Index = () => {
  const formRef = useRef<HTMLDivElement>(null);

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-background font-montserrat">
      <HeroSection onScrollToForm={scrollToForm} />
      <div className="py-20 bg-background flex justify-center items-center">
        <CircularText 
          text="UNNE CAMBURI • FESTA DE ANO NOVO • " 
          spinDuration={30}
          onHover="speedUp"
        />
      </div>
      <GallerySection />
      <MissionSection />
      <div ref={formRef}>
        <DonationForm />
      </div>
    </div>
  );
};

export default Index;