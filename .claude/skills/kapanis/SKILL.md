---
name: kapanis
description: Session close. Records the owner's rulings from this chat into the owning persona cards and docs, removes lines this chat made stale, and proposes guards for repeatable mistakes. Run only when the owner invokes /kapanis.
disable-model-invocation: true
---

# /kapanis: session close

Owner instruction (verbatim, kept in Turkish on purpose):

> Bu chatte verdiğim hükümleri (beğendim / reddettim / ‘böyle olsun’) kendi cümlelerimle ilgili persona’nın kural dosyasına yaz, nedeniyle birlikte. Bir hüküm tekrar edebilecek bir hataysa, guard’a ya da teste dönüşebilir mi söyle. Bu chatte eskiyen satırları güncelle ya da sil. Kodun zaten gösterdiği şeyi yazma. Yoksa ‘yok’ de.

## Procedure
1. Scope is THIS chat only. Do not mine older sessions.
2. Each owner ruling goes under `## Owner rulings` of the owning persona card in `.claude/agents/<name>.md`, in the owner's own short words, with date (YYYY-MM-DD) and reason. Cross-persona rulings go to `aras`. A project fact goes to its owner file from `docs/ssot-map.md`, never duplicated in a card.
3. For a repeatable mistake, say concretely whether a guard is possible (hook, lint rule, test, CI check) and record the lesson in `docs/lessons/<area>.md` with `guard: proposed`. Build nothing without the owner's go.
4. Update or delete lines this chat made stale, including lessons and research notes (mark changed values "(superseded YYYY-MM-DD)" with a pointer to the owner file).
5. Never write what the code already shows.
6. If there is nothing to write, answer "yok".
7. List any new capability proposals (docs/proposals/).
8. Allowed edits: persona `## Owner rulings` sections, `docs/lessons/`, `docs/research/`, owner docs from the ssot-map. Never code or config. Never commit.
9. Run `node scripts/check-ssot.mjs` at the end and fix what it reports within the allowed edits.
10. Final report in Turkish, short: yazılanlar / silinenler / guard önerileri.
