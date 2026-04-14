import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL;

async function proxy(request: NextRequest): Promise<NextResponse> {
  if (!BACKEND_URL) {
    console.error('[proxy] BACKEND_URL is not configured');
    return NextResponse.json(
      { error: 'Backend service not configured' },
      { status: 503 }
    );
  }

  const { pathname, search } = request.nextUrl;
  const backendUrl = `${BACKEND_URL}${pathname}${search}`;

  const forwardedHeaders: Record<string, string> = {
    'Accept': 'application/json',
  };
  const auth = request.headers.get('Authorization');
  if (auth) forwardedHeaders['Authorization'] = auth;
  const contentType = request.headers.get('Content-Type');
  if (contentType) forwardedHeaders['Content-Type'] = contentType;

  const hasBody = request.method !== 'GET' && request.method !== 'HEAD';
  const body = hasBody ? await request.text() : undefined;

  try {
    const backendResponse = await fetch(backendUrl, {
      method: request.method,
      headers: forwardedHeaders,
      body,
    });

    const responseBody = await backendResponse.arrayBuffer();
    const responseHeaders = new Headers();
    const responseContentType = backendResponse.headers.get('Content-Type');
    if (responseContentType) responseHeaders.set('Content-Type', responseContentType);

    return new NextResponse(responseBody, {
      status: backendResponse.status,
      statusText: backendResponse.statusText,
      headers: responseHeaders,
    });
  } catch (err) {
    console.error('[proxy] Backend unreachable:', err);
    return NextResponse.json(
      { error: 'Backend service unavailable' },
      { status: 502 }
    );
  }
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
