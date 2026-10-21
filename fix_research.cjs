const fs = require('fs');

let content = fs.readFileSync('src/components/workspaces/WebResearchWorkspace.tsx', 'utf8');

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
    const importMatch = content.match(/const \{ messages/);
    if (importMatch) {
        content = content.replace(importMatch[0], variants + '\n  ' + importMatch[0]);
    }
}

// Replace the main intro container
content = content.replace(/<div className="w-full h-full flex flex-col items-center justify-start relative min-h-\[420px\] sm:min-h-\[500px\] pt-4 sm:pt-8 md:pt-16">/, '<motion.div variants={containerVariants} initial="hidden" animate="visible" className="w-full h-full flex flex-col items-center justify-start relative min-h-[420px] sm:min-h-[500px] pt-4 sm:pt-8 md:pt-16">');
content = content.replace(/<\/div>\s*\) : \(/, '</motion.div>\n        ) : (');

// Replace the inner divs
content = content.replace(/<motion\.div\s*initial=\{\{ opacity: 0, y: -15 \}\}\s*animate=\{\{ opacity: 1, y: 0 \}\}\s*transition=\{\{ duration: 0\.6, delay: 0\.15, ease: "easeOut" \}\}/, '<motion.div variants={itemVariants}');

content = content.replace(/<div className="relative flex-1 w-full flex items-center justify-center z-10 pointer-events-none mt-2 sm:mt-4 md:mt-8">/, '<motion.div variants={itemVariants} className="relative flex-1 w-full flex items-center justify-center z-10 pointer-events-none mt-2 sm:mt-4 md:mt-8">');
content = content.replace(/<RealGlobe isDark={isDark} \/>\s*<\/div>\s*<\/div>\s*<\/div>/, '<RealGlobe isDark={isDark} />\n                </div>\n              </div>\n            </motion.div>');

fs.writeFileSync('src/components/workspaces/WebResearchWorkspace.tsx', content);
console.log('Updated WebResearchWorkspace');
