import React from 'react';
import { Link } from 'react-router-dom';
import { SecureMarkdown } from '@/components/ui/SecureMarkdown';

const BlogPost = ({ post }) => {
  if (!post) return <div className="p-8 text-center">Blog post not found.</div>;

  return (
    <article className="max-w-3xl mx-auto bg-white rounded-3xl shadow-neumorph p-8 mt-24">
      <Link to="/blog" className="text-blue-500 underline mb-4 inline-block">← Back to Blog</Link>
      <h1 className="text-4xl font-bold mb-2 text-gray-900">{post.title}</h1>
      <div className="flex items-center mb-6">
        <img src="/assets/author.jpg" alt={post.author} className="w-10 h-10 rounded-full mr-3" />
        <div>
          <div className="text-gray-700 font-medium">{post.author}</div>
          <div className="text-gray-400 text-xs">{post.date} • {post.readTime}</div>
        </div>
      </div>
      <img
        src={post.image}
        alt={post.title}
        className="rounded-2xl mb-6 w-full object-cover"
        loading="lazy"
      />
      <div className="prose max-w-none text-gray-800">
        <SecureMarkdown contentType="article">{post.content}</SecureMarkdown>
      </div>
    </article>
  );
};

export default BlogPost; 