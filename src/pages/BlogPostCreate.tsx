/*
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// You can use a markdown editor like react-markdown or a textarea for simplicity

export default function BlogPostCreate() {
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.uid === '***REDACTED_ADMIN_UID***';
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [image, setImage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  if (!isAdmin) {
    return <div className="max-w-xl mx-auto mt-24 p-8 bg-white rounded-2xl shadow">You do not have permission to post a blog.</div>;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    // TODO: Save the blog post to your data source (e.g., Firestore, local file, etc.)
    // For now, just navigate back to /blog
    navigate('/blog');
  };

  return (
    <div className="max-w-2xl mx-auto mt-24 p-8 bg-white rounded-2xl shadow">
      <h1 className="text-2xl font-bold mb-6">Post a New Blog</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-medium mb-1">Title</label>
          <input
            className="w-full border rounded-lg px-3 py-2"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Excerpt</label>
          <textarea
            className="w-full border rounded-lg px-3 py-2"
            value={excerpt}
            onChange={e => setExcerpt(e.target.value)}
            rows={2}
            required
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Image URL</label>
          <input
            className="w-full border rounded-lg px-3 py-2"
            value={image}
            onChange={e => setImage(e.target.value)}
            placeholder="/assets/your-image.jpg"
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Content (Markdown supported)</label>
          <textarea
            className="w-full border rounded-lg px-3 py-2 font-mono"
            value={content}
            onChange={e => setContent(e.target.value)}
            rows={10}
            required
          />
        </div>
        {error && <div className="text-red-500">{error}</div>}
        <button
          type="submit"
          className="bg-primary text-white rounded-lg px-5 py-2 font-medium hover:bg-primary/90 transition-colors"
        >
          Publish Blog
        </button>
      </form>
    </div>
  );
} 
*/ 