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
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        
        {/* App Logo Branding */}
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="p-3 rounded-2xl bg-primary text-primary-foreground shadow-md animate-bounce">
            <Ticket className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight mt-2">
            Sort<span className="text-primary">My</span>Scene
          </h1>
          <p className="text-sm text-muted-foreground">
            Sign in to discover and book event seats
          </p>
        </div>

        {/* Login Card */}
        <Card className="border border-border/40 shadow-xl bg-card/45 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Welcome Back</CardTitle>
            <CardDescription>Enter your email and password to access your account</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
                {errorMsg && (
                  <Alert variant="destructive">
                    <AlertTitle className="font-bold">Login Failed</AlertTitle>
                    <AlertDescription>{errorMsg}</AlertDescription>
                  </Alert>
                )}

                {/* Email Field */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="you@example.com"
                          autoComplete="email"
                          type="email"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Password Field */}
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="••••••••"
                          autoComplete="current-password"
                          type="password"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Submit button with loader */}
                <Button type="submit" className="w-full mt-2 font-bold" isLoading={isSubmitting}>
                  Sign In
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex justify-center border-t py-4 border-border/40">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary font-semibold hover:underline">
                Create account
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
