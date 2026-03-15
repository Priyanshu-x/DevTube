import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Youtube, Sparkles, Code, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';

const Home = () => {
  const [url, setUrl] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    const videoId = extractVideoId(url);
    if (videoId) {
      navigate(`/video/${videoId}`);
    } else {
      alert('Please enter a valid YouTube URL');
    }
  };

  const extractVideoId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl w-full text-center space-y-8"
      >
        <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full glass-card text-accent-color text-sm font-medium">
          <Sparkles size={16} />
          <span>AI-Powered Learning Platform</span>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
          Master Coding with <span className="gradient-text">DevTube</span>
        </h1>
        
        <p className="text-text-secondary text-lg md:text-xl max-w-2xl mx-auto">
          Paste a YouTube link to extract code snippets, match key concepts, and chat with AI about the content in real-time.
        </p>

        <form onSubmit={handleSubmit} className="relative max-w-2xl mx-auto group">
          <div className="absolute inset-0 bg-accent-color opacity-10 blur-xl group-hover:opacity-20 transition-opacity"></div>
          <div className="relative flex items-center p-2 glass-card h-16">
            <Youtube className="ml-4 text-text-muted" size={24} />
            <input
              type="text"
              placeholder="Paste YouTube Video URL..."
              className="flex-1 bg-transparent border-none outline-none px-4 text-lg text-text-primary"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <button type="submit" className="btn-primary h-full px-8 rounded-xl flex items-center space-x-2">
              <span>Analyze</span>
              <Play size={18} fill="currentColor" />
            </button>
          </div>
        </form>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12">
          <FeatureCard 
            icon={<Code className="text-accent-color" />}
            title="Code Extraction"
            description="Automatically extracts code snippets as the video progresses."
          />
          <FeatureCard 
            icon={<BookOpen className="text-accent-color" />}
            title="Concept Matches"
            description="Timestamps and topic names for key coding concepts."
          />
          <FeatureCard 
            icon={<Sparkles className="text-accent-color" />}
            title="Ask Gemini"
            description="Interactive chat integrated with the video context."
          />
        </div>
      </motion.div>

      <footer className="mt-20 text-text-muted text-sm">
        Built for students to accelerate their technical growth.
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }) => (
  <div className="p-6 glass-card text-left space-y-4">
    <div className="p-3 bg-bg-tertiary rounded-lg w-fit">
      {icon}
    </div>
    <h3 className="text-xl font-semibold">{title}</h3>
    <p className="text-text-secondary text-sm leading-relaxed">
      {description}
    </p>
  </div>
);

export default Home;
