export interface BlogPost {
  id: string;
  title: string;
  author: string;
  date: string;
  readTime: string;
  image: string;
  excerpt: string;
  content: string;
}

export const blogPosts: BlogPost[] = [
  {
    id: "ai-frontier",
    title: "Navigating the AI Frontier: A Journey into the World of Artificial Intelligence",
    author: "John Doe",
    date: "Jan 05, 2024",
    readTime: "5 mins read",
    image: "/assets/ai-frontier.jpg",
    excerpt:
      "In today's fast-paced digital landscape, one term stands out as a beacon of innovation and possibility: Artificial Intelligence (AI)...",
    content: `In today's fast-paced digital landscape, one term stands out as a beacon of innovation and possibility: Artificial Intelligence (AI). As we embark on a journey into the AI frontier, we find ourselves at the intersection of cutting-edge technology and limitless potential. From enhancing everyday experiences to revolutionizing entire industries, AI is reshaping the way we live, work, and interact with the world around us.\n\n## Unveiling the Mysteries of AI\nArtificial Intelligence, often portrayed in science fiction as sentient robots or superintelligent machines, is much more than Hollywood fantasies. At its core, AI refers to the development of computer systems capable of performing tasks that typically require human intelligence. This encompasses a wide range of capabilities, from speech recognition and language translation to problem-solving and decision-making.\n\n- **Fundamentals of AI:** Introduce the basic concepts of artificial intelligence, including machine learning, natural language processing, and computer vision.\n- **AI in Everyday Life:** Explore how AI is already integrated into our daily lives, from virtual assistants like Siri and Alexa to personalized recommendations on streaming platforms and social media.`,
  },
  // Add more blog posts as needed
]; 