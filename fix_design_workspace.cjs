const fs = require('fs');
let content = fs.readFileSync('src/components/workspaces/WebDesignWorkspace.tsx', 'utf8');

const regex = /<\/div>\n\s*<\/div>\n\s*<\/motion\.div>\n\s*<\/motion\.div>\n\s*<\/div>\n\s*\) : \(/;
content = content.replace(regex, '</div>\n              </motion.div>\n            </motion.div>\n          </div>\n        ) : (');

fs.writeFileSync('src/components/workspaces/WebDesignWorkspace.tsx', content);
