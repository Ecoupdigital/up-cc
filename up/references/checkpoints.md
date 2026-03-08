<overview>
Plans execute autonomously. Checkpoints formalize interaction points where human verification or decisions are needed.

**Core principle:** Claude automates everything with CLI/API. Checkpoints are for verification and decisions, not manual work.

**Golden rules:**
1. **If Claude can run it, Claude runs it** - Never ask user to execute CLI commands, start servers, or run builds
2. **Claude sets up the verification environment** - Start dev servers, seed databases, configure env vars
3. **User only does what requires human judgment** - Visual checks, UX evaluation, "does this feel right?"
4. **Secrets come from user, automation comes from Claude** - Ask for API keys, then Claude uses them via CLI
</overview>

<checkpoint_types>

<type name="human-verify">
## checkpoint:human-verify (Most Common - 90%)

**When:** Claude completed automated work, human confirms it works correctly.

**Use for:**
- Visual UI checks (layout, styling, responsiveness)
- Interactive flows (click through wizard, test user flows)
- Functional verification (feature works as expected)
- Audio/video playback quality
- Animation smoothness
- Accessibility testing

**Structure:**
```xml
<task type="checkpoint:human-verify" gate="blocking">
  <what-built>[What Claude automated and deployed/built]</what-built>
  <how-to-verify>
    [Exact steps to test - URLs, commands, expected behavior]
  </how-to-verify>
  <resume-signal>[How to continue - "approved", "yes", or describe issues]</resume-signal>
</task>
```

**Example: UI Component**
```xml
<task type="auto">
  <name>Build responsive dashboard layout</name>
  <files>src/components/Dashboard.tsx, src/app/dashboard/page.tsx</files>
  <action>Create dashboard with sidebar, header, and content area.</action>
  <verify>npm run build succeeds, no TypeScript errors</verify>
</task>

<task type="auto">
  <name>Start dev server for verification</name>
  <action>Run `npm run dev` in background, wait for "ready" message</action>
  <verify>curl http://localhost:3000 returns 200</verify>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <what-built>Responsive dashboard layout - dev server running at http://localhost:3000</what-built>
  <how-to-verify>
    Visit http://localhost:3000/dashboard and verify:
    1. Desktop (>1024px): Sidebar left, content right, header top
    2. Tablet (768px): Sidebar collapses to hamburger menu
    3. Mobile (375px): Single column layout, bottom nav appears
  </how-to-verify>
  <resume-signal>Type "approved" or describe layout issues</resume-signal>
</task>
```
</type>

<type name="decision">
## checkpoint:decision (9%)

**When:** Human must make choice that affects implementation direction.

**Use for:**
- Technology selection (which auth provider, which database)
- Architecture decisions (monorepo vs separate repos)
- Design choices (color scheme, layout approach)
- Feature prioritization (which variant to build)

**Structure:**
```xml
<task type="checkpoint:decision" gate="blocking">
  <decision>[What's being decided]</decision>
  <context>[Why this decision matters]</context>
  <options>
    <option id="option-a">
      <name>[Option name]</name>
      <pros>[Benefits]</pros>
      <cons>[Tradeoffs]</cons>
    </option>
    <option id="option-b">
      <name>[Option name]</name>
      <pros>[Benefits]</pros>
      <cons>[Tradeoffs]</cons>
    </option>
  </options>
  <resume-signal>[How to indicate choice]</resume-signal>
</task>
```

**Example: Auth Provider Selection**
```xml
<task type="checkpoint:decision" gate="blocking">
  <decision>Select authentication provider</decision>
  <context>Need user authentication. Three options with different tradeoffs.</context>
  <options>
    <option id="supabase">
      <name>Supabase Auth</name>
      <pros>Built-in with Supabase DB, generous free tier, row-level security</pros>
      <cons>Less customizable UI, tied to Supabase ecosystem</cons>
    </option>
    <option id="clerk">
      <name>Clerk</name>
      <pros>Beautiful pre-built UI, best developer experience</pros>
      <cons>Paid after 10k MAU, vendor lock-in</cons>
    </option>
  </options>
  <resume-signal>Select: supabase or clerk</resume-signal>
</task>
```
</type>

<type name="human-action">
## checkpoint:human-action (1% - Rare)

**When:** Action has NO CLI/API and requires human-only interaction, OR Claude hit an authentication gate.

**Use ONLY for:**
- **Authentication gates** - Claude tried CLI/API but needs credentials
- Email verification links
- SMS 2FA codes
- Manual account approvals
- OAuth app approvals (web-based)

**Do NOT use for:**
- Deploying (use CLI)
- Creating webhooks/databases (use API/CLI)
- Running builds/tests (use Bash tool)
- Creating files (use Write tool)

**Structure:**
```xml
<task type="checkpoint:human-action" gate="blocking">
  <action>[What human must do - Claude already did everything automatable]</action>
  <instructions>
    [What Claude already automated]
    [The ONE thing requiring human action]
  </instructions>
  <verification>[What Claude can check afterward]</verification>
  <resume-signal>[How to continue]</resume-signal>
</task>
```

**Example: Authentication Gate**
```xml
<task type="checkpoint:human-action" gate="blocking">
  <action>Authenticate Vercel CLI so I can continue deployment</action>
  <instructions>
    I tried to deploy but got authentication error.
    Run: vercel login
    This will open your browser - complete the authentication flow.
  </instructions>
  <verification>vercel whoami returns your account email</verification>
  <resume-signal>Type "done" when authenticated</resume-signal>
</task>
```

**Key distinction:** Auth gates are created dynamically when Claude encounters auth errors. NOT pre-planned.
</type>
</checkpoint_types>

<execution_protocol>

When Claude encounters `type="checkpoint:*"`:

1. **Stop immediately** - do not proceed to next task
2. **Display checkpoint clearly** using the format below
3. **Wait for user response** - do not hallucinate completion
4. **Verify if possible** - check files, run tests, whatever is specified
5. **Resume execution** - continue to next task only after confirmation

**For checkpoint:human-verify:**
```
╔═══════════════════════════════════════════════════════╗
║  CHECKPOINT: Verification Required                    ║
╚═══════════════════════════════════════════════════════╝

Progress: 5/8 tasks complete
Task: Responsive dashboard layout

Built: Responsive dashboard at /dashboard

How to verify:
  1. Visit: http://localhost:3000/dashboard
  2. Desktop (>1024px): Sidebar visible, content fills remaining space
  3. Tablet (768px): Sidebar collapses to icons
  4. Mobile (375px): Sidebar hidden, hamburger menu appears

────────────────────────────────────────────────────────
-> YOUR ACTION: Type "approved" or describe issues
────────────────────────────────────────────────────────
```

**For checkpoint:decision:**
```
╔═══════════════════════════════════════════════════════╗
║  CHECKPOINT: Decision Required                        ║
╚═══════════════════════════════════════════════════════╝

Progress: 2/6 tasks complete
Task: Select authentication provider

Decision: Which auth provider should we use?

Options:
  1. supabase - Built-in with our DB, free tier
  2. clerk - Best DX, paid after 10k users

────────────────────────────────────────────────────────
-> YOUR ACTION: Select supabase or clerk
────────────────────────────────────────────────────────
```

**For checkpoint:human-action:**
```
╔═══════════════════════════════════════════════════════╗
║  CHECKPOINT: Action Required                          ║
╚═══════════════════════════════════════════════════════╝

Progress: 3/8 tasks complete
Task: Deploy to Vercel

Attempted: vercel --yes
Error: Not authenticated

What you need to do:
  1. Run: vercel login
  2. Complete browser authentication
  3. Return here when done

I'll verify: vercel whoami returns your account

────────────────────────────────────────────────────────
-> YOUR ACTION: Type "done" when authenticated
────────────────────────────────────────────────────────
```
</execution_protocol>

<authentication_gates>

**Auth gate = Claude tried CLI/API, got auth error.** Not a failure - a gate requiring human input.

**Pattern:** Claude tries automation -> auth error -> creates checkpoint:human-action -> user authenticates -> Claude retries -> continues

**Gate protocol:**
1. Recognize it's not a failure - missing auth is expected
2. Stop current task - don't retry repeatedly
3. Create checkpoint:human-action dynamically
4. Provide exact authentication steps
5. Verify authentication works
6. Retry the original task
7. Continue normally

</authentication_gates>

<writing_guidelines>

**DO:**
- Automate everything with CLI/API before checkpoint
- Be specific: "Visit https://myapp.vercel.app" not "check deployment"
- Number verification steps
- State expected outcomes: "You should see X"

**DON'T:**
- Ask human to do work Claude can automate
- Assume knowledge: "Configure the usual settings"
- Skip steps: "Set up database" (too vague)
- Mix multiple verifications in one checkpoint

**Placement:**
- **After automation completes** - not before Claude does the work
- **After UI buildout** - before declaring phase complete
- **Before dependent work** - decisions before implementation

</writing_guidelines>

<anti_patterns>

### BAD: Asking user to start dev server

```xml
<task type="checkpoint:human-verify" gate="blocking">
  <what-built>Dashboard component</what-built>
  <how-to-verify>
    1. Run: npm run dev
    2. Visit: http://localhost:3000/dashboard
  </how-to-verify>
</task>
```

**Why bad:** Claude can run `npm run dev`. User should only visit URLs.

### GOOD: Claude starts server, user visits

```xml
<task type="auto">
  <name>Start dev server</name>
  <action>Run `npm run dev` in background</action>
  <verify>curl localhost:3000 returns 200</verify>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <what-built>Dashboard at http://localhost:3000/dashboard (server running)</what-built>
  <how-to-verify>
    Visit http://localhost:3000/dashboard and verify:
    1. Layout matches design
    2. No console errors
  </how-to-verify>
</task>
```

### BAD: Too many checkpoints

```xml
<task type="auto">Create schema</task>
<task type="checkpoint:human-verify">Check schema</task>
<task type="auto">Create API route</task>
<task type="checkpoint:human-verify">Check API</task>
```

### GOOD: Single checkpoint at end

```xml
<task type="auto">Create schema</task>
<task type="auto">Create API route</task>
<task type="auto">Create UI form</task>

<task type="checkpoint:human-verify">
  <what-built>Complete auth flow (schema + API + UI)</what-built>
  <how-to-verify>Test full flow: register, login, access protected page</how-to-verify>
</task>
```

</anti_patterns>

<summary>

**The golden rule:** If Claude CAN automate it, Claude MUST automate it.

**Checkpoint priority:**
1. **checkpoint:human-verify** (90%) - Claude automated everything, human confirms correctness
2. **checkpoint:decision** (9%) - Human makes architectural/technology choices
3. **checkpoint:human-action** (1%) - Truly unavoidable manual steps with no API/CLI

**When NOT to use checkpoints:**
- Things Claude can verify programmatically (tests, builds)
- File operations (Claude can read files)
- Code correctness (tests and static analysis)
- Anything automatable via CLI/API
</summary>
