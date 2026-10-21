/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Header, { NetworkMode } from './components/Header';
import Sidebar from './components/Sidebar';
import WelcomeScreen from './components/WelcomeScreen';
import FeatureSlider from './components/FeatureSlider';
import ChatInput from './components/ChatInput';
import ChatHistory from './components/ChatHistory';
import ImageVideoWorkspace from './components/workspaces/ImageVideoWorkspace';
import WebDesignWorkspace from './components/workspaces/WebDesignWorkspace';
import WebResearchWorkspace from './components/workspaces/WebResearchWorkspace';
import NotesMakerWorkspace from './components/workspaces/NotesMakerWorkspace';
import GlobalHistoryModal from './components/GlobalHistoryModal';
import SettingsModal from './components/SettingsModal';
import HelpModal from './components/HelpModal';
import NamePromptModal from './components/NamePromptModal';
import PhoneVoiceAssistantModal from './components/PhoneVoiceAssistantModal';
import CameraCaptureModal from './components/CameraCaptureModal';
import DepthWaveBackground from './components/DepthWaveBackground';
import GlobeDepthWallpaper from './components/GlobeDepthWallpaper';
import { useLocalStorage } from './hooks/useLocalStorage';
import { SERVICE_MAINTENANCE_MESSAGE } from './utils/maintenanceMessage';

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [activeWorkspace, setActiveWorkspace] = useState('chat');
  const [historyOpen, setHistoryOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState('general');
  const [helpOpen, setHelpOpen] = useState(false);
  const [companionOpen, setCompanionOpen] = useState(false);
  const [webDesignSettingsOpen, setWebDesignSettingsOpen] = useState(false);
  const [photoSearchOpen, setPhotoSearchOpen] = useState(false);
  
  const [messages, setMessages] = useLocalStorage<Array<{role: 'user' | 'model', content: string, mode?: 'online' | 'offline', image?: string}>>('workspace-messages-chat', []);
  const [userName, setUserName] = useLocalStorage<string>('app-user-name', '');
  const [temporaryChat] = useLocalStorage<boolean>('setting-temporary-chat', false);
  const [networkMode, setNetworkMode] = useLocalStorage<NetworkMode>('setting-network-mode', 'auto');
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [isLoading, setIsLoading] = useState(false);
  
  const abortControllerRef = useRef<AbortController | null>(null);

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check against server endpoint
    fetch('/api/network-status')
      .then(r => r.json())
      .then(d => {
        if (typeof d?.isOnline === 'boolean') {
          setIsOnline(d.isOnline);
        }
      })
      .catch(() => {});

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // If temporary chat mode is active, ensure past persistent storage is clean on app mount
  useEffect(() => {
    if (typeof window !== 'undefined' && window.localStorage.getItem('setting-temporary-chat') === 'true') {
      Object.keys(localStorage).forEach(k => {
        if (k.startsWith('workspace-messages-') || k.startsWith('companion-chat-') || k.startsWith('workspace-input-')) {
          localStorage.removeItem(k);
        }
      });
    }
  }, []);

  // Dynamic Document Title and Meta Description for Code SEO
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const titles: Record<string, { title: string; desc: string }> = {
      'chat': {
        title: 'Nexus AI – Multi-Workspace Intelligence & AI Companion',
        desc: 'A modern, premium AI assistant featuring multi-mode workspaces, AI Companion with 3D voice visualizer, debate partner, and interactive voice-to-voice calling.'
      },
      'deep-search': {
        title: 'Deep Search Intelligence | Nexus AI',
        desc: 'Initiate a comprehensive deep search across the live web. Synthesize live data, verify claims, and extract deep intelligence.'
      },
      'web-research': {
        title: 'Deep Search Intelligence | Nexus AI',
        desc: 'Initiate a comprehensive deep search across the live web. Synthesize live data, verify claims, and extract deep intelligence.'
      },
      'web-design': {
        title: 'Jaalix – Web Design & Code Studio | Nexus AI',
        desc: 'Generate aesthetic UI/UX layouts, responsive React components, and CSS animations with AI.'
      },
      'notes': {
        title: 'Notes Maker & Academic AI | Nexus AI',
        desc: 'Synthesize syllabus notes, generate flashcards, study guides, and export clean PDFs.'
      },
      'image-video': {
        title: 'Image & Video Visual Studio | Nexus AI',
        desc: 'Craft photorealistic image prompts, concept art, and visual scene directions.'
      }
    };

    const currentMeta = titles[activeWorkspace] || titles['chat'];
    document.title = currentMeta.title;

    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', currentMeta.desc);
    }

    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) {
      ogTitle.setAttribute('content', currentMeta.title);
    }
  }, [activeWorkspace]);

  useEffect(() => {
    const handleClear = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.workspaceId === 'chat') {
        setMessages([]);
      }
    };
    window.addEventListener('clear-workspace-chat', handleClear);
    return () => window.removeEventListener('clear-workspace-chat', handleClear);
  }, [setMessages]);

  const updateChatLoading = (loading: boolean) => {
    setIsLoading(loading);
    try {
      window.dispatchEvent(new CustomEvent('workspace-activity-change', {
        detail: { workspaceId: 'chat', isLoading: loading }
      }));
    } catch {}
  };

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      updateChatLoading(false);
    }
  };

  const handleSendMessage = async (text: string, image?: string) => {
    const trimmed = text.trim();
    if ((!trimmed && !image) || isLoading) return;
    const content = trimmed || (image ? "What is in this image? Search and identify it in detail." : "");
    
    const isChatAssistant = !activeWorkspace || activeWorkspace === 'chat';

    // REQUIREMENT: Offline model sirf Chat Assistant ke liye reserved hai.
    // Kisi bhi doosre workspace/assistant mein offline model use nahi hoga - unme seedha Service Maintenance show hoga.
    if (!isChatAssistant) {
      const isOfflineState = networkMode === 'always-offline' || !isOnline || (typeof navigator !== 'undefined' && !navigator.onLine);
      if (isOfflineState) {
        setMessages([...messages, 
          { role: 'user', content, image }, 
          { role: 'model', content: SERVICE_MAINTENANCE_MESSAGE, mode: 'offline' }
        ]);
        return;
      }
    } else {
      // Chat assistant: agar browser offline hai aur always-offline local server target nahi hai
      if (typeof navigator !== 'undefined' && !navigator.onLine && networkMode !== 'always-offline') {
        setMessages([...messages, 
          { role: 'user', content, image }, 
          { role: 'model', content: SERVICE_MAINTENANCE_MESSAGE, mode: 'offline' }
        ]);
        return;
      }
    }

    const newMessages = [...messages, { role: 'user' as const, content, image }];
    setMessages(newMessages);
    updateChatLoading(true);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const customInstructions = localStorage.getItem('setting-custom-instructions') || '';
      let model = 'Nexus Elite';
      let temperature = 0.7;
      try {
        const savedModel = localStorage.getItem('setting-selected-model');
        if (savedModel) model = JSON.parse(savedModel);
        const savedTemp = localStorage.getItem('setting-temperature');
        if (savedTemp) temperature = JSON.parse(savedTemp);
      } catch {}

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          messages: newMessages, 
          workspace: activeWorkspace || 'chat',
          customInstructions,
          model,
          temperature,
          networkMode
        }),
        signal: abortController.signal
      });
      
      if (!res.ok) {
        setMessages([...newMessages, { role: 'model', content: SERVICE_MAINTENANCE_MESSAGE, mode: 'offline' }]);
        updateChatLoading(false);
        abortControllerRef.current = null;
        return;
      }

      setMessages((prev) => [...prev, { role: 'model', content: '' }]);
      let currentText = '';
      let currentMode: 'online' | 'offline' | undefined = undefined;

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          
          // Keep the last part in the buffer if it doesn't end with a newline
          buffer = lines.pop() || '';
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.replace('data: ', '').trim();
              if (data === '[DONE]') break;
              if (data) {
                try {
                  const parsed = JSON.parse(data);
                  if (parsed.mode) {
                    currentMode = parsed.mode;
                  }
                  if (parsed.text) {
                    currentText += parsed.text;
                    setMessages((prev) => {
                      if (prev.length === 0) {
                        return [...newMessages, { role: 'model', content: currentText, mode: currentMode }];
                      }
                      const newMsgs = [...prev];
                      newMsgs[newMsgs.length - 1] = { 
                        ...newMsgs[newMsgs.length - 1], 
                        content: currentText,
                        mode: currentMode || newMsgs[newMsgs.length - 1].mode
                      };
                      return newMsgs;
                    });
                  }
                } catch (e) {
                  // ignore parse error on incomplete chunks
                }
              }
            }
          }
        }
      }
    } catch (e: any) {
      if (e.name === 'AbortError') {
        console.log("Generation stopped by user.");
      } else {
        console.error("Failed to send message:", e);
        setMessages([...newMessages, { role: 'model', content: SERVICE_MAINTENANCE_MESSAGE, mode: 'offline' }]);
      }
    } finally {
      updateChatLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleNewChat = () => {
    if (activeWorkspace === 'chat') {
      setMessages([]);
    } else {
      window.dispatchEvent(new CustomEvent('clear-workspace-chat', { detail: { workspaceId: activeWorkspace } }));
    }
  };

  return (
    <div 
      className={`relative flex h-[100dvh] w-full flex-col font-sans transition-colors duration-500 overflow-hidden ${
        isDark ? 'bg-[#0d0d0d] text-white' : 'bg-[#fdfcff] text-gray-900'
      }`}
    >
      {/* Dynamic Workspace Wallpaper */}
      {(activeWorkspace === 'deep-search' || activeWorkspace === 'web-research' || activeWorkspace === 'notes' || activeWorkspace === 'web-design' || activeWorkspace === 'image-video') ? (
        <div
          className={`fixed inset-0 pointer-events-none z-0 ${
            activeWorkspace === 'image-video'
              ? 'bg-[#02040a]'
              : activeWorkspace === 'deep-search' || activeWorkspace === 'web-research'
              ? 'bg-[#03081c]'
              : activeWorkspace === 'web-design'
              ? isDark ? 'bg-[#000000]' : 'bg-[#f8fafc]'
              : 'bg-[#000000]'
          }`}
        />
      ) : (
        <div className={`fixed inset-0 overflow-hidden pointer-events-none z-0 transition-colors duration-700 ${
          isDark
            ? 'bg-[#030305]'
            : 'bg-gradient-to-br from-[#f2ecff] via-[#ffffff] to-[#fff0f6]'
        }`}>
          {/* Soft Pastel Lavender & Rose Ambient Glow on White Background (matches reference image) */}
          {!isDark && (
            <>
              <div
                className="absolute inset-0 z-0 pointer-events-none"
                style={{
                  background:
                    'radial-gradient(circle at 50% 56%, rgba(192, 132, 252, 0.22) 0%, rgba(244, 114, 182, 0.12) 38%, rgba(255, 255, 255, 0) 72%)',
                }}
              />
              <div
                className="absolute -top-24 -left-24 w-96 h-96 rounded-full pointer-events-none blur-3xl opacity-50"
                style={{ background: 'radial-gradient(circle, rgba(167, 139, 250, 0.35), transparent 70%)' }}
              />
              <div
                className="absolute -top-20 -right-24 w-96 h-96 rounded-full pointer-events-none blur-3xl opacity-45"
                style={{ background: 'radial-gradient(circle, rgba(244, 114, 182, 0.3), transparent 70%)' }}
              />
              <div
                className="absolute -bottom-24 -left-20 w-96 h-96 rounded-full pointer-events-none blur-3xl opacity-45"
                style={{ background: 'radial-gradient(circle, rgba(147, 197, 253, 0.32), transparent 70%)' }}
              />
            </>
          )}

          {/* 3D Perspective Optical Wave & Silk Topography Illusion */}
          <DepthWaveBackground isDark={isDark} />

          {/* Radial Depth Vignette to Amplify 3D Tunnel / Horizon Illusion (Dark mode only) */}
          {isDark && (
            <div
              className="absolute inset-0 z-15 pointer-events-none"
              style={{
                background:
                  'radial-gradient(circle at 50% 48%, transparent 40%, rgba(2, 2, 5, 0.45) 78%, rgba(0, 0, 0, 0.85) 100%)',
              }}
            />
          )}

          {/* Subtle Silver-Violet Scanning Meridian Beam (Vertical) */}
          <motion.div 
            animate={{ x: ['-10vw', '110vw'] }}
            transition={{ duration: 14, repeat: Infinity, ease: "linear", delay: 2 }}
            className={`absolute top-0 bottom-0 w-[1px] z-20 ${
              isDark
                ? 'bg-gradient-to-b from-transparent via-purple-400/30 to-transparent shadow-[0_0_14px_rgba(168,85,247,0.3)]'
                : 'bg-gradient-to-b from-transparent via-purple-400/20 to-transparent'
            }`}
          />
          
          {/* Subtle fine film grain texture */}
          <div className="absolute inset-0 opacity-[0.025] pointer-events-none mix-blend-overlay z-30" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%224%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }} />
        </div>
      )}

      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        isDark={isDark} 
        activeWorkspace={activeWorkspace}
        onSelectWorkspace={setActiveWorkspace}
        onOpenHistory={() => setHistoryOpen(true)}
        onOpenSettings={() => {
          setSettingsTab('general');
          setSettingsOpen(true);
        }}
        onOpenHelp={() => setHelpOpen(true)}
      />
      
      <Header 
        onMenuClick={() => setSidebarOpen(true)} 
        isDark={isDark} 
        toggleTheme={() => setIsDark(!isDark)} 
        onNewChat={handleNewChat}
        isTemporaryChat={temporaryChat}
        onOpenDataControls={() => {
          setSettingsTab('data');
          setSettingsOpen(true);
        }}
        networkMode={networkMode}
        onNetworkModeChange={setNetworkMode}
        isOnline={isOnline}
        activeWorkspace={activeWorkspace}
        onOpenWebDesignSettings={() => setWebDesignSettingsOpen(true)}
      />
      
      {/* Workspaces - Render with AnimatePresence for transitions */}
      <div className="flex-1 w-full relative z-0 flex flex-col">
        <AnimatePresence mode="sync">
          {activeWorkspace === 'chat' && (
            <motion.div
              key="chat"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12, ease: "easeOut" }}
              className="flex-1 w-full flex flex-col relative z-0 absolute inset-0 overflow-hidden"
            >
              <main className={`flex-1 w-full flex flex-col ${messages.length === 0 ? 'items-center overflow-hidden' : 'justify-start items-center overflow-y-auto hide-scrollbar'} px-0 relative z-10`}>
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-start pt-2 sm:pt-3 md:pt-5 w-full h-full flex-1 pb-[90px] sm:pb-[110px] md:pb-[140px] overflow-y-auto hide-scrollbar">
                    <WelcomeScreen userName={userName || 'User'} isDark={isDark} />
                    <FeatureSlider 
                      isDark={isDark} 
                      onSelectWorkspace={setActiveWorkspace} 
                      onOpenCompanion={() => setCompanionOpen(true)}
                      onOpenPhotoSearch={() => setPhotoSearchOpen(true)}
                    />
                  </div>
                ) : (
                  <div className="w-full pb-28 md:pb-36">
                    <ChatHistory 
                      messages={messages} 
                      isLoading={isLoading} 
                      isDark={isDark} 
                      onSearchImage={(img, prompt) => handleSendMessage(prompt, img)} 
                    />
                  </div>
                )}
              </main>
              
              <ChatInput isDark={isDark} onSend={handleSendMessage} onStop={handleStopGeneration} isLoading={isLoading} workspaceId="chat" />
            </motion.div>
          )}

          {activeWorkspace === 'image-video' && (
            <motion.div
              key="image-video"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.14, ease: "easeOut" }}
              className="w-full z-0 overflow-hidden absolute -top-14 sm:-top-16 inset-x-0 bottom-0"
            >
              <ImageVideoWorkspace isDark={isDark} />
            </motion.div>
          )}

          {activeWorkspace === 'web-design' && (
            <motion.div
              key="web-design"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.14, ease: "easeOut" }}
              className="w-full z-0 overflow-hidden absolute -top-14 sm:-top-16 inset-x-0 bottom-0"
            >
              <WebDesignWorkspace 
                isDark={isDark} 
                isSettingsOpen={webDesignSettingsOpen}
                onCloseSettings={() => setWebDesignSettingsOpen(false)}
                onOpenSettings={() => setWebDesignSettingsOpen(true)}
              />
            </motion.div>
          )}

          {(activeWorkspace === 'deep-search' || activeWorkspace === 'web-research') && (
            <motion.div
              key="web-research"
              initial={{ opacity: 1 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.1, ease: "easeOut" }}
              className="w-full z-0 overflow-hidden absolute -top-14 sm:-top-16 inset-x-0 bottom-0"
            >
              <WebResearchWorkspace isDark={isDark} onOpenMenu={() => setSidebarOpen(true)} />
            </motion.div>
          )}

          {activeWorkspace === 'notes' && (
            <motion.div
              key="notes"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="w-full z-0 overflow-hidden absolute -top-14 sm:-top-16 inset-x-0 bottom-0"
            >
              <NotesMakerWorkspace isDark={isDark} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <GlobalHistoryModal 
        isOpen={historyOpen} 
        onClose={() => setHistoryOpen(false)} 
        isDark={isDark} 
        onSelectWorkspace={setActiveWorkspace}
      />

      <SettingsModal 
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        isDark={isDark}
        onThemeChange={setIsDark}
        initialTab={settingsTab}
        networkMode={networkMode}
        onNetworkModeChange={setNetworkMode}
        isOnline={isOnline}
      />

      <HelpModal 
        isOpen={helpOpen} 
        onClose={() => setHelpOpen(false)} 
        isDark={isDark} 
      />

      <PhoneVoiceAssistantModal
        isOpen={companionOpen}
        onClose={() => setCompanionOpen(false)}
        isDark={isDark}
        onToggleTheme={() => setIsDark(!isDark)}
        userName={userName}
      />

      <NamePromptModal
        isOpen={!userName && activeWorkspace === 'chat'}
        isDark={isDark}
        onSubmit={(name) => setUserName(name)}
      />

      <CameraCaptureModal
        isOpen={photoSearchOpen}
        isDark={isDark}
        onClose={() => setPhotoSearchOpen(false)}
        onCapture={(photoDataUrl) => {
          setPhotoSearchOpen(false);
          setActiveWorkspace('chat');
          handleSendMessage("What is this in the photo? Identify and search comprehensive details about it.", photoDataUrl);
        }}
      />
    </div>
  );
}
