const fs = require('fs');
let hookCode = fs.readFileSync('src/hooks/useWorkspaceChat.ts', 'utf8');

hookCode = hookCode.replace(
`                  if (parsed.text) {
                    currentText += parsed.text;
                    setMessages((prev) => {`,
`                  if (parsed.text) {
                    currentText += parsed.text;
                    setMessages((prev) => {`
);

fs.writeFileSync('src/hooks/useWorkspaceChat.ts', hookCode);
