import { useState } from 'react';
import { pineconeService } from '../lib/services/pineconeService';

export function PineconeTest() {
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState<boolean | null>(null);
  
  const testConnection = async () => {
    setLoading(true);
    setStatus('Testing connection to Pinecone...');
    
    try {
      const result = await pineconeService.testConnection();
      setTestResult(result);
      setStatus(result ? 'Connection successful!' : 'Connection failed!');
    } catch (error) {
      console.error('Error testing connection:', error);
      setTestResult(false);
      setStatus(`Connection failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-4">Pinecone Connection Test</h1>
      
      <div className="mb-6">
        <button 
          onClick={testConnection}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
        >
          {loading ? 'Testing...' : 'Test Pinecone Connection'}
        </button>
      </div>
      
      {status && (
        <div className={`p-4 rounded mb-4 ${
          testResult === true ? 'bg-green-100 text-green-800' : 
          testResult === false ? 'bg-red-100 text-red-800' : 
          'bg-yellow-100 text-yellow-800'
        }`}>
          <p>{status}</p>
        </div>
      )}
      
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-2">Troubleshooting</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>Make sure the API server is running on port 3000</li>
          <li>Check that Pinecone API key is correctly set in your .env file</li>
          <li>Verify that the index name matches your Pinecone console</li>
          <li>Check browser console for detailed error messages</li>
        </ul>
      </div>
    </div>
  );
}

export default PineconeTest; 