const fs = require('fs');
let hookCode = fs.readFileSync('src/hooks/useWorkspaceChat.ts', 'utf8');

hookCode = hookCode.replace(
`                    if (workspaceId === 'web-design') {
                      const match = currentText.match(/<preview-code>\\s*\`\`\`html\\s*([\\s\\S]*?)(?:\\s*\`\`\`\\s*<\\/preview-code>|$)/);
                      if (match && match[1]) {
                        window.localStorage.setItem('workspace-preview-code-' + previewId, match[1]);
                      }
                    }
`, '');

fs.writeFileSync('src/hooks/useWorkspaceChat.ts', hookCode);
