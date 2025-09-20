import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Heart, Users } from "lucide-react";
import heroImage from "@/assets/hero-beach-party.jpg";
import unnelogo from "@/assets/unne-logo.png";

interface HeroSectionProps {
  onScrollToForm: () => void;
}

export const HeroSection = ({ onScrollToForm }: HeroSectionProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroImage}
          alt="Pessoas dançando na praia de Camburi"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-hero"></div>
      </div>
      
      {/* Content */}
      <div className={`relative z-10 text-center px-6 max-w-4xl mx-auto transition-all duration-1000 transform ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
      }`}>
        {/* Logo */}
        <div className="mb-8">
          <img
            src={unnelogo}
            alt="UNNE Camburi"
            className="h-20 mx-auto mb-4"
          />
        </div>
        
        {/* Main Text Block */}
        <div className="bg-white/95 backdrop-blur-sm rounded-lg p-8 shadow-card border-l-4 border-accent">
          {/* Contador e Badge VIP */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
            <div className="flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full">
              <Users className="w-4 h-4 text-primary" />
              <span className="text-sm font-montserrat font-semibold text-primary">
                15 pessoas já se comprometeram!
              </span>
            </div>
            <div className="bg-gradient-to-r from-accent to-accent/80 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
              ⭐ VIP Camburi
            </div>
          </div>

          <h1 className="text-3xl md:text-4xl lg:text-5xl font-montserrat font-bold text-foreground mb-6 leading-tight">
            Ajude para termos uma festa de ano novo{" "}
            <span className="text-primary">divertida</span>,{" "}
            <span className="text-primary">com segurança</span> e{" "}
            <span className="text-primary">em família</span>!
          </h1>
          
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Participe agora da arrecadação para garantir uma celebração inesquecível na NOSSA praia de Camburi
          </p>
          
          <Button
            onClick={onScrollToForm}
            size="lg"
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-montserrat font-semibold px-8 py-3 shadow-button transition-all duration-300 hover:scale-105 animate-pulse-slow"
          >
            <Heart className="w-5 h-5 mr-2" />
            Participe Hoje
          </Button>
        </div>
      </div>
    </section>
  );
};