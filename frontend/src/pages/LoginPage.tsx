import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getApiErrorMessage } from '../utils/getApiErrorMessage';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Ticket } from 'lucide-react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../components/ui/form';
import { toast } from 'sonner';

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Parse redirect state or default to "/"
  const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? '/';

  // React to already authenticated users
  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  // Check if routed due to session expiration
  useEffect(() => {
    if (sessionStorage.getItem('show_expired_toast') === 'true') {
      sessionStorage.removeItem('show_expired_toast');
      toast.error('Your session has expired. Please login again.');
    }
  }, []);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      await login(data);
      navigate(from, { replace: true });
    } catch (err) {
      setErrorMsg(getApiErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background relative flex flex-col items-center justify-center p-4 overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-brand-pink/10 rounded-full blur-[100px] -z-10" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-brand-purple/10 rounded-full blur-[120px] -z-10" />

      <div className="w-full max-w-md space-y-8 z-10">
        
        {/* App Logo Branding */}
        <div className="flex flex-col items-center gap-2.5 text-center">
          <div className="p-3.5 rounded-2xl bg-brand-gradient text-primary-foreground shadow-brand-glow animate-pulse">
            <Ticket className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight mt-2 text-white">
            Sort<span className="text-brand-gradient font-black">My</span>Scene
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground font-medium">
            Sign in to discover and book event seats
          </p>
        </div>

        {/* Login Card */}
        <Card className="border border-border/40 shadow-2xl bg-card/85 backdrop-blur-md rounded-2xl overflow-hidden">
          <CardHeader className="space-y-1.5 pb-6">
            <CardTitle className="text-2xl font-bold text-white">Welcome Back</CardTitle>
            <CardDescription className="text-muted-foreground text-xs sm:text-sm">Enter your email and password to access your account</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
                {errorMsg && (
                  <Alert variant="destructive" className="border-destructive/20 bg-destructive/10 text-destructive-foreground">
                    <AlertTitle className="font-bold text-sm">Login Failed</AlertTitle>
                    <AlertDescription className="text-xs">{errorMsg}</AlertDescription>
                  </Alert>
                )}

                {/* Email Field */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email Address</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="you@example.com"
                          autoComplete="email"
                          type="email"
                          className="bg-secondary/40 border-border/60 rounded-xl focus-visible:ring-primary focus-visible:border-primary/80 transition-all duration-200"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-xs font-semibold" />
                    </FormItem>
                  )}
                />

                {/* Password Field */}
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Password</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="••••••••"
                          autoComplete="current-password"
                          type="password"
                          className="bg-secondary/40 border-border/60 rounded-xl focus-visible:ring-primary focus-visible:border-primary/80 transition-all duration-200"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-xs font-semibold" />
                    </FormItem>
                  )}
                />

                {/* Submit button with loader */}
                <Button type="submit" className="w-full mt-4 font-bold rounded-xl h-11 text-white shadow-lg shadow-primary/20 hover:shadow-primary/35 transition-all duration-300" isLoading={isSubmitting}>
                  Sign In
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex justify-center border-t py-5 border-border/40 bg-secondary/10">
            <p className="text-xs sm:text-sm text-muted-foreground">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary font-bold hover:text-primary/80 hover:underline transition-colors duration-150">
                Create account
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
