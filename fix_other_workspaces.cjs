const fs = require('fs');

const variants = `
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring' as any, stiffness: 300, damping: 24 } }
  };
`;

function fix(file) {
  let content = fs.readFileSync(file, 'utf8');
  if (!content.includes('containerVariants')) {
    const importMatch = content.match(/const suggestions = \[[\s\S]*?\];\n/);
    if (importMatch) {
       content = content.replace(importMatch[0], importMatch[0] + variants);
    }
  }

  // Update initial={{ opacity: 0, y: 15 }} to use variants
  content = content.replace(/<motion\.div\s*initial=\{\{ opacity: 0, y: 15 \}\}\s*animate=\{\{ opacity: 1, y: 0 \}\}/, '<motion.div variants={containerVariants} initial="hidden" animate="visible"');
  
  // Update header section
  content = content.replace(/<div className="flex flex-col items-center text-center space-y-3 sm:space-y-5">/, '<motion.div variants={itemVariants} className="flex flex-col items-center text-center space-y-3 sm:space-y-5">');
  // For WebDesign Workspace:
  if (file.includes('WebDesign')) {
     content = content.replace(/instantly\.\n\s*<\/p>\n\s*<\/div>/, 'instantly.\n                </p>\n              </motion.div>');
     content = content.replace(/<div className=\{`mt-6 sm:mt-8 mx-auto w-full max-w-2xl/, '<motion.div variants={itemVariants} className={`mt-6 sm:mt-8 mx-auto w-full max-w-2xl');
     content = content.replace(/<\/div>\n\s*<\/motion\.div>\n\s*<\/div>/, '</div>\n              </motion.div>\n            </motion.div>\n          </div>');
     content = content.replace(/<motion\.div\n\s*key=\{idx\}\n\s*initial=\{\{ opacity: 0, x: -10 \}\}\n\s*animate=\{\{ opacity: 1, x: 0 \}\}\n\s*transition=\{\{ delay: idx \* 0\.05 \}\}/g, '<motion.div variants={itemVariants} key={idx}');
  }
  
  if (file.includes('NotesMaker')) {
     content = content.replace(/your classes\.\n\s*<\/p>\n\s*<\/div>/, 'your classes.\n                </p>\n              </motion.div>');
     content = content.replace(/<div className="w-full px-4 sm:px-6 flex justify-center pb-6 sm:pb-8">/, '<motion.div variants={itemVariants} className="w-full px-4 sm:px-6 flex justify-center pb-6 sm:pb-8">');
     content = content.replace(/<\/div>\n\s*<\/div>\n\s*<\/motion\.div>/, '</div>\n            </motion.div>\n          </motion.div>');
     content = content.replace(/<motion\.div\n\s*key=\{idx\}\n\s*initial=\{\{ opacity: 0, x: -10 \}\}\n\s*animate=\{\{ opacity: 1, x: 0 \}\}\n\s*transition=\{\{ delay: idx \* 0\.05 \}\}/g, '<motion.div variants={itemVariants} key={idx}');
  }

  fs.writeFileSync(file, content);
}

fix('src/components/workspaces/WebDesignWorkspace.tsx');
fix('src/components/workspaces/NotesMakerWorkspace.tsx');
