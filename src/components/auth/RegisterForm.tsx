import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { AlertCircle } from 'lucide-react';

const formSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  email: z.string().email({ message: 'Please enter a valid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
  confirmPassword: z.string().min(6, { message: 'Confirm password must be at least 6 characters' }),
  secretCode: z.string().refine(val => val === 'H25', {
    message: 'Invalid secret code',
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type FormData = z.infer<typeof formSchema>;

export function RegisterForm() {
  const { signUp, updateUserProfile, checkEmailExists } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [emailExists, setEmailExists] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  // Watch the email field for changes
  const watchedEmail = watch("email");

  // Check if email exists when the email field loses focus
  const handleEmailBlur = async () => {
    if (watchedEmail && !errors.email) {
      try {
        const exists = await checkEmailExists(watchedEmail);
        setEmailExists(exists);
      } catch (error) {
        console.error("Error checking email:", error);
      }
    }
  };

  const onSubmit = async (data: FormData) => {
    // First check if the email already exists
    try {
      setLoading(true);
      
      // Verify secret code
      if (data.secretCode !== 'H25') {
        toast({
          title: "Invalid Secret Code",
          description: "The secret code you entered is invalid.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
      
      const exists = await checkEmailExists(data.email);
      
      if (exists) {
        setEmailExists(true);
        toast({
          title: "Account Already Exists",
          description: (
            <div>
              This email is already registered. Please <Link to="/login" className="underline font-medium text-primary">login</Link> instead or use a different email.
            </div>
          ),
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
      
      // Continue with registration if email doesn't exist
      const userCredential = await signUp(data.email, data.password);
      
      // Update user profile with name
      if (userCredential.user) {
        await updateUserProfile(data.name);
      }
      
      toast({
        title: "Success",
        description: "Your account has been created successfully",
      });
      navigate('/');
    } catch (error: any) {
      console.error('Registration error:', error);
      
      // Handle specific Firebase error codes
      if (error.code === 'auth/email-already-in-use') {
        toast({
          title: "Account Already Exists",
          description: (
            <div>
              This email is already registered. Please <Link to="/login" className="underline font-medium text-primary">login</Link> instead or use a different email.
            </div>
          ),
          variant: "destructive",
        });
      } else {
        // Generic error for other cases
        toast({
          title: "Registration Failed",
          description: error.message || "Failed to register. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Register</CardTitle>
        <CardDescription>Create a new account to access Lex Grove. A secret code is required for registration.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="John Doe"
              {...register('name')}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="email@example.com"
              {...register('email')}
              onBlur={handleEmailBlur}
              className={emailExists ? "border-red-500" : ""}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
            {emailExists && !errors.email && (
              <div className="flex items-center gap-2 text-sm text-red-500 mt-1">
                <AlertCircle className="h-4 w-4" />
                <p>
                  Email already in use. <Link to="/login" className="underline font-medium">Login instead?</Link>
                </p>
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              {...register('password')}
            />
            {errors.password && (
              <p className="text-sm text-red-500">{errors.password.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              {...register('confirmPassword')}
            />
            {errors.confirmPassword && (
              <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="secretCode">Secret Code</Label>
            <Input
              id="secretCode"
              type="text"
              placeholder="Enter the secret code"
              {...register('secretCode')}
            />
            {errors.secretCode && (
              <p className="text-sm text-red-500">{errors.secretCode.message}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              A secret code is required for exclusive access to Lex Grove. If you don't have a code, please contact an administrator.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => navigate('/login')}
            type="button"
          >
            Back to Login
          </Button>
          <Button 
            type="submit" 
            disabled={loading || emailExists}
          >
            {loading ? 'Registering...' : 'Register'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
} 