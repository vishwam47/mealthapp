
import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore, collection, addDoc, doc, onSnapshot, query, orderBy, updateDoc, deleteDoc, where } from 'firebase/firestore';
import { Calendar, MessageCircle, BookOpen, User, Brain, Target, Phone, Menu, X, Send, Plus, Check, Heart, Sun, Cloud, CloudRain, Zap, Frown } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Global Firebase variables (these would be provided by the platform)
declare global {
  var __app_id: string;
  var __firebase_config: any;
  var __initial_auth_token: string;
}

const App = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentView, setCurrentView] = useState('auth');
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [firebaseApp, setFirebaseApp] = useState(null);
  const [auth, setAuth] = useState(null);
  const [db, setDb] = useState(null);

  // Initialize Firebase
  useEffect(() => {
    try {
      const app = initializeApp(window.__firebase_config || {
        // Fallback config for development
        apiKey: "demo-key",
        authDomain: "demo.firebaseapp.com",
        projectId: "demo-project",
        storageBucket: "demo.appspot.com",
        messagingSenderId: "123456789",
        appId: "demo-app-id"
      });
      const authInstance = getAuth(app);
      const dbInstance = getFirestore(app);
      
      setFirebaseApp(app);
      setAuth(authInstance);
      setDb(dbInstance);

      // Listen for auth state changes
      const unsubscribe = onAuthStateChanged(authInstance, (user) => {
        setCurrentUser(user);
        if (user) {
          setCurrentView('dashboard');
        } else {
          setCurrentView('auth');
        }
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error('Firebase initialization error:', error);
      setLoading(false);
    }
  }, []);

  const handleSignIn = async () => {
    if (!auth) return;
    
    try {
      if (window.__initial_auth_token) {
        await signInWithCustomToken(auth, window.__initial_auth_token);
      } else {
        await signInAnonymously(auth);
      }
    } catch (error) {
      console.error('Sign in error:', error);
      // Fallback to anonymous sign in
      try {
        await signInAnonymously(auth);
      } catch (fallbackError) {
        console.error('Fallback sign in error:', fallbackError);
      }
    }
  };

  const handleSignOut = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
      setCurrentView('auth');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Mealth...</p>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (currentView) {
      case 'auth':
        return <AuthPage onSignIn={handleSignIn} />;
      case 'dashboard':
        return <Dashboard user={currentUser} db={db} />;
      case 'chatbot':
        return <Chatbot user={currentUser} db={db} />;
      case 'blogs':
        return <Blogs db={db} />;
      case 'consultations':
        return <Consultations user={currentUser} db={db} />;
      case 'mood':
        return <MoodTracker user={currentUser} db={db} />;
      case 'coping':
        return <CopingTools user={currentUser} db={db} />;
      case 'goals':
        return <Goals user={currentUser} db={db} />;
      case 'crisis':
        return <CrisisResources />;
      default:
        return <Dashboard user={currentUser} db={db} />;
    }
  };

  if (currentView === 'auth') {
    return renderContent();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      {/* Mobile Navigation */}
      <div className="lg:hidden">
        <div className="bg-white shadow-sm px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold text-blue-600">Mealth</h1>
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-md text-gray-500 hover:text-gray-600"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>

        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="fixed inset-0 bg-black bg-opacity-25" onClick={() => setSidebarOpen(false)} />
            <div className="fixed top-0 left-0 bottom-0 w-64 bg-white shadow-xl">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-blue-600">Mealth</h2>
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="p-2 rounded-md text-gray-500 hover:text-gray-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
              <Navigation 
                currentView={currentView} 
                setCurrentView={setCurrentView} 
                onSignOut={handleSignOut}
                user={currentUser}
                closeSidebar={() => setSidebarOpen(false)}
              />
            </div>
          </div>
        )}
      </div>

      <div className="lg:flex">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block lg:w-64 lg:bg-white lg:shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-blue-600">Mealth</h1>
          </div>
          <Navigation 
            currentView={currentView} 
            setCurrentView={setCurrentView} 
            onSignOut={handleSignOut}
            user={currentUser}
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 lg:ml-0">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

const AuthPage = ({ onSignIn }) => {
  const [isSignUp, setIsSignUp] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-600 mb-2">Mealth</h1>
          <p className="text-gray-600">Your mental wellness companion</p>
        </div>

        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </h2>
            <p className="text-gray-600 text-sm">
              {isSignUp 
                ? 'Join our supportive community' 
                : 'Continue your wellness journey'
              }
            </p>
          </div>

          <button
            onClick={onSignIn}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            {isSignUp ? 'Get Started' : 'Sign In'}
          </button>

          <div className="text-center">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              {isSignUp 
                ? 'Already have an account? Sign In' 
                : "Don't have an account? Sign Up"
              }
            </button>
          </div>

          <div className="text-xs text-gray-500 text-center">
            <p>Your privacy is our priority. All data is securely stored and encrypted.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const Navigation = ({ currentView, setCurrentView, onSignOut, user, closeSidebar }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Calendar },
    { id: 'chatbot', label: 'AI Chat', icon: MessageCircle },
    { id: 'mood', label: 'Mood Tracker', icon: Heart },
    { id: 'blogs', label: 'Articles', icon: BookOpen },
    { id: 'consultations', label: 'Consultations', icon: User },
    { id: 'coping', label: 'Coping Tools', icon: Brain },
    { id: 'goals', label: 'Goals', icon: Target },
    { id: 'crisis', label: 'Crisis Resources', icon: Phone },
  ];

  const handleNavClick = (viewId) => {
    setCurrentView(viewId);
    if (closeSidebar) closeSidebar();
  };

  return (
    <nav className="p-4">
      {user && (
        <div className="mb-6 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-gray-600">User ID:</p>
          <p className="text-xs font-mono text-blue-600 break-all">{user.uid}</p>
        </div>
      )}
      
      <div className="space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                currentView === item.id 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-8 pt-4 border-t border-gray-200">
        <button
          onClick={onSignOut}
          className="w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          Sign Out
        </button>
      </div>
    </nav>
  );
};

const Dashboard = ({ user, db }) => {
  const [recentMoods, setRecentMoods] = useState([]);
  const [todayJournal, setTodayJournal] = useState('');
  const [goals, setGoals] = useState([]);

  useEffect(() => {
    if (!db || !user) return;

    const appId = window.__app_id || 'demo-app';
    
    // Fetch recent moods
    const moodsRef = collection(db, `artifacts/${appId}/users/${user.uid}/moods`);
    const moodsQuery = query(moodsRef, orderBy('date', 'desc'));
    const unsubscribeMoods = onSnapshot(moodsQuery, (snapshot) => {
      const moodData = snapshot.docs.slice(0, 7).map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setRecentMoods(moodData);
    });

    // Fetch goals
    const goalsRef = collection(db, `artifacts/${appId}/users/${user.uid}/goals`);
    const unsubscribeGoals = onSnapshot(goalsRef, (snapshot) => {
      const goalData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setGoals(goalData);
    });

    return () => {
      unsubscribeMoods();
      unsubscribeGoals();
    };
  }, [db, user]);

  const completedGoals = goals.filter(goal => goal.completed).length;
  const totalGoals = goals.length;

  return (
    <div className="p-4 lg:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome back!</h1>
        <p className="text-gray-600">How are you feeling today?</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Mood Summary */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Mood</h3>
          {recentMoods.length > 0 ? (
            <div className="flex items-center space-x-3">
              <MoodIcon mood={recentMoods[0].mood} size="large" />
              <div>
                <p className="font-medium text-gray-800 capitalize">{recentMoods[0].mood}</p>
                <p className="text-sm text-gray-500">{recentMoods[0].date}</p>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">No mood logged yet today</p>
          )}
        </div>

        {/* Goals Progress */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Goals Progress</h3>
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Completed</span>
                <span className="text-sm font-medium">{completedGoals}/{totalGoals}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: totalGoals > 0 ? `${(completedGoals / totalGoals) * 100}%` : '0%' }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button className="w-full text-left p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
              <p className="font-medium text-blue-700">Log Mood</p>
              <p className="text-sm text-blue-600">Track how you're feeling</p>
            </button>
            <button className="w-full text-left p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
              <p className="font-medium text-green-700">Chat with AI</p>
              <p className="text-sm text-green-600">Get support anytime</p>
            </button>
          </div>
        </div>
      </div>

      {/* Mood Trend Chart */}
      {recentMoods.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Mood Trend (Last 7 Days)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={recentMoods.reverse()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  interval={0}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis hide />
                <Tooltip 
                  labelFormatter={(label) => `Date: ${label}`}
                  formatter={(value) => [value, 'Mood']}
                />
                <Line 
                  type="monotone" 
                  dataKey="moodScore" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Inspirational Quote */}
      <div className="bg-gradient-to-r from-blue-500 to-green-500 rounded-lg shadow-sm p-6 text-white">
        <blockquote className="text-lg font-medium mb-2">
          "The greatest revolution of our generation is the discovery that human beings, by changing the inner attitudes of their minds, can change the outer aspects of their lives."
        </blockquote>
        <cite className="text-blue-100">— William James</cite>
      </div>
    </div>
  );
};

const MoodIcon = ({ mood, size = 'normal' }) => {
  const iconSize = size === 'large' ? 'h-8 w-8' : 'h-6 w-6';
  
  switch (mood) {
    case 'happy':
      return <Sun className={`${iconSize} text-yellow-500`} />;
    case 'calm':
      return <Cloud className={`${iconSize} text-blue-400`} />;
    case 'anxious':
      return <Zap className={`${iconSize} text-orange-500`} />;
    case 'stressed':
      return <CloudRain className={`${iconSize} text-gray-500`} />;
    case 'sad':
      return <Frown className={`${iconSize} text-blue-600`} />;
    default:
      return <Heart className={`${iconSize} text-pink-500`} />;
  }
};

const Chatbot = ({ user, db }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!db || !user) return;

    const appId = window.__app_id || 'demo-app';
    const messagesRef = collection(db, `artifacts/${appId}/users/${user.uid}/chat_messages`);
    const messagesQuery = query(messagesRef, orderBy('timestamp', 'asc'));
    
    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const messageData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMessages(messageData);
    });

    return () => unsubscribe();
  }, [db, user]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !db || !user || loading) return;

    const appId = window.__app_id || 'demo-app';
    const messagesRef = collection(db, `artifacts/${appId}/users/${user.uid}/chat_messages`);

    try {
      setLoading(true);
      
      // Add user message
      await addDoc(messagesRef, {
        content: newMessage,
        sender: 'user',
        timestamp: new Date().toISOString(),
      });

      const userMessage = newMessage;
      setNewMessage('');

      // Generate AI response (mock for now - replace with actual Gemini API call)
      const aiResponse = await generateAIResponse(userMessage);
      
      // Add AI message
      await addDoc(messagesRef, {
        content: aiResponse,
        sender: 'ai',
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateAIResponse = async (message) => {
    // Mock AI responses - replace with actual Gemini API call
    const responses = [
      "I understand you're going through something. Can you tell me more about how you're feeling?",
      "It's completely normal to feel this way. You're being very brave by reaching out.",
      "Have you tried any coping techniques that have helped you in the past?",
      "Remember that it's okay to take things one day at a time. You don't have to have everything figured out right now.",
      "What's one small thing that brought you joy today, even if it was brief?",
      "Your feelings are valid, and I'm here to listen without judgment."
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  };

  return (
    <div className="h-screen flex flex-col bg-white">
      <div className="p-4 border-b border-gray-200 bg-white">
        <h1 className="text-xl font-semibold text-gray-800">AI Mental Health Assistant</h1>
        <p className="text-sm text-gray-600">I'm here to listen and support you</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Start a conversation. I'm here to help.</p>
          </div>
        )}
        
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.sender === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              <p>{message.content}</p>
              <p className={`text-xs mt-1 ${
                message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
              }`}>
                {new Date(message.timestamp).toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
        
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg px-4 py-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-gray-200 bg-white">
        <div className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Type your message..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
          <button
            onClick={sendMessage}
            disabled={loading || !newMessage.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

const Blogs = ({ db }) => {
  const [articles, setArticles] = useState([]);
  const [selectedArticle, setSelectedArticle] = useState(null);

  useEffect(() => {
    if (!db) return;

    const appId = window.__app_id || 'demo-app';
    const articlesRef = collection(db, `artifacts/${appId}/public/data/articles`);
    
    const unsubscribe = onSnapshot(articlesRef, (snapshot) => {
      const articleData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setArticles(articleData);
    });

    // Add sample articles if none exist
    if (articles.length === 0) {
      const sampleArticles = [
        {
          title: "Understanding Anxiety: A Comprehensive Guide",
          summary: "Learn about anxiety disorders, their symptoms, and effective management strategies.",
          content: "Anxiety is a natural human emotion that everyone experiences from time to time. However, when anxiety becomes persistent, excessive, and interferes with daily life, it may be classified as an anxiety disorder...",
          author: "Dr. Sarah Johnson",
          date: "2024-01-15",
          readTime: "8 min read"
        },
        {
          title: "The Power of Mindfulness in Daily Life",
          summary: "Discover how mindfulness practices can improve your mental well-being and reduce stress.",
          content: "Mindfulness is the practice of being fully present and engaged in the current moment, without judgment. This ancient practice has been scientifically proven to reduce stress, improve focus, and enhance overall well-being...",
          author: "Dr. Michael Chen",
          date: "2024-01-12",
          readTime: "6 min read"
        },
        {
          title: "Building Resilience Through Difficult Times",
          summary: "Practical strategies for developing emotional resilience and coping with life's challenges.",
          content: "Resilience is the ability to bounce back from adversity, adapt to change, and keep going in the face of hardship. While some people seem naturally resilient, it's actually a skill that can be developed...",
          author: "Dr. Emily Rodriguez",
          date: "2024-01-10",
          readTime: "10 min read"
        }
      ];

      // Add sample articles to Firestore (in a real app, this would be done through an admin interface)
      sampleArticles.forEach(async (article) => {
        try {
          await addDoc(articlesRef, article);
        } catch (error) {
          console.error('Error adding sample article:', error);
        }
      });
    }

    return () => unsubscribe();
  }, [db]);

  if (selectedArticle) {
    return (
      <div className="p-4 lg:p-8">
        <button
          onClick={() => setSelectedArticle(null)}
          className="mb-6 text-blue-600 hover:text-blue-700 flex items-center space-x-2"
        >
          <span>← Back to Articles</span>
        </button>
        
        <article className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm p-8">
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-4">{selectedArticle.title}</h1>
            <div className="flex items-center text-gray-600 text-sm space-x-4">
              <span>By {selectedArticle.author}</span>
              <span>•</span>
              <span>{selectedArticle.date}</span>
              <span>•</span>
              <span>{selectedArticle.readTime}</span>
            </div>
          </header>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-xl text-gray-600 mb-6">{selectedArticle.summary}</p>
            <div className="text-gray-800 leading-relaxed">
              {selectedArticle.content}
            </div>
          </div>
        </article>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Mental Health Articles</h1>
        <p className="text-gray-600">Expert insights and practical advice for your wellness journey</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {articles.map((article) => (
          <div
            key={article.id}
            className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => setSelectedArticle(article)}
          >
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-3">{article.title}</h3>
              <p className="text-gray-600 mb-4">{article.summary}</p>
              
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>{article.author}</span>
                <span>{article.readTime}</span>
              </div>
              
              <div className="mt-4">
                <span className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                  Read more →
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {articles.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Articles are being loaded...</p>
        </div>
      )}
    </div>
  );
};

const Consultations = ({ user, db }) => {
  const [consultations, setConsultations] = useState([]);
  const [selectedConsultation, setSelectedConsultation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    if (!db || !user) return;

    const appId = window.__app_id || 'demo-app';
    const consultationsRef = collection(db, `artifacts/${appId}/users/${user.uid}/consultations`);
    
    const unsubscribe = onSnapshot(consultationsRef, (snapshot) => {
      const consultationData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setConsultations(consultationData);
    });

    return () => unsubscribe();
  }, [db, user]);

  useEffect(() => {
    if (!db || !user || !selectedConsultation) return;

    const appId = window.__app_id || 'demo-app';
    const messagesRef = collection(db, `artifacts/${appId}/users/${user.uid}/consultation_messages`);
    const messagesQuery = query(
      messagesRef, 
      where('consultationId', '==', selectedConsultation.id),
      orderBy('timestamp', 'asc')
    );
    
    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const messageData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMessages(messageData);
    });

    return () => unsubscribe();
  }, [db, user, selectedConsultation]);

  const bookConsultation = async () => {
    if (!db || !user) return;

    const appId = window.__app_id || 'demo-app';
    const consultationsRef = collection(db, `artifacts/${appId}/users/${user.uid}/consultations`);

    try {
      const newConsultation = {
        therapistName: "Dr. Alex Morgan",
        status: "scheduled",
        date: new Date().toISOString(),
        time: "2:00 PM",
        type: "Private Session"
      };

      await addDoc(consultationsRef, newConsultation);
    } catch (error) {
      console.error('Error booking consultation:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !db || !user || !selectedConsultation) return;

    const appId = window.__app_id || 'demo-app';
    const messagesRef = collection(db, `artifacts/${appId}/users/${user.uid}/consultation_messages`);

    try {
      await addDoc(messagesRef, {
        consultationId: selectedConsultation.id,
        content: newMessage,
        sender: 'user',
        timestamp: new Date().toISOString(),
      });

      setNewMessage('');

      // Simulate therapist response
      setTimeout(async () => {
        await addDoc(messagesRef, {
          consultationId: selectedConsultation.id,
          content: "Thank you for sharing that with me. How are you feeling about this situation?",
          sender: 'therapist',
          timestamp: new Date().toISOString(),
        });
      }, 2000);

    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  if (selectedConsultation) {
    return (
      <div className="h-screen flex flex-col bg-white">
        <div className="p-4 border-b border-gray-200 bg-white">
          <button
            onClick={() => setSelectedConsultation(null)}
            className="mb-2 text-blue-600 hover:text-blue-700"
          >
            ← Back to Consultations
          </button>
          <h1 className="text-xl font-semibold text-gray-800">Session with {selectedConsultation.therapistName}</h1>
          <p className="text-sm text-gray-600">Private and secure messaging</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.sender === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                <p>{message.content}</p>
                <p className={`text-xs mt-1 ${
                  message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  {new Date(message.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-gray-200 bg-white">
          <div className="flex space-x-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Type your message..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={sendMessage}
              disabled={!newMessage.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Private Consultations</h1>
        <p className="text-gray-600">Secure, confidential sessions with licensed therapists</p>
      </div>

      <div className="mb-6">
        <button
          onClick={bookConsultation}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>Book New Consultation</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {consultations.map((consultation) => (
          <div
            key={consultation.id}
            className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => setSelectedConsultation(consultation)}
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">{consultation.therapistName}</h3>
                <p className="text-sm text-gray-600">{consultation.type}</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Status:</span>
                <span className={`text-sm font-medium ${
                  consultation.status === 'scheduled' ? 'text-green-600' : 'text-blue-600'
                }`}>
                  {consultation.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Time:</span>
                <span className="text-sm text-gray-800">{consultation.time}</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <span className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                Open Session →
              </span>
            </div>
          </div>
        ))}
      </div>

      {consultations.length === 0 && (
        <div className="text-center py-12">
          <User className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">No consultations booked yet</p>
          <button
            onClick={bookConsultation}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Book your first consultation
          </button>
        </div>
      )}
    </div>
  );
};

const MoodTracker = ({ user, db }) => {
  const [moods, setMoods] = useState([]);
  const [selectedMood, setSelectedMood] = useState('');
  const [journalEntry, setJournalEntry] = useState('');
  const [journalEntries, setJournalEntries] = useState([]);

  const moodOptions = [
    { id: 'happy', label: 'Happy', icon: 'sun', color: 'text-yellow-500', score: 5 },
    { id: 'calm', label: 'Calm', icon: 'cloud', color: 'text-blue-400', score: 4 },
    { id: 'anxious', label: 'Anxious', icon: 'zap', color: 'text-orange-500', score: 2 },
    { id: 'stressed', label: 'Stressed', icon: 'cloud-rain', color: 'text-gray-500', score: 2 },
    { id: 'sad', label: 'Sad', icon: 'frown', color: 'text-blue-600', score: 1 },
  ];

  const journalPrompts = [
    "What made you smile today?",
    "What's on your mind right now?",
    "What are you grateful for today?",
    "What would you like to improve about today?",
    "How did you take care of yourself today?"
  ];

  useEffect(() => {
    if (!db || !user) return;

    const appId = window.__app_id || 'demo-app';
    
    // Fetch moods
    const moodsRef = collection(db, `artifacts/${appId}/users/${user.uid}/moods`);
    const moodsQuery = query(moodsRef, orderBy('date', 'desc'));
    const unsubscribeMoods = onSnapshot(moodsQuery, (snapshot) => {
      const moodData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMoods(moodData);
    });

    // Fetch journal entries
    const journalRef = collection(db, `artifacts/${appId}/users/${user.uid}/journal_entries`);
    const journalQuery = query(journalRef, orderBy('date', 'desc'));
    const unsubscribeJournal = onSnapshot(journalQuery, (snapshot) => {
      const journalData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setJournalEntries(journalData);
    });

    return () => {
      unsubscribeMoods();
      unsubscribeJournal();
    };
  }, [db, user]);

  const logMood = async (mood) => {
    if (!db || !user) return;

    const appId = window.__app_id || 'demo-app';
    const moodsRef = collection(db, `artifacts/${appId}/users/${user.uid}/moods`);

    try {
      const moodData = moodOptions.find(m => m.id === mood);
      await addDoc(moodsRef, {
        mood: mood,
        moodScore: moodData.score,
        date: new Date().toISOString().split('T')[0],
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error logging mood:', error);
    }
  };

  const saveJournalEntry = async () => {
    if (!journalEntry.trim() || !db || !user) return;

    const appId = window.__app_id || 'demo-app';
    const journalRef = collection(db, `artifacts/${appId}/users/${user.uid}/journal_entries`);

    try {
      await addDoc(journalRef, {
        content: journalEntry,
        date: new Date().toISOString().split('T')[0],
        timestamp: new Date().toISOString(),
      });
      setJournalEntry('');
    } catch (error) {
      console.error('Error saving journal entry:', error);
    }
  };

  return (
    <div className="p-4 lg:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Mood Tracker</h1>
        <p className="text-gray-600">Track your emotions and reflect on your day</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Mood Logging */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">How are you feeling today?</h2>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
            {moodOptions.map((mood) => (
              <button
                key={mood.id}
                onClick={() => logMood(mood.id)}
                className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors text-center"
              >
                <MoodIcon mood={mood.id} size="large" />
                <p className="mt-2 font-medium text-gray-800">{mood.label}</p>
              </button>
            ))}
          </div>

          {/* Recent Moods */}
          <div>
            <h3 className="font-medium text-gray-800 mb-3">Recent Moods</h3>
            <div className="space-y-2">
              {moods.slice(0, 5).map((mood) => (
                <div key={mood.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <MoodIcon mood={mood.mood} />
                    <span className="font-medium capitalize">{mood.mood}</span>
                  </div>
                  <span className="text-sm text-gray-500">{mood.date}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Journal */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Journal</h2>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Random Prompt: "{journalPrompts[Math.floor(Math.random() * journalPrompts.length)]}"
            </label>
            <textarea
              value={journalEntry}
              onChange={(e) => setJournalEntry(e.target.value)}
              placeholder="Write about your day, thoughts, or feelings..."
              className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={saveJournalEntry}
              disabled={!journalEntry.trim()}
              className="mt-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save Entry
            </button>
          </div>

          {/* Recent Journal Entries */}
          <div>
            <h3 className="font-medium text-gray-800 mb-3">Recent Entries</h3>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {journalEntries.slice(0, 5).map((entry) => (
                <div key={entry.id} className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-gray-800 text-sm mb-2">{entry.content}</p>
                  <p className="text-xs text-gray-500">{entry.date}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Mood Chart */}
      {moods.length > 0 && (
        <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Mood Trends</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={moods.slice(0, 14).reverse()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  interval={0}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis domain={[1, 5]} />
                <Tooltip 
                  labelFormatter={(label) => `Date: ${label}`}
                  formatter={(value) => [value, 'Mood Score']}
                />
                <Line 
                  type="monotone" 
                  dataKey="moodScore" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

const CopingTools = ({ user, db }) => {
  const [gratitudeEntries, setGratitudeEntries] = useState([]);
  const [newGratitude, setNewGratitude] = useState('');
  const [currentAffirmation, setCurrentAffirmation] = useState(0);

  const affirmations = [
    "I am worthy of love and respect",
    "I have the strength to overcome challenges",
    "I am capable of creating positive change in my life",
    "I deserve happiness and peace",
    "I am resilient and can handle whatever comes my way",
    "I choose to focus on what I can control",
    "I am grateful for this moment",
    "I am enough, just as I am"
  ];

  const copingStrategies = [
    {
      title: "5-Minute Calming Breath",
      description: "Deep breathing exercise to reduce anxiety and stress",
      type: "breathing"
    },
    {
      title: "Body Scan Meditation",
      description: "Progressive relaxation technique for physical and mental tension",
      type: "meditation"
    },
    {
      title: "Thought Challenging Worksheet",
      description: "CBT technique to identify and reframe negative thoughts",
      type: "cbt"
    },
    {
      title: "Distress Tolerance Skills",
      description: "DBT techniques for managing intense emotions",
      type: "dbt"
    },
    {
      title: "Mindful Walking",
      description: "Grounding exercise combining movement and mindfulness",
      type: "mindfulness"
    }
  ];

  useEffect(() => {
    if (!db || !user) return;

    const appId = window.__app_id || 'demo-app';
    const gratitudeRef = collection(db, `artifacts/${appId}/users/${user.uid}/gratitude_entries`);
    const gratitudeQuery = query(gratitudeRef, orderBy('date', 'desc'));
    
    const unsubscribe = onSnapshot(gratitudeQuery, (snapshot) => {
      const gratitudeData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setGratitudeEntries(gratitudeData);
    });

    return () => unsubscribe();
  }, [db, user]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentAffirmation((prev) => (prev + 1) % affirmations.length);
    }, 10000);

    return () => clearInterval(timer);
  }, []);

  const addGratitudeEntry = async () => {
    if (!newGratitude.trim() || !db || !user) return;

    const appId = window.__app_id || 'demo-app';
    const gratitudeRef = collection(db, `artifacts/${appId}/users/${user.uid}/gratitude_entries`);

    try {
      await addDoc(gratitudeRef, {
        content: newGratitude,
        date: new Date().toISOString().split('T')[0],
        timestamp: new Date().toISOString(),
      });
      setNewGratitude('');
    } catch (error) {
      console.error('Error adding gratitude entry:', error);
    }
  };

  return (
    <div className="p-4 lg:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Coping Tools</h1>
        <p className="text-gray-600">Self-help resources and techniques for mental wellness</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Coping Strategies */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Guided Exercises</h2>
          
          <div className="space-y-4">
            {copingStrategies.map((strategy, index) => (
              <div key={index} className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors cursor-pointer">
                <h3 className="font-medium text-gray-800 mb-2">{strategy.title}</h3>
                <p className="text-sm text-gray-600 mb-3">{strategy.description}</p>
                <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                  {strategy.type.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Affirmations & Gratitude */}
        <div className="space-y-6">
          {/* Daily Affirmation */}
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg shadow-sm p-6 text-white">
            <h2 className="text-xl font-semibold mb-4">Daily Affirmation</h2>
            <blockquote className="text-lg font-medium mb-4">
              "{affirmations[currentAffirmation]}"
            </blockquote>
            <div className="flex space-x-2">
              {affirmations.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full ${
                    index === currentAffirmation ? 'bg-white' : 'bg-white bg-opacity-50'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Gratitude Journal */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Gratitude Journal</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What are you grateful for today?
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newGratitude}
                  onChange={(e) => setNewGratitude(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addGratitudeEntry()}
                  placeholder="I'm grateful for..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={addGratitudeEntry}
                  disabled={!newGratitude.trim()}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  <Plus className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {gratitudeEntries.map((entry) => (
                <div key={entry.id} className="p-3 bg-yellow-50 rounded-lg">
                  <p className="text-gray-800">{entry.content}</p>
                  <p className="text-xs text-gray-500 mt-1">{entry.date}</p>
                </div>
              ))}
            </div>

            {gratitudeEntries.length === 0 && (
              <div className="text-center py-8">
                <Heart className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">Start your gratitude practice today</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const Goals = ({ user, db }) => {
  const [goals, setGoals] = useState([]);
  const [newGoal, setNewGoal] = useState('');

  useEffect(() => {
    if (!db || !user) return;

    const appId = window.__app_id || 'demo-app';
    const goalsRef = collection(db, `artifacts/${appId}/users/${user.uid}/goals`);
    
    const unsubscribe = onSnapshot(goalsRef, (snapshot) => {
      const goalData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setGoals(goalData);
    });

    return () => unsubscribe();
  }, [db, user]);

  const addGoal = async () => {
    if (!newGoal.trim() || !db || !user) return;

    const appId = window.__app_id || 'demo-app';
    const goalsRef = collection(db, `artifacts/${appId}/users/${user.uid}/goals`);

    try {
      await addDoc(goalsRef, {
        title: newGoal,
        completed: false,
        createdAt: new Date().toISOString(),
      });
      setNewGoal('');
    } catch (error) {
      console.error('Error adding goal:', error);
    }
  };

  const toggleGoal = async (goalId, completed) => {
    if (!db || !user) return;

    const appId = window.__app_id || 'demo-app';
    const goalDoc = doc(db, `artifacts/${appId}/users/${user.uid}/goals/${goalId}`);

    try {
      await updateDoc(goalDoc, { completed: !completed });
    } catch (error) {
      console.error('Error updating goal:', error);
    }
  };

  const deleteGoal = async (goalId) => {
    if (!db || !user) return;

    const appId = window.__app_id || 'demo-app';
    const goalDoc = doc(db, `artifacts/${appId}/users/${user.uid}/goals/${goalId}`);

    try {
      await deleteDoc(goalDoc);
    } catch (error) {
      console.error('Error deleting goal:', error);
    }
  };

  const completedGoals = goals.filter(goal => goal.completed).length;

  return (
    <div className="p-4 lg:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Mental Health Goals</h1>
        <p className="text-gray-600">Set and track your personal wellness objectives</p>
      </div>

      {/* Progress Overview */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Progress Overview</h2>
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Goals Completed</span>
              <span className="text-sm font-medium">{completedGoals}/{goals.length}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-green-500 h-3 rounded-full transition-all duration-300"
                style={{ width: goals.length > 0 ? `${(completedGoals / goals.length) * 100}%` : '0%' }}
              ></div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-green-600">{Math.round((completedGoals / goals.length) * 100) || 0}%</p>
            <p className="text-sm text-gray-500">Complete</p>
          </div>
        </div>
      </div>

      {/* Add New Goal */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Add New Goal</h2>
        <div className="flex space-x-2">
          <input
            type="text"
            value={newGoal}
            onChange={(e) => setNewGoal(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addGoal()}
            placeholder="e.g., Practice mindfulness for 10 minutes daily"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={addGoal}
            disabled={!newGoal.trim()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <Plus className="h-5 w-5" />
            <span>Add Goal</span>
          </button>
        </div>
      </div>

      {/* Goals List */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Your Goals</h2>
        
        {goals.length === 0 ? (
          <div className="text-center py-8">
            <Target className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No goals set yet</p>
            <p className="text-sm text-gray-400">Add your first mental health goal to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {goals.map((goal) => (
              <div
                key={goal.id}
                className={`flex items-center space-x-3 p-4 border rounded-lg transition-colors ${
                  goal.completed 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                }`}
              >
                <button
                  onClick={() => toggleGoal(goal.id, goal.completed)}
                  className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                    goal.completed
                      ? 'bg-green-500 border-green-500 text-white'
                      : 'border-gray-300 hover:border-green-400'
                  }`}
                >
                  {goal.completed && <Check className="h-4 w-4" />}
                </button>
                
                <div className="flex-1">
                  <p className={`font-medium ${
                    goal.completed ? 'text-green-800 line-through' : 'text-gray-800'
                  }`}>
                    {goal.title}
                  </p>
                  <p className="text-sm text-gray-500">
                    Created {new Date(goal.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <button
                  onClick={() => deleteGoal(goal.id)}
                  className="flex-shrink-0 text-red-400 hover:text-red-600 p-1"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const CrisisResources = () => {
  const resources = [
    {
      name: "National Suicide Prevention Lifeline",
      phone: "988",
      description: "24/7 crisis support and suicide prevention",
      available: "24/7"
    },
    {
      name: "Crisis Text Line",
      phone: "Text HOME to 741741",
      description: "Free, 24/7 crisis support via text message",
      available: "24/7"
    },
    {
      name: "SAMHSA National Helpline",
      phone: "1-800-662-4357",
      description: "Treatment referral and information service",
      available: "24/7"
    },
    {
      name: "National Domestic Violence Hotline",
      phone: "1-800-799-7233",
      description: "Support for domestic violence survivors",
      available: "24/7"
    },
    {
      name: "Trans Lifeline",
      phone: "877-565-8860",
      description: "Crisis support for transgender individuals",
      available: "24/7"
    }
  ];

  const emergencySteps = [
    "If you're in immediate danger, call 911",
    "Reach out to a trusted friend or family member",
    "Contact one of the crisis hotlines below",
    "Go to your nearest emergency room",
    "Use a crisis chat service online"
  ];

  return (
    <div className="p-4 lg:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Crisis Resources</h1>
        <p className="text-gray-600">Immediate help and support when you need it most</p>
      </div>

      {/* Emergency Alert */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <Phone className="h-6 w-6 text-red-600" />
          <h2 className="text-xl font-semibold text-red-800">Emergency</h2>
        </div>
        <p className="text-red-700 mb-4">
          If you're having thoughts of suicide or self-harm, please reach out for help immediately.
        </p>
        <div className="space-y-2">
          {emergencySteps.map((step, index) => (
            <div key={index} className="flex items-start space-x-2">
              <span className="flex-shrink-0 w-6 h-6 bg-red-600 text-white text-sm font-medium rounded-full flex items-center justify-center">
                {index + 1}
              </span>
              <p className="text-red-700">{step}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Crisis Hotlines */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Crisis Hotlines & Support</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {resources.map((resource, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
              <h3 className="font-semibold text-gray-800 mb-2">{resource.name}</h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-blue-600">{resource.phone}</span>
                </div>
                <p className="text-sm text-gray-600">{resource.description}</p>
                <p className="text-sm text-green-600 font-medium">Available: {resource.available}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Self-Care Reminders */}
      <div className="bg-blue-50 rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Remember</h2>
        <div className="space-y-3">
          <div className="flex items-start space-x-3">
            <Heart className="h-5 w-5 text-blue-600 mt-0.5" />
            <p className="text-gray-700">You are not alone. Many people care about you and want to help.</p>
          </div>
          <div className="flex items-start space-x-3">
            <Heart className="h-5 w-5 text-blue-600 mt-0.5" />
            <p className="text-gray-700">Crisis feelings are temporary, even when they feel overwhelming.</p>
          </div>
          <div className="flex items-start space-x-3">
            <Heart className="h-5 w-5 text-blue-600 mt-0.5" />
            <p className="text-gray-700">Seeking help is a sign of strength, not weakness.</p>
          </div>
          <div className="flex items-start space-x-3">
            <Heart className="h-5 w-5 text-blue-600 mt-0.5" />
            <p className="text-gray-700">Professional help is available and can make a real difference.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
