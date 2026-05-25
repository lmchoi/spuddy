# Workout Analysis Approach

## Direction

Focus on structured data analysis — the highest value and most accurate use case. Vision-based form analysis and free-form coaching are interesting but lower value for the effort.

## Two-layer architecture

**Layer 1 — Computed locally (no model):**
- PR detection
- Volume trends week-over-week
- Plateau detection (same weight/reps for N sessions)
- Muscle group frequency and balance

Deterministic queries over workout data. More accurate than a model for these cases, and free.

**Layer 2 — Model-synthesized narrative (cloud):**
Only for cross-signal synthesis that can't be expressed as a simple query — e.g. correlating training volume + logged energy/fatigue to suggest a deload. Triggered explicitly by the user, not automatically.

## Cost

Use Claude Haiku. Send only summarized signals to the model, not raw workout logs. At ~1000 tokens per analysis call, cost is roughly $0.001–0.002 per call — negligible until significant scale.

## What this means for design

The boundary between "computed insight" and "model-synthesized narrative" is a real architectural line. Worth an ADR when the analysis milestone is in scope.
