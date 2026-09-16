// AI Gateway - the ONLY place in the backend that talks to an LLM provider.
// Every AI-powered feature (Navigator, Consultation Brief, Follow-up
// Summary) goes through here so:
//   1) provider swaps (Gemini/OpenAI/Azure) never touch feature code
//   2) safety rules (disclaimers, emergency escalation) are enforced once,
//      centrally, not re-implemented per feature
//   3) the app is fully functional with ZERO API key configured, using a
//      deterministic rule-based fallback - useful for local dev, demos,
//      and grading before you've set up a paid/student AI key.

const EMERGENCY_PATTERNS = [
  /chest pain/i, /can'?t breathe/i, /difficulty breathing/i, /severe bleeding/i,
  /unconscious/i, /suicidal/i, /want to (die|kill myself)/i, /stroke/i,
  /face drooping/i, /slurred speech/i, /severe allergic reaction/i,
  /anaphylaxis/i, /poison(ed|ing)?/i, /overdose/i, /seizure/i,
];

function detectEmergency(text = '') {
  return EMERGENCY_PATTERNS.some((re) => re.test(text));
}

const DISCLAIMER =
  'This is guidance to help you navigate care, not a medical diagnosis. ' +
  'For any doubt, please consult a licensed healthcare professional.';

const EMERGENCY_ADVISORY =
  'What you described may be a medical emergency. Please contact your local ' +
  'emergency number or go to the nearest emergency department immediately. ' +
  'This platform is not equipped to handle emergencies.';

async function callRealProvider(prompt) {
  const provider = process.env.AI_PROVIDER; // 'gemini' | 'openai' | 'azure'
  const apiKey = process.env.AI_API_KEY;
  if (!provider || !apiKey) return null; // signals "use fallback"

  if (provider === 'gemini') {
    const model = process.env.AI_MODEL || 'gemini-2.0-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    });
    if (!resp.ok) throw new Error(`Gemini API error: ${resp.status}`);
    const data = await resp.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || null;
  }
    if (provider === 'groq') {
    const model = process.env.AI_MODEL || 'openai/gpt-oss-120b';
    const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }] }),
    });
    if (!resp.ok) throw new Error(`Groq API error: ${resp.status}`);
    const data = await resp.json();
    return data?.choices?.[0]?.message?.content || null;
  }

  if (provider === 'openai') {
    const model = process.env.AI_MODEL || 'gpt-4o-mini';
    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }] }),
    });
    if (!resp.ok) throw new Error(`OpenAI API error: ${resp.status}`);
    const data = await resp.json();
    return data?.choices?.[0]?.message?.content || null;
  }

  // Unknown provider configured - fall back rather than crashing the feature.
  return null;
}

// --- Rule-based fallback engine (no external calls, always available) ---

function fallbackNavigatorReply(task, message) {
  const emergency = detectEmergency(message);
  if (emergency) return { text: EMERGENCY_ADVISORY, emergency: true };

  const lower = (message || '').toLowerCase();
  let suggestion;
  if (/skin|rash|itch/.test(lower)) suggestion = 'a dermatologist or a general practitioner for an initial review';
  else if (/tooth|dental|gum/.test(lower)) suggestion = 'a dentist (outside this platform\u2019s current scope)';
  else if (/child|kid|baby|infant/.test(lower)) suggestion = 'a paediatrician or a general practitioner';
  else if (/mental|anxious|anxiety|depress|stress/.test(lower)) suggestion = 'a mental health professional or a general practitioner for a referral';
  else if (/fever|cough|cold|flu|headache|pain/.test(lower)) suggestion = 'a general practitioner via telemedicine as a first step';
  else suggestion = 'a general practitioner, who can direct you further if needed';

  const text =
    `Based on what you've described, a reasonable next step would be to see ${suggestion}. ` +
    `Telemedicine is likely suitable for an initial assessment unless your symptoms are severe or worsening rapidly. ` +
    `Before your visit, it may help to note: when this started, how severe it is, and anything that makes it better or worse. ${DISCLAIMER}`;
  return { text, emergency: false };
}

function fallbackBriefSummary(intake) {
  const { onset, severity, frequency, associatedSymptoms, medicationsTaken, relevantHistory } = intake;
  const lines = [
    `Reported onset: ${onset || 'not specified'}.`,
    `Severity (patient-rated): ${severity || 'not specified'}.`,
    `Frequency/pattern: ${frequency || 'not specified'}.`,
    associatedSymptoms ? `Associated symptoms: ${associatedSymptoms}.` : null,
    medicationsTaken ? `Medication already taken: ${medicationsTaken}.` : null,
    relevantHistory ? `Relevant history noted by patient: ${relevantHistory}.` : null,
    'This brief is patient-reported and has not been clinically verified.',
  ].filter(Boolean);
  return lines.join(' ');
}

function fallbackFollowupSummary(patientResponse) {
  const emergency = detectEmergency(patientResponse);
  if (emergency) return { text: EMERGENCY_ADVISORY, emergency: true };
  return {
    text: `Patient-reported follow-up update: "${patientResponse.trim()}". Structured for clinician review; not a clinical assessment.`,
    emergency: false,
  };
}

function fallbackClinicalNote({ reason, briefSummary }) {
  const lines = [
    reason ? `Reason for visit: ${reason}.` : null,
    briefSummary ? `Patient intake summary: ${briefSummary}.` : null,
    'Clinical findings: [add examination findings].',
    'Assessment: [add assessment].',
    'Plan: [add plan/treatment/follow-up].',
  ].filter(Boolean);
  return lines.join('\n');
}

function fallbackScheduleSuggestion({ stops, coldChainLimitHours }) {
  const names = stops.map((s) => s.name).join(' -> ');
  return (
    `Suggested visiting order (unchanged from the order provided, since no AI provider is configured): ${names}. ` +
    `Keep total time on the road under the ${coldChainLimitHours}-hour cold-chain limit - reorder manually if a ` +
    `stop is far out of the way.`
  );
}

function fallbackStaffAssist(role, context) {
  if (context) {
    return `I can't reach an AI provider right now, but here's your current data: ${JSON.stringify(context)}. See the Analytics page for the full breakdown.`;
  }
  return (
    `I can't reach an AI provider right now, so here's a plain answer instead: for ${role === 'admin' ? 'admin' : 'doctor'} ` +
    `tasks, check the relevant page directly (Doctor Verification, Vaccination Outreach, Messages, Announcements, ` +
    `or a patient's consultation) - this assistant is a shortcut for questions, not the only way to get things done.`
  );
}

// --- Public API ---

async function navigatorReply(task, message) {
  const emergency = detectEmergency(message);
  if (emergency) return { text: EMERGENCY_ADVISORY, emergency: true, source: 'rule-based-safety' };

  try {
    const prompt =
      `You are a healthcare NAVIGATION assistant, not a diagnostic tool. A patient is asking for help with: "${task}". ` +
      `Their message: "${message}". Help them understand what type of care may be appropriate and how to prepare, ` +
      `WITHOUT diagnosing any condition. Keep it under 120 words and end with a reminder that this is not a diagnosis.`;
    const real = await callRealProvider(prompt);
    if (real) return { text: real, emergency: false, source: 'llm' };
  } catch (err) {
    console.error('AI provider call failed, using fallback:', err.message);
  }
  return { ...fallbackNavigatorReply(task, message), source: 'rule-based' };
}

async function generateBrief(intake) {
  try {
    const prompt =
      `Organize this patient-reported intake into a concise, structured clinician-facing summary (under 100 words), ` +
      `staying strictly factual to what's given, no diagnosis: ${JSON.stringify(intake)}`;
    const real = await callRealProvider(prompt);
    if (real) return { text: real, source: 'llm' };
  } catch (err) {
    console.error('AI provider call failed, using fallback:', err.message);
  }
  return { text: fallbackBriefSummary(intake), source: 'rule-based' };
}

async function summarizeFollowup(patientResponse) {
  const emergency = detectEmergency(patientResponse);
  if (emergency) return { text: EMERGENCY_ADVISORY, emergency: true, source: 'rule-based-safety' };

  try {
    const prompt =
      `Summarize this patient's follow-up progress update into one concise, factual sentence for a clinician, ` +
      `no diagnosis, no treatment suggestions: "${patientResponse}"`;
    const real = await callRealProvider(prompt);
    if (real) return { text: real, emergency: false, source: 'llm' };
  } catch (err) {
    console.error('AI provider call failed, using fallback:', err.message);
  }
  return { ...fallbackFollowupSummary(patientResponse), source: 'rule-based' };
}

// Doctor-facing: drafts a starting-point clinical note from what's already
// on record (reason for visit, the AI consultation brief if one exists).
// Always returned as a DRAFT - the doctor reviews and edits it before it's
// ever saved as the actual consultation record; this function never writes
// to the database itself.
async function draftClinicalNote({ reason, briefSummary }) {
  try {
    const prompt =
      `Draft a starting-point clinical note for a doctor to review and edit, using SOAP-style structure ` +
      `(Subjective/Reason, Findings, Assessment, Plan). Use only the information given below - do not invent ` +
      `symptoms, findings, or history that weren't mentioned. Leave assessment/plan as brief placeholders for the ` +
      `doctor to fill in, since you have no examination data. Reason for visit: "${reason || 'not specified'}". ` +
      `Patient intake summary: "${briefSummary || 'none provided'}".`;
    const real = await callRealProvider(prompt);
    if (real) return { text: real, source: 'llm' };
  } catch (err) {
    console.error('AI provider call failed, using fallback:', err.message);
  }
  return { text: fallbackClinicalNote({ reason, briefSummary }), source: 'rule-based' };
}

// Admin-facing: SUGGESTS a visiting order for a vaccination outreach route
// as plain-text reasoning the admin reads and applies manually via the
// existing reorder controls - it never reorders the route itself. Keeping
// this a suggestion rather than an automatic mutation is a deliberate
// safety choice: an admin schedule is operational data that should always
// go through a human before it changes.
async function suggestRouteOrder({ stops, coldChainLimitHours }) {
  try {
    const list = stops.map((s, i) => `${i + 1}. ${s.name}${s.address ? ` (${s.address})` : ''}`).join('\n');
    const prompt =
      `You are helping an admin plan a vaccination outreach route with a ${coldChainLimitHours}-hour cold-chain ` +
      `time limit. Given these stops in their current order:\n${list}\n` +
      `Suggest a more efficient visiting order if one is obviously better (e.g. grouping nearby stops), and ` +
      `briefly explain why in under 80 words. If the current order already looks reasonable, say so - don't ` +
      `reorder for the sake of it. This is a suggestion only; the admin will apply any reordering manually.`;
    const real = await callRealProvider(prompt);
    if (real) return { text: real, source: 'llm' };
  } catch (err) {
    console.error('AI provider call failed, using fallback:', err.message);
  }
  return { text: fallbackScheduleSuggestion({ stops, coldChainLimitHours }), source: 'rule-based' };
}

// General-purpose assistant for doctors/admins - a "hover to ask" helper
// available from anywhere in the staff-facing app, distinct from the
// patient Navigator (which is symptom-triage-framed) and from the
// task-specific draftClinicalNote/suggestRouteOrder functions above. Answers
// general questions about using the platform or interpreting information
// the staff member gives it - it never looks up or changes real data
// itself (no DB access here), so nothing it says can silently become an
// action; a reply is just text in a chat bubble the person reads.
async function staffAssist(role, message, context) {
  const emergency = detectEmergency(message);
  if (emergency) return { text: EMERGENCY_ADVISORY, emergency: true, source: 'rule-based-safety' };

  try {
    const audience = role === 'admin' ? 'a platform administrator' : 'a doctor';
    const contextLine = context
      ? `Here is their own real, current data from the platform - use it directly to answer if the question is ` +
        `about their performance/activity, and never claim you lack access to it: ${JSON.stringify(context)}.`
      : `No account data is available for this request.`;
    const prompt =
      `You are a helpful assistant for ${audience} using a telehealth platform called Forever Fit. ${contextLine} ` +
      `Answer their question below clearly and practically, grounded ONLY in the data given above - never invent ` +
      `numbers, and never reference metrics that aren't listed there (e.g. don't mention patient satisfaction ` +
      `scores or revenue - this platform doesn't track those). If the question needs data that isn't in what ` +
      `you were given, say plainly what's missing rather than guessing. Keep the answer under 150 words. ` +
      `Question: "${message}"`;
    const real = await callRealProvider(prompt);
    if (real) return { text: real, emergency: false, source: 'llm' };
  } catch (err) {
    console.error('AI provider call failed, using fallback:', err.message);
  }
  return { text: fallbackStaffAssist(role, context), emergency: false, source: 'rule-based' };
}

module.exports = {
  navigatorReply,
  generateBrief,
  summarizeFollowup,
  draftClinicalNote,
  suggestRouteOrder,
  staffAssist,
  detectEmergency,
  DISCLAIMER,
};
