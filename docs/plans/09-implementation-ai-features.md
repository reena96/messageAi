# MessageAI - Implementation: AI Features

**Phase:** AI-Powered Message Intelligence
**PRs:** #6 (Calendar), #7 (Decisions), #8 (RSVP/Deadlines)
**Timeline:** 12-15 hours
**Dependencies:** PR #5 (MVP Complete)

← [Previous: Resilience](./08-implementation-resilience.md) | [README](./README.md) | [Next: Advanced Features](./10-implementation-advanced.md)

---

## Overview

This phase implements the core AI features that differentiate MessageAI from standard messaging apps. AI automatically extracts calendar events, decisions, RSVPs, deadlines, and priority levels from conversations. **Tests are critical** - AI accuracy must exceed 90% for production use.

### Success Criteria
- ✅ Calendar extraction accuracy >90%
- ✅ Decision summarization accuracy >90%
- ✅ Priority detection accuracy >90%
- ✅ RSVP tracking accuracy >90%
- ✅ Deadline extraction accuracy >90%
- ✅ AI processing <2 seconds per message
- ✅ Low-confidence items marked visually

---

## PR #6: AI Infrastructure + Calendar Extraction

**Branch:** `feature/ai-calendar`
**Timeline:** 4-5 hours
**Test Coverage:** Accuracy + Performance

### Implementation Details

For complete code examples, see [04-implementation-guide.md PR #6](./04-implementation-guide.md#pr-6-ai-infrastructure--calendar-extraction).

**Key files to create:**
- `functions/src/index.ts` - Cloud Functions with OpenAI
- `lib/ai/calendar.ts` - Calendar extraction client
- `app/(tabs)/deadlines.tsx` - Calendar events view
- `lib/store/messageStore.ts` - Auto-extraction integration

### Tasks Summary

#### 1. Cloud Functions Setup (1 hour)

Initialize Firebase Cloud Functions:

```bash
cd messageai
firebase init functions
# Choose TypeScript
```

Implement `calendarExtraction` callable function with:
- OpenAI GPT-4 Turbo integration
- Authentication verification
- Structured JSON response
- Confidence scoring (0-1)

See [04-implementation-guide.md](./04-implementation-guide.md#pr-6-ai-infrastructure--calendar-extraction) for complete implementation.

#### 2. AI Service Client (1 hour)

Create `lib/ai/calendar.ts`:
- `CalendarEvent` interface
- `extractCalendarEvents()` function
- Test cases for validation

#### 3. Calendar View Component (1.5 hours)

Create `app/(tabs)/deadlines.tsx`:
- Query messages with `aiExtraction.calendarEvents`
- Display sorted by date
- Show confidence badges for low-confidence events
- Empty state with explanation

#### 4. Auto-extraction on Message Send (1.5 hours)

Enhance `messageStore.sendMessage`:
- Call `extractCalendarEvents()` asynchronously
- Store results in `aiExtraction.calendarEvents` field
- Non-blocking (doesn't delay message send)

---

### Tests to Add

#### Accuracy Tests for Calendar Extraction

```typescript
// lib/ai/__tests__/calendar.accuracy.test.ts
import { extractCalendarEvents, CALENDAR_TEST_CASES } from '../calendar';

describe('Calendar Extraction - Accuracy', () => {
  // Note: These tests require OpenAI API and will cost money
  // Run with: npm test -- calendar.accuracy.test.ts
  // Set OPENAI_API_KEY in environment

  it('should extract event with time and location', async () => {
    const events = await extractCalendarEvents(
      "Soccer practice is tomorrow at 4pm at the community center"
    );

    expect(events).toHaveLength(1);
    expect(events[0].event.toLowerCase()).toContain('soccer');
    expect(events[0].time).toBeDefined();
    expect(events[0].location).toBeDefined();
    expect(events[0].confidence).toBeGreaterThan(0.8);
  });

  it('should extract event with specific date and time', async () => {
    const events = await extractCalendarEvents(
      "Don't forget parent-teacher conference on Friday, January 26th at 3:30 PM"
    );

    expect(events).toHaveLength(1);
    expect(events[0].event.toLowerCase()).toContain('conference');
    expect(events[0].date).toMatch(/^\d{4}-\d{2}-\d{2}$/); // ISO format
    expect(events[0].time).toContain('3:30');
    expect(events[0].confidence).toBeGreaterThan(0.8);
  });

  it('should extract event with relative date', async () => {
    const events = await extractCalendarEvents("Birthday party next Saturday!");

    expect(events).toHaveLength(1);
    expect(events[0].event.toLowerCase()).toContain('birthday');
    expect(events[0].date).toBeDefined();
  });

  it('should return empty array for non-event messages', async () => {
    const events = await extractCalendarEvents("Can you pick up milk?");

    expect(events).toHaveLength(0);
  });

  it('should extract multiple events from one message', async () => {
    const events = await extractCalendarEvents(
      "Dentist appointment Monday at 2pm, then soccer practice Wednesday at 5pm"
    );

    expect(events).toHaveLength(2);
    expect(events[0].event.toLowerCase()).toContain('dentist');
    expect(events[1].event.toLowerCase()).toContain('soccer');
  });

  it('should handle ambiguous dates with lower confidence', async () => {
    const events = await extractCalendarEvents(
      "We should meet up sometime next week"
    );

    // Might extract event, but confidence should be low
    if (events.length > 0) {
      expect(events[0].confidence).toBeLessThan(0.7);
    }
  });

  // Accuracy validation test
  it('should achieve >90% accuracy on test cases', async () => {
    let correctCount = 0;

    for (const testCase of CALENDAR_TEST_CASES) {
      const events = await extractCalendarEvents(testCase.input);

      if (testCase.expected === null) {
        // Should not extract event
        if (events.length === 0) correctCount++;
      } else {
        // Should extract event with expected properties
        if (events.length > 0) {
          const event = events[0];
          const hasExpectedEvent = event.event
            .toLowerCase()
            .includes(testCase.expected.event.toLowerCase());
          const hasTime = testCase.expected.hasTime ? !!event.time : true;
          const hasLocation = testCase.expected.hasLocation
            ? !!event.location
            : true;

          if (hasExpectedEvent && hasTime && hasLocation) {
            correctCount++;
          }
        }
      }

      // Rate limiting - wait 1s between calls
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    const accuracy = (correctCount / CALENDAR_TEST_CASES.length) * 100;
    console.log(`✅ Calendar extraction accuracy: ${accuracy.toFixed(1)}%`);

    expect(accuracy).toBeGreaterThanOrEqual(90);
  });
});
```

#### Performance Test for AI Processing

```typescript
// lib/ai/__tests__/calendar.performance.test.ts
import { extractCalendarEvents } from '../calendar';

describe('Calendar Extraction - Performance', () => {
  it('should complete extraction in <2 seconds', async () => {
    const startTime = Date.now();

    await extractCalendarEvents(
      "Team meeting tomorrow at 10am in conference room B"
    );

    const duration = Date.now() - startTime;

    console.log(`✅ Calendar extraction performance: ${duration}ms`);
    expect(duration).toBeLessThan(2000);
  });

  it('should handle long messages efficiently', async () => {
    const longMessage = `
      Hi everyone! Here's the schedule for next week:
      - Monday: Team standup at 9am
      - Tuesday: Client presentation at 2pm in Building A
      - Wednesday: Code review session at 3pm
      - Thursday: Sprint planning at 10am
      - Friday: Happy hour at 5pm at Joe's Bar
    `;

    const startTime = Date.now();
    const events = await extractCalendarEvents(longMessage);
    const duration = Date.now() - startTime;

    expect(events.length).toBeGreaterThanOrEqual(3); // Should extract multiple events
    expect(duration).toBeLessThan(3000); // Allow 3s for longer messages
  });
});
```

---

### Validation Checklist

Run these checks before completing PR #6:

- [ ] Cloud Functions deployed successfully
- [ ] OPENAI_API_KEY secret configured
- [ ] Calendar extraction callable function works
- [ ] Client-side `extractCalendarEvents()` returns results
- [ ] Deadlines tab displays extracted events
- [ ] Events sorted by date (earliest first)
- [ ] Low-confidence events (<0.8) show badge
- [ ] Empty state displays when no events
- [ ] Auto-extraction triggers on message send
- [ ] Accuracy test passes (>90%)
- [ ] Performance test passes (<2s)

### Performance Target

- **AI extraction processing:** <2 seconds per message

---

## PR #7: Decision Summarization + Priority Detection

**Branch:** `feature-ai-decisions`
**Timeline:** 4-5 hours (can run in parallel with PR #8)
**Test Coverage:** Accuracy

### Implementation Overview

**Note:** Detailed implementation to be added. Reference architecture:

**Key files to create:**
- `functions/src/decisions.ts` - Decision extraction Cloud Function
- `lib/ai/decisions.ts` - Decision extraction client
- `app/(tabs)/decisions.tsx` - Decisions view tab
- `components/ai/PriorityBadge.tsx` - Visual priority indicator

### Features to Implement

1. **Decision Extraction**
   - Identify decision points in conversations
   - Extract: decision text, participants, timestamp
   - Detect resolved vs. pending decisions

2. **Priority Detection**
   - Classify messages as: critical, high, medium, low
   - Factors: urgency keywords, deadlines, participant count
   - Visual indicators (color-coded)

3. **Decisions Tab UI**
   - List all extracted decisions
   - Filter by: pending, resolved, chat
   - Mark decision as complete

---

### Tests to Add

#### Accuracy Tests for Decision Detection

```typescript
// lib/ai/__tests__/decisions.accuracy.test.ts
import { extractDecisions, DECISION_TEST_CASES } from '../decisions';

describe('Decision Extraction - Accuracy', () => {
  it('should detect clear decisions', async () => {
    const decisions = await extractDecisions(
      "Let's go with option B. Everyone agreed."
    );

    expect(decisions).toHaveLength(1);
    expect(decisions[0].decision.toLowerCase()).toContain('option b');
    expect(decisions[0].status).toBe('resolved');
    expect(decisions[0].confidence).toBeGreaterThan(0.8);
  });

  it('should detect pending decisions', async () => {
    const decisions = await extractDecisions(
      "Should we launch next week or wait until February?"
    );

    expect(decisions).toHaveLength(1);
    expect(decisions[0].status).toBe('pending');
  });

  it('should extract multiple decisions from conversation', async () => {
    const decisions = await extractDecisions(
      "We decided to postpone the launch. But we need to decide on the new date soon."
    );

    expect(decisions.length).toBeGreaterThanOrEqual(1);
  });

  it('should not extract questions as decisions', async () => {
    const decisions = await extractDecisions(
      "What time should we meet?"
    );

    expect(decisions).toHaveLength(0);
  });

  it('should achieve >90% accuracy on test cases', async () => {
    let correctCount = 0;

    for (const testCase of DECISION_TEST_CASES) {
      const decisions = await extractDecisions(testCase.input);

      if (testCase.expected === null) {
        if (decisions.length === 0) correctCount++;
      } else {
        if (decisions.length > 0 && decisions[0].status === testCase.expected.status) {
          correctCount++;
        }
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    const accuracy = (correctCount / DECISION_TEST_CASES.length) * 100;
    console.log(`✅ Decision detection accuracy: ${accuracy.toFixed(1)}%`);

    expect(accuracy).toBeGreaterThanOrEqual(90);
  });
});
```

#### Accuracy Tests for Priority Detection

```typescript
// lib/ai/__tests__/priority.accuracy.test.ts
import { detectPriority, PRIORITY_TEST_CASES } from '../priority';

describe('Priority Detection - Accuracy', () => {
  it('should detect critical priority for urgent keywords', async () => {
    const priority = await detectPriority(
      "URGENT: Server is down, need immediate attention!"
    );

    expect(priority.level).toBe('critical');
    expect(priority.confidence).toBeGreaterThan(0.8);
  });

  it('should detect high priority for deadline-based messages', async () => {
    const priority = await detectPriority(
      "Report due tomorrow at 9am"
    );

    expect(priority.level).toBe('high');
  });

  it('should detect medium priority for normal requests', async () => {
    const priority = await detectPriority(
      "Can you review this document when you get a chance?"
    );

    expect(priority.level).toBe('medium');
  });

  it('should detect low priority for casual messages', async () => {
    const priority = await detectPriority(
      "Just wanted to share this funny video"
    );

    expect(priority.level).toBe('low');
  });

  it('should achieve >90% accuracy on test cases', async () => {
    let correctCount = 0;

    for (const testCase of PRIORITY_TEST_CASES) {
      const priority = await detectPriority(testCase.input);

      if (priority.level === testCase.expected.level) {
        correctCount++;
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    const accuracy = (correctCount / PRIORITY_TEST_CASES.length) * 100;
    console.log(`✅ Priority detection accuracy: ${accuracy.toFixed(1)}%`);

    expect(accuracy).toBeGreaterThanOrEqual(90);
  });
});
```

---

### Validation Checklist

- [ ] Decision extraction Cloud Function deployed
- [ ] Client-side `extractDecisions()` works
- [ ] Priority detection Cloud Function deployed
- [ ] Decisions tab displays extracted decisions
- [ ] Priority badges display with correct colors
- [ ] Can filter decisions (pending/resolved)
- [ ] Can mark decision as complete
- [ ] Decision accuracy >90%
- [ ] Priority accuracy >90%
- [ ] AI processing <2s

---

## PR #8: RSVP Tracking + Deadline Extraction

**Branch:** `feature/ai-rsvp-deadlines`
**Timeline:** 4-5 hours (can run in parallel with PR #7)
**Test Coverage:** Accuracy

### Implementation Overview

**Note:** Detailed implementation to be added. Reference architecture:

**Key files to create:**
- `functions/src/rsvp.ts` - RSVP tracking Cloud Function
- `lib/ai/rsvp.ts` - RSVP extraction client
- `lib/ai/deadlines.ts` - Deadline extraction client
- `components/ai/RSVPStatus.tsx` - RSVP response component

### Features to Implement

1. **RSVP Tracking**
   - Detect invitation messages
   - Track responses: yes, no, maybe
   - Show who responded and how
   - Send reminders for pending RSVPs

2. **Deadline Extraction**
   - Extract deadlines from messages
   - Different from calendar events (tasks vs. events)
   - Examples: "Report due Friday", "Submit by EOD"
   - Show in Deadlines tab with countdown

3. **Enhanced Deadlines Tab**
   - Combined view: calendar events + deadlines
   - Sort by urgency/date
   - Mark deadlines as complete
   - Overdue highlighting

---

### Tests to Add

#### Accuracy Tests for RSVP Tracking

```typescript
// lib/ai/__tests__/rsvp.accuracy.test.ts
import { extractRSVP, RSVP_TEST_CASES } from '../rsvp';

describe('RSVP Tracking - Accuracy', () => {
  it('should detect invitation', async () => {
    const rsvp = await extractRSVP(
      "Pizza party Friday at 6pm! Who's coming?"
    );

    expect(rsvp.isInvitation).toBe(true);
    expect(rsvp.event).toBeDefined();
    expect(rsvp.confidence).toBeGreaterThan(0.8);
  });

  it('should detect "yes" response', async () => {
    const rsvp = await extractRSVP(
      "Count me in! I'll be there."
    );

    expect(rsvp.isResponse).toBe(true);
    expect(rsvp.response).toBe('yes');
  });

  it('should detect "no" response', async () => {
    const rsvp = await extractRSVP(
      "Sorry, can't make it. Have a conflict."
    );

    expect(rsvp.isResponse).toBe(true);
    expect(rsvp.response).toBe('no');
  });

  it('should detect "maybe" response', async () => {
    const rsvp = await extractRSVP(
      "I'll try to make it but not sure yet"
    );

    expect(rsvp.isResponse).toBe(true);
    expect(rsvp.response).toBe('maybe');
  });

  it('should achieve >90% accuracy on test cases', async () => {
    let correctCount = 0;

    for (const testCase of RSVP_TEST_CASES) {
      const rsvp = await extractRSVP(testCase.input);

      if (testCase.expected.isInvitation !== undefined) {
        if (rsvp.isInvitation === testCase.expected.isInvitation) {
          correctCount++;
        }
      } else if (testCase.expected.response) {
        if (rsvp.response === testCase.expected.response) {
          correctCount++;
        }
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    const accuracy = (correctCount / RSVP_TEST_CASES.length) * 100;
    console.log(`✅ RSVP tracking accuracy: ${accuracy.toFixed(1)}%`);

    expect(accuracy).toBeGreaterThanOrEqual(90);
  });
});
```

#### Accuracy Tests for Deadline Extraction

```typescript
// lib/ai/__tests__/deadlines.accuracy.test.ts
import { extractDeadlines, DEADLINE_TEST_CASES } from '../deadlines';

describe('Deadline Extraction - Accuracy', () => {
  it('should extract deadline with specific date', async () => {
    const deadlines = await extractDeadlines(
      "Report due Friday, March 15th by 5pm"
    );

    expect(deadlines).toHaveLength(1);
    expect(deadlines[0].task.toLowerCase()).toContain('report');
    expect(deadlines[0].dueDate).toBeDefined();
    expect(deadlines[0].dueTime).toContain('5');
    expect(deadlines[0].confidence).toBeGreaterThan(0.8);
  });

  it('should extract deadline with relative date', async () => {
    const deadlines = await extractDeadlines(
      "Submit proposal by end of day tomorrow"
    );

    expect(deadlines).toHaveLength(1);
    expect(deadlines[0].task.toLowerCase()).toContain('proposal');
    expect(deadlines[0].dueDate).toBeDefined();
  });

  it('should differentiate deadlines from calendar events', async () => {
    const deadlines = await extractDeadlines(
      "Birthday party Saturday" // Event, not deadline
    );

    // Should not extract or have low confidence
    expect(deadlines.length === 0 || deadlines[0].confidence < 0.5).toBe(true);
  });

  it('should extract multiple deadlines', async () => {
    const deadlines = await extractDeadlines(
      "Code review due Monday, documentation due Wednesday, and final testing by Friday"
    );

    expect(deadlines.length).toBeGreaterThanOrEqual(2);
  });

  it('should achieve >90% accuracy on test cases', async () => {
    let correctCount = 0;

    for (const testCase of DEADLINE_TEST_CASES) {
      const deadlines = await extractDeadlines(testCase.input);

      if (testCase.expected === null) {
        if (deadlines.length === 0) correctCount++;
      } else {
        if (deadlines.length > 0) {
          const deadline = deadlines[0];
          const hasTask = deadline.task
            .toLowerCase()
            .includes(testCase.expected.task.toLowerCase());

          if (hasTask) correctCount++;
        }
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    const accuracy = (correctCount / DEADLINE_TEST_CASES.length) * 100;
    console.log(`✅ Deadline extraction accuracy: ${accuracy.toFixed(1)}%`);

    expect(accuracy).toBeGreaterThanOrEqual(90);
  });
});
```

---

### Validation Checklist

- [ ] RSVP extraction Cloud Function deployed
- [ ] Deadline extraction Cloud Function deployed
- [ ] Can detect invitations in messages
- [ ] Can track RSVP responses (yes/no/maybe)
- [ ] RSVP status shows in group chats
- [ ] Deadlines display in Deadlines tab
- [ ] Deadlines sorted by due date
- [ ] Overdue deadlines highlighted
- [ ] Can mark deadline as complete
- [ ] RSVP accuracy >90%
- [ ] Deadline accuracy >90%
- [ ] AI processing <2s

---

## AI Phase Complete - Validation

After completing PR #6, #7, and #8, validate all AI features:

### AI Features Checklist

#### Calendar Events (PR #6)
- [ ] Auto-extracts calendar events from messages
- [ ] Events display in Deadlines tab
- [ ] Sorted by date
- [ ] Low-confidence events marked
- [ ] Accuracy >90%

#### Decisions (PR #7)
- [ ] Detects decision points
- [ ] Tracks pending vs. resolved
- [ ] Decisions tab displays all decisions
- [ ] Can mark decision as complete
- [ ] Accuracy >90%

#### Priority (PR #7)
- [ ] Detects message priority (critical/high/medium/low)
- [ ] Visual priority badges display
- [ ] Filters work correctly
- [ ] Accuracy >90%

#### RSVP (PR #8)
- [ ] Detects invitations
- [ ] Tracks RSVP responses
- [ ] Shows who responded
- [ ] Accuracy >90%

#### Deadlines (PR #8)
- [ ] Extracts deadlines from messages
- [ ] Displays with countdown
- [ ] Overdue highlighting works
- [ ] Can mark as complete
- [ ] Accuracy >90%

---

### Performance Validation

Document results for all AI features:

```markdown
# AI Features Performance Results

## Accuracy Metrics
- Calendar extraction: ___% (Target: >90%)
- Decision detection: ___% (Target: >90%)
- Priority detection: ___% (Target: >90%)
- RSVP tracking: ___% (Target: >90%)
- Deadline extraction: ___% (Target: >90%)

## Performance Metrics
- Calendar AI processing: ___ms (Target: <2000ms)
- Decision AI processing: ___ms (Target: <2000ms)
- Priority AI processing: ___ms (Target: <2000ms)
- RSVP AI processing: ___ms (Target: <2000ms)
- Deadline AI processing: ___ms (Target: <2000ms)

## Cost Analysis
- Average OpenAI cost per message: $___
- Estimated monthly cost (1000 users, 50 messages/day): $___
```

**All targets must pass before proceeding to PR #9 (Proactive Assistant).**

---

## Test Summary

### Tests Added in This Phase

| Test Type | Count | Purpose |
|-----------|-------|---------|
| Calendar Accuracy Tests | 7 | Validate >90% extraction accuracy |
| Calendar Performance Test | 2 | Ensure <2s processing |
| Decision Accuracy Tests | 5 | Validate decision detection >90% |
| Priority Accuracy Tests | 5 | Validate priority detection >90% |
| RSVP Accuracy Tests | 5 | Validate RSVP tracking >90% |
| Deadline Accuracy Tests | 5 | Validate deadline extraction >90% |
| **Total** | **29** | **Complete AI feature validation** |

### Cumulative Test Count

| Phase | Tests | Cumulative |
|-------|-------|------------|
| Foundation (PR #1) | 13 | 13 |
| Core Messaging (PR #2-3) | 22 | 35 |
| Resilience (PR #4-5) | 17 | 52 |
| AI Features (PR #6-8) | 29 | **81** |

---

## For Coding Agents

### TDD Workflow for This Phase

1. **Read this shard** for requirements
2. **Reference [04-implementation-guide.md](./04-implementation-guide.md)** for PR #6 code
3. **Write tests first** (all 29 tests above)
4. **Run tests** → Should FAIL (RED)
5. **Implement code** from guide + design PR #7 & #8
6. **Run tests** → Should PASS (GREEN)
7. **Validate accuracy** (must be >90% for each feature)
8. **Document performance** and cost metrics
9. **Commit with test results**

### Example Commit Message

```
feat(ai): implement calendar extraction with >90% accuracy

PR #6: AI Infrastructure + Calendar Extraction
- Cloud Functions with OpenAI GPT-4 Turbo
- Calendar event extraction from messages
- Deadlines tab UI with event display
- Auto-extraction on message send
- Accuracy: 94.2% (target >90%) ✅
- Performance: 1.4s avg (target <2s) ✅

Tests: 9/9 passing
Cost: $0.012 per message
```

### Important Notes

- **API Costs:** AI tests call OpenAI API and cost money (~$0.01-0.02 per test)
- **Rate Limiting:** Add 1s delays between API calls in tests
- **Environment:** Set `OPENAI_API_KEY` before running tests
- **Parallel Development:** PR #7 and #8 can run simultaneously
- **Accuracy First:** Don't proceed if accuracy <90%

---

← [Previous: Resilience](./08-implementation-resilience.md) | [README](./README.md) | [Next: Advanced Features](./10-implementation-advanced.md)
