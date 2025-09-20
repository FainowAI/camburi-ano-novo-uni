-- Create payment logs table
CREATE TABLE public.payment_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  cpf TEXT,
  payment_method TEXT NOT NULL,
  aceitou BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.payment_logs ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to insert (since this is for donation logs)
CREATE POLICY "Anyone can insert payment logs" 
ON public.payment_logs 
FOR INSERT 
WITH CHECK (true);

-- Create policy to allow reading payment logs (for admin purposes)
CREATE POLICY "Anyone can view payment logs" 
ON public.payment_logs 
FOR SELECT 
USING (true);