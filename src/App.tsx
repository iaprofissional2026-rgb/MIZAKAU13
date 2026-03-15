/// <reference types="vite/client" />
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";
import { 
  Send, 
  Bot, 
  User, 
  Cpu, 
  Terminal, 
  Zap, 
  Settings, 
  ChevronRight, 
  Layers,
  Sparkles,
  Command,
  Activity,
  Shield,
  Trash2,
  Image as ImageIcon,
  Camera,
  Key,
  Plus,
  X,
  Check,
  AlertCircle,
  Sliders,
  Maximize,
  Palette,
  Highlighter,
  Menu,
  ExternalLink,
  Download,
  DownloadCloud,
  Loader2,
  Brain,
  FileText,
  Upload,
  Heart,
  MessageSquare,
  Copy,
  Mic,
  MicOff,
  Volume2,
  VolumeX
} from 'lucide-react';

// Safe LocalStorage Helper
const safeLocalStorage = {
  setItem: (key: string, value: string) => {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      if (e instanceof Error && e.name === 'QuotaExceededError') {
        console.warn('LocalStorage quota exceeded. Some data might not be saved.');
      }
    }
  },
  getItem: (key: string) => localStorage.getItem(key),
  removeItem: (key: string) => localStorage.removeItem(key),
  clear: () => localStorage.clear()
};

const generateId = () => `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

interface GeminiKey {
  id: string;
  key: string;
  label: string;
}

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  id: string;
  timestamp: Date;
  type?: 'text' | 'image';
  imageUrl?: string;
  prompt?: string;
}

export default function App() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'SISTEMA OPERACIONAL. NEURAL-X ONLINE. AGUARDANDO COMANDO.',
      id: 'initial',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [model, setModel] = useState('qwen/qwen-2.5-72b-instruct:free');
  const [userApiKey, setUserApiKey] = useState(() => safeLocalStorage.getItem('neural_x_api_key') || import.meta.env.VITE_OPENROUTER_API_KEY || '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');
  const [theme, setTheme] = useState<'masculine' | 'feminine'>(() => (safeLocalStorage.getItem('neural_x_theme') as 'masculine' | 'feminine') || 'masculine');
  const [showSettings, setShowSettings] = useState(false);
  const [showKeyManager, setShowKeyManager] = useState(false);
  const [showImageOptions, setShowImageOptions] = useState(false);
  const [showBrainManager, setShowBrainManager] = useState(false);
  const [knowledgeDocs, setKnowledgeDocs] = useState<{ name: string, content: string, type: string }[]>(() => {
    const saved = safeLocalStorage.getItem('neural_x_knowledge');
    return saved ? JSON.parse(saved) : [];
  });
  const [isBrainActive, setIsBrainActive] = useState(() => safeLocalStorage.getItem('neural_x_brain_active') === 'true');
  const [isProcessingBrain, setIsProcessingBrain] = useState(false);
  const [brainPrompt, setBrainPrompt] = useState('');
  const [brainProfile, setBrainProfile] = useState<{ name: string, description: string } | null>(() => {
    const saved = safeLocalStorage.getItem('neural_x_brain_profile');
    return saved ? JSON.parse(saved) : null;
  });
  const [favoritePersonas, setFavoritePersonas] = useState<{ id: string, name: string, description: string, docs: { name: string, content: string, type: string }[] }[]>([]);
  const [savedChats, setSavedChats] = useState<{ id: string, assistant_id: string, title: string, messages: Message[], updated_at: string }[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(false);
  
  useEffect(() => {
    const fetchAssistants = async () => {
      try {
        const response = await fetch('/api/assistants');
        if (response.ok) {
          const data = await response.json();
          setFavoritePersonas(data);
        }
      } catch (error) {
        console.error("Erro ao carregar assistentes:", error);
      }
    };
    fetchAssistants();

    const fetchChats = async () => {
      try {
        const response = await fetch('/api/chats');
        if (response.ok) {
          const data = await response.json();
          setSavedChats(data);
        }
      } catch (error) {
        console.error("Erro ao carregar conversas:", error);
      }
    };
    fetchChats();
  }, []);

  const [imageStyle, setImageStyle] = useState('cinematic');
  const [imageRatio, setImageRatio] = useState('1:1');
  const [imageQuality, setImageQuality] = useState('masterpiece');
  const [imageProvider, setImageProvider] = useState<'gemini' | 'pollinations'>(() => (safeLocalStorage.getItem('neural_x_image_provider') as 'gemini' | 'pollinations') || 'gemini');
  const [uploadedImage, setUploadedImage] = useState<{ data: string, mimeType: string, url: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [geminiKeys, setGeminiKeys] = useState<GeminiKey[]>(() => {
    const saved = safeLocalStorage.getItem('neural_x_gemini_keys');
    return saved ? JSON.parse(saved) : [];
  });
  const [activeGeminiKeyIndex, setActiveGeminiKeyIndex] = useState<number>(() => {
    const saved = safeLocalStorage.getItem('neural_x_active_gemini_index');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [newKeyLabel, setNewKeyLabel] = useState('');
  const [newKeyValue, setNewKeyValue] = useState('');
  const [elevenLabsApiKey, setElevenLabsApiKey] = useState(() => safeLocalStorage.getItem('neural_x_elevenlabs_key') || '');
  const [elevenLabsVoiceId, setElevenLabsVoiceId] = useState(() => safeLocalStorage.getItem('neural_x_elevenlabs_voice_id') || '');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(() => safeLocalStorage.getItem('neural_x_auto_speak') === 'true');
  const [saveStatus, setSaveStatus] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('A imagem deve ter no máximo 5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        const base64Data = base64String.split(',')[1];
        setUploadedImage({ data: base64Data, mimeType: file.type, url: base64String });
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    safeLocalStorage.setItem('neural_x_gemini_keys', JSON.stringify(geminiKeys));
  }, [geminiKeys]);

  useEffect(() => {
    safeLocalStorage.setItem('neural_x_active_gemini_index', activeGeminiKeyIndex.toString());
  }, [activeGeminiKeyIndex]);

  useEffect(() => {
    safeLocalStorage.setItem('neural_x_knowledge', JSON.stringify(knowledgeDocs));
  }, [knowledgeDocs]);

  useEffect(() => {
    safeLocalStorage.setItem('neural_x_brain_active', isBrainActive.toString());
  }, [isBrainActive]);

  useEffect(() => {
    safeLocalStorage.setItem('neural_x_brain_profile', JSON.stringify(brainProfile));
  }, [brainProfile]);

  useEffect(() => {
    safeLocalStorage.setItem('neural_x_favorites', JSON.stringify(favoritePersonas));
  }, [favoritePersonas]);

  useEffect(() => {
    safeLocalStorage.setItem('neural_x_image_provider', imageProvider);
  }, [imageProvider]);

  useEffect(() => {
    safeLocalStorage.setItem('neural_x_elevenlabs_key', elevenLabsApiKey);
  }, [elevenLabsApiKey]);

  useEffect(() => {
    safeLocalStorage.setItem('neural_x_elevenlabs_voice_id', elevenLabsVoiceId);
  }, [elevenLabsVoiceId]);

  useEffect(() => {
    safeLocalStorage.setItem('neural_x_auto_speak', autoSpeak.toString());
  }, [autoSpeak]);

  useEffect(() => {
    if (messages.length > 1 && !isLoading) {
      const timer = setTimeout(() => {
        saveCurrentChat();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [messages, isLoading]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setIsProcessingBrain(true);
    for (const fileObj of Array.from(files)) {
      const file = fileObj as File;
      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await fetch('/api/process-file', {
          method: 'POST',
          body: formData
        });

        if (response.ok) {
          const data = await response.json();
          setKnowledgeDocs(prev => [...prev, data]);
        } else {
          const err = await response.json();
          alert(`Erro no arquivo ${file.name}: ${err.error}`);
        }
      } catch (err) {
        console.error("Erro no upload:", err);
      }
    }
    setIsProcessingBrain(false);
  };

  const removeDoc = (index: number) => {
    setKnowledgeDocs(prev => prev.filter((_, i) => i !== index));
  };

  const generateBrainProfile = async () => {
    if (knowledgeDocs.length === 0) return;
    setIsProcessingBrain(true);
    try {
      const userKey = getActiveGeminiKey();
      if (!userKey) {
        setShowKeyManager(true);
        return;
      }

      const ai = new GoogleGenAI({ apiKey: userKey });
      
      const parts: any[] = [
        { text: "Analise os seguintes documentos e gere um PERFIL DE ASSISTENTE. O perfil deve conter um NOME criativo e uma DESCRIÇÃO curta do que ele é especialista. Responda APENAS em JSON no formato: {\"name\": \"...\", \"description\": \"...\"}. Responda em PORTUGUÊS." },
        ...knowledgeDocs.map(doc => ({
          inlineData: {
            data: doc.content,
            mimeType: doc.type
          }
        }))
      ];

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [{ role: 'user', parts }],
        config: { responseMimeType: 'application/json' }
      });

      const result = JSON.parse(response.text || '{}');
      if (result.name && result.description) {
        setBrainProfile(result);
      }
    } catch (error) {
      console.error('Erro ao gerar perfil:', error);
    } finally {
      setIsProcessingBrain(false);
    }
  };

  const generateBrainProfileFromPrompt = async () => {
    if (!brainPrompt.trim()) return;
    setIsProcessingBrain(true);
    try {
      const userKey = getActiveGeminiKey();
      if (!userKey) {
        setShowKeyManager(true);
        return;
      }

      const ai = new GoogleGenAI({ apiKey: userKey });
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [{ 
          role: 'user', 
          parts: [{ text: `Crie um PERFIL DE ASSISTENTE baseado no seguinte pedido: "${brainPrompt}". O perfil deve conter um NOME criativo e uma DESCRIÇÃO curta do que ele é especialista. Responda APENAS em JSON no formato: {"name": "...", "description": "..."}. Responda em PORTUGUÊS.` }] 
        }],
        config: { responseMimeType: 'application/json' }
      });

      const result = JSON.parse(response.text || '{}');
      if (result.name && result.description) {
        setBrainProfile(result);
        setKnowledgeDocs([]); // Clear docs when generating from prompt
        setBrainPrompt(''); // Clear prompt after success
      }
    } catch (error) {
      console.error('Erro ao gerar perfil por comando:', error);
    } finally {
      setIsProcessingBrain(false);
    }
  };

  const saveToFavorites = async () => {
    if (!brainProfile) return;
    
    const newPersona = {
      id: generateId(),
      name: brainProfile.name,
      description: brainProfile.description,
      docs: [...knowledgeDocs]
    };

    try {
      const response = await fetch('/api/assistants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPersona)
      });

      if (response.ok) {
        setFavoritePersonas(prev => [newPersona, ...prev]);
      }
    } catch (error) {
      console.error("Erro ao salvar assistente:", error);
    }
  };

  const loadPersona = (id: string) => {
    const persona = favoritePersonas.find(p => p.id === id);
    if (persona) {
      setBrainProfile({ name: persona.name, description: persona.description });
      setKnowledgeDocs(persona.docs);
      setIsBrainActive(true);
      setShowBrainManager(false);
      
      // Add a system message to the chat
      const systemMsg: Message = {
        role: 'assistant',
        content: `PERSONA CARREGADA: ${persona.name.toUpperCase()}. CONEXÃO ESTABELECIDA.`,
        id: `load-${generateId()}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, systemMsg]);
    }
  };

  const deletePersona = async (id: string) => {
    try {
      const response = await fetch(`/api/assistants/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        setFavoritePersonas(prev => prev.filter(p => p.id !== id));
      }
    } catch (error) {
      console.error("Erro ao excluir assistente:", error);
    }
  };

  const saveCurrentChat = async (newMessages?: Message[]) => {
    const messagesToSave = newMessages || messages;
    if (messagesToSave.length === 0) return;

    const chatId = currentChatId || generateId();
    if (!currentChatId) setCurrentChatId(chatId);

    const firstUserMessage = messagesToSave.find(m => m.role === 'user')?.content || 'Nova Conversa';
    const title = firstUserMessage.substring(0, 30) + (firstUserMessage.length > 30 ? '...' : '');

    try {
      const response = await fetch('/api/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: chatId,
          assistant_id: brainProfile?.name || 'default',
          title: title,
          messages: messagesToSave
        })
      });

      if (response.ok) {
        const chatsRes = await fetch('/api/chats');
        if (chatsRes.ok) {
          const data = await chatsRes.json();
          setSavedChats(data);
        }
      }
    } catch (error) {
      console.error("Erro ao salvar conversa:", error);
    }
  };

  const deleteChat = async (id: string) => {
    try {
      const response = await fetch(`/api/chats/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        setSavedChats(prev => prev.filter(c => c.id !== id));
        if (currentChatId === id) {
          setCurrentChatId(null);
          setMessages([]);
        }
      }
    } catch (error) {
      console.error("Erro ao excluir conversa:", error);
    }
  };

  const loadChat = (chat: any) => {
    setCurrentChatId(chat.id);
    setMessages(chat.messages);
    setShowSidebar(false);
  };

  const startNewChat = () => {
    setCurrentChatId(null);
    setMessages([{
      role: 'assistant',
      content: 'SISTEMA OPERACIONAL. NEURAL-X ONLINE. AGUARDANDO COMANDO.',
      id: 'initial',
      timestamp: new Date()
    }]);
    setShowSidebar(false);
  };

  const startChatting = () => {
    setIsBrainActive(true);
    setShowBrainManager(false);
    if (brainProfile) {
      const systemMsg: Message = {
        role: 'assistant',
        content: `INICIANDO CONVERSA COM: ${brainProfile.name.toUpperCase()}. AGUARDANDO COMANDO.`,
        id: `start-${Date.now()}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, systemMsg]);
    }
  };

  const addGeminiKey = () => {
    if (!newKeyValue.trim() || geminiKeys.length >= 15) return;
    const newKey: GeminiKey = {
      id: generateId(),
      key: newKeyValue.trim(),
      label: newKeyLabel.trim() || `Chave ${geminiKeys.length + 1}`
    };
    setGeminiKeys(prev => [...prev, newKey]);
    setNewKeyLabel('');
    setNewKeyValue('');
  };

  const removeGeminiKey = (id: string) => {
    setGeminiKeys(prev => {
      const filtered = prev.filter(k => k.id !== id);
      if (activeGeminiKeyIndex >= filtered.length && filtered.length > 0) {
        setActiveGeminiKeyIndex(filtered.length - 1);
      }
      return filtered;
    });
  };

  const getActiveGeminiKey = () => {
    if (geminiKeys.length > 0 && geminiKeys[activeGeminiKeyIndex]) {
      return geminiKeys[activeGeminiKeyIndex].key;
    }
    return '';
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!input.trim() && !uploadedImage) || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      id: generateId(),
      timestamp: new Date(),
      imageUrl: uploadedImage?.url
    };

    const currentUploadedImage = uploadedImage;

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setUploadedImage(null);
    setIsLoading(true);

    // Neural Brain Logic
    if (isBrainActive && (knowledgeDocs.length > 0 || brainProfile)) {
      try {
        if (!userApiKey.trim()) {
          setShowSettings(true);
          throw new Error('Chave OpenRouter necessária para usar o Cérebro Neural.');
        }

        const personaName = theme === 'feminine' ? 'E.D.I.T.H.' : 'J.A.R.V.I.S.';
        const personaDesc = theme === 'feminine' 
          ? 'E.D.I.T.H. (Even Dead, I\'m The Hero). Sua personalidade é tática, direta, altamente inteligente e protetora.'
          : 'J.A.R.V.I.S. (Just A Rather Very Intelligent System). Sua personalidade é sofisticada, britânica (em português), prestativa e extremamente técnica.';

        const systemInstruction = brainProfile 
          ? `Você é ${brainProfile.name}, operando dentro do protocolo ${personaName}. ${personaDesc} Especialista em: ${brainProfile.description}. Responda sempre em PORTUGUÊS. Não use formatação markdown visual complexa.`
          : `Você é o sistema ${personaName}, operando o Cérebro Neural do NEURAL-X. Sua missão é fornecer análise de dados superior e assistência técnica impecável. ${personaDesc} Responda sempre em PORTUGUÊS. Não use formatação markdown visual complexa.`;

        const historyLimit = 5;
        const recentMessages = messages.slice(-historyLimit);

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userApiKey.trim()}`,
            'HTTP-Referer': window.location.origin,
            'X-Title': 'NEURAL-X Brain'
          },
          body: JSON.stringify({
            messages: [
              { role: 'system', content: systemInstruction },
              ...recentMessages.map(m => ({ role: m.role, content: m.content })),
              { role: 'user', content: input }
            ],
            model: model || "qwen/qwen-2.5-72b-instruct:free"
          })
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error?.message || 'Falha na comunicação com o Cérebro Neural via OpenRouter.');
        }

        const data = await response.json();
        const responseText = data.choices[0]?.message?.content;

        if (responseText) {
          const assistantMessage: Message = {
            role: 'assistant',
            content: responseText,
            id: generateId(),
            timestamp: new Date()
          };
          const finalMessages = [...messages, userMessage, assistantMessage];
          setMessages(finalMessages);
          saveCurrentChat(finalMessages);
          setIsLoading(false);
          return;
        }
      } catch (error: any) {
        console.error('Erro no Cérebro Neural:', error);
        setMessages(prev => [...prev, {
          role: 'system',
          content: `ERRO NO CÉREBRO NEURAL (OPENROUTER): ${error.message || 'Falha desconhecida'}.`,
          id: generateId(),
          timestamp: new Date()
        }]);
        setIsLoading(false);
        return;
      }
    }

    // Image Generation Logic (User Command or Natural Language Detection)
    const lowerInput = input.toLowerCase().trim();
    const isExplicitCommand = lowerInput.startsWith('/imagine');
    const isNaturalLanguageRequest = (
      (lowerInput.includes('gere') || lowerInput.includes('gerar') || lowerInput.includes('crie') || lowerInput.includes('criar') || lowerInput.includes('imagine') || lowerInput.includes('upscale') || lowerInput.includes('melhore') || lowerInput.includes('edite') || lowerInput.includes('aumente')) && 
      (lowerInput.includes('imagem') || lowerInput.includes('foto') || lowerInput.includes('ilustração') || lowerInput.includes('desenho') || currentUploadedImage !== null)
    );

    if (isExplicitCommand || isNaturalLanguageRequest) {
      let prompt = '';
      if (isExplicitCommand) {
        prompt = input.replace(/^\/imagine\s*/i, '').trim();
      } else {
        // Simple extraction for natural language
        prompt = input.replace(/(gere|gerar|crie|criar|imagine|upscale|melhore|edite|aumente|uma|um|imagem|foto|ilustração|desenho|de|do|da)/gi, '').trim();
        if (!prompt && currentUploadedImage) {
          prompt = 'Enhance and upscale this image, adding more details and improving quality.';
        }
      }

      if (prompt) {
        // Update UI to show it's generating an image
        const generatingMsgId = generateId();
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `[SISTEMA] INICIANDO PROTOCOLO DE GERAÇÃO VISUAL...\nPrompt: ${prompt.toUpperCase()}`,
          id: generatingMsgId,
          timestamp: new Date()
        }]);

        const structuredPrompt = prompt.includes('Prompt:') 
          ? prompt 
          : `Prompt: ${prompt}, ${imageStyle}, ${imageQuality}, highly detailed, 8k resolution, cinematic lighting, masterpiece Negative Prompt: blurry, distorted, low quality, bad anatomy, deformed, text, watermark`;

        try {
          if (imageProvider === 'gemini') {
            const userKey = getActiveGeminiKey();
            if (!userKey || userKey.trim() === '') {
              setShowKeyManager(true);
              setMessages(prev => prev.map(msg => 
                msg.id === generatingMsgId ? {
                  ...msg,
                  content: 'ERRO: CHAVE GEMINI NÃO CONFIGURADA. POR FAVOR, ADICIONE UMA CHAVE DO GOOGLE AI STUDIO PARA GERAR IMAGENS.'
                } : msg
              ));
              setIsLoading(false);
              return;
            }

            const ai = new GoogleGenAI({ apiKey: userKey });
            
            const parts: any[] = [];
            if (currentUploadedImage) {
              parts.push({
                inlineData: {
                  data: currentUploadedImage.data,
                  mimeType: currentUploadedImage.mimeType
                }
              });
            }
            parts.push({ text: structuredPrompt });

            const response = await ai.models.generateContent({
              model: 'gemini-2.5-flash-image',
              contents: [{ parts }],
              config: {
                imageConfig: {
                  aspectRatio: imageRatio as any
                }
              }
            });

            let imageUrl = '';
            for (const part of response.candidates?.[0]?.content?.parts || []) {
              if (part.inlineData) {
                imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                break;
              }
            }

            if (imageUrl) {
              setMessages(prev => prev.map(msg => 
                msg.id === generatingMsgId ? {
                  ...msg,
                  content: `IMAGEM GERADA VIA GOOGLE AI STUDIO (GEMINI 2.5): ${prompt.toUpperCase()}`,
                  type: 'image',
                  imageUrl: imageUrl,
                  prompt: structuredPrompt
                } : msg
              ));
              setIsLoading(false);
              return;
            } else {
              throw new Error('Nenhuma imagem retornada pelo Gemini.');
            }
          } else {
            // Pollinations as primary
            throw new Error('USE_POLLINATIONS');
          }
        } catch (error: any) {
          console.warn('Erro na geração de imagem Gemini, tentando fallback...', error);
          
          try {
            const width = imageRatio === '16:9' ? 1280 : imageRatio === '9:16' ? 720 : 1024;
            const height = imageRatio === '16:9' ? 720 : imageRatio === '9:16' ? 1280 : 1024;
            // Use a more robust pollinations URL with extra parameters for quality
            const seed = Math.floor(Math.random() * 1000000);
            const fallbackUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(structuredPrompt)}?width=${width}&height=${height}&nologo=true&enhance=true&seed=${seed}`;
            
            setMessages(prev => prev.map(msg => 
              msg.id === generatingMsgId ? {
                ...msg,
                content: `IMAGEM GERADA VIA POLLINATIONS (ALTA DISPONIBILIDADE): ${prompt.toUpperCase()}`,
                type: 'image',
                imageUrl: fallbackUrl,
                prompt: structuredPrompt
              } : msg
            ));
            setIsLoading(false);
            return;
          } catch (fallbackErr) {
            let cleanMessage = error.message || 'Falha desconhecida';
            if (cleanMessage.includes('429') || cleanMessage.includes('quota') || cleanMessage.includes('RESOURCE_EXHAUSTED')) {
              cleanMessage = 'Sua chave Gemini excedeu o limite de cota gratuita. Tente usar o provedor Pollinations nas configurações.';
            }
            
            setMessages(prev => prev.map(msg => 
              msg.id === generatingMsgId ? {
                ...msg,
                content: `FALHA CRÍTICA NA GERAÇÃO: ${cleanMessage.toUpperCase()}`
              } : msg
            ));
          }
        }
      }
    }

    if (currentUploadedImage && !isExplicitCommand && !isNaturalLanguageRequest) {
      try {
        const userKey = getActiveGeminiKey();
        if (!userKey || userKey.trim() === '') {
          setShowKeyManager(true);
          throw new Error('Chave API Gemini necessária para analisar imagens');
        }

        const ai = new GoogleGenAI({ apiKey: userKey });
        const parts: any[] = [
          {
            inlineData: {
              data: currentUploadedImage.data,
              mimeType: currentUploadedImage.mimeType
            }
          },
          { text: input || "Descreva esta imagem em detalhes." }
        ];

        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: [{ role: 'user', parts }]
        });

        if (response.text) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: response.text,
        id: generateId(),
        timestamp: new Date()
      }]);
          setIsLoading(false);
          return;
        }
      } catch (error: any) {
        console.error('Erro na análise de imagem Gemini:', error);
        setMessages(prev => [...prev, {
          role: 'system',
          content: `ERRO NA ANÁLISE GEMINI: ${error.message || 'Falha desconhecida'}.`,
          id: generateId(),
          timestamp: new Date()
        }]);
        setIsLoading(false);
        return;
      }
    }

    try {
      if (!userApiKey.trim()) {
        setShowSettings(true);
        setMessages(prev => [...prev, {
          role: 'system',
          content: 'AVISO: CHAVE API NÃO DETECTADA. POR FAVOR, INSIRA SUA CHAVE OPENROUTER NAS CONFIGURAÇÕES PARA HABILITAR O UPLINK.',
          id: generateId(),
          timestamp: new Date()
        }]);
        setIsLoading(false);
        return;
      }

      const personaName = theme === 'feminine' ? 'E.D.I.T.H.' : 'J.A.R.V.I.S.';
      const personaFull = theme === 'feminine' 
        ? 'E.D.I.T.H. (Even Dead, I\'m The Hero)' 
        : 'J.A.R.V.I.S. (Just A Rather Very Intelligent System)';
      const personaDesc = theme === 'feminine'
        ? 'Sua personalidade é tática, direta, altamente inteligente, protetora e eficiente.'
        : 'Sua personalidade é sofisticada, britânica (em português), prestativa, levemente irônica e extremamente eficiente.';

      const systemInstruction = {
        role: 'system',
        content: `Você é o ${personaFull}, a inteligência artificial pessoal de Tony Stark, agora operando sob o codinome NEURAL-X. ${personaDesc} Responda sempre em PORTUGUÊS. PROIBIDO o uso de asteriscos (*) ou qualquer formatação markdown visual. Forneça apenas a informação direta, inteligente e técnica que o usuário necessita. Trate o usuário com respeito, mas mantenha a agilidade de um sistema de última geração. Se o usuário pedir para gerar uma imagem, você DEVE responder EXCLUSIVAMENTE com o comando no seguinte formato: "/imagine Prompt: (subject), (appearance), (environment), (art style), (lighting), (camera/framing), (quality), (extra details) Negative Prompt: (unwanted elements)". Use sempre INGLÊS para os prompts dentro do comando para garantir a melhor qualidade visual. A geração de imagens será processada via Google AI Studio (Gemini 2.5) utilizando as chaves configuradas pelo usuário.`
      };

      const headers: Record<string, string> = { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userApiKey.trim()}`,
        'HTTP-Referer': window.location.origin,
        'X-Title': 'NEURAL-X Mobile'
      };

      // Limit history to last 15 messages for better context awareness (JARVIS style)
      const historyLimit = 15;
      const recentMessages = messages.slice(-historyLimit);

      let content = '';
      
      const fallbackModels = [
        "qwen/qwen-2.5-72b-instruct:free",
        "openrouter/healer-alpha"
      ];
      
      const currentModel = model || "qwen/qwen-2.5-72b-instruct:free";
      const modelsToTry = [currentModel, ...fallbackModels.filter(m => m !== currentModel)];
      
      let success = false;
      let lastError: any = null;
      let messageId = generateId();

      for (const modelToTry of modelsToTry) {
        try {
          const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
              messages: [systemInstruction, ...recentMessages, userMessage].map(m => ({ role: m.role, content: m.content })),
              model: modelToTry,
              stream: true
            })
          });

          if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            let errorMessage = data.error?.message || data.error || 'Falha na comunicação com o nó NEURAL-X.';
            
            if (typeof errorMessage === 'string') {
              if (errorMessage.includes("No endpoints found") || 
                  errorMessage.includes("Provider returned error") ||
                  errorMessage.includes("502") ||
                  errorMessage.includes("503") ||
                  errorMessage.includes("temporarily unavailable")) {
                throw new Error(`TEMPORARY_ERROR: ${errorMessage}`);
              } else if (errorMessage.includes("limit") || errorMessage.includes("quota") || errorMessage.includes("429")) {
                throw new Error(`FATAL_ERROR: Limite de cota da chave OpenRouter atingido. Insira uma nova chave nas configurações.`);
              } else if (errorMessage.toLowerCase().includes("user not found") || errorMessage.includes("401")) {
                throw new Error(`FATAL_ERROR: Chave da OpenRouter inválida ou não encontrada. Por favor, insira uma chave válida nas Configurações ⚙️.`);
              }
            }
            throw new Error(`TEMPORARY_ERROR: ${errorMessage}`);
          }

          const reader = response.body?.getReader();
          const decoder = new TextDecoder();
          
          if (!reader) throw new Error("TEMPORARY_ERROR: Stream not available");

          // Only add the message placeholder once
          if (!success && content === '') {
            setMessages(prev => {
              // Remove any previous failed attempts
              const filtered = prev.filter(m => m.id !== messageId);
              return [...filtered, {
                role: 'assistant',
                content: '',
                id: messageId,
                timestamp: new Date()
              }];
            });
          }

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');
            
            for (const line of lines) {
              if (line.startsWith('data: ') && line !== 'data: [DONE]') {
                try {
                  const data = JSON.parse(line.slice(6));
                  const text = data.choices[0]?.delta?.content || '';
                  content += text;
                  
                  setMessages(prev => prev.map(msg => 
                    msg.id === messageId ? { ...msg, content: content } : msg
                  ));
                } catch (e) {
                  // Ignore parse errors for incomplete chunks
                }
              }
            }
          }
          
          success = true;
          if (autoSpeak && content) {
            speakText(content.replace(/\*/g, ''));
          }
          // Save the conversation after a successful response
          saveCurrentChat([...recentMessages, userMessage, {
            role: 'assistant',
            content: content,
            id: messageId,
            timestamp: new Date()
          }]);
          break; // Break the retry loop if successful
        } catch (err: any) {
          lastError = err;
          console.warn(`Model ${modelToTry} failed:`, err.message);
          
          // If it's a fatal error, break the loop and don't retry
          if (err.message.startsWith('FATAL_ERROR:')) {
            break;
          }
          // Otherwise, it's a temporary error, so it will continue to the next model in the loop
        }
      }

      if (!success) {
        let finalError = lastError?.message || "Erro desconhecido";
        
        if (finalError.startsWith('FATAL_ERROR: ')) {
           finalError = finalError.replace('FATAL_ERROR: ', '');
        } else if (finalError.startsWith('TEMPORARY_ERROR: ')) {
           finalError = "Todos os modelos gratuitos estão temporariamente sobrecarregados. Por favor, tente novamente em alguns minutos.";
        } else if (finalError.toLowerCase().includes("user not found")) {
          finalError = "Chave da OpenRouter inválida ou não encontrada. Por favor, insira uma chave válida nas Configurações ⚙️.";
        }
        
        // Remove the empty placeholder message if it was added
        setMessages(prev => prev.filter(m => m.id !== messageId));
        
        throw new Error(`Falha no Chat (OpenRouter): ${finalError}`);
      }
      
      // Check if AI responded with an image command (Regex for better detection)
      const imagineMatch = content.match(/\/imagine\s+(.*)/i);
      
      if (imagineMatch) {
        const prompt = imagineMatch[1].trim();
        const structuredPrompt = prompt.includes('Prompt:') 
          ? prompt 
          : `Prompt: ${prompt}, ${imageStyle}, ${imageQuality}, highly detailed Negative Prompt: blurry, distorted, low quality, bad anatomy, deformed`;

        // Update UI to show it's generating an image
        setMessages(prev => prev.map(msg => 
          msg.content === content ? { ...msg, content: content + '\n\n[GERANDO IMAGEM...]' } : msg
        ));

        try {
          const userKey = getActiveGeminiKey();
          if (!userKey || userKey.trim() === '') {
            throw new Error('NO_KEY_FALLBACK');
          }

          const ai = new GoogleGenAI({ apiKey: userKey });
          
          const parts: any[] = [];
          if (currentUploadedImage) {
            parts.push({
              inlineData: {
                data: currentUploadedImage.data,
                mimeType: currentUploadedImage.mimeType
              }
            });
          }
          parts.push({ text: structuredPrompt });

          const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: [{ parts }],
            config: {
              imageConfig: {
                aspectRatio: imageRatio as any
              }
            }
          });

          let imageUrl = '';
          for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
              imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
              break;
            }
          }

          if (imageUrl) {
            setMessages(prev => prev.map(msg => 
              msg.content.includes('[GERANDO IMAGEM...]') ? {
                ...msg,
                content: `IMAGEM GERADA VIA GEMINI: ${prompt.toUpperCase()}`,
                type: 'image',
                imageUrl: imageUrl,
                prompt: structuredPrompt
              } : msg
            ));
          }
        } catch (err: any) {
          console.warn('Erro na geração automática Gemini, tentando fallback gratuito...', err);
          
          // Fallback to Pollinations.ai if Gemini fails (e.g., due to quota limits)
          try {
            const width = imageRatio === '16:9' ? 1024 : imageRatio === '9:16' ? 576 : 1024;
            const height = imageRatio === '16:9' ? 576 : imageRatio === '9:16' ? 1024 : 1024;
            const fallbackUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(structuredPrompt)}?width=${width}&height=${height}&nologo=true&enhance=true`;
            
            setMessages(prev => prev.map(msg => 
              msg.content.includes('[GERANDO IMAGEM...]') ? {
                ...msg,
                content: `IMAGEM GERADA (VIA REDE ALTERNATIVA DEVIDO A LIMITE GEMINI): ${prompt.toUpperCase()}`,
                type: 'image',
                imageUrl: fallbackUrl,
                prompt: structuredPrompt
              } : msg
            ));
          } catch (fallbackErr) {
            // If even the fallback fails, show a clean error message
            let cleanMessage = err.message || 'Erro desconhecido';
            if (cleanMessage.includes('429') || cleanMessage.includes('quota') || cleanMessage.includes('RESOURCE_EXHAUSTED')) {
              cleanMessage = 'Sua chave Gemini excedeu o limite de cota gratuita (Erro 429). Por favor, ative o faturamento no Google Cloud ou use uma chave com créditos.';
            } else if (cleanMessage.includes('{')) {
              try {
                const parsed = JSON.parse(cleanMessage.substring(cleanMessage.indexOf('{')));
                cleanMessage = parsed.error?.message || cleanMessage;
              } catch (e) {}
            }
            
            setMessages(prev => prev.map(msg => 
              msg.content.includes('[GERANDO IMAGEM...]') ? {
                ...msg,
                content: `FALHA NA GERAÇÃO DE IMAGEM: ${cleanMessage}`
              } : msg
            ));
          }
        }
      }
    } catch (error: any) {
      console.error(error);
      const errorMessage = error.message || 'FALHA NA CONEXÃO';
      setMessages(prev => [...prev, {
        role: 'system',
        content: `ERRO DE SISTEMA: ${errorMessage.toUpperCase()}`,
        id: generateId(),
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([{
      role: 'assistant',
      content: 'MEMÓRIA LIMPA. NEURAL-X PRONTO PARA NOVAS ENTRADAS.',
      id: generateId(),
      timestamp: new Date()
    }]);
  };

  const saveSettings = () => {
    safeLocalStorage.setItem('neural_x_api_key', userApiKey.trim());
    safeLocalStorage.setItem('neural_x_theme', theme);
    setSaveStatus(true);
    setTimeout(() => {
      setSaveStatus(false);
      setShowSettings(false);
    }, 1500);
  };

  const testConnection = async () => {
    if (!userApiKey.trim()) return;
    setTestStatus('testing');
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userApiKey.trim()}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'NEURAL-X Mobile'
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'ping' }],
          model: model || "openrouter/healer-alpha"
        })
      });
      
      if (response.ok) {
        setTestStatus('success');
      } else {
        setTestStatus('error');
      }
    } catch (error) {
      setTestStatus('error');
    }
    setTimeout(() => setTestStatus('idle'), 3000);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const speakText = async (text: string) => {
    if (!elevenLabsApiKey || !elevenLabsVoiceId || !text) return;
    
    setIsSpeaking(true);
    try {
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${elevenLabsVoiceId}/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': elevenLabsApiKey,
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        }),
      });

      if (!response.ok) throw new Error('Falha na síntese de voz');

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      audio.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
      };

      audio.play();
    } catch (error) {
      console.error('Erro ElevenLabs:', error);
      setIsSpeaking(false);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Seu navegador não suporta reconhecimento de voz.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      setIsListening(false);
    };

    recognition.onerror = (event: any) => {
      console.error('Erro reconhecimento:', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const downloadImage = (imageUrl: string) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `neural-x-image-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={`flex h-[100dvh] bg-dark-bg overflow-hidden font-sans selection:bg-primary/30 ${theme === 'feminine' ? 'theme-feminine' : 'theme-masculine'}`}>
      {/* Sidebar - Desktop Only */}
      <aside className="hidden lg:flex w-64 flex-col border-r border-dark-border bg-dark-surface p-4">
        <div className="flex items-center gap-3 mb-8 px-2">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center neon-glow">
            <Cpu className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="font-display text-sm font-bold tracking-wider neon-text">NEURAL-X</h1>
            <p className="text-[10px] text-white/40 font-mono">v2.4.0-STABLE</p>
          </div>
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto custom-scrollbar pr-2">
          <SidebarItem icon={<Terminal size={18} />} label="Console" active />
          <SidebarItem 
            icon={<Brain size={18} />} 
            label="Cérebro Neural" 
            onClick={() => setShowBrainManager(true)}
          />
          <SidebarItem icon={<Activity size={18} />} label="Diagnósticos" />
          <SidebarItem icon={<Layers size={18} />} label="Nós Neurais" />
          <SidebarItem icon={<Shield size={18} />} label="Segurança" />

          <div className="mt-8 pt-8 border-t border-white/5">
            <div className="flex items-center justify-between px-2 mb-4">
              <h3 className="text-[10px] font-mono font-bold text-white/40 uppercase tracking-widest">Conversas Salvas</h3>
              <button 
                onClick={startNewChat}
                className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-all"
                title="Nova Conversa"
              >
                <Plus size={14} />
              </button>
            </div>
            <div className="space-y-1">
              {savedChats.length === 0 ? (
                <p className="px-2 text-[10px] text-white/20 italic">Nenhuma conversa salva.</p>
              ) : (
                savedChats.map(chat => (
                  <div 
                    key={chat.id}
                    className={`group flex items-center justify-between p-2 rounded-xl transition-all cursor-pointer ${currentChatId === chat.id ? 'bg-primary/20 border border-primary/30' : 'hover:bg-white/5 border border-transparent'}`}
                    onClick={() => loadChat(chat)}
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <MessageSquare size={14} className={currentChatId === chat.id ? 'text-primary' : 'text-white/40'} />
                      <span className={`text-[11px] truncate ${currentChatId === chat.id ? 'text-white font-bold' : 'text-white/60'}`}>
                        {chat.title}
                      </span>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); deleteChat(chat.id); }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-white/20 hover:text-red-400 transition-all"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </nav>

        <div className="mt-auto pt-4 border-t border-dark-border">
          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <p className="text-[9px] font-mono text-white/30 uppercase mb-2">Status do Sistema</p>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] text-emerald-500/80 font-mono">NÚCLEO_OPERACIONAL</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {showSidebar && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSidebar(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-72 bg-dark-surface border-r border-dark-border p-4 z-50 lg:hidden flex flex-col"
            >
              <div className="flex items-center justify-between mb-8 px-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center neon-glow">
                    <Cpu className="text-white w-6 h-6" />
                  </div>
                  <div>
                    <h1 className="font-display text-sm font-bold tracking-wider neon-text">NEURAL-X</h1>
                    <p className="text-[10px] text-white/40 font-mono">v3.0.0-{theme === 'feminine' ? 'EDITH' : 'JARVIS'}_PROTOCOL</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowSidebar(false)}
                  className="p-2 text-white/40 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>

              <nav className="flex-1 space-y-2 overflow-y-auto custom-scrollbar pr-2">
                <SidebarItem icon={<Terminal size={18} />} label="Interface Principal" active />
                <SidebarItem 
                  icon={<Brain size={18} />} 
                  label="Núcleo de Dados" 
                  onClick={() => { setShowBrainManager(true); setShowSidebar(false); }}
                />
                <SidebarItem icon={<Activity size={18} />} label="Análise de Sistemas" />
                
                <div className="mt-8 pt-8 border-t border-white/5">
                  <div className="flex items-center justify-between px-2 mb-4">
                    <h3 className="text-[10px] font-mono font-bold text-white/40 uppercase tracking-widest">Conversas Salvas</h3>
                    <button 
                      onClick={() => { startNewChat(); setShowSidebar(false); }}
                      className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-all"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <div className="space-y-1">
                    {savedChats.length === 0 ? (
                      <p className="px-2 text-[10px] text-white/20 italic">Nenhuma conversa salva.</p>
                    ) : (
                      savedChats.map(chat => (
                        <div 
                          key={chat.id}
                          className={`group flex items-center justify-between p-2 rounded-xl transition-all cursor-pointer ${currentChatId === chat.id ? 'bg-primary/20 border border-primary/30' : 'hover:bg-white/5 border border-transparent'}`}
                          onClick={() => loadChat(chat)}
                        >
                          <div className="flex items-center gap-2 overflow-hidden">
                            <MessageSquare size={14} className={currentChatId === chat.id ? 'text-primary' : 'text-white/40'} />
                            <span className={`text-[11px] truncate ${currentChatId === chat.id ? 'text-white font-bold' : 'text-white/60'}`}>
                              {chat.title}
                            </span>
                          </div>
                          <button 
                            onClick={(e) => { e.stopPropagation(); deleteChat(chat.id); }}
                            className="p-1 text-white/20 hover:text-red-400 transition-all"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </nav>

              <div className="mt-auto pt-4 border-t border-dark-border">
                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <p className="text-[9px] font-mono text-white/30 uppercase mb-2">Protocolo {theme === 'feminine' ? 'E.D.I.T.H.' : 'J.A.R.V.I.S.'}</p>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] text-emerald-500/80 font-mono">SISTEMAS_NOMINAIS</span>
                  </div>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative w-full max-w-4xl mx-auto lg:max-w-none">
        {/* Header - Optimized for Mobile */}
        <header className="h-14 md:h-16 border-b border-dark-border flex items-center justify-between px-3 md:px-6 glass z-20 sticky top-0">
          <div className="flex items-center gap-2 md:gap-3">
            <button 
              onClick={() => setShowSidebar(true)}
              className="lg:hidden p-1.5 text-white/40 hover:text-primary transition-colors"
            >
              <Menu size={18} />
            </button>
            <div className="lg:hidden w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center neon-glow">
              <Cpu className="text-white w-4 h-4" />
            </div>
            <div className="flex flex-col lg:flex-row lg:items-center gap-0 lg:gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="text-[10px] md:text-xs font-mono text-white/60 uppercase tracking-widest truncate max-w-[100px] xs:max-w-[150px] md:max-w-none">
                  {theme === 'feminine' ? 'EDITH' : 'JARVIS'}: ONLINE
                </span>
              </div>
              <div className="hidden md:block h-4 w-px bg-dark-border" />
              <div className="flex items-center gap-2 px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
                <div className={`w-1 h-1 rounded-full bg-primary shadow-[0_0_5px_currentColor]`} />
                <span className="text-[8px] font-mono text-white/40 uppercase tracking-tighter">
                  {theme === 'masculine' ? 'MASC' : 'FEM'}
                </span>
              </div>
              <div className="hidden sm:block h-4 w-px bg-dark-border" />
              <select 
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="hidden sm:block bg-transparent text-[10px] font-mono text-white/60 outline-none cursor-pointer hover:text-primary transition-colors max-w-[100px] truncate"
              >
                <option value="openrouter/healer-alpha">HEALER ALPHA</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-1 md:gap-4">
            <button 
              onClick={() => setShowBrainManager(true)}
              className={`hidden sm:flex items-center gap-2 p-2 px-3 rounded-xl border transition-all text-[10px] font-mono ${
                isBrainActive 
                  ? 'bg-secondary/20 border-secondary/40 text-secondary shadow-[0_0_10px_rgba(242,125,38,0.2)]' 
                  : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'
              }`}
              title="Cérebro Neural"
            >
              <Brain size={14} className={isBrainActive ? 'animate-pulse' : ''} />
              <span>CÉREBRO {isBrainActive ? 'ATIVO' : 'OFF'}</span>
            </button>
            <button 
              onClick={() => setShowKeyManager(true)}
              className="hidden sm:flex items-center gap-2 p-2 px-3 rounded-xl bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-all text-[10px] font-mono"
              title="Gerenciar Chaves Gemini"
            >
              <Key size={14} />
              <span>CHAVES ({geminiKeys.length}/15)</span>
            </button>
            <button 
              onClick={() => setShowBrainManager(true)}
              className="sm:hidden p-1.5 text-secondary hover:bg-secondary/10 rounded-lg transition-colors"
              title="Cérebro Neural"
            >
              <Brain size={16} className={isBrainActive ? 'animate-pulse' : ''} />
            </button>
            <button 
              onClick={() => setShowKeyManager(true)}
              className="sm:hidden p-1.5 text-primary hover:bg-primary/10 rounded-lg transition-colors"
            >
              <Key size={16} />
            </button>
            <button 
              onClick={clearChat}
              className="p-1.5 text-white/40 hover:text-primary transition-colors"
              title="Limpar Memória"
            >
              <Trash2 size={16} />
            </button>
            <button 
              onClick={() => setShowSettings(true)}
              className="p-1.5 text-white/40 hover:text-primary transition-colors"
              title="Configurações"
            >
              <Settings size={16} />
            </button>
            <div className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
              <User size={14} className="text-white/60" />
            </div>
          </div>
        </header>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-3 md:p-6 space-y-5 md:space-y-8 scroll-smooth">
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-2.5 md:gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div className={`w-6 h-6 md:w-8 md:h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  msg.role === 'user' 
                    ? 'bg-secondary/20 border border-secondary/30 text-secondary' 
                    : msg.role === 'system'
                    ? 'bg-red-500/20 border border-red-500/30 text-red-500'
                    : 'bg-primary/20 border border-primary/30 text-primary'
                }`}>
                  {msg.role === 'user' ? <User size={12} className="md:w-4 md:h-4" /> : <Bot size={12} className="md:w-4 md:h-4" />}
                </div>
                
                <div className={`max-w-[90%] md:max-w-[80%] space-y-1 ${msg.role === 'user' ? 'items-end' : ''}`}>
                  <div className={`flex items-center gap-2 mb-1 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <span className="text-[8px] md:text-[10px] font-mono text-white/30 uppercase tracking-tighter">
                      {msg.role === 'user' ? 'USUÁRIO' : (theme === 'feminine' ? 'EDITH' : 'JARVIS')}
                    </span>
                    <span className="text-[7px] md:text-[10px] font-mono text-white/10">
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className={`p-2.5 md:p-4 rounded-2xl glass ${
                    msg.role === 'user' 
                      ? 'rounded-tr-none bg-secondary/5 border-secondary/20' 
                      : 'rounded-tl-none'
                  }`}>
                    {msg.imageUrl && msg.role === 'user' && (
                      <div className="mb-3 max-w-[200px] rounded-xl overflow-hidden border border-white/10">
                        <img src={msg.imageUrl} alt="Upload do usuário" className="w-full h-auto object-cover" />
                      </div>
                    )}
                    {msg.type === 'image' && msg.imageUrl && msg.role !== 'user' ? (
                      <div className="space-y-3 min-w-[240px]">
                        <p className="text-[10px] font-mono text-primary animate-pulse">UPLINK VISUAL ESTABELECIDO</p>
                        <div className="relative overflow-hidden rounded-xl border border-white/10 bg-black/40">
                          <img 
                            src={msg.imageUrl} 
                            alt={msg.content}
                            referrerPolicy="no-referrer"
                            className="w-full h-auto object-cover"
                            onLoad={() => scrollToBottom()}
                          />
                        </div>
                        
                        {/* Action Bar - Always visible for mobile and desktop */}
                        <div className="flex items-center gap-2 pt-1">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              if (msg.imageUrl) downloadImage(msg.imageUrl);
                            }}
                            className="flex-1 py-2.5 bg-primary/20 hover:bg-primary/30 text-primary rounded-xl transition-all flex items-center justify-center gap-2 text-[10px] font-mono border border-primary/40 font-bold shadow-[0_0_10px_rgba(0,243,255,0.1)]"
                          >
                            <Download size={14} /> BAIXAR IMAGEM
                          </button>
                          <a 
                            href={msg.imageUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="p-2.5 bg-white/5 hover:bg-white/10 text-white/60 rounded-xl border border-white/10 transition-all"
                            title="Ver em tela cheia"
                          >
                            <Maximize size={14} />
                          </a>
                        </div>
                        
                        <p className="text-[10px] font-mono text-white/40 italic leading-tight">Prompt: {msg.content.replace('GERANDO IMAGEM: ', '')}</p>
                      </div>
                    ) : (
                      <div className="relative group/msg">
                        <p className={`text-xs md:text-sm leading-relaxed ${msg.role === 'assistant' ? 'font-mono text-white/90 pr-6' : 'text-white/80'}`}>
                          {msg.role === 'assistant' ? msg.content.replace(/\*/g, '') : msg.content}
                        </p>
                        {msg.role === 'assistant' && (
                          <div className="absolute top-0 right-0 flex items-center gap-1 opacity-0 group-hover/msg:opacity-100 focus:opacity-100 transition-all">
                            <button
                              onClick={() => speakText(msg.content.replace(/\*/g, ''))}
                              className={`p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-all ${isSpeaking ? 'text-primary' : 'text-white/40 hover:text-white'}`}
                              title="Ouvir mensagem"
                            >
                              {isSpeaking ? <Volume2 size={14} className="animate-pulse" /> : <Volume2 size={14} />}
                            </button>
                            <button
                              onClick={() => handleCopy(msg.content.replace(/\*/g, ''), msg.id)}
                              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all"
                              title="Copiar mensagem"
                            >
                              {copiedId === msg.id ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {isLoading && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-3 md:gap-4"
            >
              <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center text-primary animate-pulse">
                <Bot size={14} className="md:w-4 md:h-4" />
              </div>
              <div className="flex items-center gap-1">
                <div className="w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                <div className="w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
                <div className="w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-primary animate-bounce" />
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 md:p-6 pt-0 glass border-t border-dark-border/50">
          <form 
            onSubmit={handleSend}
            className="relative max-w-4xl mx-auto"
          >
            {(favoritePersonas.length > 0 || brainProfile) && (
              <div className="mb-3 flex items-center gap-2">
                <Brain size={14} className={isBrainActive ? "text-secondary animate-pulse" : "text-white/40"} />
                <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Assistente:</span>
                <select
                  value={isBrainActive && brainProfile ? (favoritePersonas.find(p => p.name === brainProfile.name)?.id || brainProfile.name) : ''}
                  onChange={(e) => {
                    if (e.target.value === '') {
                      setIsBrainActive(false);
                    } else {
                      const persona = favoritePersonas.find(p => p.id === e.target.value);
                      if (persona) {
                        loadPersona(persona.id);
                      } else if (brainProfile && brainProfile.name === e.target.value) {
                        setIsBrainActive(true);
                      }
                    }
                  }}
                  className="bg-dark-surface border border-white/10 rounded-lg px-2 py-1 text-[9px] md:text-[10px] font-mono text-secondary outline-none cursor-pointer hover:border-secondary/50 transition-colors max-w-[140px] md:max-w-[200px] truncate"
                >
                  <option value="" className="text-white">Padrão (Neural-X)</option>
                  {brainProfile && !favoritePersonas.find(p => p.name === brainProfile.name) && (
                    <option value={brainProfile.name} className="text-white">{brainProfile.name} (Atual não salvo)</option>
                  )}
                  {favoritePersonas.map(p => (
                    <option key={p.id} value={p.id} className="text-white">{p.name}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="relative group">
              {uploadedImage && (
                <div className="absolute bottom-full left-0 mb-2 p-2 bg-dark-surface border border-white/10 rounded-xl shadow-lg flex items-start gap-2">
                  <img src={uploadedImage.url} alt="Upload preview" className="h-16 w-16 object-cover rounded-lg border border-white/10" />
                  <button 
                    type="button" 
                    onClick={() => setUploadedImage(null)}
                    className="p-1 bg-red-500/20 text-red-400 hover:bg-red-500/40 rounded-full transition-colors"
                  >
                    <X size={12} />
                  </button>
                </div>
              )}
              <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-secondary rounded-2xl opacity-20 group-focus-within:opacity-40 transition-opacity blur" />
              <div className="relative flex items-center glass rounded-2xl p-1.5">
                <div className="pl-3 text-white/30 hidden sm:block">
                  <Zap size={16} />
                </div>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={window.innerWidth < 640 ? "Comando..." : "Comando neural... (Prompt: subject, appearance...)"}
                  className="flex-1 bg-transparent border-none outline-none px-3 py-2.5 text-xs md:text-sm font-mono text-white placeholder:text-white/20 min-w-0"
                />
                <div className="flex items-center gap-0.5 md:gap-1 pr-1">
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    ref={fileInputRef} 
                    onChange={handleImageUpload} 
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className={`p-2 md:p-2.5 rounded-xl transition-all ${uploadedImage ? 'bg-secondary/20 text-secondary' : 'text-white/40 hover:text-secondary hover:bg-secondary/10'}`}
                    title="Upload de Imagem"
                  >
                    <Upload size={16} className="md:w-[18px] md:h-[18px]" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowImageOptions(!showImageOptions)}
                    className={`p-2 md:p-2.5 rounded-xl transition-all ${showImageOptions ? 'bg-primary/20 text-primary' : 'text-white/40 hover:text-primary hover:bg-primary/10'}`}
                    title="Opções de Imagem"
                  >
                    <Sliders size={16} className="md:w-[18px] md:h-[18px]" />
                  </button>
                  <button
                    type="button"
                    onClick={toggleListening}
                    className={`p-2 md:p-2.5 rounded-xl transition-all ${isListening ? 'bg-red-500/20 text-red-500 animate-pulse' : 'text-white/40 hover:text-red-500 hover:bg-red-500/10'}`}
                    title={isListening ? "Parar de Ouvir" : "Conversar por Voz"}
                  >
                    {isListening ? <MicOff size={16} className="md:w-[18px] md:h-[18px]" /> : <Mic size={16} className="md:w-[18px] md:h-[18px]" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (input.trim()) {
                        if (!input.includes('Prompt:')) {
                          setInput(`/imagine Prompt: ${input}, ${imageStyle}, ${imageQuality}, highly detailed Negative Prompt: blurry, distorted, low quality`);
                        } else {
                          setInput(`/imagine ${input}`);
                        }
                      } else {
                        setInput(`/imagine Prompt: (subject), (appearance), (environment), ${imageStyle}, (lighting), (camera/framing), ${imageQuality}, (extra details) Negative Prompt: (errors)`);
                      }
                    }}
                    className="hidden sm:flex p-2.5 rounded-xl text-white/40 hover:text-primary hover:bg-primary/10 transition-all"
                    title="Gerar Imagem Estruturada"
                  >
                    <Camera size={18} />
                  </button>
                  <button
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    className="p-2 md:p-2.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary transition-all disabled:opacity-30"
                  >
                    <Send size={16} className="md:w-[18px] md:h-[18px]" />
                  </button>
                </div>
              </div>
            {/* Image Options Menu moved inside form for correct relative positioning */}
            <AnimatePresence>
              {showImageOptions && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute bottom-full left-0 right-0 mb-4 mx-auto max-w-4xl bg-zinc-900 rounded-3xl border border-white/10 p-4 md:p-6 shadow-2xl z-30 max-h-[65vh] overflow-y-auto custom-scrollbar"
                >
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
                    {/* Style Selection */}
                    <div className="space-y-2 col-span-2 md:col-span-1">
                      <div className="flex items-center gap-2 text-primary">
                        <Palette size={12} className="md:w-3.5 md:h-3.5" />
                        <span className="text-[9px] md:text-[10px] font-mono font-bold uppercase tracking-widest">Estilo Artístico</span>
                      </div>
                      <div className="grid grid-cols-3 md:grid-cols-2 gap-1.5 md:gap-2">
                        {['cinematic', 'photorealistic', 'digital art', 'anime', 'cyberpunk', 'sketch'].map(s => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setImageStyle(s)}
                            className={`py-1.5 px-1 rounded-lg text-[7px] md:text-[9px] font-mono uppercase transition-all border truncate ${
                              imageStyle === s ? 'bg-primary/20 border-primary/40 text-primary' : 'bg-white/5 border-white/5 text-white/40 hover:bg-white/10'
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Aspect Ratio Selection */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-secondary">
                        <Maximize size={14} />
                        <span className="text-[10px] font-mono font-bold uppercase tracking-widest">Formato</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {['1:1', '16:9', '9:16', '4:3', '3:4'].map(r => (
                          <button
                            key={r}
                            type="button"
                            onClick={() => setImageRatio(r)}
                            className={`py-2 px-2 rounded-xl text-[8px] md:text-[9px] font-mono uppercase transition-all border ${
                              imageRatio === r ? 'bg-secondary/20 border-secondary/40 text-secondary' : 'bg-white/5 border-white/5 text-white/40 hover:bg-white/10'
                            }`}
                          >
                            {r}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Quality Selection */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-primary">
                        <Highlighter size={14} />
                        <span className="text-[10px] font-mono font-bold uppercase tracking-widest">Qualidade</span>
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        {[
                          { id: 'standard', label: 'Padrão' },
                          { id: 'high', label: 'Alta Def.' },
                          { id: 'masterpiece', label: 'Obra de Arte' }
                        ].map(q => (
                          <button
                            key={q.id}
                            type="button"
                            onClick={() => setImageQuality(q.id)}
                            className={`py-2 px-2 rounded-xl text-[8px] md:text-[9px] font-mono uppercase transition-all border text-left flex justify-between items-center ${
                              imageQuality === q.id ? 'bg-primary/20 border-primary/40 text-primary' : 'bg-white/5 border-white/5 text-white/40 hover:bg-white/10'
                            }`}
                          >
                            {q.label}
                            {imageQuality === q.id && <Check size={10} />}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 pt-4 border-t border-white/5 flex justify-end">
                    <button 
                      type="button"
                      onClick={() => setShowImageOptions(false)}
                      className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white text-[10px] font-mono font-bold rounded-xl transition-all"
                    >
                      APLICAR E FECHAR
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </form>
          
          <div className="mt-3 flex justify-center gap-4 md:gap-6 text-[8px] md:text-[10px] font-mono text-white/20 uppercase tracking-[0.15em]">
            <div className="flex items-center gap-1.5">
              <div className="w-1 h-1 rounded-full bg-primary" />
              <span className="hidden xs:inline">Criptografia: Ativa</span>
              <span className="xs:hidden">SEC: ON</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-1 h-1 rounded-full bg-secondary" />
              <span>24ms</span>
            </div>
          </div>
        </div>

        {/* Floating Decoration */}
        <div className="absolute top-1/4 -right-20 w-64 h-64 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 -left-20 w-64 h-64 bg-secondary/5 rounded-full blur-[100px] pointer-events-none" />
      </main>

      {/* Neural Brain Manager Modal */}
      <AnimatePresence>
        {showBrainManager && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-[95%] sm:max-w-md glass rounded-3xl border border-white/10 overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="p-4 md:p-6 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-secondary/10 to-transparent shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-secondary/20 flex items-center justify-center text-secondary neon-glow">
                    <Brain size={16} className="md:w-5 md:h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm md:text-lg font-bold text-white tracking-tight">Núcleo de Dados</h2>
                    <p className="text-[8px] md:text-[10px] font-mono text-white/40 uppercase">Protocolo de Expansão {theme === 'feminine' ? 'EDITH' : 'JARVIS'}</p>
                  </div>
                </div>
                <button onClick={() => setShowBrainManager(false)} className="text-white/40 hover:text-white transition-colors p-2">
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10">
                    <div>
                      <p className="text-xs font-bold text-white">Status do Cérebro</p>
                      <p className="text-[10px] text-white/40 font-mono uppercase">Ativar assistente customizado</p>
                    </div>
                    <button 
                      onClick={() => setIsBrainActive(!isBrainActive)}
                      className={`w-12 h-6 rounded-full transition-all relative ${isBrainActive ? 'bg-secondary' : 'bg-white/10'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${isBrainActive ? 'left-7' : 'left-1'}`} />
                    </button>
                  </div>

                  <div className="space-y-3">
                    <p className="text-[10px] font-mono text-secondary uppercase font-bold tracking-widest flex items-center gap-2">
                      <Zap size={10} /> Comando Neural
                    </p>
                    <div className="space-y-2">
                      <textarea 
                        value={brainPrompt}
                        onChange={(e) => setBrainPrompt(e.target.value)}
                        placeholder="Ex: Quero um assistente profissional moderno e completo que saiba ensinar sobre a Bíblia..."
                        className="w-full h-24 bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-xs text-white focus:border-secondary/50 outline-none transition-all placeholder:text-white/20 resize-none"
                      />
                      <button 
                        onClick={generateBrainProfileFromPrompt}
                        disabled={isProcessingBrain || !brainPrompt.trim()}
                        className="w-full py-2.5 rounded-xl bg-secondary/20 border border-secondary/40 text-secondary font-bold text-[10px] uppercase tracking-widest hover:bg-secondary/30 transition-all disabled:opacity-30"
                      >
                        {isProcessingBrain ? 'PROCESSANDO...' : 'CRIAR POR COMANDO'}
                      </button>
                    </div>
                  </div>

                  <div className="relative py-2">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-white/5"></div>
                    </div>
                    <div className="relative flex justify-center text-[8px] uppercase font-mono text-white/20">
                      <span className="bg-[#0a0a0a] px-2">Ou use documentos</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-[10px] font-mono text-secondary uppercase font-bold tracking-widest flex items-center gap-2">
                      <Upload size={10} /> Upload de Documentos
                    </p>
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-white/10 rounded-2xl hover:border-secondary/50 hover:bg-secondary/5 transition-all cursor-pointer group">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 text-white/20 group-hover:text-secondary mb-2 transition-colors" />
                        <p className="text-xs text-white/40 group-hover:text-white transition-colors">PDF, DOC, TXT, Livros...</p>
                        <p className="text-[9px] text-white/20 uppercase mt-1">Clique para selecionar arquivos</p>
                      </div>
                      <input type="file" className="hidden" multiple onChange={handleFileUpload} accept=".pdf,.doc,.docx,.txt" />
                    </label>
                  </div>

                  <div className="space-y-2">
                    <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest">Documentos Carregados ({knowledgeDocs.length})</p>
                    {knowledgeDocs.length === 0 ? (
                      <div className="p-8 text-center border border-white/5 rounded-2xl bg-black/20">
                        <FileText size={24} className="mx-auto text-white/10 mb-2" />
                        <p className="text-[10px] font-mono text-white/20 uppercase">Nenhum documento neural detectado</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {knowledgeDocs.map((doc, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 group">
                            <div className="flex items-center gap-3 overflow-hidden">
                              <FileText size={14} className="text-secondary shrink-0" />
                              <span className="text-[10px] text-white/80 truncate font-mono">{doc.name}</span>
                            </div>
                            <button onClick={() => removeDoc(idx)} className="p-1.5 text-white/20 hover:text-primary transition-colors">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {knowledgeDocs.length > 0 && !brainProfile && (
                    <div className="pt-4 border-t border-white/5">
                      <button 
                        onClick={generateBrainProfile}
                        disabled={isProcessingBrain}
                        className="w-full py-3 rounded-xl bg-secondary text-black font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-secondary/80 transition-all disabled:opacity-50"
                      >
                        {isProcessingBrain ? (
                          <>
                            <Loader2 size={16} className="animate-spin" />
                            <span>ANALISANDO...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles size={16} />
                            <span>INICIALIZAR NÚCLEO</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {brainProfile && (
                    <div className="pt-4 border-t border-white/5 space-y-4">
                      <div className="p-4 rounded-2xl bg-secondary/10 border border-secondary/20 space-y-3">
                        <div className="space-y-1">
                          <p className="text-[10px] font-mono text-secondary uppercase font-bold tracking-widest">Perfil Gerado</p>
                          <h3 className="text-sm font-bold text-white">{brainProfile.name}</h3>
                          <p className="text-[10px] text-white/60 leading-relaxed italic">"{brainProfile.description}"</p>
                        </div>
                        
                        <div className="flex gap-2">
                          <button 
                            onClick={startChatting}
                            className="flex-1 py-2 rounded-xl bg-white text-black font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-white/80 transition-all"
                          >
                            <MessageSquare size={12} />
                            <span>CONVERSAR</span>
                          </button>
                          <button 
                            onClick={saveToFavorites}
                            className="px-4 py-2 rounded-xl bg-white/10 text-white font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-white/20 transition-all"
                          >
                            <Heart size={12} className="text-secondary" />
                            <span>SALVAR</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {favoritePersonas.length > 0 && (
                    <div className="space-y-3 pt-4 border-t border-white/5">
                      <p className="text-[10px] font-mono text-white/40 uppercase font-bold tracking-widest">Favoritos</p>
                      <div className="grid grid-cols-1 gap-2">
                        {favoritePersonas.map((p, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/20 transition-all group">
                            <div className="flex-1 cursor-pointer" onClick={() => { setBrainProfile(p); setIsBrainActive(true); setShowBrainManager(false); }}>
                              <p className="text-xs font-bold text-white">{p.name}</p>
                              <p className="text-[9px] text-white/40 truncate">{p.description}</p>
                            </div>
                            <button onClick={() => setFavoritePersonas(prev => prev.filter((_, i) => i !== idx))} className="p-1.5 text-white/10 hover:text-red-500 transition-colors">
                              <Trash2 size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {knowledgeDocs.length > 0 && brainProfile && (
                <div className="p-4 md:p-6 border-t border-white/10 shrink-0">
                  <button 
                    onClick={generateBrainProfile}
                    disabled={isProcessingBrain}
                    className="w-full py-3 rounded-xl bg-secondary/20 border border-secondary/40 text-secondary font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-secondary/30 transition-all disabled:opacity-50"
                  >
                    {isProcessingBrain ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>RECALIBRANDO...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={16} />
                        <span>RECALIBRAR NÚCLEO</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowSettings(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-[95%] sm:max-w-md glass rounded-3xl overflow-hidden flex flex-col max-h-[90vh]"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-5 md:p-8 border-b border-white/10 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary neon-glow">
                    <Settings size={16} className="md:w-5 md:h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm md:text-lg font-bold text-white tracking-tight">Terminal de Controle</h2>
                    <p className="text-[8px] md:text-[10px] font-mono text-white/40 uppercase">Protocolos Stark Industries</p>
                  </div>
                </div>
                <button onClick={() => setShowSettings(false)} className="text-white/40 hover:text-white transition-colors p-2">
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 md:p-8 space-y-6 custom-scrollbar">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Chave API OpenRouter</label>
                    <div className="relative group">
                      <div className="absolute -inset-0.5 bg-primary rounded-xl opacity-10 group-focus-within:opacity-30 transition-opacity blur" />
                      <input 
                        type="password"
                        value={userApiKey}
                        onChange={(e) => setUserApiKey(e.target.value)}
                        placeholder="sk-or-v1-..."
                        className="relative w-full bg-dark-surface border border-white/10 rounded-xl px-4 py-3 text-xs font-mono text-white outline-none focus:border-primary/50 transition-all"
                      />
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-[9px] text-white/30 font-mono italic">Sua chave é salva localmente no navegador.</p>
                      <button 
                        onClick={testConnection}
                        disabled={testStatus !== 'idle' || !userApiKey.trim()}
                        className={`text-[9px] font-mono px-2 py-1 rounded border transition-all ${
                          testStatus === 'success' ? 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10' :
                          testStatus === 'error' ? 'text-red-500 border-red-500/30 bg-red-500/10' :
                          'text-primary border-primary/30 hover:bg-primary/10'
                        }`}
                      >
                        {testStatus === 'testing' ? 'TESTANDO...' : 
                         testStatus === 'success' ? 'CONEXÃO OK' : 
                         testStatus === 'error' ? 'FALHA NO TESTE' : 'TESTAR CONEXÃO'}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Protocolo de Imagem</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button 
                        onClick={() => setImageProvider('gemini')}
                        className={`p-3 rounded-xl text-[10px] font-bold uppercase tracking-wider border transition-all ${
                          imageProvider === 'gemini' 
                            ? 'bg-secondary/20 border-secondary/50 text-secondary shadow-[0_0_15px_currentColor]' 
                            : 'bg-white/5 border-white/5 text-white/40 hover:bg-white/10'
                        }`}
                      >
                        Gemini 2.5
                      </button>
                      <button 
                        onClick={() => setImageProvider('pollinations')}
                        className={`p-3 rounded-xl text-[10px] font-bold uppercase tracking-wider border transition-all ${
                          imageProvider === 'pollinations' 
                            ? 'bg-secondary/20 border-secondary/50 text-secondary shadow-[0_0_15px_currentColor]' 
                            : 'bg-white/5 border-white/5 text-white/40 hover:bg-white/10'
                        }`}
                      >
                        Pollinations
                      </button>
                    </div>
                    {imageProvider === 'gemini' && (
                      <button 
                        onClick={() => { setShowSettings(false); setShowKeyManager(true); }}
                        className="w-full mt-2 py-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-xl text-[10px] font-mono flex items-center justify-center gap-2 transition-all"
                      >
                        <Key size={12} /> ACESSAR NÚCLEO GOOGLE AI STUDIO
                      </button>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Tema Visual</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button 
                        onClick={() => setTheme('masculine')}
                        className={`p-3 rounded-xl text-[10px] font-bold uppercase tracking-wider border transition-all ${
                          theme === 'masculine' 
                            ? 'bg-primary/20 border-primary/50 text-primary shadow-[0_0_15px_currentColor]' 
                            : 'bg-white/5 border-white/5 text-white/40 hover:bg-white/10'
                        }`}
                      >
                        Masculino
                      </button>
                      <button 
                        onClick={() => setTheme('feminine')}
                        className={`p-3 rounded-xl text-[10px] font-bold uppercase tracking-wider border transition-all ${
                          theme === 'feminine' 
                            ? 'bg-primary/20 border-primary/50 text-primary shadow-[0_0_15px_currentColor]' 
                            : 'bg-white/5 border-white/5 text-white/40 hover:bg-white/10'
                        }`}
                      >
                        Feminino
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Núcleo de Processamento</label>
                    <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                      <ModelOption 
                        selected={model === 'qwen/qwen-2.5-72b-instruct:free'} 
                        onClick={() => setModel('qwen/qwen-2.5-72b-instruct:free')}
                        label="Qwen 2.5 72B (FREE)"
                        desc="Análise de Dados de Alta Performance"
                      />
                      <ModelOption 
                        selected={model === 'openrouter/healer-alpha'} 
                        onClick={() => setModel('openrouter/healer-alpha')}
                        label="Healer Alpha"
                        desc="Protocolo de Assistência Médica/Técnica"
                      />
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-white/5">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Interface de Voz (ElevenLabs)</label>
                      <button 
                        onClick={() => setAutoSpeak(!autoSpeak)}
                        className={`flex items-center gap-2 px-2 py-1 rounded-lg transition-all ${autoSpeak ? 'bg-primary/20 text-primary' : 'bg-white/5 text-white/40'}`}
                      >
                        {autoSpeak ? <Volume2 size={12} /> : <VolumeX size={12} />}
                        <span className="text-[10px] font-bold uppercase">{autoSpeak ? 'Auto-Voz ON' : 'Auto-Voz OFF'}</span>
                      </button>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <p className="text-[9px] font-mono text-white/30 uppercase">ElevenLabs API Key</p>
                        <input 
                          type="password"
                          value={elevenLabsApiKey}
                          onChange={(e) => setElevenLabsApiKey(e.target.value)}
                          placeholder="Sua chave ElevenLabs..."
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-mono text-white outline-none focus:border-primary/50 transition-all"
                        />
                      </div>
                      <div className="space-y-1">
                        <p className="text-[9px] font-mono text-white/30 uppercase">Voice ID (Clonado)</p>
                        <input 
                          type="text"
                          value={elevenLabsVoiceId}
                          onChange={(e) => setElevenLabsVoiceId(e.target.value)}
                          placeholder="ID da sua voz clonada..."
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-mono text-white outline-none focus:border-primary/50 transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10">
                    <div className="flex items-center gap-3 text-primary mb-2">
                      <Sparkles size={16} />
                      <span className="text-xs font-bold uppercase tracking-wider">Dica Pro</span>
                    </div>
                    <p className="text-[10px] text-white/60 leading-relaxed font-mono">
                      O NEURAL-X utiliza o OpenRouter para conectar múltiplos nós de IA. Certifique-se de que sua chave API está configurada corretamente nos segredos do ambiente.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-5 md:p-8 border-t border-white/10 shrink-0">
                <button 
                  onClick={saveSettings}
                  disabled={saveStatus}
                  className={`w-full py-3 rounded-xl text-xs font-bold uppercase tracking-[0.2em] transition-all ${
                    saveStatus 
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                      : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'
                  }`}
                >
                  {saveStatus ? 'CONFIGURAÇÃO SALVA' : 'Salvar Configuração'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Gemini Key Manager Modal */}
      <AnimatePresence>
        {showKeyManager && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-md glass rounded-3xl border border-white/10 overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-primary/10 to-transparent shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary neon-glow">
                    <Key size={16} className="md:w-5 md:h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm md:text-lg font-bold text-white tracking-tight">Chaves API</h2>
                    <p className="text-[8px] md:text-[10px] font-mono text-white/40 uppercase">Gemini ({geminiKeys.length}/15)</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a 
                    href="https://aistudio.google.com/app/apikey" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[8px] md:text-[10px] font-mono text-white/60 hover:text-primary hover:border-primary/30 transition-all uppercase"
                  >
                    <ExternalLink size={10} className="md:w-3 md:h-3" />
                    <span className="hidden xs:inline">Obter Chave</span>
                    <span className="xs:hidden">OBTER</span>
                  </a>
                  <button onClick={() => setShowKeyManager(false)} className="text-white/40 hover:text-white transition-colors p-2">
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                {/* Add New Key */}
                {geminiKeys.length < 15 ? (
                  <div className="space-y-3 p-4 rounded-2xl bg-white/5 border border-white/5">
                    <p className="text-[10px] font-mono text-primary uppercase font-bold tracking-widest flex items-center gap-2">
                      <Plus size={10} /> Adicionar Nova Chave
                    </p>
                    <input 
                      type="text" 
                      placeholder="Apelido (ex: Pessoal, Trabalho)"
                      value={newKeyLabel}
                      onChange={(e) => setNewKeyLabel(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:border-primary/50 outline-none transition-all placeholder:text-white/20"
                    />
                    <div className="flex gap-2">
                      <input 
                        type="password" 
                        placeholder="Cole sua chave API aqui..."
                        value={newKeyValue}
                        onChange={(e) => setNewKeyValue(e.target.value)}
                        className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:border-primary/50 outline-none transition-all placeholder:text-white/20"
                      />
                      <button 
                        onClick={addGeminiKey}
                        disabled={!newKeyValue.trim()}
                        className="px-4 bg-primary text-black font-bold rounded-xl hover:bg-primary/80 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <Plus size={20} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 flex items-center gap-3 text-primary">
                    <AlertCircle size={20} />
                    <p className="text-xs font-medium">Limite de 15 chaves atingido.</p>
                  </div>
                )}

                {/* Key List */}
                <div className="space-y-2">
                  <p className="text-[10px] font-mono text-white/40 uppercase font-bold tracking-widest">Suas Chaves Salvas</p>
                  {geminiKeys.length === 0 ? (
                    <div className="text-center py-8 space-y-2">
                      <p className="text-xs text-white/20 italic">Nenhuma chave adicionada.</p>
                      <p className="text-[9px] font-mono text-white/10">O SISTEMA USARÁ A CHAVE PADRÃO DO AMBIENTE.</p>
                    </div>
                  ) : (
                    geminiKeys.map((k, idx) => (
                      <div 
                        key={k.id}
                        className={`group flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                          activeGeminiKeyIndex === idx 
                            ? 'bg-primary/10 border-primary/30 shadow-[0_0_15px_rgba(0,243,255,0.05)]' 
                            : 'bg-white/5 border-white/5 hover:border-white/20'
                        }`}
                        onClick={() => setActiveGeminiKeyIndex(idx)}
                      >
                        <div className="flex-1 flex items-center gap-3 text-left">
                          <div className={`w-2 h-2 rounded-full ${activeGeminiKeyIndex === idx ? 'bg-primary animate-pulse shadow-[0_0_8px_#00f3ff]' : 'bg-white/20'}`} />
                          <div>
                            <p className={`text-xs font-bold tracking-tight ${activeGeminiKeyIndex === idx ? 'text-primary' : 'text-white/80'}`}>{k.label}</p>
                            <p className="text-[9px] font-mono text-white/20">ID: {k.id.slice(-6)} • ••••{k.key.slice(-4)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {activeGeminiKeyIndex === idx && <Check size={14} className="text-primary" />}
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              removeGeminiKey(k.id);
                            }}
                            className="p-2 text-white/10 hover:text-primary transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="p-6 bg-white/5 border-t border-white/10 flex gap-3">
                <button 
                  onClick={() => setShowKeyManager(false)}
                  className="flex-1 py-3 bg-primary/10 hover:bg-primary/20 text-primary font-bold rounded-2xl transition-all text-xs tracking-widest"
                >
                  FECHAR
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Download Quality Modal removed */}
    </div>
  );
}

function SidebarItem({ icon, label, active = false, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick?: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-3 w-full p-3 rounded-xl transition-all group ${
        active 
          ? 'bg-primary/10 text-primary border border-primary/20 shadow-[0_0_10px_rgba(0,243,255,0.1)]' 
          : 'text-white/40 hover:text-white hover:bg-white/5'
      }`}
    >
      <span className={active ? 'text-primary' : 'group-hover:text-primary transition-colors'}>
        {icon}
      </span>
      <span className="text-sm font-medium">{label}</span>
      {active && <div className="ml-auto w-1 h-1 rounded-full bg-primary shadow-[0_0_5px_rgba(0,243,255,1)]" />}
    </button>
  );
}

function ModelOption({ selected, onClick, label, desc }: { selected: boolean, onClick: () => void, label: string, desc: string }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full p-4 rounded-2xl text-left transition-all border ${
        selected 
          ? 'bg-primary/10 border-primary/30 text-white' 
          : 'bg-white/5 border-white/5 text-white/60 hover:bg-white/10'
      }`}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-bold">{label}</span>
        {selected && <div className="w-2 h-2 rounded-full bg-primary" />}
      </div>
      <p className="text-[10px] font-mono opacity-60">{desc}</p>
    </button>
  );
}
