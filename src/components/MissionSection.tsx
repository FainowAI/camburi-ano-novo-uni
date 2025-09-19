import { useEffect, useState } from "react";
import { Shield, Waves, Sparkles, Heart } from "lucide-react";
import ScrollFloat from "@/components/ScrollFloat";

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
    <section id="mission-section" className="py-20 bg-background">
      <div className="container mx-auto px-6">
        <div className={`text-center mb-16 transition-all duration-1000 transform ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
        }`}>
          <ScrollFloat
            containerClassName="text-4xl font-montserrat font-bold text-foreground mb-8"
            animationDuration={1.2}
            ease="back.inOut(2)"
            scrollStart="center bottom+=40%"
            scrollEnd="bottom bottom-=40%"
            stagger={0.06}
          >
            Nossa Missão
          </ScrollFloat>
          
          <div className="max-w-4xl mx-auto">
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              A UNNE Camburi dedica-se a manter a segurança, lazer, limpeza e divertimento 
              para a praia de Camburi, criando um ambiente perfeito para famílias e amigos 
              celebrarem juntos.
            </p>
            
            <div className="bg-unne-light-green/20 border-l-4 border-primary p-8 rounded-lg mb-12">
              <ScrollFloat
                containerClassName="text-2xl md:text-3xl font-montserrat font-semibold text-primary leading-relaxed"
                textClassName="text-2xl md:text-3xl"
                animationDuration={1}
                ease="elastic.out(1, 0.3)"
                scrollStart="center bottom+=30%"
                scrollEnd="bottom bottom-=30%"
                stagger={0.02}
              >
                "Quem ama cuida do paraíso Cambury!"
              </ScrollFloat>
            </div>
          </div>
        </div>

        {/* Mission Items Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
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