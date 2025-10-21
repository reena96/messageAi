# MessageAI - Architecture Diagrams

This directory contains comprehensive Mermaid diagrams visualizing the MessageAI architecture, data models, message flows, and implementation timeline.

## Diagram Index

### 1. System Architecture
**File:** [SystemArchitecture.md](./SystemArchitecture.md)

Covers:
- High-level system architecture (all layers)
- Mobile app layer breakdown
- Real-time sync architecture
- Firebase services integration
- Offline-first architecture
- Security & data flow
- Performance architecture
- Technology stack overview
- Component dependency graph

**Use Cases:**
- Understanding overall system design
- Onboarding new developers
- Technical presentations
- Architecture documentation

---

### 2. Data Models
**File:** [DataModels.md](./DataModels.md)

Covers:
- Firestore collections overview (ERD)
- Users collection structure
- Chats collection structure
- Messages subcollection structure
- AI extraction data models
- Data relationships
- Denormalization patterns
- Read receipt tracking
- Unread count management
- Composite indexes
- Security rules data access

**Use Cases:**
- Database schema reference
- Query optimization
- Security rule design
- Data migration planning

---

### 3. Message Flow & Real-Time Sync
**File:** [MessageFlow.md](./MessageFlow.md)

Covers:
- Complete message lifecycle state diagram
- Real-time message send flow sequence
- Optimistic UI pattern
- Message status progression
- Read receipt flows (1-on-1 and group)
- Firestore listener pattern
- Offline message queue
- Message ordering strategy
- Typing indicators
- Presence system
- Batch update patterns
- Performance metrics
- Error handling
- Conflict resolution
- Pagination strategy

**Use Cases:**
- Understanding message delivery
- Debugging sync issues
- Performance optimization
- Implementing new features

---

### 4. Offline-First Architecture
**File:** [OfflineFirst.md](./OfflineFirst.md)

Covers:
- Offline-first philosophy mindmap
- Complete offline flow state diagram
- Offline scenarios (send, receive, force-quit)
- Network state management
- SQLite cache architecture
- Write queue processing
- Optimistic UI with rollback
- Sync performance targets
- Poor network handling (3G)
- Conflict resolution strategies
- onDisconnect handlers (presence)
- Cache size management
- Offline testing scenarios
- Resilience checklist
- Sync recovery flow

**Use Cases:**
- Implementing offline features
- Testing offline scenarios
- Debugging sync issues
- Network state handling

---

### 5. AI Processing Pipeline
**File:** [AIProcessing.md](./AIProcessing.md)

Covers:
- AI feature overview mindmap
- AI processing architecture
- Calendar extraction (function calling)
- Decision summarization (JSON mode)
- Priority detection (classification)
- RSVP tracking (group analysis)
- Deadline extraction (date parsing)
- Proactive Assistant (LangChain + RAG)
- Performance targets (<2s, <15s)
- Accuracy requirements (>90%)
- Cloud Function deployment
- API key security
- Error handling
- Testing strategy

**Use Cases:**
- Implementing AI features
- Understanding AI pipeline
- Optimizing AI performance
- Testing AI accuracy

---

### 6. Implementation Timeline
**File:** [ImplementationTimeline.md](./ImplementationTimeline.md)

Covers:
- 4-day sprint Gantt chart
- Day 1 MVP timeline
- Critical path analysis
- PR breakdown with dependencies
- Parallel work opportunities
- Risk mitigation timeline
- Testing strategy timeline
- MVP checkpoint gate
- Daily progress tracking
- Time budget breakdown (pie chart)
- PR size guidelines
- Commit strategy
- Final week schedule

**Use Cases:**
- Project planning
- Time estimation
- Risk management
- Progress tracking

---

## How to Use These Diagrams

### For Developers
1. **Start with SystemArchitecture.md** - Get the big picture
2. **Review DataModels.md** - Understand data structure
3. **Study MessageFlow.md** - Learn how messaging works
4. **Read OfflineFirst.md** - Master offline patterns
5. **Explore AIProcessing.md** - Implement AI features

### For Project Managers
1. **ImplementationTimeline.md** - Track progress
2. **SystemArchitecture.md** - Understand scope
3. **AIProcessing.md** - Verify AI requirements

### For Code Reviews
- **DataModels.md** - Verify schema changes
- **MessageFlow.md** - Check sync logic
- **OfflineFirst.md** - Validate offline handling
- **AIProcessing.md** - Review AI integration

### For Documentation
All diagrams are in Mermaid format and can be:
- Rendered in GitHub (native support)
- Embedded in README files
- Exported to PNG/SVG using mermaid-cli
- Included in technical presentations

---

## Diagram Legend

### Colors Used

**Green (#34a853):** Success states, optimized paths, completed tasks
**Blue (#4285f4):** Primary actions, Firebase services, important steps
**Yellow (#f9ab00):** Warning states, checkpoints, medium priority
**Red (#ea4335):** Error states, blocked gates, high priority
**Teal (#10a37f):** AI/OpenAI components

### Common Symbols

- **Rectangles:** Processes, components, actions
- **Diamonds:** Decision points, conditionals
- **Circles:** Start/end points, events
- **Arrows:** Data flow, dependencies, sequence
- **Dashed lines:** Optional flows, weak references
- **Thick borders:** Important milestones, gates

---

## Rendering Diagrams

### In GitHub
All `.md` files with Mermaid code blocks render automatically in GitHub.

### Locally with VS Code
Install extension: **Markdown Preview Mermaid Support**

### Export to Images
```bash
# Install mermaid-cli
npm install -g @mermaid-js/mermaid-cli

# Export to PNG
mmdc -i SystemArchitecture.md -o system-arch.png

# Export to SVG
mmdc -i DataModels.md -o data-models.svg
```

### In Documentation Sites
Most static site generators support Mermaid:
- Docusaurus (plugin)
- GitBook (built-in)
- MkDocs (plugin)
- Hugo (shortcode)

---

## Updating Diagrams

When updating architecture:

1. **Identify affected diagrams** - Check which diagrams need updates
2. **Update diagram files** - Modify Mermaid code
3. **Test rendering** - Verify diagrams render correctly
4. **Update references** - Update links in architecture docs
5. **Commit changes** - Include diagram updates in PR

**Example:**
```bash
# When adding a new Firestore collection
1. Update DataModels.md (add to ERD)
2. Update SystemArchitecture.md (if new service)
3. Update MessageFlow.md (if affects messaging)
4. Test rendering in GitHub preview
5. Commit with message: "docs: add UserPreferences collection to data model diagrams"
```

---

## Integration with Main Documentation

These diagrams are referenced in:
- `/docs/architecture/TechnicalArchitecture.md`
- `/docs/architecture/MessagingInfrastructure.md`
- `/docs/prd/ProductRequirements.md`
- `/docs/tasks/ShardingStrategy.md`

Each architecture document now has links to relevant diagrams for visual reference.

---

## Statistics

**Total Diagrams:** 60+
**Total Files:** 6
**Lines of Mermaid Code:** ~2,500
**Coverage:**
- System architecture: ✅ Complete
- Data models: ✅ Complete
- Message flows: ✅ Complete
- Offline patterns: ✅ Complete
- AI pipeline: ✅ Complete
- Timeline: ✅ Complete

---

**Last Updated:** January 20, 2025
**Version:** 1.0
**Maintained by:** MessageAI Development Team
