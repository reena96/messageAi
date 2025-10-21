# Architecture Documentation

This folder contains technical architecture and design patterns for MessageAI.

## 📄 Files

### TechnicalArchitecture.md
**What:** System architecture and technical design
**When to read:** Before implementing any PR
**Contains:**
- Complete tech stack (React Native, Firebase, OpenAI)
- System architecture diagrams
- Data models (User, Chat, Message)
- Firestore security rules
- Performance targets
- File structure

**Reference this** → When implementing data models, security, or understanding system design.

### MessagingInfrastructure.md
**What:** Deep dive on real-time messaging patterns
**When to read:** Before PR #3 (Messaging), PR #4 (Offline)
**Contains:**
- Real-time sync patterns (Firestore listeners)
- Offline-first architecture (8 pages)
- Optimistic UI implementation
- Poor network handling
- Group chat delivery tracking
- Common pitfalls & solutions

**Critical for** → PR #3, #4, #5 (messaging foundation).

## 🔗 Related Folders

**Read in this order:**
1. [../prd/ProductRequirements.md](../prd/ProductRequirements.md) - WHAT we're building
2. TechnicalArchitecture.md - HOW it's designed
3. MessagingInfrastructure.md - DEEP DIVE on messaging
4. [../prPrompts/](../prPrompts/) - Step-by-step implementation

**These docs are referenced by:**
- All PR prompts (for data models, patterns)
- Task lists (for implementation details)
