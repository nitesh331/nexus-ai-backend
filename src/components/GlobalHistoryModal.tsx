import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, X, MessageSquare, Image as ImageIcon, Layout, Globe, BookOpen, Trash2 } from 'lucide-react';

interface GlobalHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  onSelectWorkspace: (id: string) => void;
}

const WORKSPACES = [
  { id: 'chat', label: 'Chat Assistant', icon: <MessageSquare size={18} /> },
  { id: 'image-video', label: 'Zenra', icon: <ImageIcon size={18} /> },
  { id: 'web-design', label: 'Jaalix', icon: <Layout size={18} /> },
  { id: 'deep-search', label: 'Atal', icon: <Globe size={18} /> },
  { id: 'notes', label: 'Medhira', icon: <BookOpen size={18} /> },
];

type HistoryItem = {
  workspaceId: string;
  label: string;
  icon: React.ReactNode;
  messages: { role: string; content: string }[];
  lastMessage: string;
};

export default function GlobalHistoryModal({ isOpen, onClose, isDark, onSelectWorkspace }: GlobalHistoryModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Load history from localStorage or sessionStorage when modal opens
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setConfirmDeleteId(null);
      const loadedHistory: HistoryItem[] = [];
      const isTemp = typeof window !== 'undefined' && window.localStorage.getItem('setting-temporary-chat') === 'true';
      const primaryStorage = isTemp ? window.sessionStorage : window.localStorage;
      
      for (const ws of WORKSPACES) {
        try {
          let data = primaryStorage.getItem(`workspace-messages-${ws.id}`);
          if (!data && isTemp) {
            data = window.localStorage.getItem(`workspace-messages-${ws.id}`);
          }
          if (!data && ws.id === 'deep-search') {
            data = primaryStorage.getItem('workspace-messages-web-research') || window.localStorage.getItem('workspace-messages-web-research');
          }
          if (data) {
            const messages = JSON.parse(data);
            if (Array.isArray(messages) && messages.length > 0) {
              loadedHistory.push({
                workspaceId: ws.id,
                label: ws.label,
                icon: ws.icon,
                messages,
                lastMessage: messages[messages.length - 1].content
              });
            }
          }
        } catch (e) {
          console.warn(`Could not load history for ${ws.id}:`, e);
        }
      }
      
      setHistory(loadedHistory);
    }
  }, [isOpen]);

  const handleDelete = (workspaceId: string) => {
    window.localStorage.removeItem(`workspace-messages-${workspaceId}`);
    window.sessionStorage.removeItem(`workspace-messages-${workspaceId}`);
    if (workspaceId === 'deep-search') {
      window.localStorage.removeItem('workspace-messages-web-research');
      window.sessionStorage.removeItem('workspace-messages-web-research');
    }
    setHistory(prev => prev.filter(h => h.workspaceId !== workspaceId));
    setConfirmDeleteId(null);
    window.dispatchEvent(new CustomEvent('clear-workspace-chat', { detail: { workspaceId } }));
  };

  const filteredHistory = useMemo(() => {
    if (!searchQuery.trim()) return history;
    const lowerQuery = searchQuery.toLowerCase();
    return history.filter(h => 
      h.label.toLowerCase().includes(lowerQuery) || 
      h.messages.some(m => m.content.toLowerCase().includes(lowerQuery))
    );
  }, [history, searchQuery]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={`relative w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] ${
              isDark ? 'bg-[#1a1a1a] border border-white/10 text-white' : 'bg-white border border-gray-200 text-gray-900'
            }`}
          >
            {/* Search Header */}
            <div className={`flex items-center px-4 py-4 border-b ${isDark ? 'border-white/10' : 'border-gray-100'}`}>
              <Search className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
              <input
                autoFocus
                type="text"
                placeholder="Search across all workspaces..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className={`flex-1 bg-transparent border-none outline-none px-4 text-lg placeholder:text-gray-500`}
              />
              <button 
                onClick={onClose} 
                className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-white/10 text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-900'}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {typeof window !== 'undefined' && window.localStorage.getItem('setting-temporary-chat') === 'true' && (
              <div className={`mx-3 mt-3 px-3.5 py-2.5 rounded-xl border text-xs flex items-center gap-2 ${
                isDark ? 'bg-amber-500/10 border-amber-500/20 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-800'
              }`}>
                <span className="shrink-0 text-sm">⏳</span>
                <span>
                  <strong>Temporary Chat Active:</strong> Conversations exist only while this app is open and will vanish when you close the window.
                </span>
              </div>
            )}
            
            {/* Results */}
            <div className="flex-1 overflow-y-auto p-2">
              {filteredHistory.length === 0 ? (
                <div className={`py-12 text-center ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  {searchQuery ? "No results found for your search." : "No recent chats found. Start a conversation in any workspace!"}
                </div>
              ) : (
                <div className="flex flex-col gap-1">
                  {filteredHistory.map((item) => (
                    <div 
                      key={item.workspaceId}
                      className={`relative flex items-center p-2 rounded-xl transition-all ${
                        isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'
                      }`}
                    >
                      <button
                        onClick={() => {
                          onSelectWorkspace(item.workspaceId);
                          onClose();
                        }}
                        className="flex-1 flex flex-col text-left p-2 pr-4"
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`p-2 rounded-lg ${isDark ? 'bg-white/10' : 'bg-gray-100'}`}>
                            {item.icon}
                          </div>
                          <span className="font-semibold">{item.label}</span>
                          <span className={`text-xs ml-auto ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            {item.messages.length} message{item.messages.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <p className={`text-sm line-clamp-2 pl-11 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {item.lastMessage}
                        </p>
                      </button>

                      {confirmDeleteId === item.workspaceId ? (
                        <div className="flex items-center gap-2 pr-2">
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDelete(item.workspaceId); }}
                            className="px-3 py-1.5 text-xs font-bold bg-red-500 text-white rounded-lg hover:bg-red-600 shadow-sm"
                          >
                            Delete
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(null); }}
                            className={`px-3 py-1.5 text-xs font-medium rounded-lg ${isDark ? 'bg-white/10 hover:bg-white/20' : 'bg-gray-200 hover:bg-gray-300'}`}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(item.workspaceId); }}
                          className={`p-2 mr-2 rounded-lg transition-colors ${isDark ? 'text-gray-400 hover:text-red-400 hover:bg-red-500/10' : 'text-gray-500 hover:text-red-500 hover:bg-red-50'}`}
                          title="Delete Chat"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
