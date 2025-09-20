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
  const [showPaymentModal, setShowPaymentModal] = useState(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
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
      email_domain: formData.email.split('@')[1] || 'unknown'
    });

    // Abrir modal de seleção de pagamento
    setShowPaymentModal(true);
    
    // Track modal opening
    await trackEvent('payment_modal_opened');
  };

  const handleOneTimePayment = async () => {
    setShowPaymentModal(false);
    setIsSubmitting(true);

    try {
      // Track payment method selection
      await trackEvent('payment_method_selected', {
        payment_method: 'à vista',
        amount: 900,
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
    setShowPaymentModal(false);
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

  const handlePixPayment = async () => {
    setShowPaymentModal(false);
    
    try {
      // Track payment method selection
      await trackEvent('payment_method_selected', {
        payment_method: 'PIX',
        amount: 900,
        currency: 'BRL'
      });

      console.log("Logging PIX payment selection:", formData);
      
      // Log payment selection (keep for compatibility)
      const { error: logError } = await supabase.functions.invoke('log-payment', {
        body: {
          name: formData.name,
          email: formData.email,
          cpf: formData.cpf,
          payment_method: "PIX"
        }
      });

      if (logError) {
        console.error("Error logging payment:", logError);
      }

      // Track PIX selection (not implemented yet)
      await trackEvent('pix_selected_not_implemented', {
        payment_method: 'PIX'
      });

    } catch (error) {
      console.error("Error logging PIX payment:", error);
      await trackEvent('pix_error', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
    
    toast({
      title: "PIX em desenvolvimento",
      description: "A opção PIX estará disponível em breve!",
    });
  };

  const handleModalClose = async () => {
    setShowPaymentModal(false);
    // Track modal abandonment
    await trackEvent('payment_modal_abandoned');
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
              {/* Preço destacado com opções */}
              <div className="mb-8">
                <div className="text-center">
                  <div className="mb-2">
                    <span className="text-5xl font-bold text-white">R$900</span>
                    <span className="text-gray-400 text-lg ml-2">à vista</span>
                  </div>
                  <div className="text-gray-400">
                    <span className="text-sm">ou </span>
                    <span className="text-2xl font-semibold text-blue-400">3x R$300</span>
                    <span className="text-sm"> sem juros</span>
                  </div>
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

      <PaymentMethodModal
        open={showPaymentModal}
        onOpenChange={handleModalClose}
        onSelectOneTime={handleOneTimePayment}
        onSelectInstallment={handleInstallmentPayment}
        onSelectPix={handlePixPayment}
      />
    </section>
  );
};
