const fs = require('fs');

let content = fs.readFileSync('src/components/workspaces/NotesMakerWorkspace.tsx', 'utf8');
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

if (!content.includes('containerVariants')) {
    const importMatch = content.match(/const quickModes = \[/);
    if (importMatch) {
       content = content.replace(importMatch[0], variants + '\n  ' + importMatch[0]);
    }
}
fs.writeFileSync('src/components/workspaces/NotesMakerWorkspace.tsx', content);
