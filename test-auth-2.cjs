const { GoogleGenAI } = require("@google/genai");
console.log("Token:", process.env.GEMINI_API_KEY?.substring(0, 5));
const ai = new GoogleGenAI({});
ai.models.generateContent({ model: "gemini-2.5-flash", contents: "hi" })
  .then(r => console.log(r.text))
  .catch(e => console.log("Failed:", e.message));
