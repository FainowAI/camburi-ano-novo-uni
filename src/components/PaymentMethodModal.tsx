import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CreditCard, QrCode } from "lucide-react";

interface PaymentMethodModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectCard: () => void;
  onSelectPix: () => void;
}

export const PaymentMethodModal = ({ 
  open, 
  onOpenChange, 
  onSelectCard, 
  onSelectPix 
}: PaymentMethodModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-gray-800 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white text-center">
            Escolha o método de pagamento
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <Button
            onClick={onSelectCard}
            className="flex items-center gap-3 h-16 bg-white hover:bg-gray-100 text-gray-900 text-lg font-semibold"
          >
            <CreditCard className="w-6 h-6" />
            Cartão de Crédito
            <span className="text-sm font-normal text-gray-600 ml-auto">
              Parcelamento disponível
            </span>
          </Button>
          
          <Button
            onClick={onSelectPix}
            variant="outline"
            className="flex items-center gap-3 h-16 border-gray-600 text-white hover:bg-gray-700 text-lg font-semibold"
          >
            <QrCode className="w-6 h-6" />
            PIX
            <span className="text-sm font-normal text-gray-400 ml-auto">
              Pagamento instantâneo
            </span>
          </Button>
        </div>
        
        <p className="text-gray-400 text-sm text-center">
          Valor: R$ 900,00
        </p>
      </DialogContent>
    </Dialog>
  );
};