addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function fetchData(location) {
  const response = await fetch(`https://raw.githubusercontent.com/nxtagi/nxtevent/main/data/${location}.json`)
  if (!response.ok) throw new Error(`Data for ${location} not found`)
  return await response.json()
}

function jsonResponse(data, status = 200, headers) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      ...headers,
      'Cache-Control': 'public, max-age=3600'
    }
  })
}

async function handleRequest(request) {
  const url = new URL(request.url)
  const params = url.searchParams
  const allowedOrigins = [
    "https://scriptable.app",
    "https://*.scriptable.app",
    "https://nxtagi.github.io"
  ];
  
  const securityHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'",
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Permissions-Policy': "geolocation=(), microphone=(), camera=()",
    'Referrer-Policy': 'no-referrer',
    'X-Robots-Tag': 'noindex'
  };

  const origin = request.headers.get('Origin');
  if (origin && allowedOrigins.some(o => {
    if (o.includes('*')) {
      const domain = o.replace('https://', '').replace('*.', '')
      return origin.endsWith(domain)
    }
    return origin === o
  })) {
    securityHeaders['Access-Control-Allow-Origin'] = origin;
  }

  try {
    if (request.method !== 'GET') {
      return jsonResponse({
        status: 'error',
        message: 'Method not allowed'
      }, 405, securityHeaders);
    }

    if (params.get('all') === 'true') {
      const [hux, max, vel, wuh] = await Promise.all([
        fetchData('hux'),
        fetchData('max'),
        fetchData('vel'),
        fetchData('wuh')
      ])
      
      return jsonResponse({
        status: 'success',
        data: {
          hux,
          max,
          vel,
          wuh
        },
        timestamp: new Date().toISOString()
      }, 200, securityHeaders)
    }
    
    const location = params.get('location')
    if (location && ['hux', 'max', 'vel', 'wuh'].includes(location)) {
      const data = await fetchData(location)
      return jsonResponse({
        status: 'success',
        data,
        timestamp: new Date().toISOString()
      }, 200, securityHeaders)
    }
    
    if (params.get('meta') === 'true') {
      return jsonResponse({
        status: 'success',
        meta: {
          name: "NXT Event API",
          version: "1.0.0",
          description: "NXT Event API",
          endpoints: [
            "/api.js?all=true",
            "/api.js?location=hux",
            "/api.js?location=max",
            "/api.js?location=vel",
            "/api.js?location=wuh",
            "/api.js?meta=true"
          ]
        }
      }, 200, securityHeaders)
    }
    
    return jsonResponse({
      status: 'error',
      message: 'Invalid request. Available parameters: all, location, meta',
      usage: {
        all_events: "/api.js?all=true",
        single_location: "/api.js?location=hux",
        metadata: "/api.js?meta=true"
      }
    }, 400, securityHeaders)
    
  } catch (error) {
    return jsonResponse({
      status: 'error',
      message: 'Internal server error: ' + error.message
    }, 500, securityHeaders)
  }
}