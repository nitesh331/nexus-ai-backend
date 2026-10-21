const { GoogleGenAI } = require("@google/genai");
async function run() {
  const ai = new GoogleGenAI({ 
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: { 
      headers: { 'User-Agent': 'aistudio-build' } 
    } 
  });
  try {
    const res = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: "hi" });
    console.log("Success:", res.text);
  } catch (e) {
    console.error("Error:", e.message);
  }
}
run();
