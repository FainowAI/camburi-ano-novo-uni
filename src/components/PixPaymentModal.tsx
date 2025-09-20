import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import QRCode from "qrcode";

interface PixPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  pixCode: string;
  amount: number;
}

export const PixPaymentModal = ({ isOpen, onClose, pixCode, amount }: PixPaymentModalProps) => {
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold">
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
        
        <div className="space-y-6">
          {/* Amount */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Valor a pagar</p>
            <p className="text-2xl font-bold text-primary">
              R$ {amount.toFixed(2).replace('.', ',')}
            </p>
          </div>

          {/* QR Code */}
          <div className="flex justify-center">
            {qrCodeDataUrl ? (
              <div className="p-4 bg-white rounded-lg border">
                <img 
                  src={qrCodeDataUrl} 
                  alt="QR Code PIX" 
                  className="w-48 h-48"
                />
              </div>
            ) : (
              <div className="w-48 h-48 bg-muted rounded-lg flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="text-center space-y-2">
            <p className="text-sm font-medium">Como pagar:</p>
            <ol className="text-xs text-muted-foreground space-y-1">
              <li>1. Abra o app do seu banco</li>
              <li>2. Escaneie o QR Code acima</li>
              <li>3. Ou copie e cole o código PIX</li>
              <li>4. Confirme o pagamento</li>
            </ol>
          </div>

          {/* PIX Code */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Código PIX:</p>
            <div className="relative">
              <div className="p-3 bg-muted rounded-lg text-xs font-mono break-all">
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

          {/* Footer */}
          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              O pagamento será processado automaticamente após a confirmação.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};