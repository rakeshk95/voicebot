import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { openaiApi, ChatMessage, ChatRequest, OpenAIStatus } from '@/lib/openaiApi';
import { 
  MessageSquare, 
  Send, 
  Bot, 
  User, 
  Zap, 
  Brain, 
  MessageCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  Mic,
  Paperclip,
  Download,
  Copy,
  ThumbsUp,
  ThumbsDown,
  Plus,
  Settings,
  Trash2,
  Edit3,
  Save,
  X,
  Sparkles,
  FileText,
  Lightbulb,
  RefreshCw
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  status?: 'sending' | 'sent' | 'error';
  usage?: {
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
  };
}

interface Conversation {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
  unread: number;
  messageCount: number;
}

interface ClaudeSettings {
  model: string;
  maxTokens: number;
  temperature: number;
  systemPrompt: string;
}

const AgenticChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'system',
      content: 'Welcome to VoxiFlow AI Assistant! I can help you with campaign optimization, batch calling setup, analytics insights, and call performance improvement. What would you like to work on today?',
      timestamp: new Date(),
      status: 'sent'
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [openaiStatus, setOpenaiStatus] = useState<OpenAIStatus | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<string>('current');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<ClaudeSettings>({
    model: 'gpt-4o-mini',
    maxTokens: 1000,
    temperature: 0.7,
    systemPrompt: `You are VoxiFlow AI, an intelligent assistant for voice calling and campaign management. 
You help users with:
- Campaign optimization and strategy
- Call analytics and insights
- Batch calling setup and management
- Performance analysis
- Best practices for voice marketing

Always be helpful, professional, and provide actionable insights. Keep responses concise but informative.`
  });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    checkOpenAIStatus();
    loadSuggestions();
  }, []);

  const checkOpenAIStatus = async () => {
    try {
      const status = await openaiApi.getStatus();
      setOpenaiStatus(status);

      if (!status.available) {
        toast({
          title: 'OpenAI Service Unavailable',
          description: 'Please configure your OpenAI API key to use AI Chat features.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error checking OpenAI status:', error);
      toast({
        title: 'Connection Error',
        description: 'Unable to connect to OpenAI service.',
        variant: 'destructive'
      });
    }
  };

  const loadSuggestions = async () => {
    try {
      const result = await openaiApi.getSuggestions();
      setSuggestions(result.suggestions);
    } catch (error) {
      console.error('Error loading suggestions:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isTyping || isStreaming) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date(),
      status: 'sending'
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    try {
      // Prepare conversation history for Claude
      const conversationHistory: ChatMessage[] = messages
        .filter(msg => msg.role !== 'system')
        .map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
          timestamp: msg.timestamp.toISOString()
        }));

      const request: ChatRequest = {
        message: userMessage.content,
        conversation_history: conversationHistory,
        system_prompt: settings.systemPrompt,
        model: settings.model,
        max_tokens: settings.maxTokens,
        stream: false
      };

          const response = await openaiApi.sendMessage(request);

      if (response.success && response.response) {
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: response.response,
          timestamp: new Date(),
          status: 'sent',
          usage: response.usage
        };

        setMessages(prev => {
          const updated = [...prev];
          // Update the user message status
          updated[updated.length - 1].status = 'sent';
          // Add the AI response
          updated.push(aiMessage);
          return updated;
        });
      } else {
        throw new Error(response.error || 'Failed to get response from Claude');
      }

    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
        timestamp: new Date(),
        status: 'error'
      };

      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1].status = 'error';
        updated.push(errorMessage);
        return updated;
      });

      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsTyping(false);
    }
  };

  const handleStreamMessage = async () => {
    if (!inputMessage.trim() || isTyping || isStreaming) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date(),
      status: 'sending'
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsStreaming(true);

    // Create a placeholder for the streaming response
    const streamingMessageId = (Date.now() + 1).toString();
    const streamingMessage: Message = {
      id: streamingMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      status: 'sending'
    };

    setMessages(prev => [...prev, streamingMessage]);

    try {
      const conversationHistory: ChatMessage[] = messages
        .filter(msg => msg.role !== 'system')
        .map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
          timestamp: msg.timestamp.toISOString()
        }));

      const request: ChatRequest = {
        message: userMessage.content,
        conversation_history: conversationHistory,
        system_prompt: settings.systemPrompt,
        model: settings.model,
        max_tokens: settings.maxTokens,
        stream: true
      };

          for await (const chunk of openaiApi.streamMessage(request)) {
        if (chunk.success && chunk.chunk) {
          setMessages(prev => prev.map(msg => 
            msg.id === streamingMessageId 
              ? { ...msg, content: msg.content + chunk.chunk }
              : msg
          ));
        } else if (chunk.done && chunk.usage) {
          setMessages(prev => prev.map(msg => 
            msg.id === streamingMessageId 
              ? { ...msg, status: 'sent', usage: chunk.usage }
              : msg
          ));
        } else if (!chunk.success) {
          throw new Error(chunk.error || 'Streaming error');
        }
      }

    } catch (error) {
      console.error('Error streaming message:', error);
      
      setMessages(prev => prev.map(msg => 
        msg.id === streamingMessageId 
          ? { 
              ...msg, 
              content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
              status: 'error'
            }
          : msg
      ));

      toast({
        title: 'Streaming Error',
        description: 'Failed to stream message. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsStreaming(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputMessage(suggestion);
  };

  const handleNewConversation = () => {
    setMessages([
      {
        id: '1',
        role: 'system',
        content: 'Welcome to VoxiFlow AI Assistant! I can help you with campaign optimization, batch calling setup, analytics insights, and call performance improvement. What would you like to work on today?',
        timestamp: new Date(),
        status: 'sent'
      }
    ]);
    setActiveConversation('current');
  };

  const quickActions = [
    { label: 'Campaign Analysis', icon: Brain, prompt: 'Help me analyze my campaign performance and identify areas for improvement.' },
    { label: 'Batch Setup', icon: Zap, prompt: 'Guide me through setting up a batch calling campaign.' },
    { label: 'Generate Report', icon: Download, prompt: 'Help me generate a comprehensive report for my calling activities.' },
    { label: 'Optimize Timing', icon: Clock, prompt: 'What are the best times to make calls for maximum success rates?' }
  ];

  return (
    <div className="h-screen flex bg-gradient-to-br from-gray-50 to-blue-50 overflow-hidden">
      <div className="flex-1 flex h-screen">
        {/* Sidebar - Conversations */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-screen">
            <div className="p-4 border-b border-gray-200 flex-shrink-0 bg-gradient-to-r from-gray-50 to-blue-50">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                    <MessageSquare className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">AI Chat</h2>
                    <p className="text-xs text-gray-500">ChatGPT Assistant</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSettings(!showSettings)}
                    className="h-8 w-8 p-0 hover:bg-gray-100"
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={handleNewConversation}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-sm px-4 py-2 rounded-lg shadow-sm"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    New Chat
                  </Button>
                </div>
              </div>
            
                {/* OpenAI Status */}
                {openaiStatus && (
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`w-2 h-2 rounded-full ${openaiStatus.available ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className="text-xs text-gray-600">
                      {openaiStatus.available ? 'ChatGPT Online' : 'ChatGPT Offline'}
                    </span>
                    {openaiStatus.model && (
                      <Badge variant="outline" className="text-xs">
                        {openaiStatus.model.split('-')[1]}
                      </Badge>
                    )}
                  </div>
                )}
          </div>

          {/* Settings Panel */}
          {showSettings && (
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <h3 className="text-sm font-medium text-gray-900 mb-3">AI Settings</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-600">Response Length</label>
                  <Select value={settings.maxTokens.toString()} onValueChange={(value) => setSettings(prev => ({ ...prev, maxTokens: parseInt(value) || 1000 }))}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="500">Short</SelectItem>
                      <SelectItem value="1000">Medium</SelectItem>
                      <SelectItem value="2000">Long</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => setInputMessage(action.prompt)}
                  className="group flex items-center p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200"
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white mr-3 group-hover:scale-110 transition-transform">
                    <action.icon className="h-4 w-4" />
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-medium text-gray-900 group-hover:text-blue-700">
                      {action.label}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Chat History */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Chat History</h3>
              
              {/* Sample chat history for demo */}
              <div className="space-y-2">
                {/* Sample conversation 1 */}
                <button 
                  onClick={() => setInputMessage("Help me optimize my call campaign performance and identify areas for improvement.")}
                  className="w-full bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3 border border-blue-100 hover:border-blue-200 hover:shadow-sm transition-all duration-200 text-left"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900 text-sm">Campaign Optimization</h4>
                    <span className="text-xs text-gray-500">2 min ago</span>
                  </div>
                  <p className="text-xs text-gray-600 mb-2">"Help me optimize my call campaign performance..."</p>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-xs text-green-600">Completed</span>
                  </div>
                </button>

                {/* Sample conversation 2 */}
                <button 
                  onClick={() => setInputMessage("Guide me through setting up a batch calling campaign.")}
                  className="w-full bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-3 border border-purple-100 hover:border-purple-200 hover:shadow-sm transition-all duration-200 text-left"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900 text-sm">Batch Calling Setup</h4>
                    <span className="text-xs text-gray-500">1 hour ago</span>
                  </div>
                  <p className="text-xs text-gray-600 mb-2">"Guide me through setting up batch calls..."</p>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-xs text-green-600">Completed</span>
                  </div>
                </button>

                {/* Sample conversation 3 */}
                <button 
                  onClick={() => setInputMessage("Help me generate a comprehensive report for my calling activities.")}
                  className="w-full bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-3 border border-green-100 hover:border-green-200 hover:shadow-sm transition-all duration-200 text-left"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900 text-sm">Analytics Insights</h4>
                    <span className="text-xs text-gray-500">3 hours ago</span>
                  </div>
                  <p className="text-xs text-gray-600 mb-2">"Analyze my call success rates and patterns..."</p>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-xs text-green-600">Completed</span>
                  </div>
                </button>

                {/* Sample conversation 4 */}
                <button 
                  onClick={() => setInputMessage("What are the best times to make calls for maximum success rates?")}
                  className="w-full bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-3 border border-orange-100 hover:border-orange-200 hover:shadow-sm transition-all duration-200 text-left"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900 text-sm">Call Timing Optimization</h4>
                    <span className="text-xs text-gray-500">Yesterday</span>
                  </div>
                  <p className="text-xs text-gray-600 mb-2">"What are the best times to make calls?"</p>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-xs text-green-600">Completed</span>
                  </div>
                </button>
              </div>

              {/* View All Conversations Button */}
              <div className="mt-4 pt-3 border-t border-gray-200">
                <button className="w-full text-center text-xs text-blue-600 hover:text-blue-700 font-medium">
                  View All Conversations →
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col h-screen">
          {/* Header */}
          <div className="bg-gradient-to-r from-white to-blue-50 border-b border-gray-200 px-6 py-5 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Sparkles className="h-7 w-7 text-white" />
                  </div>
                  {openaiStatus?.available && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                  )}
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">ChatGPT Assistant</h1>
                  <p className="text-sm text-gray-500">Powered by OpenAI GPT-4o-mini</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                {openaiStatus && (
                  <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-sm">
                    <div className={`w-2 h-2 rounded-full ${openaiStatus.available ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                    <span className="text-sm font-medium text-gray-700">
                      {openaiStatus.available ? 'Online' : 'Offline'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 p-4">
            <div className="max-w-4xl mx-auto space-y-4">
              {/* Status Message */}
              {openaiStatus && !openaiStatus.available && messages.length <= 1 && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">ChatGPT Assistant Offline</h3>
                  <p className="text-gray-500 mb-4">
                    The ChatGPT assistant is currently unavailable. Please check your OpenAI API key configuration.
                  </p>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
                    <h4 className="text-sm font-medium text-blue-900 mb-2">Quick Actions Available:</h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• Campaign performance analysis</li>
                      <li>• Batch calling setup guidance</li>
                      <li>• Call timing optimization</li>
                      <li>• Report generation help</li>
                    </ul>
                  </div>
                </div>
              )}
              
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex gap-3 max-w-[85%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      {message.role === 'user' ? (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                          <User className="h-5 w-5 text-white" />
                        </div>
                      ) : message.role === 'assistant' ? (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                          <Bot className="h-5 w-5 text-white" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center">
                          <AlertCircle className="h-5 w-5 text-white" />
                        </div>
                      )}
                    </div>

                    {/* Message Content */}
                    <div className={`flex flex-col ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
                      <div
                        className={`rounded-2xl px-4 py-3 ${
                          message.role === 'user'
                            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                            : message.role === 'assistant'
                            ? 'bg-white border border-gray-200 text-gray-900 shadow-sm'
                            : 'bg-yellow-50 border border-yellow-200 text-gray-900'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                      </div>

                      <div className="flex items-center gap-2 mt-2 px-2">
                        <span className="text-xs text-gray-400">
                          {message.timestamp.toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        {message.role === 'user' && message.status === 'sent' && (
                          <CheckCircle2 className="h-3 w-3 text-blue-600" />
                        )}
                        {message.role === 'assistant' && message.status === 'sent' && (
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" title="Copy">
                              <Copy className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" title="Like">
                              <ThumbsUp className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                        {message.usage && (
                          <Badge variant="outline" className="text-xs">
                            {message.usage.total_tokens} tokens
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {(isTyping || isStreaming) && (
                <div className="flex justify-start">
                  <div className="flex gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                      <Bot className="h-5 w-5 text-white" />
                    </div>
                    <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-sm">
                      <div className="flex space-x-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input Area */}
          <div className="bg-white border-t border-gray-200 px-4 py-3 flex-shrink-0">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-end gap-3">
                <Button variant="outline" size="icon" className="flex-shrink-0 h-10 w-10">
                  <Paperclip className="h-4 w-4" />
                </Button>
                <div className="flex-1 relative">
                  <Textarea
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                        placeholder="Ask ChatGPT anything about your campaigns, analytics, or call optimization..."
                    className="min-h-[44px] max-h-32 resize-none border-2 border-gray-200 focus:border-blue-500 rounded-lg pr-12"
                    rows={1}
                  />
                </div>
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isTyping || isStreaming}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 h-10 px-4"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-gray-400">
                      {openaiStatus?.available ? 'Press Enter to send' : 'ChatGPT Assistant is offline'}
                    </p>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${openaiStatus?.available ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <span className="text-xs text-gray-500">
                        {openaiStatus?.available ? 'ChatGPT Online' : 'ChatGPT Offline'}
                      </span>
                    </div>
                  </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgenticChat;

