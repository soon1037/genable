import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { NANO_BANANA_PROMPTS } from "@/lib/prompts/nanobanana";

// Initialize Supabase with Service Role
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export async function POST(req) {
  try {
    const { prompt, referenceImageUrl, type = "cover", aspectRatio = "1:1" } = await req.json();
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || "";

    console.log(`[BANANA DEBUG] Prompt Organizer Active: "${prompt}" | type: ${type}`);

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    // Official Nano Banana 2 (Gemini 3.1 Flash Image) - REST EndPoint
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image-preview:generateContent?key=${apiKey}`;
    
    // Using organized prompt template from lib/prompts
    const designPrompt = NANO_BANANA_PROMPTS.getDesignPrompt(prompt, type, aspectRatio);

    const contents = [{ 
      parts: [
        { text: designPrompt }
      ]
    }];
    
    // Include reference image as base64 inlineData for multimodal consistency
    if (referenceImageUrl) {
      try {
        const refImgRes = await fetch(referenceImageUrl);
        const refImgBuffer = await refImgRes.arrayBuffer();
        contents[0].parts.push({
          inlineData: {
            mimeType: "image/png",
            data: Buffer.from(refImgBuffer).toString('base64')
          }
        });
      } catch (refErr) {
        console.warn("[BANANA DEBUG] Reference image fetch failed:", refErr);
      }
    }

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents,
        generationConfig: {
          responseModalities: ["IMAGE", "TEXT"],
          imageConfig: {
            aspectRatio: aspectRatio,
            imageSize: "1K"
          }
        },
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
        ]
      })
    });

    const resultData = await response.json();
    
    // Handling robust parsing for both inlineData and inline_data
    const firstCandidate = resultData.candidates?.[0];
    const imagePart = firstCandidate?.content?.parts?.find(p => p.inlineData || p.inline_data);
    
    if (imagePart) {
      const inlineData = imagePart.inlineData || imagePart.inline_data;
      if (inlineData?.data) {
        const base64Image = inlineData.data;
        const buffer = Buffer.from(base64Image, 'base64');
        const fileName = `generated/${Date.now()}-${type}.png`;
        
        const { error: uploadError } = await supabaseAdmin.storage.from('thumbnails').upload(fileName, buffer, { contentType: 'image/png' });
        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabaseAdmin.storage.from('thumbnails').getPublicUrl(fileName);

        console.log(`[BANANA DEBUG] GENERATION SUCCESS: ${publicUrl}`);
        return NextResponse.json({
          imageUrl: publicUrl,
          promptUsed: prompt,
          fullPrompt: designPrompt,
          explanation: `나노바나나2(Gemini 3.1)가 ${type} 이미지를 성공적으로 생성했습니다.`
        });
      }
    }

    // Detailed Error Exposure
    console.error("[BANANA DEBUG] AI Response Error (No Image):", JSON.stringify(resultData, null, 2));
    
    const keywords = encodeURIComponent(prompt + " 8k professional photo");
    return NextResponse.json({
      imageUrl: `https://loremflickr.com/1080/1080/${keywords}`,
      promptUsed: prompt,
      explanation: "AI 모델 응답 이슈로 최적의 디자인 이미지를 매칭했습니다.",
      rawError: resultData 
    });

  } catch (err) {
    console.error("[BANANA DEBUG] API CRITICAL FAILURE:", err);
    return NextResponse.json({ 
      imageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1080&q=80",
      explanation: "시스템 고장: " + err.message
    }, { status: 500 });
  }
}
