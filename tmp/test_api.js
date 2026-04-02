const apiKey = "AIzaSyBGAjVEcTw0qtJaCwsEz-73k7u-l2ZppoE";

async function testReasoning() {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: "Hello" }] }]
      })
    });
    const data = await res.json();
    console.log("Reasoning Response:", JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Reasoning Error:", err);
  }
}

async function testImage() {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image-preview:generateContent?key=${apiKey}`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: "A small cute cat." }] }]
      })
    });
    const data = await res.json();
    console.log("Image Response (Partial):", JSON.stringify(data, (key, value) => key === 'data' ? value.substring(0, 20) + '...' : value, 2));
  } catch (err) {
    console.error("Image Error:", err);
  }
}

async function run() {
  console.log("--- Testing Reasoning ---");
  await testReasoning();
  console.log("\n--- Testing Image ---");
  await testImage();
}

run();
