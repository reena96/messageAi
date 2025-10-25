# Optimistic UI Update UX

## Intended User Experience
- Reflect user actions instantly (sending messages, reactions, edits) without waiting for network confirmation.
- Make optimistic items visually consistent with confirmed content, while subtle affordances (e.g., pending tint, spinner) communicate in-flight state.
- Handle failures gracefully with inline retry controls and clear status copy, keeping the user in context.
- Avoid double actions or duplicate toasts by reconciling optimistic entries with server responses seamlessly.
- Maintain accessibility expectations: announcing pending states and outcome updates to screen readers.

## Algorithm To Implement It
1. Generate a client-side temporary id for optimistic entities and enqueue them in the normalized store.
2. Update the UI immediately, marking optimistic entries with a `status` field (`pending`, `confirmed`, `failed`).
3. Fire network mutation; capture cancellation token for potential rollback.
4. On success, replace the temporary id with the server id and merge authoritative payload into the store.
5. On failure, transition `status` to `failed`, surface retry affordance, and log telemetry.
6. Implement idempotency guards so retries do not duplicate messages (e.g., include client id in payload).
7. Garbage collect expired optimistic entries after retry attempts or navigation away.

## Potential Tool Use And Approaches
- Mutation libraries with built-in optimism (RTK Query `updateQueryData`, React Query `onMutate` hooks).
- Network layer instrumentation (Sentry, Datadog) to monitor failure rates and surface qualitative feedback.
- Offline-first helpers (WatermelonDB, Redux Offline) if background sync or queueing is required.
- Jest/RTL integration tests simulating network latency to validate UI state transitions.
- Visual regression tests (Storybook interactions) to lock spinner/badge behaviors.

## Best Recommended Approach
Use a normalized store with optimistic reducers that create temporary entities, tagged by `clientGeneratedId`. Keep a slim metadata slice describing optimistic status and retry counts. Utilize existing data-fetching layer (e.g., RTK Query) for mutation life cycle hooks, ensuring successful responses reconcile ids and payloads. Expose a centralized retry handler that can either auto-retry or prompt the user, depending on failure type.

## Task List To Implement
1. **Schema and metadata**
   - Extend entities with `clientGeneratedId`, `optimisticStatus`, `errorCode`, and timestamps for enqueue/settled times.
   - Store mutation context (payload hash, retry count) in a parallel queue slice for easier reconciliation and analytics.
2. **Mutation orchestration**
   - Build utility helpers (e.g., `enqueueOptimisticMessage`) that insert optimistic entities and return a resolver for success/failure.
   - Ensure helpers register cancellation tokens so UI can cancel messages (e.g., user deletes pending message).
   - Integrate with existing networking layer: for RTK Query, use `onQueryStarted`; for custom clients, provide middleware hooks.
3. **Resolution and reconciliation**
   - On success, atomically replace the temporary id with the server id while copying over authoritative fields (timestamps, receipts).
   - Handle out-of-order responses by matching on `clientGeneratedId` and ignoring stale responses based on sequence numbers.
   - On failure, transition to `failed`, attach error metadata, and expose a consistent retry action signature.
4. **User-facing treatments**
   - Design pending state visuals (lighter bubble, inline spinner) with accessibility labels like "Sending…".
   - For failures, show inline error state with "Tap to retry" CTA plus toast/snackbar for additional context if needed.
   - Respect offline mode by queueing mutations and surfacing a persistent offline banner.
5. **Retry and rollback policy**
   - Define retry strategy tiers: automatic (transient errors), manual (validation errors), and abort (permanent failures).
   - Provide centralized retry handler that replays the original mutation request using stored payload hash/idempotency token.
   - Allow manual cancellation that removes the optimistic entity and notifies the backend if necessary.
6. **Instrumentation and error handling**
   - Emit telemetry for optimism lifecycle events: enqueued, resolved, failed, retried, canceled.
   - Correlate telemetry with network traces (e.g., request id headers) for debugging.
   - Capture screenshots or console logs automatically when failure rate crosses threshold.
7. **Testing strategy**
   - Unit tests for reducers ensuring optimistic state transitions cover all statuses.
   - Integration tests simulating network latency, success, and various failure codes to verify UI state changes.
   - Accessibility tests verifying screen reader announcements for status changes and focus management on retries.
   - End-to-end tests that cover offline mode, app relaunch with pending queue, and server reconciliation.
8. **Operational readiness**
   - Document developer workflow for debugging optimistic states (log helpers, DevTools panels).
   - Establish rollback/kill-switch plan: feature flag or server toggles to disable optimism if regressions arise.
   - Define rollout metrics (latency improvement, user retries, failure rate) and create dashboards/alerts pre-launch.
