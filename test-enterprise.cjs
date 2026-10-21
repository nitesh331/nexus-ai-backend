const { GoogleGenAI } = require("@google/genai");
async function run() {
  const ai = new GoogleGenAI({ vertexai: { project: 'aistudio-build', location: 'us-central1' } }); // wait, we don't know project
  // let's try just enterprise: true?
}
run();
