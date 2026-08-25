interface SkillInfo {
  name: string;
  description: string;
  category: string;
}

const SKILLS: SkillInfo[] = [
  { name: "office-hours", description: "Start here. Reframes your product idea before you write code.", category: "plan" },
  { name: "plan-ceo-review", description: "CEO-level review: find the 10-star product in the request.", category: "plan" },
  { name: "plan-eng-review", description: "Lock architecture, data flow, edge cases, and tests.", category: "plan" },
  { name: "plan-design-review", description: "Rate each design dimension 0-10, explain what a 10 looks like.", category: "plan" },
  { name: "plan-devex-review", description: "DX-mode review: TTHW, magical moments, friction points, persona traces.", category: "plan" },
  { name: "plan-tune", description: "Self-tune AskUserQuestion sensitivity per question.", category: "plan" },
  { name: "autoplan", description: "One command runs CEO ? design ? eng ? DX review.", category: "plan" },
  { name: "design-consultation", description: "Build a complete design system from scratch.", category: "plan" },
  { name: "spec", description: "Turn vague intent into a precise, executable spec in five phases.", category: "plan" },
  { name: "review", description: "Pre-landing PR review. Finds bugs that pass CI but break in prod.", category: "implement" },
  { name: "codex", description: "Second opinion via OpenAI Codex. Review, challenge, or consult modes.", category: "implement" },
  { name: "investigate", description: "Systematic root-cause debugging. No fixes without investigation.", category: "implement" },
  { name: "design-review", description: "Live-site visual audit + fix loop with atomic commits.", category: "implement" },
  { name: "design-shotgun", description: "Generate multiple AI design variants, comparison board, iterate.", category: "implement" },
  { name: "design-html", description: "Generate production-quality Pretext-native HTML/CSS.", category: "implement" },
  { name: "devex-review", description: "Live developer experience audit (TTHW measured against the real flow).", category: "implement" },
  { name: "ship", description: "Ship your code with proper git workflow.", category: "implement" },
  { name: "land-and-deploy", description: "Land changes and deploy to production.", category: "implement" },
  { name: "canary", description: "Canary deployment with monitoring.", category: "implement" },
  { name: "benchmark", description: "Benchmark performance metrics.", category: "implement" },
  { name: "browse", description: "Fast headless browser for QA testing and site dogfooding.", category: "implement" },
  { name: "qa", description: "Run full QA cycle.", category: "qa" },
  { name: "qa-only", description: "QA without implementation.", category: "qa" },
  { name: "cso", description: "Chief Security Officer review.", category: "security" },
  { name: "guard", description: "Guardrail for safe AI-assisted work.", category: "security" },
  { name: "freeze", description: "Freeze changes temporarily.", category: "security" },
  { name: "unfreeze", description: "Unfreeze previously frozen changes.", category: "security" },
  { name: "document-release", description: "Document releases.", category: "docs" },
  { name: "document-generate", description: "Generate documentation.", category: "docs" },
  { name: "learn", description: "Learn and document new concepts.", category: "docs" },
  { name: "retro", description: "Run a retrospective.", category: "ops" },
  { name: "gstack-upgrade", description: "Upgrade gstack to latest version.", category: "ops" },
];

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

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders() });
    }

    if (url.pathname === "/api/skills" || url.pathname === "/api/skills.json") {
      const category = url.searchParams.get("category");
      const skills = category ? SKILLS.filter(s => s.category === category) : SKILLS;
      return new Response(JSON.stringify({ skills, count: skills.length }, null, 2), {
        headers: { ...corsHeaders(), "Content-Type": "application/json" },
      });
    }

    if (url.pathname === "/api/categories") {
      const categories = [...new Set(SKILLS.map(s => s.category))];
      return new Response(JSON.stringify({ categories }, null, 2), {
        headers: { ...corsHeaders(), "Content-Type": "application/json" },
      });
    }

    return new Response(generateHTML(), {
      headers: { ...corsHeaders(), "Content-Type": "text/html" },
    });
  },
};

function generateHTML() {
  const skillsHtml = SKILLS.map(s => `
    <div class="skill-card">
      <div class="skill-name">/${s.name}</div>
      <div class="skill-desc">${s.description}</div>
      <div class="skill-cat">${s.category}</div>
    </div>
  `).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GStack Skills API</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0d1117; color: #c9d1d9; padding: 2rem; }
    .container { max-width: 900px; margin: 0 auto; }
    h1 { color: #58a6ff; margin-bottom: 0.5rem; }
    .subtitle { color: #8b949e; margin-bottom: 2rem; }
    .api-link { background: #161b22; border: 1px solid #30363d; padding: 1rem; border-radius: 8px; margin-bottom: 2rem; }
    .api-link code { color: #79c0ff; }
    .skills-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem; }
    .skill-card { background: #161b22; border: 1px solid #30363d; padding: 1rem; border-radius: 8px; }
    .skill-name { color: #58a6ff; font-weight: 600; margin-bottom: 0.5rem; }
    .skill-desc { color: #8b949e; font-size: 0.9rem; margin-bottom: 0.5rem; }
    .skill-cat { font-size: 0.75rem; color: #6e7681; text-transform: uppercase; }
    .stats { color: #8b949e; margin-bottom: 1rem; }
  </style>
</head>
<body>
  <div class="container">
    <h1>?? GStack Skills API</h1>
    <p class="subtitle">Garry Tan's AI coding workflow skills, served via Cloudflare</p>
    <div class="api-link">
      <p><strong>API Endpoints:</strong></p>
      <ul style="margin-top: 0.5rem; padding-left: 1.5rem;">
        <li><code>GET /api/skills</code> - List all skills</li>
        <li><code>GET /api/skills?category=plan</code> - Filter by category</li>
        <li><code>GET /api/categories</code> - List categories</li>
      </ul>
    </div>
    <div class="stats">
      <p>?? ${SKILLS.length} skills across ${[...new Set(SKILLS.map(s => s.category))].length} categories</p>
    </div>
    <div class="skills-grid">
      ${skillsHtml}
    </div>
  </div>
</body>
</html>`;
}
