-- Criar tabela para eventos detalhados do funil de checkout
CREATE TABLE public.checkout_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  user_name TEXT,
  user_email TEXT,
  user_cpf TEXT,
  payment_method TEXT,
  checkout_session_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.checkout_events ENABLE ROW LEVEL SECURITY;

-- Criar políticas de RLS
CREATE POLICY "Anyone can insert checkout events" 
ON public.checkout_events 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can view checkout events" 
ON public.checkout_events 
FOR SELECT 
USING (true);

-- Criar índices para performance
CREATE INDEX idx_checkout_events_session_id ON public.checkout_events(session_id);
CREATE INDEX idx_checkout_events_event_type ON public.checkout_events(event_type);
CREATE INDEX idx_checkout_events_created_at ON public.checkout_events(created_at);
CREATE INDEX idx_checkout_events_email ON public.checkout_events(user_email);

-- Criar função para atualizar timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;