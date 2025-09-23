import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import QRCode from "qrcode";

interface PixPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  pixCode: string;
  amount: number;
  onPaymentConfirmed?: () => void;
  userData?: {
    name: string;
    email: string;
    telefone: string;
  };
  analytics?: {
    trackPixCodeCopy: () => void;
    trackPixPaymentConfirmed: () => void;
    trackPixModalClose: (reason: 'confirmed' | 'cancelled' | 'abandoned') => void;
  };
}

export const PixPaymentModal = ({ isOpen, onClose, pixCode, amount, onPaymentConfirmed, userData, analytics }: PixPaymentModalProps) => {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && pixCode) {
      QRCode.toDataURL(pixCode, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })
        .then((url) => setQrCodeDataUrl(url))
        .catch((err) => console.error('Error generating QR code:', err));
    }
  }, [isOpen, pixCode]);

  const handleCopyPixCode = async () => {
    try {
      await navigator.clipboard.writeText(pixCode);
      setCopied(true);
      
      // Track PIX code copy event
      analytics?.trackPixCodeCopy();
      
      toast({
        title: "Código PIX copiado!",
        description: "O código foi copiado para sua área de transferência.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar o código PIX.",
        variant: "destructive"
      });
    }
  };

  const handlePaymentConfirmed = async () => {
    try {
      // Track PIX payment confirmation
      analytics?.trackPixPaymentConfirmed();
      
      // Send payment log with pagou_pix = true
      if (userData) {
        const { error: logError } = await supabase.functions.invoke('log-payment', {
          body: {
            name: userData.name,
            email: userData.email,
            telefone: userData.telefone,
            payment_method: "a vista pix",
            pagou_pix: true
          }
        });

        if (logError) {
          console.error("Error logging payment:", logError);
        }
      }

      toast({
        title: "Pagamento confirmado!",
        description: "Obrigado pela sua contribuição. Entraremos em contato em breve.",
      });
      
      if (onPaymentConfirmed) {
        onPaymentConfirmed();
      }
      
      // Track modal close as confirmed
      analytics?.trackPixModalClose('confirmed');
      onClose();
    } catch (error) {
      console.error("Error confirming payment:", error);
      toast({
        title: "Erro ao confirmar pagamento",
        description: "Tente novamente ou entre em contato.",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg sm:text-xl font-semibold">
              Pagamento PIX
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-6 w-6"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Amount */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Valor a pagar</p>
            <p className="text-xl sm:text-2xl font-bold text-primary">
              R$ {amount.toFixed(2).replace('.', ',')}
            </p>
          </div>

          {/* Main Content - Responsive Layout */}
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
            {/* QR Code */}
            <div className="flex-shrink-0 flex justify-center sm:justify-start">
              {qrCodeDataUrl ? (
                <div className="p-3 bg-white rounded-lg border">
                  <img 
                    src={qrCodeDataUrl} 
                    alt="QR Code PIX" 
                    className="w-40 h-40 sm:w-32 sm:h-32"
                  />
                </div>
              ) : (
                <div className="w-40 h-40 sm:w-32 sm:h-32 bg-muted rounded-lg flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              )}
            </div>

            {/* Instructions and PIX Code */}
            <div className="flex-1 space-y-4">
              {/* Instructions */}
              <div className="space-y-2">
                <p className="text-sm font-medium">Como pagar:</p>
                <ol className="text-xs sm:text-sm text-muted-foreground space-y-1">
                  <li>1. Abra o app do seu banco</li>
                  <li>2. Escaneie o QR Code <span className="sm:hidden">acima</span><span className="hidden sm:inline">ao lado</span></li>
                  <li>3. Ou copie e cole o código PIX abaixo</li>
                  <li>4. Confirme o pagamento</li>
                </ol>
              </div>

              {/* PIX Code */}
              <div className="space-y-2">
                <p className="text-sm font-medium">Código PIX:</p>
                <div className="relative">
                  <div className="p-2 bg-muted rounded-lg text-xs font-mono break-all max-h-20 overflow-y-auto">
                    {pixCode}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCopyPixCode}
                    className="mt-2 w-full"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-2" />
                        Copiar código PIX
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Confirmation Section */}
          <div className="border-t pt-4 space-y-3">
            {/* Warning Message */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-800 text-sm font-medium">
                ⚠️ Após o pagamento via PIX, volte aqui e confirme o envio
              </p>
            </div>

            {/* Confirmation Button */}
            <div className="text-center">
              <Button
                onClick={handlePaymentConfirmed}
                className="bg-green-600 hover:bg-green-700 text-white px-8"
              >
                <Check className="w-4 h-4 mr-2" />
                Confirmar Pagamento Realizado
              </Button>
            </div>

            {/* Footer */}
            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                Clique em "Confirmar Pagamento Realizado" após efetuar o PIX.
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};