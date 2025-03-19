import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const TestModeNotice = () => {
  return (
    <Alert className="my-4 max-w-xl mx-auto bg-blue-50 border-blue-200">
      <AlertCircle className="h-4 w-4 text-blue-500" />
      <AlertTitle className="text-blue-700">Test Mode Active</AlertTitle>
      <AlertDescription>
        <p className="mb-2">
          Stripe is running in test mode. Use the following test card for payments:
        </p>
        <ul className="list-disc pl-6 space-y-1 text-sm">
          <li>Card Number: <code className="bg-muted p-1 rounded">4242 4242 4242 4242</code></li>
          <li>Expiration: Any future date (e.g. 12/34)</li>
          <li>CVC: Any 3 digits</li>
          <li>Name/Address: Any values</li>
        </ul>
        <p className="mt-2 text-xs">
          No real charges will be made during test mode.
        </p>
      </AlertDescription>
    </Alert>
  );
};

export default TestModeNotice; 