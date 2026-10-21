const fs = require('fs');

function updateWorkspace(file) {
    let content = fs.readFileSync(file, 'utf8');

    // Add variants
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
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };
`;

    if (!content.includes('containerVariants')) {
       // Insert after suggestions array
       const suggestionsMatch = content.match(/const suggestions = \[[\s\S]*?\];\n/);
       if (suggestionsMatch) {
           content = content.replace(suggestionsMatch[0], suggestionsMatch[0] + variants);
       }
    }
    
    // Update motion.div to use variants
    content = content.replace(/<motion\.div\s*initial=\{\{ opacity: 0, y: 15 \}\}\s*animate=\{\{ opacity: 1, y: 0 \}\}\s*transition=\{\{ duration: 0\.4 \}\}/g, '<motion.div variants={containerVariants} initial="hidden" animate="visible"');
    
    // Make children motion elements with variants
    // The title block
    content = content.replace(/<div className="px-4 sm:px-6 flex flex-col items-center w-full max-w-4xl">/, '<motion.div variants={itemVariants} className="px-4 sm:px-6 flex flex-col items-center w-full max-w-4xl">');
    content = content.replace(/<\/p>\s*<\/div>/, '</p>\n            </motion.div>');
    
    // The grid wrapper
    content = content.replace(/<div className="w-full px-4 sm:px-6 flex justify-center pb-6 sm:pb-8">/, '<motion.div variants={itemVariants} className="w-full px-4 sm:px-6 flex justify-center pb-6 sm:pb-8">');
    content = content.replace(/<\/div>\s*<\/div>\s*<\/motion.div>/, '</div>\n            </motion.div>\n          </motion.div>');

    // The buttons in the grid
    content = content.replace(/<motion\.button/g, '<motion.button variants={itemVariants}');

    fs.writeFileSync(file, content);
    console.log('Updated ' + file);
}

['src/components/workspaces/ImageVideoWorkspace.tsx', 'src/components/workspaces/WebDesignWorkspace.tsx', 'src/components/workspaces/NotesMakerWorkspace.tsx'].forEach(updateWorkspace);
