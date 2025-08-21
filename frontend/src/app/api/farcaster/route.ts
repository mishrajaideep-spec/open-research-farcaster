import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    const neynarKey = process.env.NEYNAR_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;
    if (!neynarKey || !openaiKey) {
        return NextResponse.json({ error: 'Missing API keys' }, { status: 500 });
    }
    const body = await req.json();
    const url = process.env.FARCASTER_GRAPH_URL || 'https://api.neynar.com/v2/farcaster/graph';
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'api_key': neynarKey,
        },
        body: JSON.stringify(body),
    });
    const data = await response.json();
    return NextResponse.json(data);
}
