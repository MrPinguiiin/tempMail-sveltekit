import { json } from '@sveltejs/kit';
import { CF_API_TOKEN, CF_ZONE_ID } from '$env/static/private';

export async function GET() {
  const apxQuery = `
    query GetEmailLogs($zoneTag: string, $filter: EmailRoutingAdaptiveFilter_InputObject) {
      viewer {
        zones(filter: {zoneTag: $zoneTag}) {
          emailRoutingAdaptive(limit: 100, filter: $filter, orderBy: [datetime_DESC]) {
            datetime
            id: sessionId
            messageId
            from
            to
            subject
            status
            action
          }
        }
      }
    }
  `;

  const now = new Date();
  const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000); 

  const variables = {
    zoneTag: CF_ZONE_ID,
    filter: {
      datetime_geq: last24Hours.toISOString(), 
      datetime_leq: now.toISOString(),
    },
  };
  
  // --- BARIS DEBUG ---
  // Baris ini akan mencetak isi variabel ke terminal Anda
  console.log("Variabel yang dikirim ke API Cloudflare:", JSON.stringify(variables, null, 2));
  // --------------------

  try {
    const response = await fetch("https://api.cloudflare.com/client/v4/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${CF_API_TOKEN}`,
      },
      body: JSON.stringify({ query: apxQuery, variables }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Cloudflare API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();

    return json(data);

  } catch (error) {
    console.error("Error fetching from Cloudflare:", error);
    return json({ error: "Failed to fetch data from Cloudflare API." }, { status: 500 });
  }
}