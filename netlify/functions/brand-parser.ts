// netlify/functions/brand-parser.ts
export const handler = async (event: any) => {
  try {
    const API_KEY = process.env.VITE_GEMINI_API_KEY;
    const { urls } = JSON.parse(event.body || '{}');
    
    if (!urls || urls.length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "URL list cannot be empty" }),
        headers: { 'Access-Control-Allow-Origin': '*' }
      };
    }

    // Mock brand recognition (replace with real logic)
    const results = urls.map((url: string, i: number) => ({
      url: url,
      name: `Brand ${i + 1}`
    }));

    return {
      statusCode: 200,
      body: JSON.stringify(results),
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' }
    };
  } catch (e: any) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: e.message }),
      headers: { 'Access-Control-Allow-Origin': '*' }
    };
  }
};
