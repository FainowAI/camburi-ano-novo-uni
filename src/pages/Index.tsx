import { useRef } from "react";
import { Link } from "react-router-dom";
import { HeroSection } from "@/components/HeroSection";
import { GallerySection } from "@/components/GallerySection";
import { MissionSection } from "@/components/MissionSection";
import { TestimonialsSection } from "@/components/TestimonialsSection";
import { DonationForm } from "@/components/DonationForm";
import { BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";

const Index = () => {
  const formRef = useRef<HTMLDivElement>(null);

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-background font-montserrat">
      {/* Analytics Link - Fixed position */}
      <Link to="/analytics/paraiso-cambury">
        <Button 
          variant="outline" 
          size="sm"
          className="fixed top-4 right-4 z-50 bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm"
        >
          <BarChart3 className="w-4 h-4 mr-2" />
          Analytics
        </Button>
      </Link>

      <HeroSection onScrollToForm={scrollToForm} />
      <GallerySection onScrollToForm={scrollToForm} />
      <MissionSection />
      <TestimonialsSection />
      <div ref={formRef}>
        <DonationForm />
      </div>
    </div>
  );
};

export default Index;