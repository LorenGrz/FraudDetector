# AGENTS.md

Single source of truth for humans and AI agents working on this repo. Moved here from CLAUDE.md on 2026-10-10 by `project-init`'s adopt mode - if this file and the code disagree, the code wins, fix this file.

## Documentation map (read this instead of the code)

1. `AGENTS.md` (this file) - map, how we work, workflow contract.
2. `.agents/CONTEXT.md` - current stack/architecture snapshot and repo facts.
3. `docs/plans/HANDOFF.md` - current state and how to resume, read first if work is mid-flight.
4. `docs/decisions/` - ADRs: why a non-trivial trade-off was decided the way it was.

# Contexto del proyecto

**FraudDetector**: detección de anomalías en transacciones bancarias, API
REST (Python/FastAPI) + dashboard web (HTML/CSS/JS con Bootstrap y Plotly).
No hay dataset etiquetado de "fraude confirmado" real → el enfoque es **ML no
supervisado**: tres modelos en paralelo detectan comportamientos alejados de
la norma sin depender de etiquetas previas.

## Cómo decide qué es sospechoso

- **Clientes** (`endpoints/anomalias_clientes.py`): Isolation Forest
  (contamination 5%) + LOF (20 vecinos) + K-Means (percentil 95 de distancia
  al centroide). Un cliente se marca sospechoso solo si **≥ 2 de los 3**
  modelos coinciden, más reglas de negocio (monto máximo > 5× el promedio del
  cliente, transacciones en menos de 60s entre sí).
- **Transacciones individuales** (`anomalias_transacciones.py`): Isolation
  Forest + LOF con score combinado 50/50.
- Los gráficos (`/anomalias/graficos/*`) devuelven HTML con Plotly que el
  frontend inyecta directo en el DOM.

## Stack

- Backend: FastAPI + SQLAlchemy (ORM) + SQLite + scikit-learn.
- Frontend: HTML/CSS/JS vanilla (sin framework), Bootstrap + Plotly.
- Dataset fuente: Wisabi Bank Dataset (Kaggle) — transacciones de un banco
  nigeriano. `procesar_datos.py` limpia los CSVs originales,
  `cargar_csvs.py` los carga a SQLite.
- Deploy: AWS Lambda vía imagen de contenedor (Mangum + FastAPI + SQLite +
  archivos estáticos servidos desde el mismo Lambda). Frontend también se
  publica en GitHub Pages.

## Última revisión

2026-09-04 — primera vez que se documenta en CLAUDE.md. De paso se agregó
`.aws-sam/` y `.vscode/` al `.gitignore` (quedaban sueltos en cada build de
SAM / apertura del editor).

## Workflow contract

These rules describe this repo's CURRENT reality, detected by `project-init`'s `adopt.sh` on 2026-10-10 - not an aspiration. If a row says "nothing (convention only)", that rule is not mechanically enforced today.

| Rule | Documented | Enforced by |
|---|---|---|
| Single branch flow - `master` is both base and release branch | this section | nothing (convention only) |
| No consistent branch naming convention observed | this section | nothing (convention only) |
| Direct commits to `master` observed (3 of last 10 commits, no PR/merge-commit flow for most of them) | this section | nothing (convention only) |
| ~70% of the last 10 commit subjects on `master` are Conventional Commits | this section | nothing (convention only) |
| CI: Deploy to GitHub Pages (deploy-pages.yml): push,workflow_dispatch | this section | nothing requires it to pass before merge |
| Repo allows: squash=true, merge-commit=true, rebase=true; delete-branch-on-merge=false | this section | GitHub repo settings (`gh repo view`) |

Changing any rule above: update this table and every enforcement point in the same change, and record it in `docs/decisions/`.

### Recommended (not enforced yet)
- Branch protection on `master` (required status checks, no force-push).


## Documentation rules

- Any decision with a real trade-off (architecture, a hard-to-reverse library/service choice, data model, security trade-off) gets a new ADR under the ADR directory above.
- When work pauses mid-flight, update `docs/plans/HANDOFF.md` before stopping, not after.
- A change that alters architecture, env vars, commands, or deploy updates `AGENTS.md` and `.agents/CONTEXT.md` in the same change.
- Changing any "Workflow contract" rule updates every enforcement point in the same change, per that section above.
