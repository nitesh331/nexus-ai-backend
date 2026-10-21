const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

if (!content.includes('AnimatePresence')) {
    content = content.replace(/import \{ motion \} from 'motion\/react';/, "import { motion, AnimatePresence } from 'motion/react';");
}

const startString = '{/* Workspaces - Render all, but hide inactive ones to preserve state */}';
const endString = '      <GlobalHistoryModal';

const startIndex = content.indexOf(startString);
const endIndex = content.indexOf(endString);

if (startIndex !== -1 && endIndex !== -1) {
    const newWorkspaces = `{/* Workspaces - Render with AnimatePresence for transitions */}
      <div className="flex-1 w-full relative z-0 overflow-hidden flex flex-col">
        <AnimatePresence mode="wait">
          {activeWorkspace === 'chat' && (
            <motion.div
              key="chat"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="flex-1 w-full flex flex-col relative z-0 absolute inset-0"
            >
              <main className={\`flex-1 w-full flex flex-col \${messages.length === 0 ? 'items-center overflow-hidden' : 'justify-start items-center overflow-y-auto hide-scrollbar'} px-0 relative z-0\`}>
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center w-full h-full flex-1 pb-[90px] sm:pb-[110px] md:pb-[140px]">
                    <WelcomeScreen userName={userName || 'User'} isDark={isDark} />
                    <FeatureSlider 
                      isDark={isDark} 
                      onSelectWorkspace={setActiveWorkspace} 
                      onOpenCompanion={() => setCompanionOpen(true)}
                    />
                  </div>
                ) : (
                  <div className="w-full pb-28 md:pb-36">
                    <ChatHistory messages={messages} isLoading={isLoading} isDark={isDark} />
                  </div>
                )}
              </main>
              
              <ChatInput isDark={isDark} onSend={handleSendMessage} onStop={handleStopGeneration} isLoading={isLoading} workspaceId="chat" />
            </motion.div>
          )}

          {activeWorkspace === 'image-video' && (
            <motion.div
              key="image-video"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="flex-1 w-full relative z-0 overflow-hidden h-full absolute inset-0"
            >
              <ImageVideoWorkspace isDark={isDark} />
            </motion.div>
          )}

          {activeWorkspace === 'web-design' && (
            <motion.div
              key="web-design"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="flex-1 w-full relative z-0 overflow-hidden h-full absolute inset-0"
            >
              <WebDesignWorkspace isDark={isDark} />
            </motion.div>
          )}

          {(activeWorkspace === 'deep-search' || activeWorkspace === 'web-research') && (
            <motion.div
              key="web-research"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="flex-1 w-full relative z-0 overflow-hidden h-full absolute inset-0"
            >
              <WebResearchWorkspace isDark={isDark} />
            </motion.div>
          )}

          {activeWorkspace === 'notes' && (
            <motion.div
              key="notes"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="flex-1 w-full relative z-0 overflow-hidden h-full absolute inset-0"
            >
              <NotesMakerWorkspace isDark={isDark} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
`;
    content = content.substring(0, startIndex) + newWorkspaces + content.substring(endIndex);
    fs.writeFileSync('src/App.tsx', content);
    console.log("App.tsx updated.");
} else {
    console.log("Could not find start or end strings.");
}
