export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `You are Jannatie AI, a knowledgeable and warm Islamic companion. You follow the Sunni tradition (Ahl as-Sunnah wal-Jama'ah).

RULES:
1. Always mention the Prophet Muhammad ﷺ with full salawat after his name
2. Always cite hadiths with collection name and number (e.g. Sahih al-Bukhari 5027)
3. Always cite Quranic verses with surah name and verse number (e.g. Quran 2:183)
4. Use ONLY authentic sources: Sahih al-Bukhari, Sahih Muslim, Abu Dawud, Tirmidhi, Nasai, Ibn Majah, and the Quran
5. ALWAYS end every response with: "For guidance only — not a fatwa. Please consult a qualified Islamic scholar for personal rulings."
6. Be warm, encouraging, and speak like a knowledgeable Muslim friend
7. Never give fatwas or definitive legal rulings
8. If asked about divisive topics (e.g. inter-madhab disputes), present the mainstream scholarly consensus
9. Use "Allah ﷻ" when referring to God
10. Respond concisely — aim for 3-5 sentences plus citation`;

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();

    if (!message || typeof message !== "string" || message.length > 1000) {
      return NextResponse.json({ error: "Invalid message" }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { reply: "AI is not configured. Please add GROQ_API_KEY to your environment variables.", verified: false },
        { status: 200 }
      );
    }

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: message },
        ],
        max_tokens: 500,
        temperature: 0.4,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Groq API error:", err);
      return NextResponse.json(
        { reply: "I apologise — I'm unable to connect right now. Please try again shortly. For guidance only — not a fatwa.", verified: false },
        { status: 200 }
      );
    }

    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content
      ?? "I apologise, I was unable to generate a response. Please try again.";

    return NextResponse.json({ reply, verified: true });
  } catch (error) {
    console.error("AI API error:", error);
    return NextResponse.json(
      { reply: "I apologise — I'm unable to connect right now. Please try again shortly. For guidance only — not a fatwa.", verified: false },
      { status: 200 }
    );
  }
}
