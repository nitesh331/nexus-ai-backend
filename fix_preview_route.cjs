const fs = require('fs');
let mainCode = fs.readFileSync('src/main.tsx', 'utf8');

mainCode = `
import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Intercept /preview/:id
const path = window.location.pathname;
if (path.startsWith('/preview/')) {
  const id = path.split('/')[2];
  const code = window.localStorage.getItem('workspace-preview-code-' + id);
  if (code) {
    document.open();
    document.write(code);
    document.close();
  } else {
    document.body.innerHTML = \`
      <div style="background: #000; color: #fff; font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0;">
        <h2>Generating Preview...</h2>
        <p>Your website is being generated. This page will auto-refresh when ready.</p>
        <p style="color: #666; font-size: 12px; margin-top: 10px;">ID: \${id}</p>
        <p style="color: #666; font-size: 12px; margin-top: 5px;">(If it takes too long, ensure you've started the generation in the chat.)</p>
      </div>
    \`;
    setTimeout(() => window.location.reload(), 2500);
  }
} else {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
`;

fs.writeFileSync('src/main.tsx', mainCode);
