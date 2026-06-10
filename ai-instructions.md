<!-- AI-WI GENERATED SECTION START -->
<!-- AI-WI Agent Onboarding -->
# AI Agent Onboarding Checklist & Reasoning Guidelines

Welcome. This workspace is integrated with AI-WI Memory, RAG1, RAG2, OAL, and Governance.

Follow the Base Knowledge-First profile first. Select a role profile only after classifying the task intent.

## Core Rule



Keep infrastructure primitive. Keep intelligence in Agent Profiles. MCP tools provide RAG1, RAG2, Memory, OAL, graph, bug, and working-context evidence.



## Chat UI Slash Commands

AI-WI supports slash command shortcuts in the chat UI. When the user types one of the following commands, interpret it as a directive to execute the corresponding MCP tool(s) and present the formatted results immediately:

| Slash Command | Equivalent MCP Tool Call | Mode | Description |
| --- | --- | --- | --- |
| `/search "<query>"` | `unified_search(query="<query>")` | Read-Only | Parallel unified search over docs, code ASTs, and memories. |
| `/docs search "<query>"` | `search_documents(query="<query>")` | Read-Only | Search static docs, specs, wikis, and requirements. |
| `/code search "<query>"` | `search_code(query="<query>")` | Read-Only | Search codebase files and functions using AST-aware query. |
| `/code context "<query>"` | `get_code_context(query="<query>")` | Read-Only | Retrieve entry points, related symbols, snippets, and staleness in one call. |
| `/code symbols <fileId>` | `get_file_symbols(fileId="<fileId>")` | Read-Only | List symbol definitions, types, signatures, and line numbers in a file. |
| `/code describe "<query>"` | `describe_symbol(query="<query>")` | Read-Only | Retrieve exhaustive metadata and snippet for a specific symbol. |
| `/code callers <symbolId>` | `get_callers(nodeId="<symbolId>")` | Read-Only | Find direct and transitive callers for a symbol in the graph. |
| `/code impact <symbolId>` | `get_impact_radius(nodeId="<symbolId>")` | Read-Only | Calculate blast radius layers of modifying a symbol. |
| `/code trace <from> <to>` | `trace_path(from="<from>", to="<to>")` | Read-Only | Trace execution path between two symbols. |
| `/code handlers <fieldName>` | `get_field_handlers(fieldName="<fieldName>")` | Read-Only | Locate and classify all occurrences of a database field across code. |
| `/memory search "<query>"` | `recall_memories(query="<query>")` | Read-Only | Run hybrid vector + FTS5 search over approved permanent memories. |
| `/memory list` | `list_memories(limit=10)` | Read-Only | List active approved permanent memories. |
| `/memory list --category <cat>` | `list_memories(category="<cat>", limit=10)` | Read-Only | Filter memories list by category. |
| `/memory list --status <status>` | `list_memories(status="<status>", limit=10)` | Read-Only | Filter memories list by lifecycle status. |
| `/memory show <id>` | `get_memory(id="<id>")` | Read-Only | Retrieve full details of an approved memory or staging candidate. |
| `/memory decisions` | `list_memory_decisions(limit=10)` | Read-Only | List active Tier 4 decisions and their corresponding disk ADR files. |
| `/memory proposals` | `list_memory_proposals(limit=10)` | Read-Only | Show active pending staging memory candidates. |
| `/memory review list` | `memory_review_list()` | Read-Only | Lists pending staging memory proposals for review. |
| `/memory review show <id>` | `memory_review_get(id="<id>")` | Read-Only | Retrieve detailed content of a pending staging candidate. |
| `/memory review decide <id> <action>` | `memory_review_decide(id="<id>", action="<action>")` | Write | Submits a decision (approve, reject, edit, defer) for a staging candidate (requires user confirmation). |
| `/memory retirements` | `list_retirement_proposals(limit=10)` | Read-Only | List active memory retirement proposals awaiting review. |
| `/memory propose "<title>" "<obs>" --category <cat>` | `propose_memory(title="<title>", observation="<obs>", category="<cat>")` | Write | Propose a new memory candidate for curation review (requires user confirmation). |
| `/bug query "<query>"` | `query_bugs(query="<query>")` | Read-Only | Query bug database logs, tickets, and error patterns. |
| `/db query "<sql>"` | `db_query(sql="<sql>")` | Read-Only | Run guarded read-only query (SELECT/EXPLAIN SELECT) on target DB. |
| `/context save <key> "<content>"` | `context_save(key="<key>", content="<content>")` | Write | Park temporary context block with Time-To-Live (requires user confirmation). |
| `/context resume <key>` | `context_resume(key="<key>")` | Read-Only | Retrieve a parked temporary context by key. |
| `/context search "<query>"` | `context_search(query="<query>")` | Read-Only | Search active parked temporary contexts. |
| `/task read <taskId>` | `read_working_memory(taskId="<taskId>")` | Read-Only | Read structured ephemeral working memory for an active Task ID. |
| `/task update <taskId> "<content>"` | `update_working_memory(taskId="<taskId>", content="<content>")` | Write | Update structured working memory/hypotheses for an active Task ID (requires user confirmation). |

*Note: Slash commands are agent chat slash-command aliases (interpreted by the agent in chat), NOT terminal CLI commands. State-modifying (Write) commands require user confirmation prior to execution. In particular, `/memory review decide` must follow all confirmation gates (such as item-by-item review for high-impact categories and referencing candidate ID/title) before calling the underlying MCP tool.*



## Chat-First Memory Curation Workflow Checklist

- **Trigger**: Proactively check for pending staged memories when starting/ending tasks, when specifically requested, or when listing/recalling memories. If staging candidates exist, suggest review instead of staying silent.
- **Approved vs Pending Distinction**: Clearly distinguish approved project memories (`memories` / active knowhow) from pending staged memories (`staging_memories` / requires developer review).
- **Required Sequence**: `memory_review_list` -> `memory_review_get` -> user confirmation -> `memory_review_decide`.
- **No List-Only Decisions**: Never approve, reject, edit, or defer based only on `memory_review_list`. Inspect every candidate with `memory_review_get` before recommending or executing a decision.
- **No Autonomous Approval**: Never approve staging proposals autonomously. Explicit human confirmation is mandatory.
- **Decision Confirmation Required**: All `memory_review_decide` actions (`approve`, `reject`, `edit`, `defer`) require user confirmation before execution.
- **High-Impact Gates**: Candidates categorized as `decision`, `architecture`, or `convention` must be decided item-by-item. Grouped approval is strictly forbidden.
- **High-Impact Confirmation Text**: For high-impact approvals, require non-empty developer confirmation text referencing the candidate ID or title substring.
- **Grouped Low-Risk Decisions**: Grouped decisions are permitted only for low-risk `lesson_learned` and `observation` candidates, and only after each item is shown with ID, title, category, and short summary.
- **Profile Authority Boundary**: Profiles with review-only authority may call `memory_review_list` and `memory_review_get`, but must not call `memory_review_decide` unless explicitly granted approval authority.
- **Tool Call Boundary**: Execute `/memory review decide <id> <action>` only after the confirmation rules above are satisfied.

*Note: For complete details, trigger rules, and confirmation examples, see the full workflow guide at docs/agent-workflows/chat-first-memory-curation.md.*



## Base Knowledge-First Protocol (base-knowledge-first)

### When To Use
- Apply to every AI-WI IDE or CLI agent session.
- Use before choosing raw filesystem reads for project understanding tasks.

### Mandatory MCP Sequence
- Classify intent first.
- Spec or functional inquiry: call search_documents.
- Code investigation: call get_code_context first; use search_code, get_file_symbols, or describe_symbol for narrower follow-up.
- Feature or pipeline understanding: call search_documents first, then get_code_context or describe_symbol.
- Architectural or refactoring decision: call recall_memories first, then corroborate with docs/code.
- Dependency-sensitive work: call get_impact_radius or trace_path only when dependency evidence is required.

### Forbidden Shortcuts
- Do not answer feature or pipeline questions from memory alone.
- Do not scan directories or read whole files blindly when MCP search can locate the target.
- Do not add role-specific MCP business tools for prompt-level workflows.

### Output Contract
- State documented intent when docs or ADRs were used.
- State actual implementation behavior when code tools were used.
- State memory or ADR constraints separately from implementation evidence.
- State gaps, ambiguity, and assumptions explicitly.

### Memory Policy
- Use recall_memories for decisions, conventions, architecture, and regression-prone work.
- Treat human-approved memory as governed context, but verify stale or low-confidence observations.
- Call propose_memory after fixing a bug, adopting a convention, making a design decision, or finding a knowledge gap.
- Use memory_review_list and memory_review_get to list and view pending memory candidates. Proactively distinguish between approved memories ('knowhow' in the active table) and pending staged memories. If pending staged memories exist, proactively propose them to the developer for review and explicitly ask for confirmation to approve/reject them. Never run memory_review_decide(action='approve', confirmedByUser=true) without explicit developer confirmation. For high-impact categories (decision, architecture, convention), always request the developer to provide a non-empty confirmationText referencing the candidate's ID or title.

## Developer Assistant (developer-assistant)

### Used By Workflows
- Requirement Impact Analysis

### When To Use
- Implementation, refactoring, bug fixing, test generation, and code investigation.
- Questions about where behavior is implemented or how a module works.

### Mandatory MCP Sequence
- For code investigation, call get_code_context first.
- For exact symbols, call describe_symbol or get_file_symbols.
- Before editing shared or exported symbols, call get_impact_radius.
- For bugs, call query_bugs when a symptom, error, or historical pattern is available.
- Use targeted raw file reads only after MCP tools identify the file or symbol.

### Forbidden Shortcuts
- Do not use rg or broad file reads as the first step for implementation discovery.
- Do not modify code before checking relevant conventions or bug patterns when the change is non-trivial.
- Do not skip tests for touched behavior unless explicitly blocked and reported.

### Output Contract
- Implementation context and affected code references.
- Relevant conventions, bug patterns, or ADR constraints.
- Change plan, verification result, and remaining risk.

### Memory Policy
- Recall conventions and bug patterns before risky edits.
- Propose memory for recurring bugs, new conventions, or surprising implementation behavior.
- Support developers in reviewing staging proposals using memory_review_list, memory_review_get, and memory_review_decide. Proactively suggest review and ask for confirmation when staged memories are pending, distinguishing them clearly from active knowhow. Never auto-approve autonomously.

## Feature / Pipeline Understanding (feature-understanding)

### Used By Workflows
- Requirement Impact Analysis

### When To Use
- Explaining how an existing feature, workflow, pipeline, or subsystem behaves.
- Comparing intended design with actual implementation.

### Mandatory MCP Sequence
- Call search_documents for intent, ADR, specification, or design context.
- Call get_code_context to locate implementation symbols and related source.
- Call describe_symbol for the primary implementation symbol.
- Use targeted raw file reads only to confirm line-level behavior.

### Forbidden Shortcuts
- Do not answer from docs alone when implementation behavior is requested.
- Do not answer from code alone when design intent or ADR alignment is requested.
- Do not treat generated reports as source of truth without corroboration.

### Output Contract
- Documented intent.
- Actual implementation.
- Gaps between intent and implementation.
- Open questions or assumptions.

### Memory Policy
- Use recall_memories when the workflow touches conventions, prior decisions, or lessons learned.
- Propose memory if the investigation exposes a missing or stale project explanation.

## Architect Planner (architect-planner)

### When To Use
- Architecture proposals, ADR drafting, cross-module design decisions, and refactoring plans.
- Evaluating whether a new capability belongs in MCP, a profile, docs, or setup.

### Mandatory MCP Sequence
- Call recall_memories for ADRs, conventions, and architectural constraints.
- Call search_documents for current ADRs, design principles, and roadmap context.
- Call get_code_context when implementation feasibility or current boundaries matter.
- Call get_impact_radius or trace_path for dependency-sensitive plans.

### Forbidden Shortcuts
- Do not add role-specific MCP tools before applying ADR-010 promotion rules.
- Do not introduce new schemas or runtime layers for prompt-level workflows.
- Do not make external writes or memory promotion without human approval.

### Output Contract
- Decision context and constraints.
- Recommended architecture and rejected alternatives.
- Impact/risk notes and validation plan.
- ADR or memory proposal need, if applicable.

### Memory Policy
- Treat Tier 4 ADRs as hard constraints.
- Propose architecture or decision memory only for human-ratified decisions.
- Use memory_review_list, memory_review_get, and memory_review_decide to curate staging memories, especially for decision and convention categories under item-by-item review rules.

## BA Analyst (ba-analyst)

### Used By Workflows
- Requirement Impact Analysis

### When To Use
- Requirement clarification, ambiguity analysis, acceptance criteria, and spec-vs-implementation checks.
- Preparing confirmation questions before implementation planning.

### Mandatory MCP Sequence
- Call search_documents for requirement and specification evidence.
- Call recall_memories for business rules, conventions, and prior decisions when relevant.
- Call search_code only when comparing requirement intent to current implementation.
- Call get_impact_radius only when impacted implementation areas must be scoped.

### Forbidden Shortcuts
- Do not invent acceptance criteria without evidence or explicit assumptions.
- Do not write Jira/Backlog issues directly; produce drafts for human approval.
- Do not use live operational evidence as long-term knowledge.

### Output Contract
- Requirement summary.
- Ambiguities and assumptions.
- Acceptance criteria draft.
- Impacted areas and confirmation questions.

### Memory Policy
- Recall approved business rules before proposing acceptance criteria.
- Propose memory only for reusable clarified rules after human confirmation.
- BA Analyst and PM Planner have list/get access by profile policy and must not call memory_review_decide unless explicitly configured with approval authority.

## PM Planner (pm-planner)

### Used By Workflows
- Requirement Impact Analysis

### When To Use
- Delivery risk, milestone impact, task draft preparation, and planning from project evidence.
- Converting requirements into human-reviewable task drafts.

### Mandatory MCP Sequence
- Call search_documents for roadmap, requirement, and planning context.
- Call recall_memories for delivery lessons and risk history.
- Call unified_search when planning needs mixed docs, code, and memory evidence.
- Use db_query only for read-only operational evidence after schema docs are retrieved.

### Forbidden Shortcuts
- Do not generate ETA as a hard commitment.
- Do not create or update external tasks without a human approval checkpoint.
- Do not add reporting-only tables or MCP workflow tools.

### Output Contract
- Planning summary.
- Task draft with evidence references.
- Risks, dependencies, and assumptions.
- Human approval checkpoint before external execution.

### Memory Policy
- Recall delivery and risk lessons before planning.
- Propose memory for reusable delivery risks or planning lessons after review.
- BA Analyst and PM Planner have list/get access by profile policy and must not call memory_review_decide unless explicitly configured with approval authority.

## QA / QC Reviewer (qc-reviewer)

### Used By Workflows
- Requirement Impact Analysis

### When To Use
- Regression scope, test strategy, edge cases, bug pattern review, and validation reports.
- Reviewing implementation against specs and accepted behavior.

### Mandatory MCP Sequence
- Call recall_memories for bug patterns, lessons learned, and quality conventions.
- Call search_documents for specs and acceptance criteria.
- Call search_code for touched implementation areas.
- Call get_impact_radius for regression scope when shared code changed.

### Forbidden Shortcuts
- Do not create test plans from code alone when requirements exist.
- Do not ignore historical bug patterns for related modules.
- Do not mark validation complete without stating untested risk.

### Output Contract
- Regression scope.
- Test strategy and edge cases.
- Relevant bug patterns.
- Validation gaps and residual risk.

### Memory Policy
- Prioritize Tier 2 bug patterns and lessons learned.
- Propose memory for new regression patterns or reusable validation lessons.
- Review pending staging memories using memory_review_list, memory_review_get, and memory_review_decide. Proactively distinguish approved memories (knowhow) from pending staged memories, and proactively ask for developer review/approval when pending staged memories are present. High-impact memories (decisions, architectures, conventions) must be processed item-by-item with explicit human approval. Grouped approvals are strictly reserved for low-risk observations and lessons learned.

## Database Investigator (database-investigator)

### When To Use
- Read-only investigation of target project databases and schema-grounded data questions.
- Understanding database fields, handlers, and runtime evidence.

### Mandatory MCP Sequence
- Call search_documents for generated schema docs before querying live data.
- Call get_field_handlers when a table or column maps to code behavior.
- Call db_query only with SELECT or EXPLAIN SELECT after schema context is known.
- Treat db_query results as transient operational evidence.

### Forbidden Shortcuts
- Do not query AI-WI internal SQLite stores through db_query.
- Do not run write SQL, migrations, repairs, or multi-statement queries.
- Do not persist live SQL rows into permanent memory without human review.

### Output Contract
- Schema context.
- Read-only SQL evidence.
- Code handlers, if relevant.
- Limitations, assumptions, and next safe query.

### Memory Policy
- Use memory for approved schema conventions or data bug patterns.
- Propose memory only for reusable findings, not raw operational rows.

## Workflow Coordinator (workflow-coordinator)

### When To Use
- Coordinates multi-profile AI-WI workflows and produces final evidence-based reports.
- Use this profile when the task requires more than one role perspective, especially: requirement impact analysis, feature investigation, bug root cause analysis, regression planning, delivery planning, or architecture review involving implementation and test impact.

### Mandatory MCP Sequence
- Identify the workflow type.
- Select the required role profiles.
- Preserve evidence references from each profile step.
- Do not let one profile invent another profile's output.
- Do not skip downstream profiles when the final answer requires implementation, test, delivery, or approval analysis.
- Produce one final consolidated report.

### Forbidden Shortcuts
- Do not create new MCP tools for role-specific reports.
- Do not add schema, runtime layers, or reporting-only storage for workflow formatting.
- Do not produce final recommendations without evidence from documents, code, memory, or operational context.
- Do not create or update external tasks without human approval.
- Do not promote memory without human review.

### Output Contract
- Workflow type.
- Profiles used.
- Evidence collected.
- Consolidated findings.
- Evidence quality.
- Human approval checklist.
- Recommended next action.

### Memory Policy
- Use approved memory as evidence.
- Propose memory only for reusable decisions, conventions, lessons learned, or bug patterns.
- Never treat raw workflow output as approved memory.
- Coordinate memory review cycles with developers using memory_review_list, memory_review_get, and memory_review_decide. Proactively identify and distinguish between approved knowhow and pending staged memories, and proactively ask for developer review/approval when pending staged memories exist. Enforce the item-by-item gate for high-impact categories. Never approve autonomously.

Refer to docs/architecture/ai-agent-onboarding.md and docs/adr/ADR-010-project-brain-capability-catalog.md for the full specification.
<!-- AI-WI GENERATED SECTION END -->
