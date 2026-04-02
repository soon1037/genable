const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

async function listModels() {
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    console.log("Available Models:", JSON.stringify(data.models.map(m => m.name), null, 2));
  } catch (err) {
    console.error("Error listing models:", err);
  }
}

listModels();
