import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, Shield, Check, ArrowRight } from "lucide-react";
import { PaymentMethodModal } from "./PaymentMethodModal";
import { supabase } from "@/integrations/supabase/client";

export const DonationForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    cpf: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activePaymentType, setActivePaymentType] = useState<'onetime' | 'installment' | null>(null);
  const { toast } = useToast();
  
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
          user_cpf: formData.cpf || null,
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

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const handlePaymentTypeSelect = async (paymentType: 'onetime' | 'installment') => {
    setActivePaymentType(paymentType);
    
    // Track payment type selection
    await trackEvent('payment_type_selected', {
      payment_type: paymentType,
      amount: paymentType === 'onetime' ? 810 : 900
    });
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha nome e email.",
        variant: "destructive"
      });
      return;
    }

    // Track form submission
    await trackEvent('form_submitted', {
      has_cpf: !!formData.cpf,
      name_length: formData.name.length,
      email_domain: formData.email.split('@')[1] || 'unknown',
      payment_type: activePaymentType
    });

    if (activePaymentType === 'onetime') {
      handleOneTimePayment();
    } else {
      handleInstallmentPayment();
    }
  };

  const handleOneTimePayment = async () => {
    setIsSubmitting(true);

    try {
      // Track payment method selection
      await trackEvent('payment_method_selected', {
        payment_method: 'à vista',
        amount: 810,
        currency: 'BRL'
      });

      console.log("Logging payment selection and initiating one-time Stripe payment with data:", formData);
      
      // Log payment selection (keep for compatibility)
      const { error: logError } = await supabase.functions.invoke('log-payment', {
        body: {
          name: formData.name,
          email: formData.email,
          cpf: formData.cpf,
          payment_method: "à vista"
        }
      });

      if (logError) {
        console.error("Error logging payment:", logError);
      }

      // Track checkout initiation
      await trackEvent('checkout_started', {
        payment_method: 'à vista',
        checkout_type: 'one_time'
      });
      
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: {
          name: formData.name,
          email: formData.email,
          cpf: formData.cpf,
          payment_mode: "one_time"
        }
      });

      if (error) {
        await trackEvent('checkout_error', {
          error: error.message,
          payment_method: 'à vista'
        });
        throw error;
      }

      console.log("Payment session created:", data);
      
      // Track successful checkout session creation
      await trackEvent('checkout_session_created', {
        payment_method: 'à vista',
        checkout_session_id: data.url ? 'generated' : 'failed'
      });
      
      // Redirecionar para Stripe Checkout
      if (data.url) {
        // Track redirect to Stripe
        await trackEvent('redirected_to_stripe', {
          payment_method: 'à vista'
        });
        window.open(data.url, '_blank');
      }

    } catch (error) {
      console.error("Error creating one-time payment:", error);
      await trackEvent('payment_error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        payment_method: 'à vista'
      });
      toast({
        title: "Erro no pagamento",
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
        amount: 900,
        installments: 3,
        currency: 'BRL'
      });

      console.log("Logging payment selection and initiating installment Stripe payment with data:", formData);
      
      // Log payment selection (keep for compatibility)
      const { error: logError } = await supabase.functions.invoke('log-payment', {
        body: {
          name: formData.name,
          email: formData.email,
          cpf: formData.cpf,
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
          cpf: formData.cpf,
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
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-montserrat font-bold text-white mb-4">
            Festa de Fim de Ano
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Sua contribuição torna tudo possível, tornando mais fácil e melhor para todos e em todos os lugares.
          </p>
        </div>

        {/* Two-column payment options */}
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8">
          
          {/* One-time Payment - Left */}
          <div className="bg-white border border-gray-200 rounded-2xl p-8 relative overflow-hidden">
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
                    placeholder="CPF (opcional)"
                    value={formData.cpf}
                    onChange={(e) => handleInputChange('cpf', e.target.value)}
                    maxLength={14}
                    className="bg-gray-50 border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-primary"
                  />
                  
                  <div className="flex items-center gap-2 text-gray-600 text-xs mb-4">
                    <Shield className="w-3 h-3" />
                    <span>Pagamento 100% seguro</span>
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3 rounded-xl transition-all"
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
              ) : (
                <Button
                  onClick={() => handlePaymentTypeSelect('onetime')}
                  className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3 rounded-xl transition-all"
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
          <div className="bg-gray-800 border border-gray-700 rounded-2xl p-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-gray-800/5 to-transparent"></div>
            
            <div className="relative z-10">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-white mb-2">Parcelado</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-blue-400">3x R$300</span>
                  <div className="text-gray-400 text-sm mt-1">sem juros</div>
                </div>
                <div className="text-gray-500 text-sm">
                  Total: <span className="text-gray-400 font-medium">R$900</span>
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
                    placeholder="CPF (opcional)"
                    value={formData.cpf}
                    onChange={(e) => handleInputChange('cpf', e.target.value)}
                    maxLength={14}
                    className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 focus:border-primary"
                  />
                  
                  <div className="flex items-center gap-2 text-gray-400 text-xs mb-4">
                    <Shield className="w-3 h-3" />
                    <span>Pagamento 100% seguro</span>
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-all"
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
              ) : (
                <Button
                  onClick={() => handlePaymentTypeSelect('installment')}
                  className="w-full bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 rounded-xl transition-all"
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
    </section>
  );
};
