const apiKey = "AIzaSyBGAjVEcTw0qtJaCwsEz-73k7u-l2ZppoE";

async function testReasoning25() {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: "Translate 'Hello' to Korean" }] }]
      })
    });
    const data = await res.json();
    console.log("Reasoning 2.5 Response:", JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Reasoning 2.5 Error:", err);
  }
}

testReasoning25();
