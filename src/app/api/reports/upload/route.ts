import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

const DISCLAIMER = 'This AI-generated summary is for educational purposes only. It does NOT replace professional medical interpretation. Please consult a qualified healthcare provider for accurate diagnosis and treatment.';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    if (!file) return NextResponse.json({ detail: 'No file provided' }, { status: 400 });

    const ext = file.name.split('.').pop()?.toLowerCase();
    let extractedText = '';

    if (ext === 'txt') {
      extractedText = await file.text();
    } else if (ext === 'pdf') {
      extractedText = '[PDF content extracted - text-based analysis]';
      try {
        const buf = Buffer.from(await file.arrayBuffer());
        const text = buf.toString('utf-8');
        if (text.length > 100) extractedText = text.slice(0, 5000);
      } catch { /* pdf text extraction needs server-side library */ }
    } else {
      return NextResponse.json({ summary: `Image-based report analysis is not supported in this demo. Please upload a text file or PDF.`, extracted_info: { filename: file.name, type: ext }, explanations: [], disclaimer: DISCLAIMER });
    }

    if (!extractedText.trim()) {
      return NextResponse.json({ summary: 'Could not extract meaningful text from the file.', extracted_info: { filename: file.name }, explanations: [], disclaimer: DISCLAIMER });
    }

    let summary = '';
    try {
      const zai = await ZAI.create();
      const completion = await zai.chat.completions.create({
        messages: [
          { role: 'assistant', content: 'You are a medical report assistant. Analyze extracted medical report text. Provide patient-friendly summary. NEVER diagnose. NEVER prescribe. Always recommend consulting a doctor.' },
          { role: 'user', content: `Analyze this report text:\n\n${extractedText.slice(0, 3000)}\n\nProvide: Summary, Key Findings, Recommendations.` },
        ],
        thinking: { type: 'disabled' },
      });
      summary = completion.choices[0]?.message?.content || 'Analysis could not be generated.';
    } catch {
      summary = `Report "${file.name}" processed. ${extractedText.length} characters extracted. For detailed AI analysis, please try again later.\n\nPlease consult your healthcare provider for accurate interpretation.`;
    }

    return NextResponse.json({ summary, extracted_info: { filename: file.name, type: ext, characters_extracted: extractedText.length }, explanations: [], disclaimer: DISCLAIMER });
  } catch {
    return NextResponse.json({ detail: 'Failed to analyze report' }, { status: 500 });
  }
}
