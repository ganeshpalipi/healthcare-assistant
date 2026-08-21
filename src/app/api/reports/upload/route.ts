import { NextRequest, NextResponse } from 'next/server';

const DISCLAIMER = 'This AI-powered report analysis is for educational purposes only. It does NOT replace professional medical interpretation. Always consult a qualified healthcare provider.';

async function callLLM(systemPrompt: string, userMessage: string): Promise<string> {
  try {
    const ZAI = (await import('z-ai-web-dev-sdk')).default;
    const zai = await ZAI.create();
    const completion = await zai.chat.completions.create({
      messages: [{ role: 'assistant', content: systemPrompt }, { role: 'user', content: userMessage }],
      thinking: { type: 'disabled' },
    });
    return completion.choices[0]?.message?.content || '';
  } catch { /* SDK not available */ }

  const apiKey = process.env.OPENAI_API_KEY;
  if (apiKey) {
    try {
      const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({ model, messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userMessage }], max_tokens: 1500, temperature: 0.3 }),
      });
      if (res.ok) { const data = await res.json(); return data.choices?.[0]?.message?.content || ''; }
    } catch { /* OpenAI failed */ }
  }
  return '';
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    if (!file) return NextResponse.json({ detail: 'No file provided' }, { status: 400 });
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) return NextResponse.json({ detail: 'File too large. Max 10MB.' }, { status: 400 });
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['pdf', 'txt', 'png', 'jpg', 'jpeg'].includes(ext || ''))
      return NextResponse.json({ detail: 'Unsupported format. Use PDF, TXT, PNG, or JPG.' }, { status: 400 });

    let fileContent = '';
    if (ext === 'txt') {
      fileContent = await file.text();
    } else if (['png', 'jpg', 'jpeg'].includes(ext || '')) {
      try {
        const ZAI = (await import('z-ai-web-dev-sdk')).default;
        const bytes = await file.arrayBuffer();
        const base64 = Buffer.from(bytes).toString('base64');
        const zai = await ZAI.create();
        const result = await zai.vlm.chat.completions.create({
          messages: [
            { role: 'assistant', content: 'Extract ALL text from this medical report image.' },
            { role: 'user', content: [{ type: 'image_url', image_url: { url: `data:image/${ext};base64,${base64}` } }] },
          ],
        });
        fileContent = result.choices[0]?.message?.content || '';
      } catch { fileContent = `[Image: ${file.name}] - Vision AI not configured. Upload .txt for best results.`; }
    } else if (ext === 'pdf') {
      try {
        const bytes = await file.arrayBuffer();
        const textDecoder = new TextDecoder('utf-8', { fatal: false });
        const rawText = textDecoder.decode(bytes);
        const textParts = rawText.match(/[\x20-\x7E\n\r]{10,}/g);
        fileContent = textParts ? textParts.slice(0, 50).join('\n') : `[PDF: ${file.name}] - Upload as .txt for best results.`;
      } catch { fileContent = `[PDF: ${file.name}] - Could not extract text.`; }
    }

    let summary = '';
    let explanations: string[] = [];
    if (fileContent.trim().length > 10) {
      const analysis = await callLLM(
        'Analyze medical reports. Use ### headings and - for lists. Always recommend consulting a doctor.',
        `Analyze this report:\n\n${fileContent.slice(0, 3000)}`
      );
      if (analysis.trim()) {
        summary = analysis;
        const explMatch = analysis.match(/###\s*Explanations?\s*\n([\s\S]*?)(?=###|$)/i);
        if (explMatch) explanations = explMatch[1].split('\n').filter((l: string) => l.trim().startsWith('-')).map((l: string) => l.replace(/^[-*]\s*/, '').trim());
      } else {
        summary = '### Report Received\n\n- **File:** ' + file.name + '\n- **Size:** ' + (file.size / 1024).toFixed(1) + ' KB\n\nAI analysis requires an API key. Add OPENAI_API_KEY to .env file.';
      }
    } else { summary = '### Insufficient Content\n\nCould not extract text. Upload a .txt file.'; }

    return NextResponse.json({ summary, extracted_info: { filename: file.name, size: file.size, type: file.type }, explanations, disclaimer: DISCLAIMER });
  } catch { return NextResponse.json({ detail: 'Failed to process report' }, { status: 500 }); }
}