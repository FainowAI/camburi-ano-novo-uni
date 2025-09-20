import { useEffect, useState } from "react";
import { Star, Quote } from "lucide-react";

export const TestimonialsSection = () => {
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

    const element = document.getElementById('testimonials-section');
    if (element) observer.observe(element);

    return () => observer.disconnect();
  }, []);

  const testimonials = [
    {
      name: "Maria Santos",
      comment: "A festa do ano passado foi incrível! Meus filhos se divertiram muito e eu fiquei tranquila com toda a segurança.",
      rating: 5,
      location: "Moradora de Camburi há 8 anos"
    },
    {
      name: "João Silva",
      comment: "Melhor festa de ano novo da região! Organização impecável e ambiente familiar. Já estou ansioso pela próxima!",
      rating: 5,
      location: "Família Silva - Camburi"
    },
    {
      name: "Ana Costa",
      comment: "A praia estava linda e limpa, as crianças brincaram seguras e os adultos curtiram muito. Parabéns à UNNE!",
      rating: 5,
      location: "Visitante de São Paulo"
    }
  ];

  return (
    <section id="testimonials-section" className="py-20 bg-background">
      <div className="container mx-auto px-6">
        <div className={`text-center mb-16 transition-all duration-1000 transform ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
        }`}>
          <h2 className="text-4xl font-montserrat font-bold text-foreground mb-4">
            O que dizem sobre nossas <span className="text-primary">festas</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Veja os comentários de quem já viveu momentos inesquecíveis conosco
          </p>
        </div>

        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className={`bg-card p-8 rounded-lg shadow-card hover:shadow-lg transition-all duration-500 transform hover:scale-105 ${
                isVisible 
                  ? 'translate-y-0 opacity-100' 
                  : 'translate-y-10 opacity-0'
              }`}
              style={{ transitionDelay: `${index * 200}ms` }}
            >
              <div className="flex items-center mb-4">
                <Quote className="w-6 h-6 text-primary mr-2" />
                <div className="flex">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                  ))}
                </div>
              </div>
              
              <p className="text-muted-foreground mb-6 leading-relaxed italic">
                "{testimonial.comment}"
              </p>
              
              <div className="border-t border-border pt-4">
                <p className="font-montserrat font-semibold text-foreground">
                  {testimonial.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {testimonial.location}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className={`text-center mt-12 transition-all duration-1000 delay-600 transform ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
        }`}>
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 max-w-2xl mx-auto">
            <p className="text-primary font-montserrat font-semibold">
              Mais de 500 famílias já participaram das nossas celebrações!
            </p>
            <p className="text-muted-foreground text-sm mt-2">
              Junte-se à nossa comunidade e crie memórias inesquecíveis em Camburi
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
