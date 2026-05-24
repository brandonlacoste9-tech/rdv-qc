# Plan: Production Voice Agent System
## Autonomous Execution Plan - Tonight's Build

### Overview
Transform the current voice agent demo into a production-ready system with billing, workflows, and multi-provider support.

---

## Phase 1: Billing & Credits (Priority: HIGH)
**Estimated Time: 2-3 hours**

### 1.1 Database Schema Updates
```sql
-- Voice credits table
CREATE TABLE voice_credits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    userId TEXT NOT NULL REFERENCES users(id),
    balance INTEGER NOT NULL DEFAULT 0, -- in cents (1 credit = $0.01)
    lifetimeCredits INTEGER NOT NULL DEFAULT 0,
    createdAt TIMESTAMP DEFAULT NOW(),
    updatedAt TIMESTAMP DEFAULT NOW()
);

-- Voice credit transactions
CREATE TABLE voice_credit_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    userId TEXT NOT NULL,
    amount INTEGER NOT NULL, -- positive = purchase, negative = usage
    type TEXT NOT NULL, -- 'purchase', 'usage', 'refund', 'bonus'
    description TEXT,
    callSid TEXT REFERENCES voice_calls(callSid),
    createdAt TIMESTAMP DEFAULT NOW()
);

-- Add credit tracking to voice_calls
ALTER TABLE voice_calls ADD COLUMN creditsUsed INTEGER DEFAULT 0;
ALTER TABLE voice_calls ADD COLUMN costPerMinute DECIMAL(10,4) DEFAULT 0.15;
```

### 1.2 Stripe Integration
- Create Stripe product: "Voice Credits"
- Pricing tiers:
  - $10 = 1000 credits (~66 minutes)
  - $25 = 2750 credits (~183 minutes) - 10% bonus
  - $50 = 6000 credits (~400 minutes) - 20% bonus
- Webhook endpoint: `/api/webhooks/stripe/voice-credits`
- Credit purchase flow:
  1. User selects package
  2. Create Stripe Checkout session
  3. Webhook adds credits on payment success
  4. Send confirmation email

### 1.3 Credit Deduction System
- Real-time deduction during calls
- Per-minute billing: $0.15/min (rounded up)
- Minimum call charge: 1 minute
- Low credit warnings at: $2.00, $0.50, $0.00

---

## Phase 2: Workflow Builder UI (Priority: HIGH)
**Estimated Time: 3-4 hours**

### 2.1 Workflow Types
1. **Booking Reminder** - Call 24h before appointment
2. **No-Show Follow-up** - Call 15 min after missed meeting
3. **Post-Meeting Survey** - Call after meeting ends
4. **Custom Trigger** - User-defined time/condition

### 2.2 Workflow Configuration UI
- Visual workflow builder (React Flow)
- Trigger conditions:
  - Time before/after event
  - Event type filter
  - Attendee properties
- Action: "Make AI Phone Call"
- Message templates with variables:
  - `{{attendeeName}}`
  - `{{eventTitle}}`
  - `{{eventDate}}`
  - `{{eventTime}}`
  - `{{professionalName}}`

### 2.3 Workflow Execution Engine
- Background job runner (BullMQ/Redis)
- Cron schedule: Every 5 minutes
- Check for workflows to trigger
- Queue calls for processing
- Retry failed calls (max 3 attempts)

---

## Phase 3: Multi-Provider Support (Priority: MEDIUM)
**Estimated Time: 2-3 hours**

### 3.1 Provider Interface
```typescript
interface VoiceProvider {
  name: string;
  makeCall(params: CallParams): Promise<CallResult>;
  getTranscript(callSid: string): Promise<Transcript>;
  getPricing(): number; // per minute
}
```

### 3.2 Providers
1. **Custom** (current): Deepgram + ElevenLabs
   - Cost: ~$0.12-0.32/min
   - Best for: Full control, lower cost

2. **Retell AI** (integration)
   - Cost: ~$0.05-0.08/min
   - Best for: Quick setup, reliability
   - API: REST + WebSocket

3. **Twilio AI** (future)
   - Native Twilio integration
   - Cost: ~$0.10/min

### 3.3 Provider Selection
- User chooses provider in settings
- Fallback chain if primary fails
- Automatic cost optimization option

---

## Phase 4: Real-Time Monitoring (Priority: MEDIUM)
**Estimated Time: 2 hours**

### 4.1 Live Dashboard
- Active calls view
- Real-time transcript streaming
- Call quality metrics
- Cost tracking per call

### 4.2 Analytics
- Daily/weekly/monthly usage
- Cost breakdown by provider
- Success rate by call type
- Popular time slots

### 4.3 Alerts
- Low credit email/SMS
- Failed call notifications
- Unusual usage patterns
- Daily usage summary

---

## Phase 5: Testing & QA (Priority: HIGH)
**Estimated Time: 2 hours**

### 5.1 Automated Tests
- Conversation flow tests
- Credit deduction tests
- Provider failover tests
- Webhook integration tests

### 5.2 Load Testing
- Simulate 100 concurrent calls
- Test credit system under load
- Verify database performance

### 5.3 Manual Test Checklist
- [ ] Purchase credits via Stripe
- [ ] Make test call
- [ ] Verify credit deduction
- [ ] Test low credit warning
- [ ] Create and trigger workflow
- [ ] Test provider switching
- [ ] Verify analytics accuracy

---

## Implementation Order

### Tonight (Autonomous Execution)
1. **Hour 1-2**: Database migrations + Stripe setup
2. **Hour 3-4**: Credit system + webhook handlers
3. **Hour 5-6**: Workflow engine + basic UI
4. **Hour 7-8**: Testing + bug fixes

### Tomorrow (User Review)
1. Review credit system
2. Test workflow builder
3. Verify Stripe integration
4. Go-live decision

---

## Files to Create/Modify

### New Files
```
src/lib/voice/billing.ts          # Credit management
src/lib/voice/providers/          # Provider adapters
  - index.ts
  - custom.ts                     # Current implementation
  - retell.ts                     # Retell AI integration
src/app/api/voice/credits/        # Credit API
  - route.ts                      # Get balance
  - purchase/route.ts             # Stripe checkout
src/app/api/webhooks/stripe/      # Stripe webhooks
  - voice-credits/route.ts
src/app/dashboard/voice/workflows/page.tsx  # Workflow builder
src/components/voice/             # Voice UI components
  - WorkflowBuilder.tsx
  - CreditDisplay.tsx
  - LiveCallMonitor.tsx
```

### Modified Files
```
src/lib/voice/conversation.ts     # Add credit deduction
src/app/api/voice/stream/server.ts # Credit tracking
src/app/dashboard/voice/page.tsx  # Add credits + workflows
supabase/migrations/              # New migrations
```

---

## Environment Variables Needed
```
# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...

# Retell AI (optional)
RETELL_API_KEY=...
RETELL_AGENT_ID=...

# Redis (for job queue)
REDIS_URL=redis://...

# Monitoring
SENTRY_DSN=...
```

---

## Success Criteria
- [ ] User can purchase credits via Stripe
- [ ] Credits deducted correctly during calls
- [ ] Low credit warnings sent
- [ ] Workflows trigger automatically
- [ ] Retell AI integration works
- [ ] Dashboard shows real-time data
- [ ] All tests pass

---

## Rollback Plan
If issues arise:
1. Disable voice agent via feature flag
2. Refund any failed credit purchases
3. Revert to current working version
4. Document issues for tomorrow
