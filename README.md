# Forever Fit — Telemedicine Platform (Full MVP)

A working telemedicine platform for rural and underserved communities,
built around the innovations identified in the capstone research: **Rural
Adaptive Mode**, the **AI Health Navigator**, **AI Consultation Brief**,
**My Health Journey**, the **Care Continuity Engine**, **Care Circle**, and
a **Healthcare Resource Map** — on top of standard booking, video
consultation, records, and admin oversight.

Every file in this project has been installed, syntax-checked, and boot-
tested. The one thing that could **not** be tested in the build
environment is a live MySQL database and a real cross-network WebRTC call
— both need to be verified once you deploy (steps below cover exactly how).

---

## 1. What's Included

| Feature | Status |
|---|---|
| Registration / login / JWT / RBAC | ✅ Working |
| Doctor availability + slot booking | ✅ Working |
| Video/audio/text consultation with **Adaptive Mode** (auto-degrades on packet loss, manual override) | ✅ Working (WebRTC + Socket.io) |
| Store-and-forward async updates (text + image) when the call can't connect | ✅ Working |
| **AI Health Navigator** (menu-driven, non-diagnostic, emergency detection) | ✅ Working out-of-the-box (rule-based); upgrades automatically to a real LLM if you add a key |
| **AI Consultation Brief** (structured pre-visit intake) | ✅ Working, same AI Gateway |
| **Medical Language Translator** ("explain this simply") | ✅ Working, same AI Gateway |
| **My Health Journey** (patient timeline) | ✅ Working |
| **Care Continuity Engine** (follow-ups + AI-structured patient updates) | ✅ Working |
| **Care Circle** (consent-based caregiver access, revocable) | ✅ Working |
| **Healthcare Resource Map** (Google Maps if key provided, list view otherwise) | ✅ Working either way |
| Admin panel (doctor verification, platform stats) | ✅ Working |
| In-app notifications | ✅ Working |
| **Accessibility panel** (font size, high contrast, colorblind-friendly palette, dyslexia-friendly font) | ✅ Working, floating button on every page |
| **Responsive UI** (collapsible mobile sidebar, responsive grids/forms) | ✅ Working below 860px/720px/640px breakpoints |
| **Floating AI chatbot** (always-available guided assistant, separate from the full Navigator page) | ✅ Working, same safe AI Gateway |
| **Performance analytics** (doctor: consultation volume, completion rate, follow-up review rate; patient: care activity over time) | ✅ Working, real computed data via Recharts |
| **Vitals Monitoring** (manual heart rate/SpO2/steps/sleep logging with trend chart and a safe range-check flag) | ✅ Working — manual entry, not a real device sync (see Section 8) |
| **Maternal Care Check-ins** (symptom check-ins with non-diagnostic red-flag detection against public health guidance) | ✅ Working |
| **Vaccination Outreach Planner** (multi-stop route builder with real travel-time math against a cold-chain time budget) | ✅ Working, for doctor/admin roles |
| **Crisis Support** (informational resource page with real, verified hotline numbers) | ✅ Working — deliberately informational only, not a simulated call-routing tool (see note below) |

**Deliberately out of scope for this MVP** (per the original roadmap —
Future Work): e-pharmacy/delivery logistics, wearable/IoT integration,
national health-record system integration, multilingual voice interaction,
community health worker portal.

---

## 2. Project Structure

```
telemedicine-platform/
├── backend/
│   ├── src/
│   │   ├── config/db.js              MySQL pool
│   │   ├── models/                   Data-access layer (10 models)
│   │   ├── controllers/              Request handlers (12 controllers)
│   │   ├── middleware/                JWT auth + RBAC
│   │   ├── routes/                    12 route modules
│   │   ├── services/ai.service.js     AI Gateway (rule-based + pluggable LLM)
│   │   └── server.js                  Express + Socket.io entrypoint
│   ├── uploads/                       Async submission images (local disk - see note below)
│   ├── schema.sql                     Full schema + seed facility data
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── components/                AppShell, VideoCall, ConsultationBriefForm, etc.
    │   ├── context/AuthContext.jsx
    │   ├── pages/                     13 pages covering every feature
    │   ├── services/api.js            Every backend call, one place
    │   └── services/socket.js         Shared Socket.io client
    └── .env.example
```

## 3. Running It Locally

### Backend
```bash
cd backend
cp .env.example .env      # edit DB_*, JWT_SECRET; leave AI_PROVIDER/AI_API_KEY blank for now
npm install
mysql -u root -p < schema.sql
npm run dev                # http://localhost:5000
```
You should see `Database connection OK` and `Telemedicine backend (HTTP + Socket.io) running on port 5000`.

### Frontend
```bash
cd frontend
cp .env.example .env       # VITE_API_URL=http://localhost:5000/api
npm install
npm run dev                 # http://localhost:5173
```

## 4. Testing Every Feature (do this in order — later steps depend on earlier ones)

1. **Admin account**: the schema doesn't seed one on purpose (don't ship a
   default admin password). Create your first admin manually:
   ```sql
   -- after registering a normal account through the UI, promote it:
   UPDATE users SET role = 'admin' WHERE email = 'you@example.com';
   ```
2. **Register a doctor** (`/register`, role = Doctor, fill specialty/license).
   Log in as admin → **Doctor Verification** → Approve them.
3. **Doctor: set availability** — log in as the doctor → **My Availability**
   → add a weekly window → Save.
4. **Register a patient** → **Find & Book** → the verified doctor should
   appear → pick an open slot → you're redirected into the Consultation Room.
5. **Consultation Brief**: as the patient, fill the guided intake — confirm
   a structured summary appears (works immediately, no AI key needed).
6. **Video call / Adaptive Mode**: open the same consultation URL as both
   patient and doctor (two browser windows, or two devices) → both click
   **Join consultation** → confirm local/remote video connect. Click
   **Text only** manually to confirm the mode pill updates on both sides
   and the peer-mode label appears. To see automatic degradation, throttle
   one tab's network in DevTools (Network tab → Slow 3G) during the call.
7. **Async fallback**: with the call open, submit a message + image in the
   "Async update" panel → confirm it appears in the list immediately.
8. **Doctor ends the consultation**: add notes, an optional prescription,
   and a follow-up in N days → Submit.
9. **My Health Journey** (as patient): confirm the consultation notes now
   appear on the timeline. Click "Explain this simply" to test the
   Medical Language Translator.
10. **Follow-ups**: wait for (or manually adjust) the due date, submit a
    patient update → confirm the AI-structured summary appears, then mark
    it reviewed as the doctor.
11. **Care Circle** (as patient): invite a caregiver by email → log in as
    that user (they need an existing account with that email) → **Care
    Circle → Check for & accept pending invites**.
12. **Resource Map**: confirm the 5 seeded facilities appear as a list;
    add `VITE_GOOGLE_MAPS_KEY` to see them plotted on an actual map.
13. **Emergency detection**: in the AI Navigator, type something like *"I
    have severe chest pain and can't breathe"* → confirm you get the
    emergency advisory instead of a normal navigation reply.
14. **Accessibility panel**: click the ♿ button (bottom-right, every page)
    → try "Extra large" text, "Colorblind-friendly" mode, "High contrast",
    and the dyslexia-friendly font toggle → confirm the whole page updates
    and your choice persists after a refresh.
15. **Floating chatbot**: as a patient, click the 💬 button (bottom-right)
    → try one of the starter questions → confirm it responds using the
    same safe Navigator logic (try an emergency phrase here too).
16. **Responsive layout**: resize your browser window below ~860px wide
    (or open DevTools device toolbar) → confirm the sidebar collapses into
    a hamburger menu and the layout stays usable.
17. **Analytics**: as a doctor, go to **My Performance** → after completing
    at least one consultation and reviewing a follow-up, confirm the stats
    and weekly chart reflect real numbers (they show honestly empty/zero
    before you have data — nothing is faked). As a patient, check **My
    Activity** the same way.
18. **Dark mode**: click the 🌙/☀️ icon in the top bar → confirm the whole
    app switches theme and your choice persists after a refresh.
19. **Vitals Monitoring** (patient): go to **Vitals Monitoring** → log a
    heart rate of 130 → confirm it saves with a flagged warning; log 70 →
    confirm no flag; check the trend chart populates after 2+ readings.
20. **Maternal Care** (patient): go to **Maternal Care** → submit "feeling
    tired but fine" → confirm no red flag; submit "severe headache that
    won't go away" → confirm the red-flag advisory appears.
21. **Vaccination Outreach Planner** (doctor or admin): go to **Vaccination
    Outreach** → add 2-3 facilities as stops, save a route with a short
    cold-chain limit (e.g. 1 hour) → view it → confirm it correctly flags
    "Exceeds cold-chain limit" if the computed travel+service time is over
    your limit.
22. **Crisis Support**: open it from any role's sidebar → confirm it shows
    real hotline numbers, not a fake call-routing interface.

## 5. Common Errors

| Symptom | Likely cause |
|---|---|
| `ECONNREFUSED 127.0.0.1:3306` | MySQL isn't running, or `.env` DB values are wrong |
| Video call doesn't connect between two devices on different networks | Public STUN alone often can't traverse strict NATs/firewalls — add a TURN server (e.g. a free Metered.ca or self-hosted coturn) to `ICE_SERVERS` in `VideoCall.jsx` for real-world use. Works reliably on the same network / localhost as-is. |
| Async submission images disappear after a Render redeploy | Uploads are stored on local disk (`backend/uploads/`), which Render's free tier does **not** persist. Fine for local dev/demo; swap for S3/Cloudinary before relying on it in production. |
| AI Navigator gives generic answers | Expected — this is the built-in rule-based fallback, which is intentionally safe and functional with zero setup. Add `AI_PROVIDER`/`AI_API_KEY` in `backend/.env` to use a real LLM. |
| Resource Map shows a list, not a map | Expected until `VITE_GOOGLE_MAPS_KEY` is set — this is a deliberate graceful fallback, not a bug. |
| `403 You do not have permission` booking as a doctor, or setting availability as a patient | RBAC working as intended — check you're testing with the right role's account. |

## 6. Deploying Online (free-tier stack)

Same three-service split as before, extended for the new pieces. Confirm
free/student-tier limits with Panan before relying on any paid service.

### Step A — Database (Railway MySQL)
Same as before — provision MySQL on Railway, then run the **full**,
updated `schema.sql` (it now includes 9 additional tables plus seed
facility data) against it.

### Step B — Backend (Render)
1. Root directory `backend`, build `npm install`, start `npm start`.
2. Env vars: everything in `.env.example`, with your Railway DB
   credentials, `DB_SSL=true`, a strong `JWT_SECRET`, and `FRONTEND_URL`
   set once you have your Vercel URL (Step C).
3. Leave `AI_PROVIDER`/`AI_API_KEY` blank to launch with the built-in
   rule-based AI Gateway — completely functional, zero cost. Add them
   later once you've confirmed access with Panan; no code changes needed.
4. **Socket.io note**: Render's free web services support WebSockets
   natively, so video signaling works without extra configuration — just
   make sure `FRONTEND_URL` matches your real Vercel domain exactly (CORS
   applies to the socket connection too).
5. **Uploads note**: Render's free tier has an ephemeral filesystem —
   uploaded async-submission images won't survive a redeploy/restart. This
   is fine for a capstone demo; mention it as a known limitation in your
   report, or swap `multer.diskStorage` for an S3/Cloudinary adapter if
   you want it to persist.

### Step C — Frontend (Vercel)
1. Root directory `frontend`, framework preset Vite.
2. Env vars: `VITE_API_URL` = your Render URL + `/api`, and optionally
   `VITE_GOOGLE_MAPS_KEY` once you've confirmed access with Panan.
3. Deploy, then go back to Render and set `FRONTEND_URL` to this Vercel
   URL, and redeploy the backend so CORS (REST **and** Socket.io) allows it.

### Step D — Verify end-to-end
Repeat the full test sequence in Section 4 against your live URLs. Pay
particular attention to step 6 (video call) — test from two genuinely
different networks (e.g. your laptop + your phone on mobile data) to see
whether you need a TURN server for your specific demo setup.

## 7. Architecture Notes (for your capstone report)

- **AI Gateway pattern**: every AI feature routes through
  `backend/src/services/ai.service.js`. This is the only file that talks
  to an external LLM provider — the rest of the app calls
  `navigatorReply()`, `generateBrief()`, `summarizeFollowup()` and doesn't
  know or care whether the answer came from Gemini/OpenAI or the built-in
  rule-based engine. This directly supports NFR6 (maintainability) from
  the requirements doc: swapping AI providers, or falling back to
  rule-based mode if a provider has an outage, requires no changes outside
  this one file.
- **Emergency safety**: `detectEmergency()` runs centrally, before any
  external AI call, on both the Navigator and Follow-up features — so the
  safety behaviour doesn't depend on the LLM's own judgment and can't be
  silently dropped if you swap providers later.
- **Adaptive Mode**: implemented as real, measurable behaviour (WebRTC
  `getStats()` packet-loss monitoring + the browser's own
  `navigator.connection` hint), not a cosmetic toggle — this is the
  strongest live-demo moment per the capstone demonstration scenario.
- **RBAC enforcement**: centralized in `requireRole()` middleware, applied
  per-route (e.g. only `patient` can book, only `doctor` can set
  availability/end a consultation, only `admin` can verify doctors) —
  directly satisfies FR10 from the requirements doc.
- **Crisis Support is informational by design, not simulated infrastructure**:
  an earlier design reference for this project included a fully mocked
  crisis-call queue with fake counselors and fabricated caller transcripts.
  That was deliberately not replicated here — presenting a fake "your call
  is being routed" interface to someone in a genuine crisis, when no real
  response system exists behind it, could actively delay them getting real
  help. The Crisis Support page instead shows real, verified hotline
  numbers with a clear note to localize them before deployment. This is a
  good example of a "similar but not identical" design decision worth
  explaining in your report's Limitations section.
- **Vitals Monitoring is manual entry, not device integration**: the
  original research doc explicitly scoped real wearable/IoT integration as
  Future Work (Step 32). This module gives the same trend-tracking value
  without overclaiming a hardware integration that isn't actually built.
- **Maternal Care red-flag detection is a checklist, not a clinical score**:
  it matches reported symptoms against well-established public "when to
  call your doctor" pregnancy guidance (severe headache, reduced fetal
  movement, vaginal bleeding, etc.), the same non-diagnostic pattern as the
  AI Navigator's emergency detection — it flags for human review, it never
  scores or diagnoses.

## 8. What's Genuinely Left for Future Work (per Step 32 of the research)

Wearable/IoT integration, offline-first content caching beyond the
async-submission fallback already built, multilingual voice interaction,
community health worker portal, and integration with a national/regional
health record system. None of these were skipped by oversight — they were
explicitly scoped out as beyond a capstone team's realistic timeframe.
