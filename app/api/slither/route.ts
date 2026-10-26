
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const code = body?.code;

    if (typeof code !== 'string' || !code.trim()) {
      return NextResponse.json(
        { error: 'Missing Solidity code' },
        { status: 400 }
      );
    }

    // Use localhost only during local development.
    const backendUrl =
      process.env.SLITHER_BACKEND_URL ||
      (process.env.NODE_ENV === 'development'
        ? 'http://localhost:5005'
        : '');

    if (!backendUrl) {
      return NextResponse.json(
        {
          error: 'Slither backend is not configured.',
          hint: 'Set SLITHER_BACKEND_URL in Vercel.'
        },
        { status: 503 }
      );
    }

    const token = process.env.SLITHER_BACKEND_TOKEN;
    const url = `${backendUrl.replace(/\/+$/, '')}/analyze`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'X-Slither-Token': token } : {})
      },
      body: JSON.stringify({ code }),
      signal: AbortSignal.timeout(55_000)
    });

    const data = await response.json().catch(() => ({
      error: 'Slither backend returned an invalid response.'
    }));

    if (!response.ok) {
      return NextResponse.json(
        {
          error: data.error || 'Slither backend returned an error',
          details: data
        },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Unknown error';

    if (message.toLowerCase().includes('timeout')) {
      return NextResponse.json(
        { error: 'Slither analysis timed out.' },
        { status: 504 }
      );
    }

    return NextResponse.json(
      {
        error: 'Cannot connect to Slither backend.',
        details: message,
        hint: 'Check SLITHER_BACKEND_URL and the hosted backend logs.'
      },
      { status: 503 }
    );
  }
}
