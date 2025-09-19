import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import festa1 from "@/assets/festa-1.jpg";
import festa2 from "@/assets/festa-2.jpg";
import festa3 from "@/assets/festa-3.jpg";

const images = [
  { src: festa1, alt: "Festa na praia com fogueira" },
  { src: festa2, alt: "Celebração diurna na praia" },
  { src: festa3, alt: "Voluntários cuidando da praia" },
];

export const GallerySection = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
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

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

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

        {/* Carousel */}
        <div className={`relative max-w-4xl mx-auto mb-12 transition-all duration-1000 delay-300 transform ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
        }`}>
          <div className="relative overflow-hidden rounded-lg shadow-card">
            <div
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {images.map((image, index) => (
                <div key={index} className="min-w-full">
                  <img
                    src={image.src}
                    alt={image.alt}
                    className="w-full h-96 object-cover"
                  />
                </div>
              ))}
            </div>
            
            {/* Navigation Arrows */}
            <button
              onClick={prevSlide}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full transition-all duration-200 hover:scale-110"
            >
              <ChevronLeft className="w-6 h-6 text-foreground" />
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full transition-all duration-200 hover:scale-110"
            >
              <ChevronRight className="w-6 h-6 text-foreground" />
            </button>
          </div>

          {/* Dots Indicator */}
          <div className="flex justify-center mt-6 space-x-2">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-3 h-3 rounded-full transition-colors duration-200 ${
                  index === currentIndex ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Instagram Button */}
        <div className={`text-center transition-all duration-1000 delay-500 transform ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
        }`}>
          <Button
            variant="outline"
            size="lg"
            className="border-accent text-accent hover:bg-accent hover:text-accent-foreground font-montserrat font-semibold px-8 py-3 transition-all duration-300 hover:scale-105"
            onClick={() => window.open('https://instagram.com/unnecambury', '_blank')}
          >
            Ver mais no Instagram da UNNE
          </Button>
        </div>
      </div>
    </section>
  );
};