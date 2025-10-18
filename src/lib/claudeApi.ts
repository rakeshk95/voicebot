import { authorizedFetch } from './api';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

export interface ChatRequest {
  message: string;
  conversation_history?: ChatMessage[];
  system_prompt?: string;
  model?: string;
  max_tokens?: number;
  stream?: boolean;
}

export interface ChatResponse {
  success: boolean;
  response?: string;
  error?: string;
  usage?: {
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
  };
  model?: string;
  timestamp?: string;
  conversation_id?: string;
}

export interface ClaudeStatus {
  available: boolean;
  model?: string;
  timestamp: string;
}

export interface ConversationSuggestion {
  suggestions: string[];
  timestamp: string;
}

export interface Conversation {
  id: string;
  title: string;
  system_prompt?: string;
  created_at: string;
  updated_at: string;
  message_count: number;
}

class ClaudeApiService {
  private baseUrl = '/claude';

  async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    try {
      const response = await authorizedFetch(`${this.baseUrl}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error sending message to Claude:', error);
      throw error;
    }
  }

  async *streamMessage(request: ChatRequest): AsyncGenerator<ChatResponse, void, unknown> {
    try {
      const response = await authorizedFetch(`${this.baseUrl}/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...request, stream: true }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body reader available');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                yield data;
                
                if (data.done) {
                  return;
                }
              } catch (parseError) {
                console.warn('Failed to parse SSE data:', parseError);
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      console.error('Error streaming message from Claude:', error);
      throw error;
    }
  }

  async getStatus(): Promise<ClaudeStatus> {
    try {
      const response = await authorizedFetch(`${this.baseUrl}/status`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting Claude status:', error);
      throw error;
    }
  }

  async getSuggestions(context?: string): Promise<ConversationSuggestion> {
    try {
      const url = context 
        ? `${this.baseUrl}/suggestions?context=${encodeURIComponent(context)}`
        : `${this.baseUrl}/suggestions`;
        
      const response = await authorizedFetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting suggestions:', error);
      throw error;
    }
  }

  async analyzeDocument(documentContent: string, analysisType: string = 'summary'): Promise<{
    success: boolean;
    analysis?: string;
    analysis_type?: string;
    usage?: any;
    timestamp?: string;
  }> {
    try {
      const response = await authorizedFetch(`${this.baseUrl}/analyze-document`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          document_content: documentContent,
          analysis_type: analysisType,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error analyzing document:', error);
      throw error;
    }
  }

  // Conversation management methods
  async createConversation(title: string, systemPrompt?: string): Promise<Conversation> {
    try {
      const response = await authorizedFetch(`${this.baseUrl}/conversations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          system_prompt: systemPrompt,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw error;
    }
  }

  async getConversations(): Promise<Conversation[]> {
    try {
      const response = await authorizedFetch(`${this.baseUrl}/conversations`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting conversations:', error);
      throw error;
    }
  }

  async getConversation(conversationId: string): Promise<Conversation> {
    try {
      const response = await authorizedFetch(`${this.baseUrl}/conversations/${conversationId}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting conversation:', error);
      throw error;
    }
  }

  async updateConversation(conversationId: string, updates: { title?: string; system_prompt?: string }): Promise<Conversation> {
    try {
      const response = await authorizedFetch(`${this.baseUrl}/conversations/${conversationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating conversation:', error);
      throw error;
    }
  }

  async deleteConversation(conversationId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await authorizedFetch(`${this.baseUrl}/conversations/${conversationId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting conversation:', error);
      throw error;
    }
  }
}

export const claudeApi = new ClaudeApiService();
