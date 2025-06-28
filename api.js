addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)
  const params = url.searchParams
  
  try {
    // Alle Events abrufen
    if (params.get('all') === 'true') {
      const [velodrom, huxleys, maxschmeling] = await Promise.all([
        fetchData('velodrom'),
        fetchData('huxleys'),
        fetchData('maxschmeling')
      ])
      
      return jsonResponse({
        status: 'success',
        data: {
          velodrom,
          huxleys,
          maxschmeling
        },
        timestamp: new Date().toISOString()
      })
    }
    
    // Einzelne Location
    const location = params.get('location')
    if (location && ['velodrom', 'huxleys', 'maxschmeling'].includes(location)) {
      const data = await fetchData(location)
      return jsonResponse({
        status: 'success',
        data,
        timestamp: new Date().toISOString()
      })
    }
    
    // Metadaten
    if (params.get('meta') === 'true') {
      return jsonResponse({
        status: 'success',
        meta: {
          name: "Events API",
          version: "1.0",
          description: "Kostenlose Events API für Velodrom, Huxleys und Max-Schmeling",
          endpoints: [
            "/api.js?all=true",
            "/api.js?location=velodrom",
            "/api.js?location=huxleys",
            "/api.js?location=maxschmeling",
            "/api.js?meta=true"
          ]
        }
      })
    }
    
    // Standardantwort
    return jsonResponse({
      status: 'error',
      message: 'Ungültige Anfrage. Verfügbare Parameter: all, location, meta',
      usage: {
        all_events: "/api.js?all=true",
        single_location: "/api.js?location=velodrom",
        metadata: "/api.js?meta=true"
      }
    }, 400)
    
  } catch (error) {
    return jsonResponse({
      status: 'error',
      message: 'Serverfehler: ' + error.message
    }, 500)
  }
}

// Hilfsfunktionen
async function fetchData(location) {
  const response = await fetch(`https://raw.githubusercontent.com/nxtagi/events.api/main/data/${location}.json`)
  if (!response.ok) throw new Error(`Daten für ${location} nicht gefunden`)
  return await response.json()
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  })
}