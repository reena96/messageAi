# Push Notifications Strategy

**Last updated:** 2025-02-14  
**Author:** Assistant (Codex CLI)

---

## 1. Current State Assessment
- No client-side notification setup exists (`lib/notifications/*` and related Cloud Functions are absent). Dependencies include `@react-native-firebase/messaging`, but the app currently relies on the web Firebase JS SDK (`firebase/app`) which cannot deliver native push notifications.
- No device token management, permission prompts, or notification channel configuration are present in the React Native code.
- Backend (`functions/src`) has no notification trigger; message creation does not fan out push notifications.
- User persona (busy parents) values reliable, context-rich alerts with minimal noise (see `docs/plans/01-messageai-prd.md`).

## 2. Can We Use Firebase JS for Push?
- **React Native (native apps):** The Firebase JS SDK does *not* support background push notifications; it lacks access to APNs/FCM native layers. We must use either `@react-native-firebase/messaging` (bare React Native/Expo Dev Client) or `expo-notifications` + Expo Push service. Firebase JS alone is only viable for web/PWA targets with service workers.
- **Web/PWA:** Firebase JS can show push notifications via Service Workers, but that does not cover our iOS/Android builds. Conclusion: we need native modules to meet app requirements.

## 3. Notification Modalities We Can Offer
- **Immediate message alerts:** Standard FCM notification payload (title/body) for every new message when the app is backgrounded or quit.
- **Data-only pushes:** Silent data messages to refresh local caches or trigger in-app banners when the app is foregrounded.
- **High-priority “time-sensitive” alerts:** Mark critical updates (schedule changes, sick kid alerts) using iOS Time Sensitive interruption level and Android high-importance channels.
- **Reminder scheduling:** AI-generated deadlines can create scheduled/local notifications (e.g., permission slip due tomorrow at 7pm). Requires storing reminder metadata and scheduling local notifications client-side.
- **Digest/bundled summaries:** Periodic pushes (e.g., “Evening summary: 2 new events, 1 decision”) to reduce notification fatigue—mirrors Slack/WhatsApp mute + summary features.
- **Actionable notifications:** Quick actions (e.g., “RSVP Yes/No”, “Mark done”) using iOS UNNotificationAction / Android action buttons where supported.

## 4. Industry Benchmarks & UX Standards
- **WhatsApp / iMessage:** Immediate message alerts with sender photo, message preview, quick reply. Reliability and speed are critical.
- **Slack / Teams:** Notification categories, keyword alerts, do-not-disturb schedules, collapsible threads. Focus on relevance and configurability.
- **Parent-focused apps (ClassDojo, Remind):** Separate channels for urgent school alerts vs general chatter, scheduled reminders, digest emails/pushes for daily recap.
- **Best practices to adopt:**
  - Pre-permission screen explaining value (“Get instant updates on schedule changes”).
  - Respect platform guidelines (Time Sensitive justification on iOS, channel descriptions on Android).
  - Provide notification settings inside app (mute chat, choose alert level, snooze schedules).
  - Include rich context: child name, activity, time, actionable next step (“Practice moved to 5pm — tap to update calendar”).
  - Use batching to avoid overloading parents; send high-signal alerts individually, group low-priority updates.

## 5. Personalization Opportunities for Parents
- **Context-aware copy:** Use the child’s name, event type, and urgency (“Emma’s soccer practice moved to 5pm today”).
- **Priority scoring:** Leverage AI classifiers (priorityDetection, deadlineExtraction, calendarExtraction, rsvpTracking) to assign urgency tiers and decide whether to push immediately or bundle.
- **Smart quiet hours:** Allow parents to set family bedtime/morning quiet windows; only “time-sensitive” alerts break through.
- **Digest scheduling:** Offer configurable digest times (morning briefing, afternoon wrap-up) summarizing events, outstanding RSVPs, looming deadlines.
- **Adaptive channel tuning:** Track which chats the parent interacts with most; reduce pushes for low-engagement threads or suggest muting.
- **Cross-device coherence:** Ensure tapping a notification opens the relevant chat and pre-scrolls to the highlighted message/summary.
- **Feedback loop:** Inline thumbs-up/down on AI-generated alert summaries to improve models over time.

## 6. Recommended Implementation Approach
1. **Foundation (FCM integration):**
   - Switch to native Firebase Messaging (`@react-native-firebase/messaging`) or `expo-notifications` with FCM/APNs configuration.
   - Request permissions with a contextual explainer screen; store decision to avoid repeated prompts.
   - Register device tokens, store in Firestore under user profiles (with platform & device metadata).
   - Configure Android channels (Default, High Priority, Digest) and iOS categories/time-sensitive capabilities.

2. **Server triggers:**
   - Add Cloud Function (`functions/src/notifications/sendMessageNotification.ts`) that fires on message writes.
   - Compose payloads: include `chatId`, `messageId`, `priority`, `category`. Use notification payload for background delivery, data payload for in-app handling.
   - Implement topic or per-chat subscriptions for scalability (parents automatically join/leave topics based on membership).

3. **AI-driven enrichment:**
   - Extend AI pipelines (priorityDetection, calendarExtraction, deadlineExtraction, rsvpTracking) to flag messages needing elevated notifications.
   - For deadline/calendar events, schedule local reminders (store metadata, schedule with `expo-notifications` or native APIs).
   - Generate digest payloads server-side (daily Cloud Function cron) summarizing key updates.

4. **UX polish & settings:**
   - Build Notification Preferences screen: toggle per-chat alerts, quiet hours, digest frequency, “urgent only” mode.
   - Implement deep link handling so tapping a notification navigates to the specific chat/message/AI summary.
   - Add in-app banners for foreground updates with quick actions (reply, mark read, snooze).

5. **QA & Observability:**
   - Test matrix across iOS/Android (foreground, background, quit states).
   - Instrument delivery/failure metrics (store token validity, FCM responses).
   - Add analytics events for notification interactions to measure effectiveness and tune personalization.

### Clean UX Guardrails
- **Consent journey:** Lead with a branded pre-permission explainer, surface OS prompt only once, and route declined users to a friendly follow-up card with “Enable notifications” CTA that deep-links into device settings.
- **Copy & visuals:** Keep titles under 45 characters, front-load the child/activity context, reuse avatar imagery from chats, and ensure every push carries a single clear next step.
- **Foreground handling:** Use a unified banner component for in-app alerts so messages, reminders, and AI digests feel consistent; allow swipe-to-dismiss without losing the update (archive it in the digest view).
- **Settings access:** Mirror system categories (Default, High Priority, Digest) inside the app, expose snooze/quiet hours in two taps or less, and show live previews as parents adjust preferences.
- **Accessibility:** Verify large-text layouts, VoiceOver/TalkBack labels for quick actions, high-contrast color tokens, and haptic cues that differentiate urgent vs routine alerts.
- **Resilience:** Detect token failures or permission revokes and surface a gentle “Notifications paused” toast with remediation tips; default to email/SMS backup when we cannot deliver critical pushes.

## 7. Open Questions & Risks
- **One app, many platforms:** If web/PWA becomes a target, we will need a service worker implementation in parallel (Firebase JS messaging) and a shared notification preference model.
- **Expo vs bare workflow:** Confirm whether the team is staying on Expo Dev Client; if so, verify compatibility with `@react-native-firebase/messaging` (requires config via `expo prebuild`).
- **Token lifecycle:** Need a strategy for token rotation, revocation, and GDPR-compliant deletion.
- **Backlog coordination:** Align with AI feature roadmap so notification priorities reflect real-time AI insights without over-alerting.
- **Time Sensitive approvals:** Apple may require justification for Time Sensitive category; ensure policy compliance.

---

### Next Actions
1. Decide on native notification stack (`@react-native-firebase/messaging` vs `expo-notifications`).
2. Scope UI for permission education and notification preferences.
3. Design Firestore data schema for device tokens and notification settings.
4. Draft Cloud Function architecture for message-triggered and scheduled notifications.
5. Prototype personalization heuristics leveraging existing AI outputs.

## 8. Simulator & Emulator Support Matrix
- **iOS Simulator (macOS):**
  - Remote push (APNs/FCM) delivery is blocked; cannot validate real background/quit notifications.
  - Local notifications, permission prompts, notification categories/actions, and UI flows are testable.
  - Use physical iOS hardware for end-to-end push verification, including Time Sensitive alerts and action handling.
- **Android Emulator (macOS with Expo Dev Client):**
  - Supports full FCM remote push delivery when built with custom native modules (`expo prebuild` + `@react-native-firebase/messaging` or equivalent).
  - Requires Google Play Services image and configured `google-services.json`.
  - Suitable for validating deep links, action buttons, and background data messages during development.

## 9. Additional Parent Pain Points We Can Address
- **Carpool coordination:** Push a reminder when it’s a parent’s turn to drive or when another parent signals a delay, preventing confusion around pickups and drop-offs.
- **Attendance alerts:** Notify immediately if a child is marked absent, or if practice is cancelled last minute, so parents can plan accordingly.
- **Packing checklists:** Trigger reminders the evening before events (e.g., “Bring cleats and water bottle for tomorrow’s game”) sourced from AI-detected requirements in chat threads.
- **Medication schedules:** For children with health needs, schedule discreet reminders aligned with chat discussions about dosage or timing to ensure doses aren’t missed.
- **Budget/payment nudges:** Send polite nudges close to deadlines for fees, fundraisers, or contributions surfaced by deadline extraction.
- **Safety confirmations:** Offer opt-in “home safe” pings when a child’s location-share or check-in message arrives, reassuring caregivers after late activities.
- **Shared task follow-up:** When chores or to-dos are assigned in chat, push targeted reminders to the responsible parent with completion prompts or quick-mark-done actions.

## 10. Key User Scenarios & Flows
1. **Urgent schedule change**
   - Trigger: Coach posts “Practice moved to 5pm today.”
   - Flow: AI flags as high priority → Cloud Function sends Time Sensitive push → Parent taps notification → App deep-links to chat highlighting message → Inline action offers “Add to calendar” or “Acknowledge.”

2. **Carpool reminder**
   - Trigger: Shared carpool schedule assigns today’s pickup to the parent.
   - Flow: Scheduled reminder sent 45 minutes prior → Notification copy references child and location → Parent can tap “Running late” quick action to inform group or “On my way” to auto-post status.

3. **Deadline approaching**
   - Trigger: AI extracts “Permission slip due Friday.”
   - Flow: Local reminder scheduled 24 hours and 2 hours before deadline → Push includes quick link to uploaded form → Parent marks “Done,” suppressing further alerts.

4. **RSVP status update**
   - Trigger: Group poll reaches quorum or event headcount changes.
   - Flow: Data-only push updates in-app badge → Foreground banner summarizes new RSVP counts → Tap opens event detail sheet with quick actions for “RSVP Yes/No.”

5. **Daily digest**
   - Trigger: Evening digest cron job.
   - Flow: Cloud Function compiles highlights (events added, outstanding tasks) → Digest notification arrives at user-selected time → Deep link opens digest view with expandable sections and completion toggles.

6. **Medication reminder**
   - Trigger: Caregiver logs medication schedule in chat.
   - Flow: AI schedules recurring local notifications → Push tone subdued, includes dosage info → Quick action “Taken” logs compliance; missed responses trigger gentle follow-up.

7. **Safety check-in**
   - Trigger: Child taps “Arrived” button in companion app or sends agreed keyword.
   - Flow: Backend generates confirmation push to designated caregivers → Tap opens safety timeline, offering “Notify other parent” shortcut.

8. **Payment due**
   - Trigger: Team treasurer posts payment reminder with due date.
   - Flow: AI sets reminder close to due date → Push includes secure payment link → “Paid” quick action logs status and informs organizer, preventing duplicate nudges.

9. **Task assignment follow-up**
   - Trigger: Parent assigns “Bring snacks” to another caregiver.
   - Flow: Task stored with due date → Reminder push sent the morning of event → Quick action “Ready” posts confirmation; if ignored, digest includes outstanding task.

10. **Low-priority chatter management**
    - Trigger: Group enters high-volume casual conversation.
    - Flow: AI detects low priority → Notifications auto-bundle into hourly summary → Parent receives single digest push (“12 new messages in Neighborhood Chat; no urgent updates”) reducing disturbance while keeping awareness.

11. **AI chat recap (Gemini/Teams-style)**
    - Trigger: Chat crosses threshold of important updates within a time window (e.g., after team meeting or strategy discussion).
    - Flow: AI compiles concise summary with key decisions, action items, upcoming events → Push delivers “Today’s team recap” with highlight bullets → Tap opens summary card pinned atop chat, offering quick navigation to referenced messages or one-tap acknowledgments.

## 11. Feasibility, Limitations, and Near-Term Possibilities
- **Expo workflow constraints:** We run an Expo Custom Dev Client but have not yet configured native modules. Implementing `@react-native-firebase/messaging` (or `expo-notifications` with bare modules) requires `expo prebuild`, native build scripts, and ongoing maintenance of iOS/Android native projects.
- **Firebase JS vs native SDK:** Current code initializes only the web Firebase JS SDK. To support push, we must add native Firebase App/Messaging setups, service credentials (`GoogleService-Info.plist`, `google-services.json`), and ensure APNs certificates/keys are provisioned.
- **Backend triggers missing:** Sending notifications demands new Cloud Functions (message writes, digest jobs) plus secure token storage. We also need automation for topic management and retry/error logging.
- **AI signal maturity:** Existing AI functions (priorityDetection, etc.) return structured data but may not yet deliver production-accuracy urgency scores or deadlines. We’ll need evaluation, guardrails, and fallback behavior to avoid noisy notifications.
- **Scheduling/local alerts:** Cross-platform scheduling of local notifications requires persistence and reconciliation (e.g., if a reminder is marked done on another device). We must design conflict resolution and sync rules.
- **Permissions & policy compliance:** Apple’s Time Sensitive category, Android notification channels, and background activity all have review implications. We must document user-facing value and supply controls to pass App Store review.
- **Performance & cost:** High-volume groups may trigger many AI runs and notification sends. We need quotas for Cloud Functions, rate limiting per chat, and analytics to avoid runaway costs or spammy behavior.
- **What’s realistic near-term:** 
  - Phase 1: Implement foundational push (permissions, token sync, message alerts, tap-to-open chat).
  - Phase 2: Layer AI-priority routing, daily digests, and quick actions for RSVPs/tasks.
  - Phase 3: Add advanced scenarios (carpool reminders, medication schedules, AI recaps) once AI pipelines and scheduling infrastructure prove reliable.

## 12. PR Task Checklist (Granular)

### Phase 1 – Foundation & Delivery
- [ ] **Native setup:** Add `@react-native-firebase/messaging` (or `expo-notifications`) via `expo prebuild`; configure iOS entitlements and Android manifest for push.
- [ ] **Credentials:** Add `GoogleService-Info.plist`, `google-services.json`, APNs key/cert instructions, and update `FIREBASE_SETUP.md`.
- [ ] **Bootstrap module:** Create `lib/notifications/setup.ts` to request permissions, obtain FCM tokens, handle foreground messages, and expose navigation hooks.
- [ ] **Permission education:** Ship branded pre-permission explainer screen, track user decision, and trigger the OS prompt exactly once with an inline “Enable notifications” retry path.
- [ ] **Token persistence:** Extend Firestore user profile with device token subcollection (deviceId, platform, lastSeen, expoVersion); add update/remove flows.
- [ ] **Navigation handling:** Implement notification tap routing (initial notification, background tap) to open target chat/message.
- [ ] **Android channels:** Define notification channels (Default, High Priority, Digest) with localized descriptions.
- [ ] **Resilience hooks:** Detect revoked permissions or token failures, surface “Notifications paused” toast with remediation CTA, and handoff critical alerts to fallback channel (email/SMS) when push is unavailable.
- [ ] **Instrumentation:** Add debugging logs and analytics events for token registration and notification receipts.

### Phase 2 – AI Signal Integration & Preferences
- [ ] **Priority service:** Wire AI outputs (priorityDetection, deadlineExtraction, calendarExtraction, rsvpTracking) into notification payload builder; map priorities to channels/categories.
- [ ] **Cloud Functions:** Implement `functions/src/notifications/sendMessageNotification.ts` trigger for new messages (includes category, priority, metadata) and `functions/src/notifications/scheduleDigest.ts` for scheduled digests.
- [ ] **Foreground UX:** Build unified in-app banner/toast for foreground pushes with quick action buttons (reply, mark read, snooze) and archive dismissed items into the digest view.
- [ ] **Notification settings UI:** Add screen to manage per-chat alerts, quiet hours, digest timing, “urgent only” toggle, and AI recap opt-in.
- [ ] **Preview & theming:** Mirror Android channel/iOS category labels in settings, display live previews as parents adjust preferences, and reuse chat avatars in notification mockups.
- [ ] **Digest view:** Create in-app digest summary surface opened via notifications, showing grouped highlights and completion toggles.
- [ ] **Accessibility support:** Ensure dynamic type, VoiceOver/TalkBack labels, high-contrast themes, and haptic differentiation across notification surfaces.
- [ ] **Analytics:** Track notification engagements (open, dismiss, quick action) and preference changes.

### Phase 3 – Advanced Parent Workflows
- [ ] **Carpool reminder engine:** Store rotation metadata; schedule reminders and quick responses (“On my way”, “Running late”).
- [ ] **Medication scheduler:** Support recurring local notifications with compliance logging and caregiver notifications on misses.
- [ ] **Payment tracker:** Tie deadlineExtraction to payment reminders with quick “Paid” acknowledgment and organizer update.
- [ ] **Safety check-in flow:** Capture arrival signals and push confirmations with optional broadcast to other caregivers.
- [ ] **Packing checklist reminders:** Detect required items in chat, generate evening-before reminders with checklist actions.
- [ ] **AI recap generator:** Build summarization job (on-demand & scheduled) and push “Today’s team recap” notifications linking to summary card.
- [ ] **Task follow-up automation:** Convert assigned chores/tasks into reminders with “Ready”/“Snooze” quick actions and status sync.

### QA, Ops, and Compliance
- [ ] **End-to-end device testing:** Document test plan across iOS hardware + Android emulator (foreground/background/killed states).
- [ ] **Copy compliance:** Validate push titles stay under 45 characters, include child/activity context first, and present a single clear action.
- [ ] **Banner persistence:** Confirm swipe-dismissed foreground banners remain available in digest/history surfaces.
- [ ] **Settings usability:** Usability-test that snooze/quiet hours are reachable within two taps and mirror OS channel names.
- [ ] **Accessibility audit:** Verify large-text layouts, VoiceOver/TalkBack labels, high-contrast tokens, and distinct haptics across urgency tiers.
- [ ] **Token lifecycle scripts:** Add cleanup for invalid tokens and rotation handling.
- [ ] **Rate limiting:** Implement safeguards (per-user limits, per-chat throttling) to avoid notification floods.
- [ ] **Policy review prep:** Draft App Store review notes explaining Time Sensitive usage, data handling, and user controls.
- [ ] **Monitoring:** Set up logging dashboards/alerts for Cloud Function failures, notification send errors, AI signal anomalies.
- [ ] **User feedback loop:** Surface thumbs-up/down on AI notifications and feed results into retraining backlog.
- [ ] **Failure recovery:** Simulate revoked permissions/token deletion to ensure “Notifications paused” messaging and fallback channel activation.

## 13. Validation & Acceptance Criteria
- **Consent journey:** Pre-permission explainer appears before the OS prompt; declining shows an inline “Enable notifications” CTA that deep-links to device settings.
- **Notification clarity:** Push titles <45 characters, first line names the child/activity, and each notification offers exactly one primary action or deep link.
- **Foreground experience:** Unified banner component renders for data/AI events, supports reply/mark read/snooze, and dismissed items are retrievable from the digest view.
- **Settings parity:** In-app notification settings mirror system channel/category names, display live previews, and expose quiet hours/snooze within two taps.
- **Accessibility readiness:** Dynamic type, VoiceOver/TalkBack, high-contrast mode, and urgency-specific haptics are verified on both iOS and Android.
- **Resilience:** Permission/token loss triggers “Notifications paused” messaging and routes critical alerts to fallback channels; analytics capture remediation taps.
