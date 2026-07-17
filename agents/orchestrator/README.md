# Orchestrator Agent

## Responsibility

Coordinate the complete job collection workflow.

## Input

- Schedule trigger

## Output

- Commands for downstream modules

## Modules Controlled

- Collector
- Validator
- Deduplicator
- Enrichment
- SEO
- Publisher

## Rules

- Never skip validation
- Retry failed modules
- Continue processing remaining jobs if one job fails
- Log every execution