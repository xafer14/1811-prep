# Git workflow

Owner: tuna.

- Remote: `origin` = https://github.com/xafer14/1811-prep.git (private). It already exists; nothing has been pushed. No push without the owner's go.
- Git hooks (lefthook): pre-commit runs gitleaks on staged files, a Prettier check and `check-ssot`; pre-push runs `npm run verify`.
- Trunk-based. `main` is the only long-lived branch.
- Branch names: `feat/<slug>`, `fix/<slug>`, `docs/<slug>`, `chore/<slug>`.
- Commits: small and logical; Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`, `test:`, `refactor:`, `ci:`); English; imperative mood.
- Before every commit: `npm run verify` is green.
- PRs into `main` use `.github/pull_request_template.md`: summary, risk, test evidence, docs updated.
- Review: owner approves every PR; sinan and pelin review non-trivial changes first.
- Agents never push, merge, force-push, rebase shared history, create remotes, or open PRs without the owner's explicit go in chat.
- Line endings are normalized by `.gitattributes`; no symlinks.
