import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any; needsMFA?: boolean }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  verifyMFA: (token: string) => Promise<{ error: any }>;
  enrollMFA: () => Promise<{ error: any; qrCode?: string; secret?: string }>;
  unenrollMFA: (factorId: string) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Check if user is admin when session changes
        if (session?.user) {
          setTimeout(() => {
            checkAdminRole(session.user.id);
          }, 0);
        } else {
          setIsAdmin(false);
        }
        
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        checkAdminRole(session.user.id);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAdminRole = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .maybeSingle();
      
      setIsAdmin(!!data);
    } catch (error) {
      console.error('Error checking admin role:', error);
      setIsAdmin(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error, data } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        let errorMessage = "Erro ao fazer login";
        let needsMFA = false;
        
        if (error.message.includes('Invalid login credentials')) {
          errorMessage = "Email ou senha incorretos";
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = "Por favor, confirme seu email antes de fazer login";
        } else if (error.message.includes('MFA challenge required') || error.message.includes('MFA enrollment is required')) {
          needsMFA = true;
          
          // Try to challenge MFA
          try {
            const { data: mfaData } = await supabase.auth.mfa.challenge({
              factorId: data?.user?.factors?.[0]?.id || ''
            });
            
            if (mfaData?.id) {
              sessionStorage.setItem('mfa_challenge_id', mfaData.id);
            }
          } catch (mfaError) {
            console.error('MFA challenge error:', mfaError);
          }
          
          errorMessage = "Código de autenticação necessário";
        }
        
        if (!needsMFA) {
          toast({
            title: "Erro de Login",
            description: errorMessage,
            variant: "destructive"
          });
        }
        
        return { error, needsMFA };
      }
      
      return { error };
    } catch (error) {
      console.error('Login error:', error);
      return { error };
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl
        }
      });
      
      if (error) {
        let errorMessage = "Erro ao criar conta";
        if (error.message.includes('User already registered')) {
          errorMessage = "Este email já está cadastrado";
        } else if (error.message.includes('Password should be at least')) {
          errorMessage = "A senha deve ter pelo menos 6 caracteres";
        }
        
        toast({
          title: "Erro de Cadastro",
          description: errorMessage,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Conta Criada",
          description: "Verifique seu email para confirmar a conta",
        });
      }
      
      return { error };
    } catch (error) {
      console.error('Signup error:', error);
      return { error };
    }
  };

  const verifyMFA = async (token: string) => {
    try {
      const challengeId = sessionStorage.getItem('mfa_challenge_id');
      if (!challengeId) {
        throw new Error('No MFA challenge found');
      }

      const { error } = await supabase.auth.mfa.verify({
        factorId: challengeId,
        challengeId,
        code: token
      });
      
      if (error) {
        toast({
          title: "Erro de Verificação",
          description: "Código inválido ou expirado",
          variant: "destructive"
        });
      } else {
        sessionStorage.removeItem('mfa_challenge_id');
        toast({
          title: "Autenticação Confirmada",
          description: "Login realizado com sucesso",
        });
      }
      
      return { error };
    } catch (error) {
      console.error('MFA verification error:', error);
      return { error };
    }
  };

  const enrollMFA = async () => {
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp'
      });
      
      if (error) {
        toast({
          title: "Erro ao Configurar MFA",
          description: "Não foi possível configurar a autenticação em duas etapas",
          variant: "destructive"
        });
      }
      
      return { 
        error, 
        qrCode: data?.totp?.qr_code,
        secret: data?.totp?.secret
      };
    } catch (error) {
      console.error('MFA enrollment error:', error);
      return { error };
    }
  };

  const unenrollMFA = async (factorId: string) => {
    try {
      const { error } = await supabase.auth.mfa.unenroll({
        factorId
      });
      
      if (error) {
        toast({
          title: "Erro ao Remover MFA",
          description: "Não foi possível remover a autenticação em duas etapas",
          variant: "destructive"
        });
      } else {
        toast({
          title: "MFA Removido",
          description: "Autenticação em duas etapas foi desabilitada",
        });
      }
      
      return { error };
    } catch (error) {
      console.error('MFA unenroll error:', error);
      return { error };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setIsAdmin(false);
      toast({
        title: "Logout",
        description: "Você foi desconectado com sucesso",
      });
    } catch (error) {
      console.error('Signout error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      signIn,
      signUp,
      signOut,
      isAdmin,
      verifyMFA,
      enrollMFA,
      unenrollMFA
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};