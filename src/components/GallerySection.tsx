import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Instagram, Users, Leaf, Calendar } from "lucide-react";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import Aurora from "@/components/Aurora";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";

interface Photo {
  src: string;
  alt: string;
  legenda: string;
}

const photoLegendas: Record<string, string> = {
  "festa-1.jpg": "Carnaval 2025",
  "festa-2.jpg": "Carnaval 2024", 
  "festa-3.jpg": "Final de ano 2024",
};

const depoimentos = [
  {
    texto: "Esses encontros fazem parte da nossa história.",
    autor: "Ana, participante desde 2018"
  },
  {
    texto: "É muito mais que uma festa, é família e amizade.",
    autor: "Lucas, 2022"
  }
];

const destaques = [
  {
    icon: Users,
    valor: "+300 pessoas",
    descricao: "já participaram"
  },
  {
    icon: Leaf,
    valor: "50kg de lixo",
    descricao: "recolhidos em ações na praia"
  },
  {
    icon: Calendar,
    valor: "4 anos",
    descricao: "de tradição"
  }
];

interface GallerySectionProps {
  onScrollToForm: () => void;
}

export const GallerySection = ({ onScrollToForm }: GallerySectionProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const isMobile = useIsMobile();

  useEffect(() => {
    const fetchPhotos = async () => {
      try {
        console.log('Fetching photos from Supabase...');
        const { data, error } = await supabase
          .from('photos')
          .select('*')
          .order('id');
        
        console.log('Supabase response:', { data, error });
        
        if (error) {
          console.error('Supabase error:', error);
          return;
        }
        
        if (data && data.length > 0) {
          console.log('Processing photos:', data);
          const mappedPhotos = data.map((photo: any) => ({
            src: photo.url || '',
            alt: photo.name?.replace('.jpg', '') || '',
            legenda: photoLegendas[photo.name || ''] || photo.name || ''
          }));
          console.log('Mapped photos:', mappedPhotos);
          setPhotos(mappedPhotos);
        } else {
          console.log('No photos found in database');
        }
      } catch (error) {
        console.error('Error fetching photos:', error);
      }
    };

    fetchPhotos();
  }, []);

  useEffect(() => {
    // Mobile fallback: set visible immediately on mobile devices
    if (isMobile) {
      console.log('Mobile detected, setting gallery visible immediately');
      setIsVisible(true);
      return;
    }

    // Desktop intersection observer with more tolerant settings
    const observer = new IntersectionObserver(
      ([entry]) => {
        console.log('IntersectionObserver triggered:', entry.isIntersecting, entry.intersectionRatio);
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { 
        threshold: 0.1, // More tolerant threshold
        rootMargin: '50px' // Trigger earlier
      }
    );

    const element = document.getElementById('gallery-section');
    if (element) {
      console.log('Setting up IntersectionObserver for gallery section');
      observer.observe(element);
    }

    // Safety timeout: force visibility after 3 seconds if observer hasn't triggered
    const timeoutId = setTimeout(() => {
      console.log('Safety timeout triggered, forcing gallery visibility');
      setIsVisible(true);
    }, 3000);

    return () => {
      clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, [isMobile]);

  return (
    <section id="gallery-section" className="py-20 bg-gradient-section">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className={`text-center mb-16 transition-all duration-1000 transform ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
        }`}>
          <h2 className="text-4xl font-montserrat font-bold text-foreground mb-4">
            Últimas Festas da <span className="text-primary">UNNE</span>
          </h2>
          <h3 className="text-2xl font-montserrat font-semibold text-foreground mb-4">
            Nossas melhores memórias juntos
          </h3>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Reviva momentos que marcaram nossa comunidade
          </p>
        </div>

        {/* Images Grid with Captions */}
        <div className={`max-w-5xl mx-auto mb-16 transition-all duration-1000 delay-300 transform ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
        }`}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {photos.map((image, index) => (
              <div key={index} className="group">
                <div 
                  className="relative p-4 rounded-lg shadow-card hover:shadow-primary/20 transition-all duration-300 group-hover:scale-105 overflow-hidden cursor-pointer"
                  onClick={() => window.open('https://www.instagram.com/unnecambury/?hl=en', '_blank')}
                >
                  {!isMobile && (
                    <>
                      <Aurora 
                        colorStops={['#8b5cf6', '#a855f7', '#9333ea']}
                        amplitude={0.8}
                        blend={0.6}
                        speed={0.5}
                      />
                      <GlowingEffect
                        disabled={false}
                        proximity={100}
                        spread={30}
                        blur={2}
                        movementDuration={1.5}
                        borderWidth={2}
                        variant="white"
                      />
                    </>
                  )}
                  <div className="relative z-10 overflow-hidden rounded-lg">
                    <img
                      src={image.src}
                      alt={image.alt}
                      className="w-full h-80 object-cover"
                    />
                  </div>
                </div>
                <p className="text-center mt-4 font-montserrat font-medium text-foreground">
                  {image.legenda}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Instagram Button Below Photos */}
        <div className={`text-center mb-16 transition-all duration-1000 delay-400 transform ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
        }`}>
          <Button
            variant="outline"
            size="lg"
            className="border-accent text-accent hover:bg-accent hover:text-accent-foreground font-montserrat font-semibold px-8 py-3 transition-all duration-300 hover:scale-105"
            onClick={() => window.open('https://www.instagram.com/unnecambury/?hl=en', '_blank')}
          >
            <Instagram className="w-6 h-6 mr-2" />
            Siga no Instagram
          </Button>
        </div>

        {/* Depoimentos */}
        <div className={`max-w-4xl mx-auto mb-16 transition-all duration-1000 delay-500 transform ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
        }`}>
          <div className="grid md:grid-cols-2 gap-8">
            {depoimentos.map((depoimento, index) => (
              <div key={index} className="bg-white/80 backdrop-blur-sm p-6 rounded-lg border-l-4 border-primary">
                <p className="text-lg italic text-foreground mb-3">
                  "{depoimento.texto}"
                </p>
                <p className="text-sm font-montserrat font-semibold text-primary">
                  — {depoimento.autor}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Destaques */}
        <div className={`max-w-4xl mx-auto mb-16 transition-all duration-1000 delay-700 transform ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
        }`}>
          <div className="grid md:grid-cols-3 gap-6">
            {destaques.map((destaque, index) => (
              <div key={index} className="text-center bg-card p-6 rounded-lg shadow-card">
                <destaque.icon className="w-8 h-8 text-primary mx-auto mb-3" />
                <p className="text-2xl font-montserrat font-bold text-foreground mb-1">
                  {destaque.valor}
                </p>
                <p className="text-muted-foreground">
                  {destaque.descricao}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA e Instagram */}
        <div className={`text-center transition-all duration-1000 delay-900 transform ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
        }`}>
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-8 max-w-3xl mx-auto mb-8">
            <p className="text-lg text-foreground mb-6 leading-relaxed">
              Cada contribuição ajuda a escrever o próximo capítulo dessa história. 
              Venha fazer parte da nossa festa de fim de ano!
            </p>
            <Button
              onClick={onScrollToForm}
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-montserrat font-semibold px-8 py-3 mb-6"
            >
              Quero apoiar a próxima festa
            </Button>
          </div>
          
          <h3 className="text-xl font-montserrat font-semibold text-foreground mb-4">
            Venha conhecer mais a <span className="text-primary">UNNE</span>
          </h3>
          <Button
            variant="outline"
            size="lg"
            className="border-accent text-accent hover:bg-accent hover:text-accent-foreground font-montserrat font-semibold px-8 py-3 transition-all duration-300 hover:scale-105"
            onClick={() => window.open('https://www.instagram.com/unnecambury/?hl=en', '_blank')}
          >
            <Instagram className="w-6 h-6 mr-2" />
            Siga no Instagram
          </Button>
        </div>
      </div>
    </section>
  );
};