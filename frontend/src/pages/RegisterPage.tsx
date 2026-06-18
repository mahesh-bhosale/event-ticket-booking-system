import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
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

const registerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z
    .string()
    .min(6, 'Password too short')
    .regex(/[A-Z]/, 'Password must contain uppercase letter')
    .regex(/[0-9]/, 'Password must contain number'),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const { register: signUp, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // React to already authenticated users
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      await signUp(data);
      navigate('/', { replace: true });
    } catch (err) {
      setErrorMsg(getApiErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        
        {/* App Logo */}
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="p-3 rounded-2xl bg-primary text-primary-foreground shadow-md animate-bounce">
            <Ticket className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight mt-2">
            Sort<span className="text-primary">My</span>Scene
          </h1>
          <p className="text-sm text-muted-foreground">
            Sign up to book tickets and manage reservations
          </p>
        </div>

        {/* Register Card */}
        <Card className="border border-border/40 shadow-xl bg-card/45 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Create Account</CardTitle>
            <CardDescription>Enter details below to sign up for a new account</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
                {errorMsg && (
                  <Alert variant="destructive">
                    <AlertTitle className="font-bold">Registration Failed</AlertTitle>
                    <AlertDescription>{errorMsg}</AlertDescription>
                  </Alert>
                )}

                {/* Name Field */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="John Doe"
                          autoComplete="name"
                          type="text"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                          autoComplete="new-password"
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
                  Sign Up
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex justify-center border-t py-4 border-border/40">
            <p className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link to="/login" className="text-primary font-semibold hover:underline">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
