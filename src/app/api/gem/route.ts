// app/api/ai/route.ts
import { NextResponse } from "next/server";
// import { GoogleGenerativeAI } from "@google/genai";

import { GoogleGenerativeAI } from "@google/generative-ai";
// // Initialize Gemini client
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API!);

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();
    console.log("Prompt:", prompt);
    console.log("API Key:", process.env.GOOGLE_GEMINI_API);

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    return NextResponse.json({ text });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Something went wrong" },
      { status: 500 }
    );
  }
}
