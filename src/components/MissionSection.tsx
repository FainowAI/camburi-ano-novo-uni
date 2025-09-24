import { useEffect, useState } from "react";
import { HandHeart, Search, Users, Leaf, Sun } from "lucide-react";

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

  const valuesItems = [
    {
      icon: HandHeart,
      title: "Colaboração",
      description: "Juntos, transformamos nossa comunidade",
    },
    {
      icon: Search,
      title: "Transparência",
      description: "Clareza em todas as nossas ações",
    },
    {
      icon: Users,
      title: "Responsabilidade Social",
      description: "Impacto positivo para pessoas e território",
    },
    {
      icon: Leaf,
      title: "Respeito à Cultura e Natureza",
      description: "Valorizamos nossas raízes e o meio ambiente",
    },
    {
      icon: Sun,
      title: "Pluralidade e Inclusão",
      description: "Todos são bem-vindos nesse movimento",
    },
  ];

  return (
    <section id="mission-section" className="py-12 sm:py-16 md:py-20 bg-background">
      <div className="container mx-auto px-4 sm:px-6">
        <div className={`text-center mb-8 sm:mb-12 md:mb-16 transition-all duration-1000 transform ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
        }`}>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-montserrat font-bold text-foreground mb-6 sm:mb-8">
            Nossa <span className="text-primary">Missão</span>: Cuidar de Cambury, nosso paraíso
          </h2>
          
          <div className="max-w-4xl mx-auto">
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              Nossa missão é promover a sustentabilidade territorial e o bem-estar coletivo, 
              fortalecendo redes colaborativas que unem moradores e visitantes de Cambury. 
              Fazemos isso com responsabilidade e gratidão, devolvendo à comunidade tudo o 
              que esse paraíso nos proporciona.
            </p>
            
            <div className="bg-unne-light-green/20 border-l-4 border-primary p-8 rounded-lg mb-12">
              <h3 className="text-xl font-montserrat font-semibold text-primary mb-4">
                Nossa Visão
              </h3>
              <p className="text-lg text-foreground leading-relaxed">
                Queremos ser referência em desenvolvimento comunitário e inovação social no 
                litoral norte paulista — um modelo de como pessoas, saberes e recursos podem 
                se unir por um futuro mais justo e harmônico com a natureza.
              </p>
            </div>
          </div>
        </div>

        {/* Values Items Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 sm:gap-8 max-w-7xl mx-auto">
          {valuesItems.map((item, index) => (
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