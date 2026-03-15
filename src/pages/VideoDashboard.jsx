import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
// ReactPlayer replaced by native iframe for reliability
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { 
  Send, 
  ChevronRight, 
  Code, 
  BookOpen, 
  MessageSquare, 
  Clock, 
  ArrowLeft,
  Loader2
} from 'lucide-react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE_URL = '/api';

const VideoDashboard = () => {
  const { videoId } = useParams();
  const navigate = useNavigate();
  const playerRef = useRef(null);
  
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [transcript, setTranscript] = useState([]);
  const [conceptMatches, setConceptMatches] = useState([]);
  const [codeSnippets, setCodeSnippets] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    fetchData();
  }, [videoId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const transcriptRes = await axios.get(`${API_BASE_URL}/transcript?v=${videoId}`);
      const fullText = transcriptRes.data.map(t => t.text).join(' ');
      
      setTranscript(transcriptRes.data);

      const analyzeRes = await axios.post(`${API_BASE_URL}/analyze`, { 
        transcript: fullText.substring(0, 10000)
      });

      setConceptMatches(analyzeRes.data.conceptMatches || []);
      setCodeSnippets(analyzeRes.data.codeSnippets || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Failed to load video analysis. Make sure the backend is running and the video has captions.');
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const newMessage = { role: 'user', content: inputMessage };
    setChatMessages([...chatMessages, newMessage]);
    setInputMessage('');
    setIsTyping(true);

    try {
      const fullText = transcript.map(t => t.text).join(' ');
      const res = await axios.post(`${API_BASE_URL}/chat`, {
        message: inputMessage,
        transcript: fullText.substring(0, 5000),
        history: chatMessages.map(m => ({ 
          role: m.role === 'user' ? 'user' : 'model', 
          parts: [{ text: m.content }] 
        }))
      });

      setChatMessages(prev => [...prev, { role: 'assistant', content: res.data.response }]);
    } catch (error) {
      console.error('Chat error:', error);
    } finally {
      setIsTyping(false);
    }
  };

  const handleProgress = (seconds) => {
    setCurrentTime(seconds);
  };

  const seekTo = (seconds) => {
    const iframe = document.querySelector('iframe');
    if (iframe) {
      // Basic seeks can be tricky with plain iframes, 
      // but we'll try the URL update method first
      const currentSrc = iframe.src.split('?')[0];
      iframe.src = `${currentSrc}?start=${seconds}&autoplay=1`;
    }
  };

  const currentSnippet = [...codeSnippets]
    .sort((a, b) => b.timestamp - a.timestamp)
    .find(s => s.timestamp <= currentTime);

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center space-y-4">
        <Loader2 className="text-accent-color animate-spin" size={48} />
        <p className="text-text-secondary animate-pulse">Analyzing Video Content with AI...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-bg-primary">
      <header className="h-16 border-b border-glass-border flex items-center justify-between px-6 shrink-0 bg-bg-secondary/50 backdrop-blur-md">
        <div className="flex items-center space-x-4">
          <button onClick={() => navigate('/')} className="p-2 hover:bg-bg-tertiary rounded-lg transition-colors">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold gradient-text">DevTube Assistant</h1>
        </div>
        <div className="flex items-center space-x-2 text-text-secondary text-sm">
          <Clock size={16} />
          <span>{Math.floor(currentTime / 60)}:{(currentTime % 60).toFixed(0).padStart(2, '0')}</span>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        <div className="w-1/3 flex flex-col border-r border-glass-border">
          <div className="aspect-video bg-black shrink-0 relative overflow-hidden rounded-xl border border-glass-border">
            <iframe
              width="100%"
              height="100%"
              src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1`}
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            ></iframe>
          </div>
          
          <div className="flex-1 flex flex-col min-h-0 bg-bg-secondary/30">
            <div className="p-4 border-b border-glass-border flex items-center space-x-2 bg-bg-secondary/50">
              <MessageSquare size={18} className="text-accent-color" />
              <h2 className="font-semibold">Ask AI</h2>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              {chatMessages.length === 0 && (
                <div className="text-center py-8 text-text-muted">
                  <p>Ask anything about this video!</p>
                </div>
              )}
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-3 rounded-2xl ${
                    msg.role === 'user' 
                      ? 'bg-accent-color text-white' 
                      : 'bg-bg-tertiary text-text-primary border border-glass-border'
                  }`}>
                    <p className="text-sm">{msg.content}</p>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-bg-tertiary p-3 rounded-2xl border border-glass-border">
                    <Loader2 size={16} className="animate-spin text-accent-color" />
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={handleSendMessage} className="p-4 border-t border-glass-border bg-bg-secondary/50">
              <div className="flex items-center space-x-2 p-1 glass-card rounded-xl">
                <input 
                  type="text" 
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Ask a question..."
                  className="flex-1 bg-transparent border-none outline-none px-3 py-2 text-sm"
                />
                <button type="submit" className="p-2 bg-accent-color text-white rounded-lg hover:bg-accent-hover transition-colors">
                  <Send size={16} />
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="flex-1 flex flex-col min-w-0 bg-bg-primary">
          <div className="p-4 border-b border-glass-border flex items-center justify-between bg-bg-secondary/50 backdrop-blur-sm sticky top-0 z-10">
            <div className="flex items-center space-x-2">
              <Code size={18} className="text-accent-color" />
              <h2 className="font-semibold">Code Snippets</h2>
            </div>
            <div className="text-xs text-text-muted">Updates as you watch</div>
          </div>
          
          <div className="flex-1 overflow-auto p-4 custom-scrollbar">
            {currentSnippet ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                key={currentSnippet.timestamp}
                className="rounded-xl overflow-hidden border border-glass-border shadow-2xl"
              >
                <div className="bg-bg-tertiary px-4 py-2 text-xs text-text-muted flex justify-between items-center border-b border-glass-border">
                  <span>Detected Code</span>
                  <span>{Math.floor(currentSnippet.timestamp/60)}:{(currentSnippet.timestamp%60).toFixed(0).padStart(2, '0')}</span>
                </div>
                <SyntaxHighlighter 
                  language="javascript" 
                  style={vscDarkPlus}
                  customStyle={{ margin: 0, padding: '1.5rem', background: '#1e1e1e', fontSize: '0.9rem' }}
                >
                  {currentSnippet.code}
                </SyntaxHighlighter>
              </motion.div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-text-muted space-y-4 opacity-50">
                <Code size={48} />
                <p>Code snippets will appear here as the video progresses.</p>
              </div>
            )}
          </div>
        </div>

        <div className="w-1/4 min-w-[300px] flex flex-col bg-bg-secondary/20 border-l border-glass-border">
          <div className="p-4 border-b border-glass-border flex items-center space-x-2 bg-bg-secondary/50">
            <BookOpen size={18} className="text-accent-color" />
            <h2 className="font-semibold">Concept Matches</h2>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {conceptMatches.map((concept, i) => (
              <motion.button
                whileHover={{ x: 4 }}
                key={i}
                onClick={() => seekTo(concept.timestamp)}
                className={`w-full text-left p-4 rounded-xl glass-card transition-all group ${
                  currentTime >= concept.timestamp && (i === conceptMatches.length - 1 || currentTime < conceptMatches[i+1].timestamp)
                    ? 'border-accent-color ring-1 ring-accent-color'
                    : ''
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono text-accent-color bg-accent-color/10 px-2 py-1 rounded">
                    {Math.floor(concept.timestamp/60)}:{(concept.timestamp%60).toFixed(0).padStart(2, '0')}
                  </span>
                  <ChevronRight size={14} className="text-text-muted group-hover:text-accent-color transition-colors" />
                </div>
                <h3 className="text-sm font-semibold text-text-primary mb-1">{concept.topic}</h3>
                <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed">{concept.description}</p>
              </motion.button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default VideoDashboard;
