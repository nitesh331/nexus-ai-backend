import { useState, useEffect, useRef } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { SERVICE_MAINTENANCE_MESSAGE } from '../utils/maintenanceMessage';

export type Message = { 
  role: 'user' | 'model'; 
  content: string; 
  mode?: 'online' | 'offline';
  image?: string;
};

export function useWorkspaceChat(workspaceId: string) {
  const [messages, setMessages] = useLocalStorage<Message[]>(`workspace-messages-${workspaceId}`, []);
  const [previewId] = useLocalStorage<string>(`workspace-preview-id-${workspaceId}`, Math.random().toString(36).substring(2, 10));
  const [isLoading, setIsLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const updateLoading = (loading: boolean) => {
    setIsLoading(loading);
    try {
      window.dispatchEvent(new CustomEvent('workspace-activity-change', {
        detail: { workspaceId, isLoading: loading }
      }));
    } catch {}
  };

  useEffect(() => {
    const handleClear = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.workspaceId === workspaceId) {
        setMessages([]);
      }
    };

    window.addEventListener('clear-workspace-chat', handleClear);
    return () => window.removeEventListener('clear-workspace-chat', handleClear);
  }, [workspaceId, setMessages]);

  const stopMessage = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      updateLoading(false);
    }
  };

  const sendMessage = async (text: string, image?: string) => {
    const trimmed = text.trim();
    if ((!trimmed && !image) || isLoading) return;
    
    const content = trimmed || (image ? "What is in this image? Search and identify it in detail." : "");
    const newMessages = [...messages, { role: 'user' as const, content, image }];
    setMessages(newMessages);
    updateLoading(true);

    // Offline model is ONLY for Chat Assistant. Non-chat workspaces always show Service Maintenance when offline or in always-offline mode.
    let isAlwaysOffline = false;
    try {
      const savedMode = localStorage.getItem('setting-network-mode');
      if (savedMode) isAlwaysOffline = JSON.parse(savedMode) === 'always-offline';
    } catch {}

    if ((typeof navigator !== 'undefined' && !navigator.onLine) || isAlwaysOffline) {
      setMessages([...newMessages, { role: 'model', content: SERVICE_MAINTENANCE_MESSAGE, mode: 'offline' }]);
      updateLoading(false);
      return;
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      let customInstructions = localStorage.getItem('setting-custom-instructions') || '';
      if (workspaceId === 'web-design') {
        const fw = localStorage.getItem('webdesign-framework') || 'react-tailwind';
        const style = localStorage.getItem('webdesign-style') || 'modern-saas';
        const ts = (localStorage.getItem('webdesign-typescript') ?? 'true') === 'true';
        const resp = (localStorage.getItem('webdesign-responsive') ?? 'true') === 'true';
        const single = (localStorage.getItem('webdesign-singlefile') ?? 'true') === 'true';
        const webCustom = localStorage.getItem('webdesign-instructions') || '';

        const webRules = [
          `Target Stack: ${fw}`,
          `Visual Style: ${style}`,
          ts ? 'Use TypeScript with strict prop types.' : 'Use clean JavaScript.',
          resp ? 'Ensure mobile-first responsive layout across all breakpoints.' : '',
          single ? 'Output complete, self-contained runnable code without placeholders.' : '',
          webCustom ? `User Web Design Instructions: ${webCustom}` : ''
        ]
          .filter(Boolean)
          .join('\n');

        customInstructions = customInstructions ? `${customInstructions}\n\n${webRules}` : webRules;
      }

      let model = 'Nexus Elite';
      let temperature = 0.7;
      let networkMode = 'auto';
      try {
        const savedModel = localStorage.getItem('setting-selected-model');
        if (savedModel) model = JSON.parse(savedModel);
        const savedTemp = localStorage.getItem('setting-temperature');
        if (savedTemp) temperature = JSON.parse(savedTemp);
        const savedNetworkMode = localStorage.getItem('setting-network-mode');
        if (savedNetworkMode) networkMode = JSON.parse(savedNetworkMode);
      } catch {}

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: newMessages, 
          workspace: workspaceId, 
          customInstructions,
          model,
          temperature,
          previewId,
          networkMode
        }),
        signal: abortController.signal
      });
      
      if (!res.ok) {
        setMessages([...newMessages, { role: 'model', content: SERVICE_MAINTENANCE_MESSAGE, mode: 'offline' }]);
        updateLoading(false);
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
        setMessages([...newMessages, { role: 'model', content: SERVICE_MAINTENANCE_MESSAGE, mode: 'offline' }]);
      }
    } finally {
      updateLoading(false);
      abortControllerRef.current = null;
    }
  };

  return { messages, setMessages, isLoading, sendMessage, stopMessage };
}
