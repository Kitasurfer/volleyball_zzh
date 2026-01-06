import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const qdrantUrl = Deno.env.get('QDRANT_URL') || '';
    const qdrantKey = Deno.env.get('QDRANT_API_KEY') || '';
    const collection = Deno.env.get('QDRANT_COLLECTION') || 'content_vectors';

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // 1. Reset vector job for referee gestures
    const { data: updateData, error: updateError } = await supabase
      .from('vector_jobs')
      .update({ 
        status: 'pending', 
        error: null, 
        started_at: null, 
        completed_at: null,
        updated_at: new Date().toISOString()
      })
      .eq('content_id', 'a1b2c3d4-e5f6-4a5b-bc6d-7e8f9a0b1c2d')
      .select();

    // 2. Check vector jobs status
    const { data: recentJobs, error: jobsError } = await supabase
      .from('vector_jobs')
      .select('id, content_id, status, error, updated_at')
      .order('updated_at', { ascending: false })
      .limit(5);

    // 3. Systematic Qdrant Scan
    const clusterId = 'f1aa8cca-cede-4a92-ad87-7b2a3d837696';
    const keys = [
      qdrantKey,
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIn0.xYn-tKa27SHNMIYMdfCzd5tItuZTneoocPMjU7NXk5A' // Variant 2 from docs
    ];
    
    const regions = [
      'europe-west3-0.gcp',
      'eu-west-1',
      'us-east-1',
      'europe-west1.gcp',
      'us-central1.gcp'
    ];

    const probeResults = [];
    const targets = [];

    // Add current env and variations
    if (qdrantUrl) {
      const cleanBase = qdrantUrl.replace(/\/$/, '');
      targets.push(`${cleanBase}/health`);
      targets.push(`${cleanBase}/v1/collections`);
    }

    for (const region of regions) {
      const base = `https://${clusterId}.${region}.cloud.qdrant.io`;
      targets.push(`${base}/health`);
      targets.push(`${base}/v1/collections`);
      targets.push(`${base}:6333/health`);
    }

    for (const url of [...new Set(targets)]) {
      for (const key of [...new Set(keys)]) {
        if (!key) continue;
        try {
          const start = Date.now();
          const resp = await fetch(url, {
            headers: { 'api-key': key },
            signal: AbortSignal.timeout(1500)
          });
          const duration = Date.now() - start;
          const text = await resp.text().catch(() => "N/A");
          if (resp.status !== 404 || targets.length < 20) { // Log all if few, or only interesting ones
            probeResults.push({
              url,
              key: key.substring(key.length - 8),
              status: resp.status,
              ok: resp.ok,
              duration,
              response: text.substring(0, 50)
            });
          }
        } catch (e) {
          // Only log errors that aren't simple timeouts or DNS
          if (!String(e).includes('timeout') && !String(e).includes('dns')) {
             probeResults.push({ url, key: key.substring(key.length - 8), error: String(e) });
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        resetResult: { data: updateData, error: updateError },
        recentJobs,
        probeResults,
        secrets: {
          qdrantUrl: qdrantUrl ? (qdrantUrl.substring(0, 15) + "...") : "MISSING",
          qdrantKey: qdrantKey ? (qdrantKey.substring(0, 10) + "..." + qdrantKey.substring(qdrantKey.length - 5)) : "MISSING",
          collection
        }
      }, null, 2),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
