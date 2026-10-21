const fs = require('fs');

let content = fs.readFileSync('src/components/workspaces/NotesMakerWorkspace.tsx', 'utf8');

// The faulty motion.div is after item.desc
content = content.replace(/\{item\.desc\}\n\s*<\/p>\n\s*<\/motion\.div>/, '{item.desc}\n                      </p>\n                    </div>');

// The end of the block needs </motion.div> instead of </div> if I broke it? 
// No, it has </motion.div> at the end already.
// Wait, the main container `items-center` might also be broken.
// I will just use regex to fix it.

fs.writeFileSync('src/components/workspaces/NotesMakerWorkspace.tsx', content);
