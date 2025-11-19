import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { code, slitherOutput, slitherErrors } = await req.json();

  // Read API key from env
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_API_KEY) {
    return NextResponse.json({ error: 'Gemini API key not set. Set GEMINI_API_KEY in your .env.local.' }, { status: 500 });
  }

  if (!code) {
    return NextResponse.json({ error: 'Missing code' }, { status: 400 });
  }

  try {
    // Build prompt for analyzing Slither output
    const promptText = `You are a security analysis expert for Solidity smart contracts. Analyze the following Slither security analysis output and provide a clear, concise summary.

Solidity Code:
\`\`\`solidity
${code}
\`\`\`

Slither Analysis Output:
${slitherOutput || 'No output'}

Slither Errors/Warnings:
${slitherErrors || 'No errors'}

Please provide a summary that includes:
1. Overall security assessment (High/Medium/Low risk)
2. Key vulnerabilities or issues found (if any)
3. Critical findings that need immediate attention
4. Recommendations for fixing identified issues

Format your response in a clear, structured way that's easy to understand. Be concise but thorough.`;

    const response = await fetch('https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=' + GEMINI_API_KEY, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          { parts: [{ text: promptText }] }
        ],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 2048
        }
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown API error' }));
      return NextResponse.json({ 
        error: `Gemini API error: ${errorData.error?.message || errorData.error || 'Unknown error'}`,
        debug: errorData 
      }, { status: response.status });
    }

    const data = await response.json();
    
    if (data.error) {
      return NextResponse.json({ 
        error: `Gemini API error: ${data.error.message || data.error}`,
        debug: data 
      }, { status: 500 });
    }

    const candidate = data?.candidates?.[0];
    
    if (!candidate) {
      return NextResponse.json({ 
        error: 'No response from AI. The API may have blocked the request.',
        debug: data 
      }, { status: 500 });
    }

    const finishReason = candidate?.finishReason;
    
    if (finishReason && finishReason !== 'STOP' && finishReason !== 'MAX_TOKENS') {
      return NextResponse.json({ 
        error: `AI response was blocked. Reason: ${finishReason}`,
        debug: data 
      }, { status: 500 });
    }

    const aiText = candidate?.content?.parts?.[0]?.text;

    if (!aiText || aiText.trim().length === 0) {
      return NextResponse.json({ 
        error: 'AI did not return any analysis.',
        debug: data 
      }, { status: 500 });
    }

    return NextResponse.json({ summary: aiText.trim() });
  } catch (error) {
    return NextResponse.json({ 
      error: `Failed to process AI request: ${(error as Error).message}`,
      debug: { error: (error as Error).stack }
    }, { status: 500 });
  }
}


