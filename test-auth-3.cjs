const { GoogleGenAI } = require("@google/genai");
async function run() {
  const ai = new GoogleGenAI({ 
    httpOptions: { 
      headers: { Authorization: `Bearer ${process.env.GEMINI_API_KEY}` } 
    } 
  });
  try {
    const res = await ai.models.generateContent({ model: "gemini-1.5-flash", contents: "hi" });
    console.log("Success:", res.text);
  } catch (e) {
    console.error("Error:", e.message);
  }
}
run();
