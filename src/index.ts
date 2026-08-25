import skillsData from './skills-data.json' assert { type: 'json' };

interface SkillMeta {
  name: string;
  description: string;
  version?: string;
  preambleTier?: string;
  triggers?: string[];
  allowedTools?: string[];
  path: string;
}

const CATEGORIES: Record<string, string[]> = {
  plan: ['office-hours', 'plan-ceo-review', 'plan-eng-review', 'plan-design-review', 'plan-devex-review', 'plan-tune', 'autoplan', 'design-consultation', 'spec'],
  implement: ['review', 'codex', 'investigate', 'design-review', 'design-shotgun', 'design-html', 'devex-review', 'ship', 'land-and-deploy', 'canary', 'benchmark', 'browse', 'diagram', 'make-pdf', 'skillify', 'scrape'],
  qa: ['qa', 'qa-only', 'ios-qa', 'ios-clean', 'ios-fix', 'ios-design-review', 'ios-sync'],
  security: ['cso', 'guard', 'freeze', 'unfreeze', 'careful'],
  docs: ['document-release', 'document-generate', 'learn', 'health', 'retro'],
  ops: ['gstack-upgrade', 'gstack', 'openclaw', 'open-gstack-browser', 'pair-agent', 'patches', 'sync-gbrain', 'setup-gbrain', 'context-save', 'context-restore', 'supabase', 'setup-deploy', 'setup-browser-cookies'],
};

function categorize(name: string): string {
  for (const [cat, skills] of Object.entries(CATEGORIES)) {
    if (skills.includes(name)) return cat;
  }
  return 'other';
}

const SKILLS: (SkillMeta & { category: string })[] = skillsData.map(s => ({ ...s, category: categorize(s.name) })).filter(s => s.name);
const GITHUB_BASE = 'https://raw.githubusercontent.com/garrytan/gstack/main';

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

function authenticate(request: Request, apiKey: string): { authenticated: boolean; error?: string } {
  const auth = request.headers.get("Authorization");
  if (!auth) return { authenticated: false, error: "Missing Authorization header" };
  if (auth === `Bearer ${apiKey}` || auth === `Basic ${btoa(apiKey)}`) {
    return { authenticated: true };
  }
  return { authenticated: false, error: "Invalid API key" };
}

export default {
  async fetch(request: Request, env: { GSTACK_API_KEY: string }): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const apiKey = env.GSTACK_API_KEY;

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders() });
    }

    // Public endpoints
    if (path === "/" || path === "/index.html") {
      return new Response(generateHTML(), { headers: { ...corsHeaders(), "Content-Type": "text/html" } });
    }

    // Auth required for API
    const authResult = authenticate(request, apiKey);
    if (!authResult.authenticated) {
      return new Response(JSON.stringify({ error: authResult.error, requiresAuth: true }), {
        status: 401,
        headers: { ...corsHeaders(), "Content-Type": "application/json" },
      });
    }

    if (path === "/api/skills" || path === "/api/skills.json") {
      const category = url.searchParams.get("category");
      const search = url.searchParams.get("search");
      let skills = category ? SKILLS.filter(s => s.category === category) : SKILLS;
      if (search) {
        const q = search.toLowerCase();
        skills = skills.filter(s => 
          s.name.toLowerCase().includes(q) || 
          (s.description && s.description.toLowerCase().includes(q)) ||
          (s.triggers && s.triggers.some(t => t.toLowerCase().includes(q)))
        );
      }
      const result = skills.map(({ path: _p, ...rest }) => rest);
      return new Response(JSON.stringify({ skills: result, count: result.length, total: SKILLS.length }, null, 2), {
        headers: { ...corsHeaders(), "Content-Type": "application/json" },
      });
    }

    if (path.startsWith("/api/skills/")) {
      const name = decodeURIComponent(path.replace("/api/skills/", ""));
      const skill = SKILLS.find(s => s.name === name);
      if (!skill) return new Response(JSON.stringify({ error: `Skill "${name}" not found` }), { status: 404, headers: { ...corsHeaders(), "Content-Type": "application/json" } });
      try {
        const resp = await fetch(`${GITHUB_BASE}/${skill.path}/SKILL.md`);
        const body = await resp.text();
        return new Response(JSON.stringify({ name, path: skill.path, category: skill.category, description: skill.description, triggers: skill.triggers, allowedTools: skill.allowedTools, body, bodyLength: body.length }, null, 2), {
          headers: { ...corsHeaders(), "Content-Type": "application/json" },
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: "Fetch failed", name }), { status: 502, headers: { ...corsHeaders(), "Content-Type": "application/json" } });
      }
    }

    if (path === "/api/categories") {
      const cats = [...new Set(SKILLS.map(s => s.category))].sort();
      const counts = cats.map(c => ({ category: c, count: SKILLS.filter(s => s.category === c).length }));
      return new Response(JSON.stringify({ categories: counts }, null, 2), {
        headers: { ...corsHeaders(), "Content-Type": "application/json" },
      });
    }

    if (path === "/api/search") {
      const q = url.searchParams.get("q");
      if (!q) return new Response(JSON.stringify({ error: "Missing q" }), { status: 400, headers: { ...corsHeaders(), "Content-Type": "application/json" } });
      const query = q.toLowerCase();
      const results = SKILLS.filter(s => 
        s.name.toLowerCase().includes(query) || 
        (s.description && s.description.toLowerCase().includes(query)) ||
        (s.triggers && s.triggers.some(t => t.toLowerCase().includes(query)))
      );
      return new Response(JSON.stringify({ query, results, count: results.length }, null, 2), {
        headers: { ...corsHeaders(), "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Not found" }), { status: 404, headers: { ...corsHeaders(), "Content-Type": "application/json" } });
  },
};

function generateHTML() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GStack Skills — Auth Required</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, sans-serif; background: #0d1117; color: #c9d1d9; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
    .container { text-align: center; padding: 2rem; }
    h1 { color: #58a6ff; margin-bottom: 1rem; }
    p { color: #8b949e; margin-bottom: 2rem; }
    .api-key { background: #161b22; border: 1px solid #30363d; padding: 1rem; border-radius: 8px; font-family: monospace; color: #79c0ff; word-break: break-all; }
  </style>
</head>
<body>
  <div class="container">
    <h1>GStack Skills API</h1>
    <p>This API requires authentication. Provide your API key via the Authorization header:</p>
    <div class="api-key">Authorization: Bearer &lt;your-api-key&gt;</div>
  </div>
</body>
</html>`;
}