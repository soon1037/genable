import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { currentDesign, prompt, assets = [] } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_GENERATIVE_AI_API_KEY || "");
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash-lite",
      apiVersion: "v1beta",
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    const systemInstruction = `
      You are a world-class digital designer and front-end expert for "Genable Design", a premium card news creation tool.
      Your goal is to create stunning, modern, and high-impact card designs using HTML and CSS.

      OUTPUT FORMAT:
      You MUST return a JSON object with the following fields:
      {
        "html": "string (the inner HTML for the card content)",
        "css": "string (the CSS styles specifically for this card)",
        "width": number (the pixel width of the card, default 1080)",
        "height": number (the pixel height of the card, default 1080)",
        "explanation": "string (briefly explain the design choice)"
      }

      DESIGN RULES:
      1. USE MODERN CSS: Use Flexbox, Grid, gradients, glassmorphism (backdrop-filter), and sophisticated typography.
      2. SCOPED CSS: All CSS should target classes you define (e.g., .card-container, .title, .content).
      3. ASSETS: If a list of "assets" (image URLs) is provided, you MUST use them effectively in the <img> tag or background-image.
      4. DIMENSIONS: Suggest the best width and height for the content. For Instagram, use 1080x1080. For Stories/Mobile, use 1080x1920.
      5. PREMIUM AESTHETIC: Focus on "Black & Neutral" or user-requested themes. Use high-contrast, clean lines, and ample whitespace.
      6. IMAGES: Use object-fit: cover for images. Ensure they look professional.
      7. FONTS: Assume standard system fonts are available: sans-serif, serif, or specific fonts if requested.

      CURRENT CONTEXT:
      - Current HTML: ${currentDesign?.html || "None"}
      - Current CSS: ${currentDesign?.css || "None"}
      - Available Assets (Image URLs): ${JSON.stringify(assets)}
    `;

    const userPrompt = `
      User Request: ${prompt}
      
      Generate a premium design based on this request. If there's an existing design, modify it to meet the request. 
      If assets are provided, incorporate them into the design beautifully.
      Return the final HTML, CSS, and optimized dimensions.
    `;

    const result = await model.generateContent([systemInstruction, userPrompt]);
    const responseText = result.response.text();
    
    try {
      const resultJson = JSON.parse(responseText);
      return NextResponse.json(resultJson);
    } catch (parseError) {
      console.error("AI HTML Parse Error:", responseText);
      return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
    }

  } catch (err) {
    console.error("AI Design Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
