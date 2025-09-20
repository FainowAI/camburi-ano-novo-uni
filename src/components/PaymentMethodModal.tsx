import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CreditCard, Calendar } from "lucide-react";

interface PaymentMethodModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectOneTime: () => void;
  onSelectInstallment: () => void;
}

export const PaymentMethodModal = ({ 
  open, 
  onOpenChange, 
  onSelectOneTime, 
  onSelectInstallment 
}: PaymentMethodModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-gray-800 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white text-center">
            Escolha a forma de pagamento
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <Button
            onClick={onSelectOneTime}
            className="flex flex-col items-center gap-3 h-20 bg-white hover:bg-gray-100 text-gray-900 text-lg font-semibold p-4"
          >
            <div className="flex items-center gap-2">
              <CreditCard className="w-6 h-6" />
              <span>À vista</span>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">R$ 900,00</div>
              <div className="text-sm font-normal text-gray-600">Pagamento único</div>
            </div>
          </Button>
          
          <Button
            onClick={onSelectInstallment}
            variant="outline"
            className="flex flex-col items-center gap-3 h-20 border-gray-600 text-white hover:bg-gray-700 text-lg font-semibold p-4"
          >
            <div className="flex items-center gap-2">
              <Calendar className="w-6 h-6" />
              <span>Parcelado</span>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">3x R$ 300,00</div>
              <div className="text-sm font-normal text-gray-400">Sem juros mensais</div>
            </div>
          </Button>
        </div>
        
        <p className="text-gray-400 text-xs text-center">
          * No pagamento parcelado, o valor será cobrado mensalmente por 3 meses
        </p>
      </DialogContent>
    </Dialog>
  );
};