import { RegisterForm } from '@/components/auth/RegisterForm';

export default function Register() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md">
        <RegisterForm />
      </div>
    </div>
  );
} 