const apiKey = "AIzaSyBGAjVEcTw0qtJaCwsEz-73k7u-l2ZppoE";

async function diagnose() {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image-preview:generateContent?key=${apiKey}`;
  
  const payload = {
    contents: [{
      parts: [{ text: "A cute orange cat in a high-end designer studio, 8k professional photo." }]
    }],
    generationConfig: {
      thinkingConfig: {
        thinkingLevel: "minimal"
      },
      responseModalities: ["IMAGE", "TEXT"],
      imageConfig: {
        aspectRatio: "1:1",
        imageSize: "1K"
      }
    }
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    
    const data = await res.json();
    console.log("--- DIAGNOSTIC RESULTS ---");
    console.log("Status:", res.status);
    console.log("Body:", JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Fetch Error:", err);
  }
}

diagnose();
