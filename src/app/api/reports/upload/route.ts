import { NextRequest, NextResponse } from 'next/server';

const DISCLAIMER = 'This AI analysis is for educational purposes only. Always consult a qualified healthcare provider for medical advice.';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    if (!file) return NextResponse.json({ detail: 'No file uploaded' }, { status: 400 });

    const ext = file.name.split('.').pop()?.toLowerCase();

    if (ext === 'pdf' || ext === 'txt') {
      const bytes = await file.arrayBuffer();
      const text = new TextDecoder().decode(bytes);
      return NextResponse.json({
        summary: `### Report: ${file.name}\n\nThe report has been received and processed.\n\n### Extracted Content\n${text.slice(0, 2000)}\n\n*For detailed AI-powered analysis, configure an OpenAI API key in environment variables.*`,
        extracted_info: { filename: file.name, type: ext, size_bytes: file.size },
        explanations: ['Report uploaded successfully', 'Text content extracted from file'],
        disclaimer: DISCLAIMER,
      });
    } else if (['png', 'jpg', 'jpeg'].includes(ext || '')) {
      return NextResponse.json({
        summary: `### Report: ${file.name}\n\nThe image report has been received.\n\n### Note\nImage analysis requires an OpenAI API key with vision support. Please configure OPENAI_API_KEY in your Vercel environment variables to enable AI-powered image analysis.\n\n### Recommendation\n- **Consult your doctor** with the original report for accurate interpretation\n- Use the **AI Chat** feature to ask questions about your report findings`,
        extracted_info: { filename: file.name, type: ext, size_bytes: file.size },
        explanations: ['Image received', 'AI vision analysis requires API key configuration'],
        disclaimer: DISCLAIMER,
      });
    }

    return NextResponse.json({ detail: 'Unsupported file type. Use PDF, TXT, PNG, or JPG.' }, { status: 400 });
  } catch {
    return NextResponse.json({ detail: 'Failed to process report' }, { status: 500 });
  }
}