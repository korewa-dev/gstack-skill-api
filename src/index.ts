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

const SKILLS: (SkillMeta & { category: string })[] = skillsData.map(s => ({ ...s, category: categorize(s.name) }));
const GITHUB_BASE = 'https://raw.githubusercontent.com/garrytan/gstack/main';

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders() });
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
      if (!skill) return new Response(JSON.stringify({ error: `Not found: ${name}` }), { status: 404, headers: { ...corsHeaders(), "Content-Type": "application/json" } });
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

    return new Response(generateHTML(), { headers: { ...corsHeaders(), "Content-Type": "text/html" } });
  },
};

function generateHTML() {
  const categories = [...new Set(SKILLS.map(s => s.category))].sort();
  const skillsHtml = SKILLS.map(s => `
    <div class="skill-card" data-cat="${s.category}">
      <div class="skill-name">/${s.name}</div>
      <div class="skill-desc">${s.description || 'No description'}</div>
      <div class="skill-meta">
        ${s.triggers?.length ? `<div class="triggers">Triggers: ${s.triggers.slice(0,5).join(', ')}</div>` : ''}
        ${s.allowedTools?.length ? `<div class="tools">Tools: ${s.allowedTools.join(', ')}</div>` : ''}
      </div>
    </div>
  `).join("");
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>GStack Skills API</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, sans-serif; background: #0d1117; color: #c9d1d9; padding: 2rem; }
    .container { max-width: 1100px; margin: 0 auto; }
    h1 { color: #58a6ff; }
    .subtitle { color: #8b949e; margin-bottom: 2rem; }
    .api-link { background: #161b22; border: 1px solid #30363d; padding: 1rem; border-radius: 8px; margin-bottom: 2rem; }
    .api-link code { color: #79c0ff; }
    .cat-nav { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 2rem; }
    .cat-btn { background: #161b22; border: 1px solid #30363d; color: #c9d1d9; padding: 0.5rem 1rem; border-radius: 20px; cursor: pointer; }
    .cat-btn:hover, .cat-btn.active { background: #1f6feb; }
    .search-box { width: 100%; padding: 0.75rem; background: #161b22; border: 1px solid #30363d; border-radius: 8px; color: #c9d1d9; margin-bottom: 2rem; }
    .skills-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1rem; }
    .skill-card { background: #161b22; border: 1px solid #30363d; padding: 1rem; border-radius: 8px; }
    .skill-card:hover { border-color: #58a6ff; }
    .skill-name { color: #58a6ff; font-weight: 600; }
    .skill-desc { color: #8b949e; font-size: 0.9rem; margin: 0.5rem 0; }
    .skill-meta { font-size: 0.75rem; color: #6e7681; }
    .triggers { color: #79c0ff; }
    .tools { color: #3fb950; }
    .hidden { display: none; }
  </style>
</head>
<body>
  <div class="container">
    <h1>GStack Skills API</h1>
    <p class="subtitle">${SKILLS.length} skills from Garry Tan's gstack</p>
    <input type="text" class="search-box" placeholder="Search..." onkeyup="search(this.value)">
    <div class="cat-nav">
      <button class="cat-btn active" onclick="filter('all')">ALL</button>
      ${categories.map(c => `<button class="cat-btn" onclick="filter('${c}')">${c.toUpperCase()}</button>`).join('')}
    </div>
    <div class="skills-grid">${skillsHtml}</div>
    <div class="api-link" style="margin-top:2rem">
      <p><strong>API:</strong></p>
      <ul style="padding-left: 1.5rem; margin-top: 0.5rem;">
        <li><code>GET /api/skills</code> — All skills</li>
        <li><code>GET /api/skills?category=plan</code> — Filter</li>
        <li><code>GET /api/skills?search=design</code> — Search</li>
        <li><code>GET /api/skills/:name</code> — Full content</li>
        <li><code>GET /api/categories</code> — Categories</li>
        <li><code>GET /api/search?q=keyword</code> — Full-text</li>
      </ul>
    </div>
  </div>
  <script>
    function filter(cat) {
      document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
      event.target.classList.add('active');
      document.querySelectorAll('.skill-card').forEach(c => c.classList.toggle('hidden', cat !== 'all' && c.dataset.cat !== cat));
    }
    function search(q) {
      const query = q.toLowerCase();
      document.querySelectorAll('.skill-card').forEach(c => {
        const name = c.querySelector('.skill-name').textContent.toLowerCase();
        const desc = c.querySelector('.skill-desc').textContent.toLowerCase();
        c.classList.toggle('hidden', !name.includes(query) && !desc.includes(query));
      });
    }
  </script>
</body>
</html>`;
}
