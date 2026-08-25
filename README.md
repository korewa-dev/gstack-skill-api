# GStack Skills API

Cloudflare Worker that serves Garry Tan's gstack AI coding skills as a REST API.

## Live API

- **Base URL:** https://gstack-skill-api.beerman.workers.dev
- **Skills:** https://gstack-skill-api.beerman.workers.dev/api/skills
- **Categories:** https://gstack-skill-api.beerman.workers.dev/api/categories

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/skills` | List all 32 skills |
| `GET /api/skills?category=plan` | Filter by category |
| `GET /api/categories` | List all categories |

## Deploy

```bash
wrangler deploy
```

## Categories

- `plan` - Planning and architecture reviews
- `implement` - Implementation and code quality
- `qa` - Quality assurance
- `security` - Security checks
- `docs` - Documentation
- `ops` - Operations
