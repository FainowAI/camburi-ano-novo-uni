import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CreditCard, Calendar, QrCode } from "lucide-react";

interface PaymentMethodModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectOneTime: () => void;
  onSelectInstallment: () => void;
  onSelectPix: () => void;
}

export const PaymentMethodModal = ({ 
  open, 
  onOpenChange, 
  onSelectOneTime, 
  onSelectInstallment,
  onSelectPix 
}: PaymentMethodModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl bg-gray-800 border-gray-700 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white text-center text-lg sm:text-xl mb-4">
            Escolha a forma de pagamento
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 py-4">
          {/* À Vista */}
          <Button
            onClick={onSelectOneTime}
            variant="outline"
            className="flex flex-col items-center gap-2 sm:gap-3 h-28 sm:h-32 border-2 border-green-500 text-white hover:bg-green-500/10 font-semibold p-3 sm:p-4 rounded-xl transition-all duration-200 hover:scale-105"
          >
            <CreditCard className="w-6 h-6 sm:w-8 sm:h-8 text-green-400" />
            <div className="text-center">
              <div className="text-sm sm:text-lg font-bold text-green-400">À vista</div>
              <div className="text-lg sm:text-2xl font-bold text-green-400">R$ 900,00</div>
              <div className="text-xs sm:text-sm font-normal text-gray-400">Pagamento único</div>
            </div>
          </Button>
          
          {/* Parcelado */}
          <Button
            onClick={onSelectInstallment}
            variant="outline"
            className="flex flex-col items-center gap-2 sm:gap-3 h-28 sm:h-32 border-2 border-blue-500 text-white hover:bg-blue-500/10 font-semibold p-3 sm:p-4 rounded-xl transition-all duration-200 hover:scale-105"
          >
            <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400" />
            <div className="text-center">
              <div className="text-sm sm:text-lg font-bold text-blue-400">Parcelado</div>
              <div className="text-lg sm:text-2xl font-bold text-blue-400">3x R$ 300,00</div>
              <div className="text-xs sm:text-sm font-normal text-gray-400">Sem juros mensais</div>
            </div>
          </Button>

          {/* PIX */}
          <Button
            onClick={onSelectPix}
            variant="outline"
            className="flex flex-col items-center gap-2 sm:gap-3 h-28 sm:h-32 border-2 border-purple-500 text-white hover:bg-purple-500/10 font-semibold p-3 sm:p-4 rounded-xl transition-all duration-200 hover:scale-105"
          >
            <QrCode className="w-6 h-6 sm:w-8 sm:h-8 text-purple-400" />
            <div className="text-center">
              <div className="text-sm sm:text-lg font-bold text-purple-400">PIX</div>
              <div className="text-lg sm:text-2xl font-bold text-purple-400">R$ 900,00</div>
              <div className="text-xs sm:text-sm font-normal text-gray-400">Pagamento instantâneo</div>
            </div>
          </Button>
        </div>
        
        <p className="text-gray-400 text-xs text-center mt-4">
          * No pagamento parcelado, o valor será cobrado mensalmente por 3 meses
        </p>
      </DialogContent>
    </Dialog>
  );
};