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
    </div>
  );
};

export default Index;