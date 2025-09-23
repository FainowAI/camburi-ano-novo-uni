import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, Shield, Check, ArrowRight } from "lucide-react";
import { PaymentMethodModal } from "./PaymentMethodModal";
import { PixPaymentModal } from "./PixPaymentModal";
import { supabase } from "@/integrations/supabase/client";

export const DonationForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    telefone: '',
    paymentMethod: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activePaymentType, setActivePaymentType] = useState<'onetime' | 'installment' | null>(null);
  const [showPixModal, setShowPixModal] = useState(false);
  const [donationConfirmed, setDonationConfirmed] = useState(false);
  const { toast } = useToast();

  const PIX_CODE = "00020126440014br.gov.bcb.pix0122unne.cambury@gmail.com27600016BR.COM.PAGSEGURO0136E4BDA145-AEE6-4416-A353-561976EFC0835204000053039865406810.005802BR5919EDSON ROBERTO FORAO6009Sao Paulo62290525PAGS0000810002509201311866304F775";
  
  // Track session for funnel analytics
  const sessionId = useRef(crypto.randomUUID());

  // Helper function to track events
  const trackEvent = async (eventType: string, additionalData = {}) => {
    try {
      await supabase.functions.invoke('track-checkout-event', {
        body: {
          session_id: sessionId.current,
          event_type: eventType,
          user_name: formData.name || null,
          user_email: formData.email || null,
          user_cpf: null,
          metadata: {
            timestamp: new Date().toISOString(),
            ...additionalData
          }
        }
      });
      console.log(`[ANALYTICS] Event tracked: ${eventType}`, additionalData);
    } catch (error) {
      console.error("Error tracking event:", error);
    }
  };

  const formatTelefone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    } else {
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
  };

  const handlePaymentTypeSelect = async (paymentType: 'onetime' | 'installment') => {
    setActivePaymentType(paymentType);
    
    // Track payment type selection
      await trackEvent('payment_type_selected', {
        payment_type: paymentType,
        amount: paymentType === 'onetime' ? 810 : 945
      });
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.telefone) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha nome, email e telefone.",
        variant: "destructive"
      });
      return;
    }

    if (!donationConfirmed) {
      toast({
        title: "Confirmação necessária",
        description: "Por favor, confirme que está fazendo uma doação para a UNNE Cambury.",
        variant: "destructive",
      });
      return;
    }

    // Para pagamento à vista, definir automaticamente como PIX
    if (activePaymentType === 'onetime') {
      setFormData(prev => ({ ...prev, paymentMethod: 'pix' }));
    }

    // Track form submission
    await trackEvent('form_submitted', {
      has_telefone: !!formData.telefone,
      name_length: formData.name.length,
      email_domain: formData.email.split('@')[1] || 'unknown',
      payment_type: activePaymentType,
      payment_method: activePaymentType === 'onetime' ? 'pix' : (formData.paymentMethod || 'card')
    });

    if (activePaymentType === 'onetime') {
      // Pagamento à vista é sempre PIX
      setShowPixModal(true);
    } else {
      handleInstallmentPayment();
    }
  };

  const handleOneTimePayment = async () => {
    setIsSubmitting(true);

    try {
      // Track payment method selection
      await trackEvent('payment_method_selected', {
        payment_method: 'pix',
        amount: 810,
        currency: 'BRL'
      });

      console.log("Logging payment selection and initiating one-time Stripe payment with data:", formData);
      
      // Log payment selection (keep for compatibility)
      const { error: logError } = await supabase.functions.invoke('log-payment', {
        body: {
          name: formData.name,
          email: formData.email,
          telefone: formData.telefone,
          payment_method: "a vista pix"
        }
      });

      if (logError) {
        console.error("Error logging payment:", logError);
      }

      // Track checkout initiation
      await trackEvent('checkout_started', {
        payment_method: 'pix',
        checkout_type: 'one_time'
      });
      
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: {
          name: formData.name,
          email: formData.email,
          telefone: formData.telefone,
          payment_mode: "one_time",
          payment_method: 'pix'
        }
      });

      if (error) {
        await trackEvent('checkout_error', {
          error: error.message,
          payment_method: 'pix'
        });
        throw error;
      }

      console.log("Payment session created:", data);
      
      // Track successful checkout session creation
      await trackEvent('checkout_session_created', {
        payment_method: 'pix',
        checkout_session_id: data.url ? 'generated' : 'failed'
      });
      
      // Redirecionar para Stripe Checkout
      if (data.url) {
        // Track redirect to Stripe
        await trackEvent('redirected_to_stripe', {
          payment_method: 'pix'
        });
        window.open(data.url, '_blank');
      }

    } catch (error) {
      console.error("Error creating one-time payment:", error);
      await trackEvent('payment_error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        payment_method: 'pix'
      });
      toast({
        title: "Erro no pagamento via PIX",
        description: "Não foi possível processar o pagamento. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInstallmentPayment = async () => {
    setIsSubmitting(true);

    try {
      // Track payment method selection
      await trackEvent('payment_method_selected', {
        payment_method: 'parcelado',
        amount: 945,
        installments: 4,
        currency: 'BRL'
      });

      console.log("Logging payment selection and initiating installment Stripe payment with data:", formData);
      
      // Log payment selection (keep for compatibility)
      const { error: logError } = await supabase.functions.invoke('log-payment', {
        body: {
          name: formData.name,
          email: formData.email,
          telefone: formData.telefone,
          payment_method: "parcelado"
        }
      });

      if (logError) {
        console.error("Error logging payment:", logError);
      }

      // Track checkout initiation
      await trackEvent('checkout_started', {
        payment_method: 'parcelado',
        checkout_type: 'installment'
      });
      
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: {
          name: formData.name,
          email: formData.email,
          telefone: formData.telefone,
          payment_mode: "installment"
        }
      });

      if (error) {
        await trackEvent('checkout_error', {
          error: error.message,
          payment_method: 'parcelado'
        });
        throw error;
      }

      console.log("Installment payment session created:", data);
      
      // Track successful checkout session creation
      await trackEvent('checkout_session_created', {
        payment_method: 'parcelado',
        checkout_session_id: data.url ? 'generated' : 'failed'
      });
      
      // Redirecionar para Stripe Checkout
      if (data.url) {
        // Track redirect to Stripe
        await trackEvent('redirected_to_stripe', {
          payment_method: 'parcelado'
        });
        window.open(data.url, '_blank');
      }

    } catch (error) {
      console.error("Error creating installment payment:", error);
      await trackEvent('payment_error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        payment_method: 'parcelado'
      });
      toast({
        title: "Erro no pagamento parcelado",
        description: "Não foi possível processar o pagamento parcelado. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };


  const handleInputChange = (field: string, value: string) => {
    if (field === 'telefone') {
      value = formatTelefone(value);
    }
    
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const benefits = [
    {
      title: "Acesso exclusivo à festa",
      description: "Garantia de entrada na celebração mais aguardada de Cambury."
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
    <section id="donation-form" className="py-12 sm:py-16 md:py-20 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="container mx-auto px-4 sm:px-6">
        {/* Header */}
          <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-montserrat font-bold text-white mb-4">
            Festa de Fim de Ano
            </h2>
          <p className="text-gray-400 text-base sm:text-lg max-w-2xl mx-auto">
            Sua contribuição torna tudo possível, tornando mais fácil e melhor para todos e em todos os lugares.
            </p>
          </div>

        {/* Two-column payment options */}
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          
          {/* One-time Payment - Left */}
          <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-6 md:p-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent"></div>
            
            <div className="relative z-10">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">À Vista</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-primary">R$810</span>
                  <div className="text-green-600 text-sm mt-1 font-medium">Economize R$90</div>
                </div>
                <div className="text-gray-500 text-sm">
                  <span className="line-through">R$900</span> • Desconto de 10%
                </div>
              </div>

              {/* Benefits */}
              <div className="space-y-3 mb-8">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-gray-900 text-sm font-medium">{benefit.title}</p>
                      <p className="text-gray-600 text-xs">{benefit.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Form or Button */}
              {activePaymentType === 'onetime' ? (
                <div className="animate-fade-in animate-scale-in">
                  <form onSubmit={handleFormSubmit} className="space-y-4">
                  <Input
                    type="text"
                    placeholder="Digite seu nome completo"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    required
                      className="bg-gray-50 border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-primary"
                    />
                  <Input
                    type="email"
                    placeholder="Digite seu email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    required
                      className="bg-gray-50 border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-primary"
                    />
                    <Input
                      type="text"
                      placeholder="Telefone"
                      value={formData.telefone}
                      onChange={(e) => handleInputChange('telefone', e.target.value)}
                      maxLength={15}
                      required
                      className="bg-gray-50 border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-primary"
                    />
                    
                    <div className="flex items-center space-x-2 mb-4">
                      <Checkbox 
                        id="donation-confirmation-1" 
                        checked={donationConfirmed}
                        onCheckedChange={(checked) => setDonationConfirmed(checked as boolean)}
                      />
                      <Label 
                        htmlFor="donation-confirmation-1" 
                        className="text-sm text-gray-700 cursor-pointer"
                      >
                        Ao aceitar confirmo que estou fazendo uma <span className="text-green-600 font-medium">doação</span> para a UNNE Cambury
                      </Label>
                    </div>
                    
                    <div>
                      <Label className="text-gray-700 text-sm font-medium mb-2 block">
                        Método de Pagamento
                      </Label>
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <div>
                          <p className="text-green-800 font-medium text-sm">Pagamento via PIX</p>
                          <p className="text-green-600 text-xs">Pagamento à vista disponível apenas via PIX</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 text-gray-600 text-xs mb-4">
                      <Shield className="w-3 h-3" />
                      <span>Pagamento 100% seguro</span>
                    </div>

                    <Button
                      type="submit"
                      disabled={isSubmitting || !donationConfirmed}
                      className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3 rounded-xl transition-all hover-scale disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Processando...
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          <span>Prosseguir para pagamento</span>
                          <ArrowRight className="w-4 h-4" />
                        </div>
                      )}
                    </Button>
                  </form>
                </div>
              ) : (
                <Button
                  onClick={() => handlePaymentTypeSelect('onetime')}
                  className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3 rounded-xl transition-all hover-scale"
                >
                  <div className="flex items-center justify-center gap-2">
                    <span>Contribuir agora</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </Button>
              )}
            </div>
          </div>

          {/* Installment Payment - Right */}
          <div className="bg-gray-800 border border-gray-700 rounded-2xl p-4 sm:p-6 md:p-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-gray-800/5 to-transparent"></div>
            
            <div className="relative z-10">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-white mb-2">Parcelado</h3>
                <div className="mb-4">
                  <div className="text-4xl font-bold text-blue-400">
                    4x R$225 <span className="text-lg text-gray-400">+ 5% de taxa</span>
                  </div>
                  <div className="text-gray-400 text-sm mt-1">sem juros</div>
                </div>
                <div className="text-gray-500 text-sm">
                  Total: <span className="text-gray-400 font-medium">R$945</span>
                </div>
              </div>

              {/* Benefits */}
              <div className="space-y-3 mb-8">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-white text-sm font-medium">{benefit.title}</p>
                      <p className="text-gray-400 text-xs">{benefit.description}</p>
                    </div>
                  </div>
                ))}
                </div>

              {/* Form or Button */}
              {activePaymentType === 'installment' ? (
                <div className="animate-fade-in animate-scale-in">
                  <form onSubmit={handleFormSubmit} className="space-y-4">
                  <Input
                    type="text"
                      placeholder="Digite seu nome completo"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      required
                      className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 focus:border-primary"
                    />
                    <Input
                      type="email"
                      placeholder="Digite seu email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                    required
                      className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 focus:border-primary"
                    />
                    <Input
                      type="text"
                      placeholder="Telefone"
                      value={formData.telefone}
                      onChange={(e) => handleInputChange('telefone', e.target.value)}
                      maxLength={15}
                      required
                      className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 focus:border-primary"
                    />
                    
                    <div className="flex items-center space-x-2 mb-4">
                      <Checkbox 
                        id="donation-confirmation-2" 
                        checked={donationConfirmed}
                        onCheckedChange={(checked) => setDonationConfirmed(checked as boolean)}
                        className="border-gray-600 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                      />
                      <Label 
                        htmlFor="donation-confirmation-2" 
                        className="text-sm text-gray-300 cursor-pointer"
                      >
                        Ao aceitar confirmo que estou fazendo uma <span className="text-green-400 font-medium">doação</span> para a UNNE Cambury
                      </Label>
                    </div>
                    
                    <div className="flex items-center gap-2 text-gray-400 text-xs mb-4">
                      <Shield className="w-3 h-3" />
                      <span>Pagamento 100% seguro</span>
                </div>

                <Button
                  type="submit"
                      disabled={isSubmitting || !donationConfirmed}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-all hover-scale disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Processando...
                    </div>
                  ) : (
                        <div className="flex items-center justify-center gap-2">
                          <span>Prosseguir para pagamento</span>
                          <ArrowRight className="w-4 h-4" />
                        </div>
                  )}
                </Button>
              </form>
                </div>
              ) : (
                <Button
                  onClick={() => handlePaymentTypeSelect('installment')}
                  className="w-full bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 rounded-xl transition-all hover-scale"
                >
                  <div className="flex items-center justify-center gap-2">
                    <span>Contribuir agora</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* PIX Payment Modal */}
      <PixPaymentModal
        isOpen={showPixModal}
        onClose={() => setShowPixModal(false)}
        pixCode={PIX_CODE}
        amount={810}
        onPaymentConfirmed={() => {
          // Aqui você pode adicionar lógica adicional após confirmação do pagamento
          console.log('Pagamento PIX confirmado pelo usuário');
        }}
      />
    </section>
  );
};
