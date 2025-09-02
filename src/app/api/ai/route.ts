// app/api/ai/route.ts
import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API!);

export async function POST(req: Request) {
  try {
    const { prompt, fileUrl } = await req.json();

    if (!prompt && !fileUrl) {
      return NextResponse.json(
        { error: "Prompt or fileUrl is required" },
        { status: 400 }
      );
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    let result: any;

    if (fileUrl) {
      result = await model.generateContent([
        // 👇 Force plain English explanation
        `Answer in simple, plain English. No bullet points, no technical jargon.\n\n${
          prompt || "Summarize this document:"
        }`,
        {
          fileData: {
            mimeType: "application/pdf",
            fileUri: fileUrl,
          },
        },
      ]);
    } else {
      result = await model.generateContent(
        `Answer in simple, plain English. No bullet points, no technical jargon.\n\n${prompt}`
      );
    }

    const text = result.response.text();
    return NextResponse.json({ text });
  } catch (error: any) {
    console.error("AI API error:", error);
    return NextResponse.json(
      { error: error.message || "Something went wrong" },
      { status: 500 }
    );
  }
}
