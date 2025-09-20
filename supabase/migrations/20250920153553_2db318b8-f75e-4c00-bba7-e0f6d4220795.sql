-- Enable RLS on photos table
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to view photos
CREATE POLICY "Anyone can view photos" 
ON public.photos 
FOR SELECT 
USING (true);