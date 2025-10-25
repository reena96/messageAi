# FlatList Inverted Normalized Data UX

## Intended User Experience
- Present chat-style threads that load newest messages at the bottom while keeping scroll position stable when new messages arrive.
- Seamlessly append historical messages as the user scrolls upward, with visual cues indicating fetch status and the point where history continues.
- Maintain smooth momentum scrolling on both iOS and Android without blank frames or jumps during large batch renders.
- Preserve message grouping (day headers, author bubbles) while leveraging normalized data to avoid redundant renders.
- Support accessibility features (screen readers, reduce motion) without compromising interaction, including consistent focus for newly added messages.

## Algorithm To Implement It
1. Store message entities in a normalized shape: `{ ids: string[], entities: Record<string, Message> }`.
2. Maintain a derived selector that maps the `ids` array into UI-ready rows with memoization (e.g., `useMemo` or `createSelector`).
3. Render the derived `ids` via `FlatList` with `inverted` set to `true` and `initialNumToRender` tuned for expected density.
4. Use `maintainVisibleContentPosition` to lock scroll offset when prepending older messages; fall back to manual offset adjustment on unsupported versions.
5. Batch message insertion using `unstable_batchedUpdates` or framework-equivalent to minimize layout thrashing.
6. Throttle fetch triggers with an intersection observer hook (or `onEndReached`) to avoid redundant pagination requests.
7. Apply `getItemLayout` with cached heights where possible to keep scroll jumps predictable when virtualizing long histories.

## Potential Tool Use And Approaches
- React Native `FlatList` profiling tools (e.g., `Systrace`, `Performance Monitor`) to validate render timings.
- Normalization via `@reduxjs/toolkit` entity adapters or custom memoized selectors for non-Redux state managers.
- UI snapshot tools (Storybook, Chromatic) to verify grouping and separators in inverted orientation.
- Automated end-to-end scroll tests (Detox, Maestro) to ensure stable pagination and focus handling.
- Optional use of `react-native-reanimated` for smooth sticky headers when grouping messages.

## Best Recommended Approach
Leverage normalized state (RTK entity adapter or equivalent) with memoized derived selectors feeding a single `FlatList` configured as inverted. Combine `maintainVisibleContentPosition`, batched state updates, and `getItemLayout` caching to keep scroll stable. Feature-flag reanimated or sticky header enhancements, but keep the baseline implementation dependency-light for maintainability. Profile on low-end devices before enabling heavy visual treatments.

## Task List To Implement
1. **Data architecture**
   - Introduce a normalized message slice (ids/entities) plus selectors that return ordered messages, grouped by day and author.
   - Define a `MessageRow` view model type capturing layout-relevant metadata (group boundaries, delivered status, optimistic flags).
   - Add memoized selectors for `MessageRow[]`, ensuring they depend only on the minimal entity keys.
2. **Rendering adapter**
   - Create an adapter hook/component that converts the selector output into `FlatList` data, configuring stable `keyExtractor` logic that swaps client ids for server ids transparently.
   - Centralize bubble/header rendering so the `FlatList` item renderer remains a single pure function.
3. **FlatList shell**
   - Implement a `ConversationList` component that applies `inverted`, `maintainVisibleContentPosition`, tuned `initialNumToRender`, `windowSize`, and `maxToRenderPerBatch`.
   - Provide fallbacks when `maintainVisibleContentPosition` is unavailable (older RN versions) by manually adjusting scroll offset via `scrollToOffset`.
   - Add pagination triggers using both `onEndReached` and a scroll listener threshold to prefetch older history.
4. **Performance safeguards**
   - Implement `getItemLayout` using cached message heights; store per-message height hints to avoid layout thrash.
   - Wrap multi-message insertions in `unstable_batchedUpdates` (or equivalent) and measure render cost via RN Performance Monitor.
   - Add dev tooling (e.g., `__DEV__` overlay) to visualize virtualization windows during QA.
5. **State updates and stability**
   - Ensure message insertion functions accept arrays with chronological order enforced server-side.
   - Build utility that deduplicates incoming messages using ids/timestamps before mutating state.
   - Provide safe guards for real-time pushes racing against pagination results (prefer sequence numbers).
6. **Testing and validation**
   - Unit tests for selectors verifying grouping, memoization, and id swapping.
   - Integration tests (Jest/RTL) that simulate append/prepend flows and assert `FlatList` snapshot stability.
   - End-to-end scroll tests (Detox/Maestro) validating pagination, loader visibility, and focus retention.
7. **Accessibility and fallback UX**
   - Ensure screen readers announce "New message" when the list prepends content while the user is at top.
   - Respect `reduceMotion` by disabling heavy animations or using opacity fades only.
8. **Documentation and rollout**
   - Update engineering docs to outline debugging steps and performance thresholds (fps, dropped frames).
   - Create a rollout plan with feature flag toggles and analytics events for render performance and pagination errors.
