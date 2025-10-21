# MessageAI - Testing Strategy

**Purpose:** Comprehensive testing guide for all implementation phases
**Test Coverage:** Unit, Integration, E2E, Accuracy, Performance
**Total Tests:** ~100 tests across all phases

← [Previous: Advanced Features](./10-implementation-advanced.md) | [README](./README.md) | [Sharding Plan](./IMPLEMENTATION_SHARDING_PLAN.md)

---

## Overview

This document outlines the complete testing strategy for MessageAI, organized by test type and implementation phase. **Testing is mandatory** - no PR should be merged without passing tests.

### Testing Philosophy

1. **Test-Driven Development (TDD)**: Write tests before implementation
2. **RED-GREEN-REFACTOR**: Tests fail → implement → tests pass → refactor
3. **Test Coverage**: Aim for >80% coverage on critical paths
4. **Fast Feedback**: Unit tests run in <5s, integration in <30s

---

## Test Types

### 1. Unit Tests

**Purpose:** Test individual functions/components in isolation

**Characteristics:**
- Fast (<1s per test)
- No external dependencies (mocked)
- Test single responsibility
- High test count (60-70% of all tests)

**Example:**
```typescript
// lib/store/__tests__/authStore.test.ts
describe('authStore - signUp', () => {
  it('should create user account and save to Firestore', async () => {
    // Arrange: Setup mocks
    const mockAuth = { createUserWithEmailAndPassword: jest.fn() };

    // Act: Call function
    await signUp('test@example.com', 'password', 'Test User');

    // Assert: Verify behavior
    expect(mockAuth.createUserWithEmailAndPassword).toHaveBeenCalledWith(
      'test@example.com',
      'password'
    );
  });
});
```

**Coverage:**
- Store functions (authStore, chatStore, messageStore)
- Utility functions (performance, validation)
- Custom hooks (useNetworkStatus)

---

### 2. Integration Tests

**Purpose:** Test interactions between components/systems

**Characteristics:**
- Moderate speed (1-5s per test)
- Multiple components working together
- May use test databases or mocked services
- Critical path validation

**Example:**
```typescript
// lib/store/__tests__/messaging.integration.test.ts
describe('Messaging Flow - Integration', () => {
  it('should send message and trigger AI extraction', async () => {
    // Setup: Create chat
    const chatId = await createChat('user1', 'user2');

    // Act: Send message with calendar event
    await sendMessage(chatId, 'user1', 'Meeting tomorrow at 3pm');

    // Assert: Verify message saved AND AI extraction triggered
    const messages = await getMessages(chatId);
    expect(messages[0].text).toBe('Meeting tomorrow at 3pm');
    expect(messages[0].aiExtraction?.calendarEvents).toBeDefined();
  });
});
```

**Coverage:**
- Message send → receive flow
- Offline queue → sync
- AI extraction pipeline
- Group chat creation → messaging

---

### 3. E2E (End-to-End) Tests

**Purpose:** Test complete user journeys from UI to backend

**Characteristics:**
- Slow (10-60s per test)
- Full app rendering
- Simulates real user interactions
- Low test count (5-10 critical paths)

**Example:**
```typescript
// __tests__/e2e/appFlow.test.ts
describe('E2E - Complete User Journey', () => {
  it('should complete signup → send message → AI extraction', async () => {
    const { getByText, getByPlaceholderText } = renderApp();

    // 1. Sign up
    fireEvent.press(getByText('Sign Up'));
    fireEvent.changeText(getByPlaceholderText('Email'), 'user@test.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'pass123');
    fireEvent.press(getByText('Create Account'));

    await waitFor(() => expect(getByText('Chats')).toBeTruthy());

    // 2. Create chat and send message
    // 3. Verify message received
    // 4. Check AI extraction
    // ...
  });
});
```

**Coverage:**
- Complete signup/login flow
- Send/receive messages
- Offline → online sync
- AI feature activation
- Navigation between screens

---

### 4. Accuracy Tests (AI Features)

**Purpose:** Validate AI extraction accuracy >90%

**Characteristics:**
- Expensive (calls OpenAI API, costs money)
- Run selectively (not on every commit)
- Requires test cases with expected outputs
- Measure precision/recall

**Example:**
```typescript
// lib/ai/__tests__/calendar.accuracy.test.ts
describe('Calendar Extraction - Accuracy', () => {
  it('should achieve >90% accuracy on test cases', async () => {
    let correctCount = 0;

    for (const testCase of CALENDAR_TEST_CASES) {
      const events = await extractCalendarEvents(testCase.input);

      if (matchesExpected(events, testCase.expected)) {
        correctCount++;
      }

      await delay(1000); // Rate limiting
    }

    const accuracy = (correctCount / CALENDAR_TEST_CASES.length) * 100;
    console.log(`✅ Accuracy: ${accuracy.toFixed(1)}%`);

    expect(accuracy).toBeGreaterThanOrEqual(90);
  });
});
```

**Coverage:**
- Calendar extraction (>90%)
- Decision detection (>90%)
- Priority detection (>90%)
- RSVP tracking (>90%)
- Deadline extraction (>90%)
- Proactive Assistant (>90%)

---

### 5. Performance Tests

**Purpose:** Validate performance targets are met

**Characteristics:**
- Measure execution time
- Compare against targets
- Run on production builds
- Document results

**Example:**
```typescript
// lib/store/__tests__/messageStore.performance.test.ts
describe('Message Delivery - Performance', () => {
  it('should deliver message in <200ms on good network', async () => {
    const startTime = Date.now();

    await sendMessage('chat1', 'user1', 'Test message');

    const deliveryTime = Date.now() - startTime;

    console.log(`✅ Delivery time: ${deliveryTime}ms`);
    expect(deliveryTime).toBeLessThan(200);
  });
});
```

**Coverage:**
- App launch (<2s)
- Message delivery (<200ms)
- Offline sync (<1s)
- Scrolling (60 FPS)
- AI processing (<2s simple, <15s advanced)
- Typing indicator (<100ms)
- Presence update (<100ms)

---

## Testing Workflow (TDD)

### Step 1: Write Failing Test (RED)

```typescript
// First, write the test
describe('messageStore', () => {
  it('should send message', async () => {
    const result = await sendMessage('chat1', 'user1', 'Hello');
    expect(result.success).toBe(true);
  });
});

// Run test → FAILS (function doesn't exist yet)
```

### Step 2: Implement Minimal Code (GREEN)

```typescript
// Implement just enough to pass
export async function sendMessage(chatId: string, userId: string, text: string) {
  // Minimal implementation
  return { success: true };
}

// Run test → PASSES
```

### Step 3: Refactor (REFACTOR)

```typescript
// Improve implementation
export async function sendMessage(chatId: string, userId: string, text: string) {
  // Full implementation with error handling, validation, etc.
  try {
    await firestore().collection('chats').doc(chatId).collection('messages').add({
      senderId: userId,
      text,
      timestamp: firestore.FieldValue.serverTimestamp(),
    });
    return { success: true };
  } catch (error) {
    console.error('Send error:', error);
    return { success: false, error };
  }
}

// Run test → STILL PASSES
```

---

## Running Tests

### Run All Tests

```bash
npm test
```

### Run Specific Test File

```bash
npm test -- authStore.test.ts
```

### Run Tests by Pattern

```bash
# All unit tests
npm test -- unit

# All integration tests
npm test -- integration

# All E2E tests
npm test -- e2e

# All accuracy tests (expensive!)
npm test -- accuracy
```

### Run with Coverage

```bash
npm test -- --coverage
```

### Watch Mode (for development)

```bash
npm test -- --watch
```

---

## Test Organization

### Directory Structure

```
messageai/
├── lib/
│   ├── store/
│   │   ├── authStore.ts
│   │   └── __tests__/
│   │       ├── authStore.test.ts (unit)
│   │       └── authStore.integration.test.ts (integration)
│   └── ai/
│       ├── calendar.ts
│       └── __tests__/
│           ├── calendar.accuracy.test.ts (accuracy)
│           └── calendar.performance.test.ts (performance)
├── components/
│   └── chat/
│       ├── MessageBubble.tsx
│       └── __tests__/
│           └── MessageBubble.test.tsx (unit)
└── __tests__/
    ├── e2e/
    │   └── appFlow.test.ts (e2e)
    └── performance/
        └── benchmarks.test.ts (performance)
```

### Naming Conventions

- Unit tests: `<filename>.test.ts`
- Integration tests: `<feature>.integration.test.ts`
- Accuracy tests: `<feature>.accuracy.test.ts`
- Performance tests: `<feature>.performance.test.ts`
- E2E tests: `<flow>.test.ts` (in `__tests__/e2e/`)

---

## Test Coverage Requirements

### By Phase

| Phase | Min Coverage | Actual |
|-------|-------------|--------|
| Foundation (PR #1) | 80% | ___% |
| Core Messaging (PR #2-3) | 75% | ___% |
| Resilience (PR #4-5) | 80% | ___% |
| AI Features (PR #6-8) | 70%* | ___% |
| Advanced (PR #9-11) | 75% | ___% |

*Lower for AI due to external API dependency

### By Component Type

- **Store functions**: >85% coverage
- **Utility functions**: >90% coverage
- **Components**: >70% coverage
- **Cloud Functions**: >80% coverage

---

## Manual Testing Checklists

Some scenarios require manual testing on real devices.

### Offline Scenarios (PR #4)

- [ ] Scenario 1: Send messages while offline
- [ ] Scenario 2: Receive messages while offline
- [ ] Scenario 3: Read receipts while offline
- [ ] Scenario 4: Create chat while offline
- [ ] Scenario 5: Poor network simulation
- [ ] Scenario 6: App backgrounded while offline
- [ ] Scenario 7: Force quit while offline

### Cross-Platform (All PRs)

- [ ] iOS: Sign up → send message → receive
- [ ] Android: Sign up → send message → receive
- [ ] iOS: Offline sync
- [ ] Android: Offline sync
- [ ] iOS: Push notifications
- [ ] Android: Push notifications
- [ ] iOS: All AI features
- [ ] Android: All AI features

### Performance (PR #10A)

- [ ] App launch time (stopwatch): ___ms
- [ ] Message delivery (network inspector): ___ms
- [ ] Scroll 1000+ messages (visual): Smooth? Y/N
- [ ] AI extraction time (stopwatch): ___ms

---

## CI/CD Integration

### Pre-Commit Hook

```bash
# .husky/pre-commit
npm run lint
npm test -- --bail --findRelatedTests
```

### Pre-Push Hook

```bash
# .husky/pre-push
npm test
npm run type-check
```

### GitHub Actions (Future)

```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: npm install
      - run: npm test -- --coverage
      - run: npm run type-check
```

---

## Debugging Failed Tests

### Common Issues

**1. Mock not working**
```typescript
// ❌ Wrong
import firestore from '@react-native-firebase/firestore';
firestore.collection('chats').doc('123').get();

// ✅ Correct
jest.mock('@react-native-firebase/firestore');
const mockFirestore = firestore as jest.Mocked<typeof firestore>;
mockFirestore.mockReturnValue({ ... });
```

**2. Async timing issues**
```typescript
// ❌ Wrong
it('should update state', () => {
  updateState();
  expect(state.value).toBe('new'); // Fails - async not awaited
});

// ✅ Correct
it('should update state', async () => {
  await updateState();
  await waitFor(() => expect(state.value).toBe('new'));
});
```

**3. Firestore timestamp comparison**
```typescript
// ❌ Wrong
expect(message.timestamp).toBe(new Date());

// ✅ Correct
expect(message.timestamp).toBeDefined();
expect(message.timestamp.toDate()).toBeInstanceOf(Date);
```

---

## Test Data Management

### Test Fixtures

```typescript
// __tests__/fixtures/mockData.ts
export const mockUser = {
  uid: 'test-user-1',
  email: 'test@example.com',
  displayName: 'Test User',
};

export const mockChat = {
  id: 'chat-1',
  type: 'one-on-one',
  participants: ['user-1', 'user-2'],
};

export const mockMessage = {
  id: 'msg-1',
  chatId: 'chat-1',
  senderId: 'user-1',
  text: 'Hello world',
  timestamp: new Date(),
};
```

### Using Fixtures

```typescript
import { mockUser, mockChat } from '__tests__/fixtures/mockData';

it('should load user chats', async () => {
  // Use fixture
  const chats = await loadChats(mockUser.uid);
  expect(chats).toContain(mockChat);
});
```

---

## Test Summary by Phase

### Foundation (PR #1) - 13 tests
- 7 unit tests (authStore)
- 6 integration tests (auth flow)

### Core Messaging (PR #2-3) - 22 tests
- 7 unit tests (chatStore)
- 10 unit tests (messageStore)
- 3 integration tests (messaging)
- 2 performance tests

### Resilience (PR #4-5) - 17 tests
- 7 integration tests (offline)
- 1 performance test (offline sync)
- 3 integration tests (group chat)
- 6 integration tests (push notifications)

### AI Features (PR #6-8) - 29 tests
- 7 accuracy tests (calendar)
- 2 performance tests (calendar)
- 5 accuracy tests (decisions)
- 5 accuracy tests (priority)
- 5 accuracy tests (RSVP)
- 5 accuracy tests (deadlines)

### Advanced (PR #9-11) - 17 tests
- 4 accuracy tests (proactive AI)
- 5 E2E tests (app flow)
- 8 performance benchmarks

**Total: ~98 tests**

---

## For Coding Agents

### Before Starting Any PR

1. **Read the implementation shard** for that PR
2. **Identify all tests** listed in the shard
3. **Create test files** with failing tests (RED)
4. **Run tests** → verify they fail
5. **Proceed with implementation**

### During Implementation

1. **Implement minimal code** to pass tests (GREEN)
2. **Run tests frequently** (every 5-10 minutes)
3. **Fix failures immediately** (don't accumulate debt)
4. **Refactor** once tests pass (REFACTOR)

### Before Completing PR

1. **Run full test suite** → all must pass
2. **Check coverage** → meet minimum requirements
3. **Run manual tests** for applicable scenarios
4. **Document results** in commit message
5. **Update PERFORMANCE.md** if applicable

### Example Commit with Test Results

```
feat(offline): implement offline support with comprehensive tests

PR #4: Offline Support + Persistence
- Enhanced Firestore offline persistence
- Message queue with optimistic updates
- Network status monitoring
- 7 offline scenario integration tests
- Offline sync performance test

Tests: 8/8 passing ✅
Coverage: 84% (target >80%) ✅
Performance: Offline sync 847ms (target <1s) ✅

Manual Testing:
- ✅ All 7 offline scenarios validated on iPhone 13
- ✅ All 7 offline scenarios validated on Pixel 6

Co-Authored-By: Claude <noreply@anthropic.com>
```

---

## Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/)
- [Testing Best Practices](https://testingjavascript.com/)
- [TDD Guide](https://martinfowler.com/bliki/TestDrivenDevelopment.html)

---

← [Previous: Advanced Features](./10-implementation-advanced.md) | [README](./README.md) | [Sharding Plan](./IMPLEMENTATION_SHARDING_PLAN.md)
