# GStack Skills API

Cloudflare Worker that serves Garry Tan's gstack AI coding skills as a REST API.

## Live API

- **Base URL:** https://gstack-skill-api.beerman.workers.dev
- **GitHub:** https://github.com/korewa-dev/gstack-skill-api

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/skills` | List all 37 skills (metadata) |
| `GET /api/skills?category=plan` | Filter by category |
| `GET /api/skills?search=design` | Search by name/desc/triggers |
| `GET /api/skills/:name` | Full markdown from GitHub |
| `GET /api/categories` | Category counts |
| `GET /api/search?q=keyword` | Full-text search |

## Categories

| Category | Count |
|----------|-------|
| plan | 9 |
| implement | 10 |
| ops | 7 |
| docs | 5 |
| other | 3 |
| qa | 2 |
| security | 1 |

## Features

- **37 skills** from gstack with full metadata
- **Triggers** - invocation keywords for each skill
- **Allowed tools** - what tools each skill can use
- **Full content** - fetch complete SKILL.md from GitHub
- **Search** - by name, description, or triggers
- **CORS** - works from any browser

## Deploy

```bash
wrangler deploy
```
