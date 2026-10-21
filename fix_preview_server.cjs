const fs = require('fs');
let serverCode = fs.readFileSync('server.ts', 'utf8');

// We need to send index.html for /preview/:id so the frontend SPA can handle it and read from localStorage.
// The current app.get("/preview/:id") hardcodes HTML and reads from the memory map.

serverCode = serverCode.replace(
/app\.get\("\/preview\/:id", \(req, res\) => \{[\s\S]*?res\.send\([\s\S]*?\}\);\s*\}\);/g,
`app.get("/preview/:id", (req, res) => {
    // Send to SPA so it can handle the preview from localStorage
    if (process.env.NODE_ENV !== "production") {
      // In dev, Vite middleware handles SPA fallback if not defined, but we explicitly want to route to index.html
      // We don't want it to fail. Actually, Vite middleware handles all unknown routes.
      // So we can just remove the route entirely!
      res.redirect('/?preview=' + req.params.id); // Or just let Vite handle it. Let's just send the index file in prod.
    } else {
      const distPath = path.join(process.cwd(), 'dist');
      res.sendFile(path.join(distPath, 'index.html'));
    }
  });`
);

// Better yet, just remove the app.get("/preview/:id") route and let the SPA fallback handle it.
// Let's replace the whole app.get route with an empty string, except we need to match it correctly.
