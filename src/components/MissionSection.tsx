import { useEffect, useState } from "react";
import { Shield, Waves, Sparkles, Heart } from "lucide-react";

export const MissionSection = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3 }
    );

    const element = document.getElementById('mission-section');
    if (element) observer.observe(element);

    return () => observer.disconnect();
  }, []);

  const missionItems = [
    {
      icon: Shield,
      title: "Segurança",
      description: "Garantindo um ambiente seguro para toda a família",
    },
    {
      icon: Sparkles,
      title: "Lazer",
      description: "Proporcionando momentos de diversão e alegria",
    },
    {
      icon: Waves,
      title: "Limpeza",
      description: "Mantendo nossa praia limpa e preservada",
    },
    {
      icon: Heart,
      title: "Divertimento",
      description: "Criando memórias especiais para todos",
    },
  ];

  return (
    <section id="mission-section" className="py-12 sm:py-16 md:py-20 bg-background">
      <div className="container mx-auto px-4 sm:px-6">
        <div className={`text-center mb-8 sm:mb-12 md:mb-16 transition-all duration-1000 transform ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
        }`}>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-montserrat font-bold text-foreground mb-6 sm:mb-8">
            Nossa <span className="text-primary">Missão</span>
          </h2>
          
          <div className="max-w-4xl mx-auto">
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              A UNNE Cambury dedica-se a manter a segurança, lazer, limpeza e divertimento 
              para a praia de Cambury, criando um ambiente perfeito para famílias e amigos 
              celebrarem juntos.
            </p>
            
            <div className="bg-unne-light-green/20 border-l-4 border-primary p-8 rounded-lg mb-12">
              <blockquote className="text-2xl md:text-3xl font-montserrat font-semibold text-primary leading-relaxed">
                "Quem ama cuida do paraíso Cambury!"
              </blockquote>
            </div>
          </div>
        </div>

        {/* Mission Items Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 max-w-6xl mx-auto">
          {missionItems.map((item, index) => (
            <div
              key={index}
              className={`text-center p-6 bg-card rounded-lg shadow-card hover:shadow-lg transition-all duration-500 transform hover:scale-105 ${
                isVisible 
                  ? 'translate-y-0 opacity-100' 
                  : 'translate-y-10 opacity-0'
              }`}
              style={{ transitionDelay: `${index * 150}ms` }}
            >
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <item.icon className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-montserrat font-semibold text-foreground mb-3">
                {item.title}
              </h3>
              <p className="text-muted-foreground">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};