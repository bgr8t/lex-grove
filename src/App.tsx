import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import Index from '@/pages/Index';
import CaseBrief from '@/pages/case-brief';
import Library from '@/pages/Library';
import About from '@/pages/About';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/case-brief/:id" element={<CaseBrief />} />
        <Route path="/library" element={<Library />} />
        <Route path="/about" element={<About />} />
      </Routes>
      <Toaster />
    </Router>
  );
}

export default App;
