import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import ScrollFloat from "@/components/ScrollFloat";
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
          <ScrollFloat
            containerClassName="text-3xl md:text-4xl lg:text-5xl font-montserrat font-bold text-foreground mb-6 leading-tight"
            animationDuration={1.5}
            ease="power2.out"
            scrollStart="top center"
            scrollEnd="bottom center"
            stagger={0.05}
          >
            Ajude para termos uma festa de ano novo divertida, com segurança e em família!
          </ScrollFloat>
          
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Participe da arrecadação para garantir uma celebração inesquecível na praia de Camburi
          </p>
          
          <Button
            onClick={onScrollToForm}
            size="lg"
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-montserrat font-semibold px-8 py-3 shadow-button transition-all duration-300 hover:scale-105"
          >
            Participe
          </Button>
        </div>
      </div>
    </section>
  );
};