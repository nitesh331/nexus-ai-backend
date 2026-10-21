const { GoogleGenAI } = require("@google/genai");
async function run() {
  console.log("Testing with no args...");
  try {
    const ai = new GoogleGenAI({});
    const res = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: "hi" });
    console.log("Success no args!", res.text);
    return;
  } catch (e) {
    console.error("No args failed:", e.message);
  }

  console.log("\nTesting explicitly as apiKey...");
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const res = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: "hi" });
    console.log("Success apiKey!", res.text);
    return;
  } catch (e) {
    console.error("apiKey failed:", e.message);
  }

  console.log("\nTesting explicitly with Bearer Authorization header...");
  try {
    const ai = new GoogleGenAI({ httpOptions: { headers: { Authorization: `Bearer ${process.env.GEMINI_API_KEY}` } } });
    const res = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: "hi" });
    console.log("Success Authorization!", res.text);
    return;
  } catch (e) {
    console.error("Authorization failed:", e.message);
  }
}
run();
