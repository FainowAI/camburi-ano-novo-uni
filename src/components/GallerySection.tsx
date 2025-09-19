import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Instagram } from "lucide-react";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import festa1 from "@/assets/festa-1.jpg";
import festa2 from "@/assets/festa-2.jpg";
import festa3 from "@/assets/festa-3.jpg";

const images = [
  { src: festa1, alt: "Festa na praia com fogueira" },
  { src: festa2, alt: "Celebração diurna na praia" },
  { src: festa3, alt: "Voluntários cuidando da praia" },
];

export const GallerySection = () => {
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

    const element = document.getElementById('gallery-section');
    if (element) observer.observe(element);

    return () => observer.disconnect();
  }, []);

  return (
    <section id="gallery-section" className="py-20 bg-gradient-section">
      <div className="container mx-auto px-6">
        <div className={`text-center mb-12 transition-all duration-1000 transform ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
        }`}>
          <h2 className="text-4xl font-montserrat font-bold text-foreground mb-4">
            Últimas Festas da <span className="text-primary">UNNE</span>
          </h2>
        </div>

        {/* Images Grid */}
        <div className={`max-w-4xl mx-auto mb-12 transition-all duration-1000 delay-300 transform ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
        }`}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {images.map((image, index) => (
              <div key={index} className="group">
                <div className="relative bg-black p-4 rounded-lg shadow-card hover:shadow-primary/20 transition-all duration-300 group-hover:scale-105">
                  <GlowingEffect
                    disabled={false}
                    proximity={100}
                    spread={30}
                    blur={2}
                    movementDuration={1.5}
                    borderWidth={2}
                    variant="white"
                  />
                  <div className="overflow-hidden rounded-lg">
                    <img
                      src={image.src}
                      alt={image.alt}
                      className="w-full h-80 object-cover"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Instagram Button */}
        <div className={`text-center transition-all duration-1000 delay-500 transform ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
        }`}>
          <h3 className="text-2xl font-montserrat font-semibold text-foreground mb-6">
            Venha conhecer mais a <span className="text-primary">UNNE</span>
          </h3>
          <Button
            variant="outline"
            size="lg"
            className="border-accent text-accent hover:bg-accent hover:text-accent-foreground font-montserrat font-semibold px-8 py-3 transition-all duration-300 hover:scale-105"
            onClick={() => window.open('https://instagram.com/unnecambury', '_blank')}
          >
            <Instagram className="w-6 h-6" />
          </Button>
        </div>
      </div>
    </section>
  );
};