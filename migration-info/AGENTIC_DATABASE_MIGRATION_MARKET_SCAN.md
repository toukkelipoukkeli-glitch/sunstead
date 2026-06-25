# Agentic Database Migration Market Scan

Date: 2026-06-24

## Category Summary

Agentic database migration is becoming a real product category, but the term is unevenly used. Products in the category are not just LLM SQL translators. They combine deterministic parsing, source-system assessment, dependency analysis, LLM-assisted repair, scratch-database validation, data diffing, deployment planning, and human review.

Visible activity is concentrated around expensive enterprise migrations:

- Oracle, SQL Server, Teradata, Snowflake, Redshift, Sybase, Netezza, and mainframe databases moving to PostgreSQL, Snowflake, Databricks, Aurora/RDS, AlloyDB, Cloud SQL, or Azure Database for PostgreSQL.
- Stored procedures, functions, triggers, ETL logic, BI workloads, and application SQL rewrites.
- Validation and reconciliation, because SQL translation alone is not enough for enterprise trust.

The major clouds and data platforms are moving fast:

- Snowflake has SnowConvert AI and the Snowflake AIM Migration Agent.
- Databricks has Lakebridge and acquired BladeBridge.
- Microsoft is embedding AI-assisted Oracle-to-PostgreSQL conversion into VS Code with Microsoft Foundry and GitHub Copilot Agent Mode.
- Google Cloud Database Migration Service has Gemini-powered conversion workspaces.
- AWS DMS Schema Conversion has generative AI, and AWS has published a Bedrock + Strands Agents migration assistant architecture.

The open-source landscape is different. Most OSS tools are not agentic migration systems. They are migration primitives:

- Schema-as-code and deployment agents that version, plan, and apply schema changes.
- Data movement and replication agents that move rows between databases, warehouses, files, queues, and lakes.
- Cross-engine conversion tools that extract schemas, translate types, and generate target DDL.
- Online schema-change tools that keep production tables writable during large DDL changes.
- AI SQL clients that help write, explain, or inspect SQL but usually do not perform validated end-to-end migrations.

## What Counts As Agentic Database Migration

For this scan, "agentic database migration" means software that can plan or execute multi-step migration work with feedback loops, not just generate a one-shot SQL conversion.

High-confidence agentic traits:

- Reads source metadata and code.
- Builds a migration plan or task graph.
- Converts code across dialects.
- Deploys to a scratch or target database for validation.
- Captures errors and feeds them back into an automated repair loop.
- Validates functional equivalence or data parity.
- Tracks state across sessions or project phases.
- Escalates unresolved tasks to human review.

Lower-confidence AI migration traits:

- Chatbot gives migration advice.
- LLM translates one SQL snippet.
- Tool provides AI suggestions but no validation loop.
- Tool only reviews schema changes but does not migrate data or code across engines.

## Core Company Map

| Company | Category | Main Migration Focus | Agentic / AI Signal | Notes |
|---|---|---|---|---|
| Datafold | Startup | Data platform migrations, SQL, ETL, dbt, data validation | Data Migration Agent with AI agent architecture, code translation, data diffing, and parity loops | Validation plus translation |
| Snowflake | Platform incumbent | Legacy warehouses to Snowflake | SnowConvert AI and Snowflake AIM Migration Agent | Snowflake target |
| Databricks | Platform incumbent | Legacy warehouses to Databricks SQL | Lakebridge, AI-powered conversion, BladeBridge acquisition | Databricks target |
| Microsoft Azure / GitHub | Cloud incumbent | Oracle to Azure Database for PostgreSQL | VS Code workflow, Foundry models, GitHub Copilot Agent Mode | Azure Postgres target |
| Google Cloud | Cloud incumbent | Oracle and SQL Server to PostgreSQL / AlloyDB / Cloud SQL | Gemini-powered conversion workspaces, assistant prompts, quality assessments, pattern learning | Google Cloud targets |
| AWS | Cloud incumbent | Oracle and SQL Server to Aurora/RDS PostgreSQL | DMS Schema Conversion generative AI plus Bedrock + Strands Agents reference architecture | AWS targets |
| EDB | Database vendor | Oracle to Postgres / EDB Postgres Advanced Server | Migration Portal with AI Copilot | Postgres compatibility |
| Newt Global | Services + product | Oracle / SQL Server to PostgreSQL | DMAP markets agentic AI with recursive agents and validation workflows | Services plus product |
| mLogica | Services + product | Mainframe, distributed legacy DBs, non-Oracle to Oracle/cloud | AI-powered migration software and modernization suites | Enterprise modernization |
| Harness | DevOps platform | Schema-change authoring and governance | Natural-language migration authoring with rollback/governance | Database DevOps |
| Atlas / Ariga | Schema-as-code | Schema migration safety for AI agents | AI-safe migration guardrails, linting, policy, self-correction | Schema governance |
| Liquibase | Database DevOps | Governed database changes | Liquibase MCP server and Agent Safe Governance | Database change governance |
| Bytebase | Database DevSecOps | Schema change workflows | AI-powered SQL review, state-based migration workflows | Database DevSecOps |

## Detailed Company Notes

### Datafold

Datafold is one of the most direct startup examples in the category. Its Data Migration Agent is positioned as a full-cycle migration automation product that combines AI-powered code translation with Datafold's core cross-database data diffing.

Key claims and capabilities:

- AI agent architecture and Data Knowledge Graph.
- Complete SQL codebase translation and validation.
- LLM-powered feedback loop optimized for full parity between source and target.
- Metadata analysis including schema, data types, and relationships.
- Fixed price, timeline, and data parity positioning.
- Migrations claimed to be more than 6x faster than traditional approaches.

Relevant sources:

- https://docs.datafold.com/data-migration-automation/datafold-migration-agent
- https://www.datafold.com/data-migration/
- https://www.datafold.com/blog/what-is-the-datafold-migration-agent/
- https://www.datafold.com/blog/data-migrations-reimagined-introducing-the-ai-powered-datafold-migration-agent/

### Snowflake

Snowflake has two relevant migration layers:

- SnowConvert AI: AI-powered migration and code conversion into Snowflake.
- Snowflake AIM Migration Agent: a more explicitly agentic workflow layered around SnowConvert and Snowflake CoCo.

Snowflake AIM Migration Agent capabilities:

- Guided end-to-end workflow.
- Session persistence.
- Source connection, extraction, conversion, assessment, deployment, data migration, and validation.
- SnowConvert deterministic conversion before AI touches output.
- Dependency-aware deployment waves.
- Source-side baselines and two-sided testing.
- Fix loops where failures trigger diagnosis, patching, and retesting.
- Reusable fix rules.

Relevant sources:

- https://docs.snowflake.com/en/migrations/migration-skill/skill
- https://docs.snowflake.com/en/migrations/snowconvert-docs/overview
- https://www.snowflake.com/en/blog/snowconvert-ai-new-features-feb-2026/
- https://www.snowflake.com/en/blog/engineering/snowconvert-migration-assistant/

### Databricks

Databricks is attacking migration through Lakebridge and the BladeBridge acquisition.

Lakebridge capabilities:

- Assessment.
- Code conversion.
- Data migration.
- Reconciliation.
- AI-powered SQL conversion from dialects such as T-SQL, Redshift, Teradata, Oracle, and Snowflake into Databricks-compatible ANSI SQL.
- Profiling, unsupported construct analysis, dependency visibility, and complexity analysis.
- Validation reports covering schema, row, and column data.

BladeBridge acquisition:

Databricks acquired BladeBridge technology and talent in February 2025. Databricks described BladeBridge as an AI-powered enterprise data warehouse migration solution provider with a proven LLM-driven approach for code assessment and conversion.

Relevant sources:

- https://www.databricks.com/solutions/migration/lakebridge
- https://www.databricks.com/blog/new-migrations-faster-and-more-predictable
- https://www.databricks.com/company/newsroom/press-releases/databricks-acquires-bladebridge-technology-and-talent
- https://github.com/databrickslabs/lakebridge

### Microsoft Azure / GitHub Copilot

Microsoft's database migration AI work is around Oracle to PostgreSQL on Azure, exposed through the PostgreSQL extension for Visual Studio Code.

Capabilities:

- End-to-end Oracle to PostgreSQL migration workflow inside VS Code.
- Connects to Oracle source.
- Selects schemas.
- Configures a Microsoft Foundry model for AI-assisted DDL conversion.
- Uses a PostgreSQL scratch database for validation.
- Tracks extraction, conversion, export, and review.
- Flags tasks that need manual review.
- Uses GitHub Copilot Agent Mode to resolve review tasks.
- Converts Oracle-specific application code such as SQL scripts, stored procedures, loader control files, shell scripts, or Java files.

Relevant sources:

- https://learn.microsoft.com/en-us/azure/postgresql/development/vs-code-extension/oracle-migration
- https://learn.microsoft.com/en-us/azure/postgresql/migrate/oracle-conversions-schema/schema-conversions-overview
- https://learn.microsoft.com/en-us/azure/postgresql/migrate/oracle-conversions-application/app-conversions-overview
- https://learn.microsoft.com/en-us/azure/postgresql/development/vs-code-extension/postgresql-extension-overview
- https://azure.microsoft.com/en-us/blog/accelerate-migration-and-modernization-with-agentic-ai/

### Google Cloud

Google Cloud Database Migration Service has Gemini-powered conversion workspaces for heterogeneous migrations.

Capabilities:

- Oracle and SQL Server schema conversion to PostgreSQL.
- Conversion workspaces for schema and code objects.
- Gemini-powered auto-conversion that enhances deterministic conversion results.
- Gemini conversion assistant prompts for explainability, fixes, and optimization.
- Gemini quality assessments for correctness and functional equivalence.
- Pattern matching where Gemini learns from fixes and suggests similar changes across faulty objects.

Relevant sources:

- https://docs.cloud.google.com/database-migration/docs/convert-sql-with-dms
- https://docs.cloud.google.com/database-migration/docs/oracle-to-postgresql/code-conversion-with-gemini
- https://docs.cloud.google.com/database-migration/docs/oracle-to-postgresql/create-conversion-workspace
- https://docs.cloud.google.com/database-migration/docs/sqlserver-to-alloydb/example-workflow-cw-issues-with-gemini

### AWS

AWS has both productized generative AI in DMS Schema Conversion and a more agentic reference architecture using Amazon Bedrock and Strands Agents.

DMS Schema Conversion generative AI:

- Supports Oracle and SQL Server to Amazon RDS / Aurora PostgreSQL migrations.
- Uses generative AI to generate additional conversion recommendations for action items that would otherwise need manual conversion.
- Obfuscates sensitive data before sending candidate statements to the LLM.
- Reverses obfuscation and generates target SQL.

Bedrock + Strands Agents reference architecture:

- Uses AWS DMS Schema Conversion output as input.
- Fetches Oracle PL/SQL source code.
- Converts objects with Amazon Bedrock.
- Consults AWS migration documentation through an MCP server.
- Deploys converted code to Aurora PostgreSQL through Lambda for syntax validation.
- Runs an automated testing engine.
- Feeds validation errors back into the agent.
- Describes extension points for parallel conversion, rollback, CI/CD integration, and other dialect pairs.

Relevant sources:

- https://aws.amazon.com/blogs/database/new-accelerate-database-modernization-with-generative-ai-using-aws-database-migration-service-schema-conversion/
- https://aws.amazon.com/blogs/database/automate-oracle-pl-sql-to-postgresql-migration-with-amazon-bedrock-and-strands-agents/

### EDB

EDB's Migration Portal with AI Copilot targets Oracle-to-Postgres migrations.

Capabilities:

- Analyze Oracle schemas for compatibility.
- Apply transformation rules and workarounds.
- Load migrated schema into EDB Postgres Advanced Server.
- AI Copilot provides an AI-driven chat interface for migration strategy, syntax errors, and usage examples.
- Can use Azure AI by default or other OpenAI-compatible models, including local LLMs.
- Hybrid Control Plane option for sovereignty over schema information.

Relevant source:

- https://www.enterprisedb.com/products/migration-free-tool-migrating-oracle-postgresql

### Newt Global

Newt Global's DMAP is one of the vendors explicitly using "agentic AI" language for database migration.

Positioning:

- DMAP stands for Database Migration Acceleration Platform / Database Modernization Acceleration Platform in Newt Global materials.
- Focuses on Oracle and SQL Server to PostgreSQL.
- Claims an agentic AI process with recursive agents, compiler-style analysis, and validation.
- Markets automation across discovery, dependency mapping, PL/SQL conversion, transaction replay, validation, and cutover.

Relevant sources:

- https://newtglobal.com/white-paper/agentic-ai-for-database-migration-how-dmap-automates-oracle-sql-server-to-postgresql/
- https://newtglobal.com/dmap/
- https://newtglobal.com/blogs/ai-database-migration-how-dmap-uses-genai/
- https://newtglobal.com/oracle-to-postgresql/how-agentic-ai-automates-oracle-to-postgresql-migration-validation/

### mLogica

mLogica is an enterprise modernization company with AI-powered migration software for database, application, and mainframe modernization.

Relevant products and themes:

- STAR*M Distributed Workload Modernization.
- LIBER*M Mainframe Modernization Suite.
- AI-powered migration software for non-Oracle databases, mainframes, and cloud modernization.
- Migration of mainframe databases such as Db2 to cloud-native systems like PostgreSQL.
- Refactoring and transformation of complex legacy systems.

Relevant sources:

- https://www.mlogica.com/
- https://www.mlogica.com/resources/blogs/how-mlogica-and-oracle-drive-ai-powered-database-and-mainframe-modernization
- https://www.mlogica.com/products/liber-m-mainframe-modernization
- https://www.mlogica.com/resources/blogs/mongodb-to-oracle-migrations-with-mlogica%E2%80%99s-next-generation-ai-powered-migration-software
- https://www.mlogica.com/resources/blogs/navigating-cloud-native-modernization-with-ai-powered-migration

## Adjacent Database DevOps Players

These companies are not primarily cross-engine migration vendors, but they matter because agentic migration will need governance, review, rollback, auditability, and production controls.

### Harness

Harness launched AI-Powered Database Migration Authoring inside Harness Database DevOps.

Capabilities:

- Developers describe schema changes in plain language.
- Harness generates compliant, production-ready migrations.
- Rollback and governance are built into the workflow.
- Integrated into CI/CD and database DevOps.

Relevant sources:

- https://www.harness.io/blog/introducing-ai-powered-database-migration-authoring
- https://www.harness.io/blog/ai-in-database-devops-from-manual-bottlenecks-to-autonomous-change
- https://www.harness.io/products/database-devops

### Atlas / Ariga

Atlas positions itself around AI-safe migrations.

Capabilities:

- Same gates for human and AI-generated schema changes.
- Linting, tests, and policy checks on every PR.
- Structured errors allow agents to self-correct and resubmit.
- Agent skills for schema migrations, linting, testing, and policy enforcement.

Relevant sources:

- https://atlasgo.io/use-cases/ai-safe-migrations
- https://atlasgo.io/blog/2025/08/19/teach-ai-agents-schema-management
- https://atlasgo.io/guides/ai-tools

### Liquibase

Liquibase is moving toward governed AI-assisted database change.

Capabilities:

- Liquibase MCP server connects AI-assisted workflows to Liquibase Secure.
- Developers and AI assistants can produce Liquibase changelogs, schema updates, rollback logic, and DDL.
- Policy checks, schema lineage, drift detection, and change intelligence govern the path to production.

Relevant sources:

- https://www.liquibase.com/blog/liquibase-secures-your-database-changes-human-or-ai
- https://www.liquibase.com/supported-databases/cloud-database-devops

### Bytebase

Bytebase is a database DevSecOps platform with AI-powered SQL review and state-based schema management.

Capabilities:

- Declarative schema definitions.
- Auto-generation of migrations from desired schema state.
- AI-powered SQL reviews on pull requests.
- Automated deployments after merge.
- Review workflows, policy, and governance around DB changes.

Relevant sources:

- https://docs.bytebase.com/tutorials/state-based-schema-management-github
- https://www.bytebase.com/blog/top-database-schema-change-tool-evolution/
- https://github.com/bytebase/bytebase

## Open Source Tooling Landscape

Open-source database migration tools generally split into two primary categories:

- Schema migration agents: version-control, plan, review, and deploy schema changes.
- Data migration and replication agents: move live or batch data across databases and storage systems.

A third category matters for cross-engine modernization:

- Conversion and loading tools: translate schema, types, and sometimes procedural code while moving data to a new engine.

These OSS tools are not the same as agentic migration products. They are the building blocks that an agentic migration system would orchestrate, monitor, repair, and validate.

### Schema-As-Code And Deploy Agents

These tools track schema history and integrate into CI/CD pipelines to apply migrations incrementally.

| Tool | What It Does | Best For | Agentic Relevance |
|---|---|---|---|
| Flyway by Redgate | Framework-agnostic database migration tool using versioned SQL, Java, and other migration scripts; Flyway Community is free and built on open source | Teams that want simple, script-based schema migration across many databases | Strong execution layer for agent-generated migration scripts |
| Liquibase | Database change management through changelogs in XML, YAML, JSON, or SQL; tracks, versions, deploys, and rolls back database changes | Enterprises needing auditability, rollback, and structured change control | Strong governance layer for AI-generated database changes |
| Atlas | Language-agnostic schema-as-code tool with declarative and versioned workflows; compares desired state to actual database state and plans migrations | Terraform-like database schema management and CI review | Very strong fit for agents because it can inspect, diff, lint, and apply schema plans |
| Dbmate | Lightweight, framework-agnostic standalone CLI using plain SQL migrations | Polyglot teams that want one simple migration tool across services | Useful low-friction runner for agent-generated SQL |
| Sqitch | Framework-free, database-native change management with dependency-aware plans rather than simple numbering | Teams that need explicit dependency ordering across DB changes | Good for agents that need to model migration dependency graphs |
| Alembic | Lightweight migration tool for SQLAlchemy | Python / SQLAlchemy applications | Useful when agent work is scoped to a Python app's ORM model changes |
| golang-migrate | CLI and Go library that reads migrations from sources and applies them in order | Go services and language-agnostic SQL migration workflows | Simple runner for generated `up` / `down` migrations |
| Goose | Go CLI and library supporting incremental SQL changes and Go functions | Go services that want SQL or code-based migrations | Useful when migrations need app-level logic in Go |
| Skeema | Declarative, pure-SQL schema management for MySQL and MariaDB | MySQL/MariaDB teams that want desired-state schema files | Strong MySQL-specific schema-as-code primitive |
| Prisma Migrate | Generates migration files from changes in Prisma's declarative schema | TypeScript / Node applications using Prisma ORM | Useful for app-local schema evolution, less suitable for heterogeneous database migration |
| Django migrations | Framework-native schema migration from Django model changes | Django applications | Useful inside app migrations, not a neutral cross-database migration system |
| Rails Active Record migrations | Ruby DSL for evolving schema over time | Rails applications | Useful inside app migrations, not a heterogeneous migration tool |
| Knex migrations | JavaScript/TypeScript migration system for Knex projects | Node.js projects using Knex | Useful as an app-local migration runner |

Relevant sources:

- https://www.red-gate.com/products/flyway/community/
- https://github.com/flyway/flyway
- https://github.com/liquibase/liquibase
- https://www.liquibase.com/open-source
- https://atlasgo.io/docs
- https://github.com/ariga/atlas
- https://github.com/amacneil/dbmate
- https://sqitch.org/
- https://alembic.sqlalchemy.org/
- https://github.com/golang-migrate/migrate
- https://github.com/pressly/goose
- https://www.skeema.io/
- https://www.prisma.io/migrate
- https://docs.djangoproject.com/en/6.0/topics/migrations/
- https://guides.rubyonrails.org/active_record_migrations.html
- https://knexjs.org/guide/migrations.html

### Data Movement And Replication Agents

These tools move actual rows, records, and events. Some are batch-first, while others support streaming or change data capture.

| Tool | What It Does | Best For | Agentic Relevance |
|---|---|---|---|
| Airbyte | Open-source data movement platform with a large connector catalog and CDC support for selected sources | ELT pipelines, warehouse/lake replication, long-tail connectors | Good connector substrate for agents that need source and target access |
| Dsync | Open-source CLI from Adiom for fast database migration and synchronization; parallelized in-memory streaming engine with SQL, NoSQL, and vector-store support | Fast live migration and synchronization across heterogeneous stores | Interesting new primitive for agent-controlled live copy jobs |
| pgLoader | Data loading and whole-database migration tool into PostgreSQL; handles files and live database sources, schema creation, type conversion, and rejected rows | Moving MySQL, SQLite, MS SQL, CSV, and other sources into Postgres | Strong deterministic loader for Postgres-targeted migration agents |
| ReplicaDB | Open-source CLI for bulk replication between heterogeneous databases without requiring agents or triggers | Parallel bulk transfer across relational and NoSQL stores | Useful for batch copy phases where CDC is not required |
| Debezium | Open-source distributed CDC platform that reads database logs and streams row-level changes | Event-driven replication, streaming changes into Kafka-compatible pipelines | Strong CDC primitive for near-zero-downtime migration agents |
| SymmetricDS | Database replication, synchronization, and transformation across heterogeneous environments; supports bidirectional patterns | Edge, retail, distributed, and intermittently connected systems | Useful when agentic migration needs conflict handling or multi-site sync |
| Apache SeaTunnel | Apache data integration platform for batch, streaming, CDC, schema evolution, and multi-engine execution | Large-scale data integration across many sources and sinks | Strong pipeline substrate, especially when migration overlaps data integration |
| Apache Flink CDC | Distributed integration tool built on Flink for full database synchronization, CDC, schema evolution, and transformation | Real-time and batch database synchronization | Useful for streaming cutover and continuously synced migration targets |
| Apache NiFi | Flow-based data movement and processing system with data provenance and visual pipeline management | Complex dataflow automation, routing, transformation, and monitored movement | Useful for visual migration pipelines, less focused on schema semantics |
| Talend Open Studio | Historical open-source ETL tool for data integration and transformation; discontinued by Talend/Qlik as of January 31, 2024 | Legacy ETL projects and teams with existing Talend jobs | Relevant historically, but not a fresh OSS foundation |
| Sling | Open-source/free ELT CLI for moving data between databases, files, APIs, and storage systems | Small-to-medium ELT and database-to-database copy jobs | Useful simple copy primitive for agent-executed tasks |
| Meltano | Open-source/declarative data integration engine and DataOps framework built around pipelines-as-code | Data teams that want versioned ELT pipelines | Useful when migrations are part of a broader data platform pipeline |
| CloudQuery | Open-source framework/CLI and SDK for ELT-style data pipelines, especially cloud/SaaS/config inventory | Cloud asset and SaaS data sync into databases/warehouses | Adjacent, more cloud/SaaS ingestion than DB-to-DB migration |
| PeerDB | Open-source Postgres-first replication and CDC platform for moving Postgres data to warehouses, queues, and storage engines | Postgres to analytical targets and Postgres-to-Postgres movement | Strong Postgres migration and replication primitive |

Relevant sources:

- https://github.com/airbytehq/airbyte
- https://docs.airbyte.com/platform/understanding-airbyte/cdc
- https://github.com/adiom-data/dsync/
- https://pgloader.io/
- https://github.com/dimitri/pgloader
- https://osalvador.github.io/ReplicaDB/
- https://github.com/osalvador/ReplicaDB
- https://debezium.io/
- https://symmetricds.org/
- https://seatunnel.apache.org/
- https://nightlies.apache.org/flink/flink-cdc-docs-stable/
- https://nifi.apache.org/
- https://www.talend.com/blog/update-on-the-future-of-talend-open-studio/
- https://slingdata.io/
- https://github.com/slingdata-io/sling-cli
- https://docs.meltano.com/meltano-open/meltano-at-a-glance/
- https://github.com/meltano/meltano
- https://github.com/cloudquery/cloudquery
- https://peerdb.io/
- https://github.com/PeerDB-io/peerdb

### Cross-Engine Conversion And Loading Tools

These are closer to "database migration" in the heterogeneous sense: they convert schemas, types, or database-specific constructs, then produce target-compatible SQL or load data.

| Tool | What It Does | Best For | Agentic Relevance |
|---|---|---|---|
| Ora2Pg | Free, open-source Oracle and MySQL to PostgreSQL migration toolkit; extracts schema/data and generates PostgreSQL-compatible SQL; can handle many Oracle objects and some PL/SQL conversion | Oracle-to-Postgres migration assessment and first-pass conversion | Excellent deterministic baseline for an Oracle-to-Postgres repair agent |
| pgLoader | Loads files or migrates whole databases into PostgreSQL, including schema/type conversion from source catalogs | Fast initial loads into Postgres | Strong loader paired with validation and repair loops |
| pgcopydb | Automates copying a PostgreSQL database to another Postgres server; supports base copy and CDC through logical decoding | Postgres-to-Postgres migration with reduced downtime | Strong for Postgres major-version, hardware, cloud, or provider migration |
| AWS Schema Conversion Tool | Free AWS tool, not open source, for converting schemas/code to AWS targets | AWS-bound heterogeneous migrations | Important comparison point, but not OSS |
| SnowConvert AI / Databricks Lakebridge | Platform migration tools, not open source in the same sense, although Lakebridge has open Databricks Labs components | Migrations into Snowflake or Databricks | Incumbent comparison point for OSS-based agents |

Relevant sources:

- https://ora2pg.darold.net/
- https://github.com/darold/ora2pg
- https://pgloader.io/
- https://github.com/dimitri/pgloader
- https://pgcopydb.readthedocs.io/
- https://github.com/dimitri/pgcopydb

### Online Schema Change Tools

These tools matter when a migration involves large production tables and downtime is unacceptable. They usually do not migrate across engines; they change schema in-place with reduced lock impact.

| Tool | What It Does | Best For | Agentic Relevance |
|---|---|---|---|
| gh-ost | GitHub's triggerless online schema migration tool for MySQL | Large MySQL table changes with controllable operational behavior | Useful execution backend for safe agent-planned MySQL DDL |
| pt-online-schema-change | Percona Toolkit tool that alters MySQL tables by operating on a copy while the original remains readable/writable | Mature MySQL online DDL workflows | Useful but needs strong guardrails around foreign keys, triggers, and load |
| Vitess Online DDL | Managed online schema migrations in Vitess using strategies such as direct, online, gh-ost, and pt-osc | Sharded MySQL/Vitess environments | Useful when migration targets cloud-scale MySQL/Vitess infrastructure |
| Spirit | Block's reimplementation of gh-ost for MySQL 8.0+, designed for faster multi-threaded row copying and binlog apply | MySQL 8 online schema changes where speed matters | Interesting newer execution primitive, but narrower than gh-ost |

Relevant sources:

- https://github.com/github/gh-ost
- https://docs.percona.com/percona-toolkit/pt-online-schema-change.html
- https://vitess.io/docs/archive/20.0/user-guides/schema-changes/ddl-strategies/
- https://github.com/block/spirit

### AI SQL Clients And Database Workbenches

These tools are adjacent to agentic migration because they help users inspect schemas, write SQL, explain queries, or generate SQL from natural language. They are not usually full migration agents unless they add planning, execution, validation, and repair loops.

| Tool | What It Does | Best For | Agentic Relevance |
|---|---|---|---|
| Chat2DB | AI-powered SQL client and database management tool with text-to-SQL, SQL explanation, SQL optimization, visualization, and support for many databases | AI-assisted database management and SQL generation | Useful UX/reference point, but not a complete migration agent by itself |
| Vanna | Open-source text-to-SQL/RAG framework for chatting with SQL databases | Natural-language analytics over existing databases | Useful for query generation and explainability, not migration execution |
| SQL Chat / DB-GPT-style tools | Conversational database interfaces | SQL assistance and data exploration | Adjacent; can help inspect source/target but need orchestration to migrate |

Chat2DB-specific note:

The Chat2DB blog post the user supplied lists Flyway, Liquibase, Apache NiFi, Talend Open Studio, and Chat2DB as top open-source database migration tools. That is useful as a vendor perspective, but the list mixes categories:

- Flyway and Liquibase are schema migration/deployment tools.
- Apache NiFi and Talend Open Studio are dataflow/ETL tools.
- Chat2DB is primarily an AI SQL client and database management workbench.

The useful takeaway is that migration workflows are converging with AI-assisted SQL authoring and visual database management. The caveat is that a Chat2DB-style workbench does not replace deterministic migration execution, CDC, or data parity validation.

Relevant sources:

- https://chat2db.ai/resources/blog/top-open-source-database-migration-tools
- https://chat2db.ai/en-US
- https://github.com/OtterMind/Chat2DB
- https://github.com/vanna-ai/vanna

### Open Source Gap

The open-source stack already has many strong primitives:

- Flyway, Liquibase, Atlas, Dbmate, Sqitch, Alembic, golang-migrate, Goose, Skeema, Prisma, Django, Rails, and Knex for schema evolution.
- Airbyte, Dsync, pgLoader, ReplicaDB, Debezium, SymmetricDS, SeaTunnel, Flink CDC, NiFi, Sling, Meltano, CloudQuery, and PeerDB for data movement.
- Ora2Pg, pgLoader, and pgcopydb for practical migration and loading workflows.
- gh-ost, pt-online-schema-change, Vitess Online DDL, and Spirit for online schema changes.
- Chat2DB and Vanna-style tools for AI-assisted database interaction.

What is still missing is a neutral, open, agentic migration control plane that can:

- Pick the right primitive for each migration phase.
- Inspect source schema, target schema, procedures, and application SQL.
- Generate a plan.
- Execute conversion and copy steps.
- Validate source-vs-target behavior.
- Repair failed SQL or procedural code.
- Produce a reviewable proof package.

## Competitive Pattern

Observed category layers:

### 1. Platform Migration Agents

These help users move into a vendor's platform:

- Snowflake AIM Migration Agent and SnowConvert AI.
- Databricks Lakebridge and BladeBridge.
- Google Cloud DMS with Gemini.
- AWS DMS Schema Conversion with generative AI.
- Microsoft Azure Oracle-to-Postgres migration tooling.

### 2. Neutral Migration Automation

These sell migration outcomes across platforms:

- Datafold.
- Newt Global DMAP.
- mLogica.
- Systems integrator migration accelerators.

### 3. Validation and Reconciliation

These prove the migration worked:

- Datafold's data diffing.
- Databricks Lakebridge validation and reconciliation.
- Snowflake AIM two-sided testing.
- Google Gemini quality assessments.
- Custom transaction replay and parity tools.

### 4. Governance and Delivery

These make AI-generated database changes safe:

- Harness.
- Atlas.
- Liquibase.
- Bytebase.

## What Is Actually Hard

The hard parts are not basic `CREATE TABLE` or simple SQL syntax conversion.

Hard problems:

- Stored procedures and packages with business logic.
- Triggers and side effects.
- Oracle-specific exception handling and transaction semantics.
- Sequences, identity, defaults, timestamp behavior, and null semantics.
- Proprietary functions such as `NVL`, `DECODE`, `MERGE`, `CONNECT BY`, `PIVOT`, and vendor-specific date logic.
- Application code that embeds SQL assumptions.
- ETL/ELT workflows and orchestration dependencies.
- BI semantic layers and reports.
- Performance differences after syntactically correct conversion.
- Data parity for large tables and transformations.
- Cutover, CDC correctness, rollback, and downtime windows.
- Audit proof for regulated industries.

## Risks and Caveats

- Most "agentic" claims are vendor marketing unless there is a real closed-loop validation and repair system.
- Full autonomy is risky because database migrations can cause data loss, downtime, compliance issues, and subtle business logic regressions.
- Incumbents have distribution advantages.
- Data access and security are major blockers. Enterprises will ask where source schema, code, data samples, and prompts are processed.
- Validation cost can become high on very large datasets.
- Performance parity is separate from functional parity. A query can return correct results but perform badly in the target engine.
- Migration projects often involve stakeholder alignment in addition to technical conversion.
