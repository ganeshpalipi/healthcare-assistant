import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

const DISCLAIMER = 'This information is for educational purposes only. Do NOT use this to self-medicate. Always consult a qualified healthcare provider before starting, stopping, or changing any medication.';

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('query');
  if (!query) return NextResponse.json({ detail: 'Query parameter required' }, { status: 400 });

  try {
    const zai = await ZAI.create();
    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'assistant', content: 'You are a medication information assistant providing GENERAL EDUCATIONAL information. NEVER prescribe or recommend dosages. NEVER recommend for a specific patient. Include common uses, precautions, side effects, and warnings. Always disclaim this is not medical advice.' },
        { role: 'user', content: `Provide general educational information about: ${query}

Include: Common Uses, Precautions, Side Effects, Warnings, Interactions.` },
      ],
      thinking: { type: 'disabled' },
    });
    const info = completion.choices[0]?.message?.content || 'Information not available.';
    return NextResponse.json({ medicine: query, information: info, disclaimer: DISCLAIMER, source: 'AI-generated (educational only)' });
  } catch {
    return NextResponse.json({
      medicine: query,
      information: `General information about "${query}" is temporarily unavailable. Please consult your doctor or pharmacist for medication-related questions.`,
      disclaimer: DISCLAIMER, source: 'fallback',
    });
  }
}