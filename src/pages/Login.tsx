import { LoginForm } from '@/components/auth/LoginForm';

export default function Login() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md">
        <LoginForm />
      </div>
    </div>
  );
} 