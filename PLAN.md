# Deployment Finalization Plan

**Custom domain:** `yourdomain.com` *(replace with your real domain when adding in Vercel)*  
**Goal:** Polish → deploy to Vercel → attach custom domain → deliver final live URL.

---

## Phase 1: Analyze & Polish

| Step | Action | Command / Notes |
|------|--------|-----------------|
| 1.1 | Read codebase context | Done – Next.js 16, React 19, Supabase, tldraw canvas |
| 1.2 | Fix linter/TypeScript errors | `npm run lint` |
| 1.3 | Run local build | `npm run build` |
| 1.4 | Fix build errors | Iterate until clean |
| 1.5 | Optimize | Remove `console.log` from app/lib; keep in scripts/examples. Add error boundaries / loading if low-effort |
| 1.6 | Basic a11y | Check frontend (focus, labels, contrast) |

**Risks:** Build or lint may reveal type/lint issues; fix before push.

---

## Phase 2: Pre-deploy Checks

| Step | Action | Status |
|------|--------|--------|
| 2.1 | `.env.example` | ✅ Created; documents NEXT_PUBLIC_SUPABASE_URL, ANON_KEY |
| 2.2 | `.gitignore` | ✅ Has `.env*`, `node_modules`, `.vercel` |
| 2.3 | `vercel.json` | ✅ Added (framework: nextjs, buildCommand) |

---

## Phase 3: Deployment Execution

| Step | Action | Notes |
|------|--------|--------|
| 3.1 | Git remote | If none: user provides GitHub repo URL or create repo |
| 3.2 | Commit | `chore: pre-deployment polish & fixes` |
| 3.3 | Push | To `main` (or user’s branch) – only after successful local build |
| 3.4 | Vercel | vercel.com → New Project → Import Git repo → Deploy |
| 3.5 | Preview URL | Copy and show after deploy |
| 3.6 | Custom domain | Vercel → Settings → Domains → Add `yourdomain.com`; DNS: A @ → 76.76.21.21, CNAME www → cname.vercel-dns.com; wait 5–60 min |

---

## Phase 4: Verification & Handover

| Step | Action |
|------|--------|
| 4.1 | Visit deployed URL | User confirms or we check |
| 4.2 | If issues | Copy error → fix → redeploy |
| 4.3 | Handover | “Deployment complete. Live at https://yourdomain.com (pending DNS) / [preview URL]” |

---

## Commands Reference

```bash
npm run lint      # Lint
npm run build     # Production build (must pass before push)
npm run start     # Local prod preview
```

---

*Plan created by Deployment Finalizer agent. Execute phases in order.*
