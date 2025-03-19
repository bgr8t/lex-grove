import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { checkEnvVariables } from './utils/env-test'

// Check environment variables are loaded
checkEnvVariables();

// Import firebase to initialize it
import './lib/firebase';

createRoot(document.getElementById("root")!).render(<App />);
