import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, Shield, Check, ArrowRight } from "lucide-react";

export const DonationForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    cpf: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    setTimeout(() => {
      toast({
        title: "Obrigado pela sua contribuição!",
        description: "Sua contribuição de R$900 foi processada com sucesso. Em breve enviaremos os detalhes da festa!",
      });
      
      setFormData({ name: '', email: '', cpf: '' });
      setIsSubmitting(false);
    }, 1000);
  };

  const handleInputChange = (field: string, value: string) => {
    if (field === 'cpf') {
      value = formatCPF(value);
    }
    
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const benefits = [
    {
      title: "Acesso exclusivo à festa",
      description: "Garantia de entrada na celebração mais aguardada de Camburi."
    },
    {
      title: "Segurança garantida",
      description: "Equipe de segurança profissional durante todo o evento."
    },
    {
      title: "Ambiente familiar",
      description: "Espaço seguro e acolhedor para toda a família se divertir."
    },
    {
      title: "Limpeza e organização",
      description: "Praia limpa e bem cuidada para uma experiência perfeita."
    }
  ];

  return (
    <section id="donation-form" className="py-20 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="container mx-auto px-6">
        <div className="max-w-lg mx-auto">
          {/* Header minimalista */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-montserrat font-bold text-white mb-3">
              Festa de Fim de Ano
            </h2>
            <p className="text-gray-400 text-lg">
              Sua contribuição torna tudo possível, tornando mais fácil e melhor para todos e em todos os lugares.
            </p>
          </div>

          {/* Card principal estilo moderno */}
          <div className="bg-gray-800 border border-gray-700 rounded-2xl p-8 relative overflow-hidden">
            {/* Gradient sutil no fundo */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent"></div>
            
            <div className="relative z-10">
              {/* Preço destacado */}
              <div className="mb-8">
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-bold text-white">R$900</span>
                  <span className="text-gray-400 text-lg">/ contribuição</span>
                </div>
              </div>

              {/* Lista de benefícios */}
              <div className="space-y-4 mb-8">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-white font-medium">{benefit.title}</p>
                      <p className="text-gray-400 text-sm">{benefit.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Formulário */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Digite seu nome completo"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    required
                    className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 focus:border-primary focus:ring-primary/20"
                  />
                </div>

                <div>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Digite seu email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    required
                    className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 focus:border-primary focus:ring-primary/20"
                  />
                </div>

                <div>
                  <Input
                    id="cpf"
                    type="text"
                    placeholder="CPF (opcional)"
                    value={formData.cpf}
                    onChange={(e) => handleInputChange('cpf', e.target.value)}
                    maxLength={14}
                    className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 focus:border-primary focus:ring-primary/20"
                  />
                </div>

                {/* Nota de segurança */}
                <div className="flex items-center gap-2 text-gray-400 text-sm mb-6">
                  <Shield className="w-4 h-4" />
                  <span>Pagamento 100% seguro e processado com criptografia</span>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-white hover:bg-gray-100 text-gray-900 font-montserrat font-semibold py-4 text-lg transition-all duration-300 hover:scale-[1.02] disabled:hover:scale-100 rounded-xl"
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900 mr-2"></div>
                      Processando...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <span>Contribuir agora</span>
                      <ArrowRight className="w-5 h-5" />
                    </div>
                  )}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};