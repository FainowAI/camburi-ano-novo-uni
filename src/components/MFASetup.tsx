import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Smartphone, Check } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface MFASetupProps {
  onComplete?: () => void;
}

const MFASetup = ({ onComplete }: MFASetupProps) => {
  const [step, setStep] = useState<'info' | 'setup' | 'verify'>('info');
  const [qrCode, setQrCode] = useState<string>('');
  const [secret, setSecret] = useState<string>('');
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const { enrollMFA, verifyMFA } = useAuth();

  const handleStartSetup = async () => {
    setLoading(true);
    const { error, qrCode, secret } = await enrollMFA();
    
    if (!error && qrCode && secret) {
      setQrCode(qrCode);
      setSecret(secret);
      setStep('setup');
    }
    
    setLoading(false);
  };

  const handleVerifySetup = async () => {
    setLoading(true);
    const { error } = await verifyMFA(verificationCode);
    
    if (!error) {
      setStep('verify');
      onComplete?.();
    }
    
    setLoading(false);
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <Card>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Shield className="w-8 h-8 text-primary" />
            </div>
          </div>
          <CardTitle>Configurar Autenticação em Duas Etapas</CardTitle>
          <CardDescription>
            Adicione uma camada extra de segurança à sua conta
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 'info' && (
            <div className="space-y-4">
              <Alert>
                <Smartphone className="h-4 w-4" />
                <AlertDescription>
                  Você precisará de um aplicativo autenticador como Google Authenticator, 
                  Authy ou Microsoft Authenticator instalado no seu celular.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-2">
                <h4 className="font-medium">Como funciona:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Escaneie o código QR com seu app autenticador</li>
                  <li>• Digite o código de 6 dígitos para confirmar</li>
                  <li>• Use códigos do app para fazer login</li>
                </ul>
              </div>
              
              <Button onClick={handleStartSetup} className="w-full" disabled={loading}>
                {loading ? 'Configurando...' : 'Começar Configuração'}
              </Button>
            </div>
          )}

          {step === 'setup' && (
            <div className="space-y-4">
              <div className="text-center space-y-4">
                <h4 className="font-medium">1. Escaneie o código QR</h4>
                {qrCode && (
                  <div className="flex justify-center">
                    <img src={qrCode} alt="QR Code" className="border rounded-lg" />
                  </div>
                )}
                
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Ou digite manualmente esta chave:
                  </p>
                  <code className="text-xs bg-muted p-2 rounded block break-all">
                    {secret}
                  </code>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">2. Digite o código do app</h4>
                <Label htmlFor="verification-code">Código de verificação</Label>
                <Input
                  id="verification-code"
                  type="text"
                  placeholder="000000"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  maxLength={6}
                  className="text-center text-lg tracking-widest font-mono"
                />
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setStep('info')}
                  className="flex-1"
                >
                  Voltar
                </Button>
                <Button
                  onClick={handleVerifySetup}
                  className="flex-1"
                  disabled={loading || verificationCode.length !== 6}
                >
                  {loading ? 'Verificando...' : 'Confirmar'}
                </Button>
              </div>
            </div>
          )}

          {step === 'verify' && (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center">
                  <Check className="w-8 h-8 text-green-500" />
                </div>
              </div>
              <div>
                <h4 className="font-medium">Configuração Concluída!</h4>
                <p className="text-sm text-muted-foreground">
                  A autenticação em duas etapas foi ativada com sucesso.
                  A partir do próximo login, você precisará do código do app.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MFASetup;