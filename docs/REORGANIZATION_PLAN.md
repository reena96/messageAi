# Documentation Reorganization Plan

## Current Structure (Messy)
```
docs/plans/
├── 01-messageai-prd.md
├── 02-technical-architecture.md
├── 03-messaging-infrastructure.md
├── 04-implementation-guide.md
├── 05-rubric-alignment.md
├── 06-implementation-foundation.md
├── 07-implementation-core-messaging.md
├── pr1Prompt.md
├── README.md
├── PROMPTS_FOR_EACH_PR.md
├── IMPLEMENTATION_SHARDING_PLAN.md
└── various other files
```

## Proposed Structure (Organized)

```
docs/
├── README.md (master index)
│
├── prd/
│   ├── README.md
│   ├── ProductRequirements.md (was 01-messageai-prd.md)
│   └── RubricAlignment.md (was 05-rubric-alignment.md)
│
├── architecture/
│   ├── README.md
│   ├── TechnicalArchitecture.md (was 02-technical-architecture.md)
│   └── MessagingInfrastructure.md (was 03-messaging-infrastructure.md)
│
├── prPrompts/
│   ├── README.md
│   ├── Pr01AuthSetup.md (was pr1Prompt.md)
│   ├── Pr02CoreUI.md (new)
│   ├── Pr03Messaging.md (new)
│   ├── Pr04Offline.md (new)
│   ├── Pr05Groups.md (new)
│   ├── Pr06AiInfrastructure.md (new)
│   ├── Pr07AiDecisionPriority.md (new)
│   ├── Pr08AiRsvpDeadline.md (new)
│   ├── Pr09ProactiveAi.md (new)
│   ├── Pr10Performance.md (new)
│   └── Pr11Polish.md (new)
│
└── tasks/
    ├── README.md
    ├── CompleteImplementationGuide.md (was 04-implementation-guide.md)
    ├── FoundationTasks.md (was 06-implementation-foundation.md)
    ├── CoreMessagingTasks.md (was 07-implementation-core-messaging.md)
    └── ShardingStrategy.md (was IMPLEMENTATION_SHARDING_PLAN.md)
```

## Naming Convention

**PascalCase for all files:**
- ✅ ProductRequirements.md
- ✅ Pr01AuthSetup.md
- ✅ TechnicalArchitecture.md
- ❌ product-requirements.md (not this)
- ❌ pr_01_auth_setup.md (not this)

**Folder names: camelCase**
- prd/
- architecture/
- prPrompts/
- tasks/

## File Mappings

### PRD Folder
| Old Name | New Name | Purpose |
|----------|----------|---------|
| 01-messageai-prd.md | ProductRequirements.md | Main PRD document |
| 05-rubric-alignment.md | RubricAlignment.md | Scoring checklist |

### Architecture Folder
| Old Name | New Name | Purpose |
|----------|----------|---------|
| 02-technical-architecture.md | TechnicalArchitecture.md | Tech stack, data models |
| 03-messaging-infrastructure.md | MessagingInfrastructure.md | Real-time patterns |

### PR Prompts Folder
| Old Name | New Name | Purpose |
|----------|----------|---------|
| pr1Prompt.md | Pr01AuthSetup.md | PR #1 implementation guide |
| (new) | Pr02CoreUI.md | PR #2 implementation guide |
| (new) | Pr03Messaging.md | PR #3 implementation guide |
| (new) | Pr04Offline.md | PR #4 implementation guide |
| (new) | Pr05Groups.md | PR #5 implementation guide |
| (new) | Pr06AiInfrastructure.md | PR #6 implementation guide |
| (new) | Pr07AiDecisionPriority.md | PR #7 implementation guide |
| (new) | Pr08AiRsvpDeadline.md | PR #8 implementation guide |
| (new) | Pr09ProactiveAi.md | PR #9 implementation guide |
| (new) | Pr10Performance.md | PR #10 implementation guide |
| (new) | Pr11Polish.md | PR #11 implementation guide |

### Tasks Folder
| Old Name | New Name | Purpose |
|----------|----------|---------|
| 04-implementation-guide.md | CompleteImplementationGuide.md | Original comprehensive guide |
| 06-implementation-foundation.md | FoundationTasks.md | PR #1 detailed tasks with tests |
| 07-implementation-core-messaging.md | CoreMessagingTasks.md | PR #2-3 detailed tasks |
| IMPLEMENTATION_SHARDING_PLAN.md | ShardingStrategy.md | How tasks are organized |

## Cross-Reference Updates

All files will need updated references:

**Example - Before:**
```markdown
See [Technical Architecture](../02-technical-architecture.md)
```

**Example - After:**
```markdown
See [Technical Architecture](../architecture/TechnicalArchitecture.md)
```

## Each Folder README

Each folder will have a README.md explaining:
- What's in this folder
- When to read these files
- How files relate to each other
- Links to other relevant folders

## Benefits

1. **Clear Separation of Concerns**
   - PRD = Product requirements
   - Architecture = System design
   - prPrompts = Implementation instructions
   - Tasks = Detailed task breakdowns

2. **Easy Navigation**
   - Know exactly where to find what you need
   - Folder structure mirrors development workflow

3. **Scalability**
   - Easy to add more documents
   - Clear naming conventions

4. **Professional Structure**
   - Follows software project documentation standards
   - Easy for new developers to understand

## Migration Steps

1. Create new folder structure
2. Create README.md in each folder
3. Move and rename files
4. Update all cross-references
5. Update main README.md
6. Delete old empty folders
7. Verify all links work

## Approval Needed

Does this structure work for you?
- Folder names (prd, architecture, prPrompts, tasks)
- PascalCase for all .md files
- Organization of content

If approved, I'll execute the reorganization.
