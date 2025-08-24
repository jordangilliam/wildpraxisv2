import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Brain, Trees, Users, Compass, BookOpen, Lightbulb, FlaskConical, Globe2, Settings,
  HelpCircle, CheckCircle2, Circle, Leaf, Copy, Sparkles, Handshake, Map,
  Heart, Target, Scale, Star, X, ChevronLeft, ChevronRight
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, Radar,
  PieChart, Pie, Cell
} from "recharts";

// ---- THEME ----
const THEME = {
  forest: "#1f3d2a",
  leaf: "#5aa870",
  gold: "#f5a524",
  coal: "#0f172a",
  mist: "#f7faf7",
  teenPink: "#f472b6",
  teenIndigo: "#6366f1",
} as const;
const shadow = "shadow-[0_10px_30px_rgba(0,0,0,0.12)]";
const cardBase = `rounded-2xl ${shadow} border border-black/5 bg-white`;
const pill = "px-2.5 py-1 rounded-full text-xs font-semibold";

// ---- Local Storage Hook ----
function useLocalState<T = any>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try { const raw = localStorage.getItem(key); return raw ? (JSON.parse(raw) as T) : initial; } catch { return initial; }
  });
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} }, [key, value]);
  return [value, setValue] as const;
}

// ---- Helpers ----
function classNames(...xs: Array<string | false | null | undefined>){ return xs.filter(Boolean).join(" "); }

// ---- Modules: Base content ----
const MOD_CONSERVATION = [
  { key: "core", icon: <Brain className="w-5 h-5" />, title: "Core Literacy", subtitle: "Models • Ethics • Data",
    color: "from-emerald-500 via-emerald-600 to-emerald-700",
    lessons: [
      { id: "foundations", title: "How models think", estMins: 15, summary: "Tokens, embeddings, context windows in plain words.", checkpoints: ["Explain tokens with a species example.", "Two uses of embeddings."] },
      { id: "ethics", title: "Responsible AI in the field", estMins: 12, summary: "Consent, sensitive species, and public trust.", checkpoints: ["Draft a kiosk disclosure.", "Name one bias risk and a test."] },
    ] },
  { key: "apply", icon: <Trees className="w-5 h-5" />, title: "Conservation Data", subtitle: "Sensors • GIS • ML",
    color: "from-lime-500 via-emerald-600 to-teal-700",
    lessons: [
      { id: "sensors", title: "Sensors & alerts", estMins: 15, summary: "AudioMoth, probes, practical alerts.", checkpoints: ["Minimal field kit sketch.", "One alert rule with time and threshold."] },
      { id: "gis", title: "Maps with care", estMins: 15, summary: "Narrative maps without harm.", checkpoints: ["Add a confluence marker.", "Buffer sensitive sites."] },
    ] },
  { key: "build", icon: <FlaskConical className="w-5 h-5" />, title: "Implementation", subtitle: "Workflows • Dashboards",
    color: "from-amber-400 via-orange-500 to-rose-500",
    lessons: [
      { id: "auto", title: "Automations you can trust", estMins: 14, summary: "Approvals, logs, disclosures.", checkpoints: ["Map a four step flow.", "Two governance controls."] },
    ] },
] as const;

const MOD_NONPROFIT = [
  { key: "core", icon: <Users className="w-5 h-5" />, title: "AI Literacy for Nonprofits", subtitle: "Models • Access • Value",
    color: "from-indigo-500 via-sky-600 to-teal-600",
    lessons: [
      { id: "onramp", title: "On ramp", estMins: 14, summary: "How assistants help and where they fail.", checkpoints: ["Context window in plain words.", "Three safe pilot tasks."] },
      { id: "equity", title: "Access & energy", estMins: 12, summary: "Who benefits; reduce compute.", checkpoints: ["Two access risks.", "One low compute tool."] },
    ] },
  { key: "impact", icon: <Handshake className="w-5 h-5" />, title: "Impact & Strategy", subtitle: "Capacity • Governance",
    color: "from-emerald-500 via-green-600 to-lime-700",
    lessons: [
      { id: "capacity", title: "Capacity planning", estMins: 14, summary: "Drafting, summarizing, scheduling.", checkpoints: ["Three workflows to streamline.", "Pick a human approval point."] },
    ] },
  { key: "build", icon: <FlaskConical className="w-5 h-5" />, title: "Tools & Workflows", subtitle: "Which tool for which task",
    color: "from-amber-400 via-orange-500 to-rose-500",
    lessons: [
      { id: "stack", title: "Choose your stack", estMins: 14, summary: "Writing, data, automation, CRM.", checkpoints: ["Pick three tools.", "Two integrations."] },
    ] },
] as const;

const MOD_TEEN = [
  { key: "core", icon: <Sparkles className="w-5 h-5" />, title: "How AI Works (Teen)", subtitle: "Systems • Prompts • Judgment",
    color: "from-fuchsia-500 via-violet-600 to-indigo-600",
    lessons: [
      { id: "systems", title: "Systems not magic", estMins: 10, summary: "Why models guess and can be confidently wrong.", checkpoints: ["Your words for tokens.", "Two times to double-check."] },
      { id: "prompting", title: "Prompt craft basics", estMins: 10, summary: "Role, goal, constraints, steps, examples.", checkpoints: ["Write a four part prompt.", "Add one constraint."] },
    ] },
  { key: "brand", icon: <Users className="w-5 h-5" />, title: "Brand & Digital Citizenship", subtitle: "Reputation • Craft • Opportunity",
    color: "from-amber-400 via-orange-500 to-rose-500",
    lessons: [
      { id: "kit", title: "Build a brand you are proud of", estMins: 12, summary: "Brainstorm content and projects; then make them real.", checkpoints: ["Two projects this month.", "Three post plan."] },
    ] },
] as const;

// ---- Quiz banks (brief) ----
const QUIZ: any = {
  conservation: { core: [ { q: "Embeddings help with?", a: "Semantic search and retrieval." } ] },
  nonprofit:   { core: [ { q: "Context window is?", a: "How much recent text a model can see at once." } ] },
  teen:        { core: [ { q: "Prompt skeleton?", a: "Role, goal, constraints, steps; include an example." } ] }
};

// ---- App ----
export default function WildPraxisV2App(){
  const [track, setTrack] = useLocalState("wp2.track", "conservation");
  const [tab, setTab] = useLocalState("wp2.tab", "learn");
  const [notes, setNotes] = useLocalState("wp2.notes", "");
  const [mapToken, setMapToken] = useLocalState("wp2.mapToken", "");
  const [csvRows, setCsvRows] = useState<any[] | null>(null);
  const [activeLesson, setActiveLesson] = useLocalState("wp2.activeLesson", null as any);

  const modules = (track === 'conservation' ? MOD_CONSERVATION : track === 'nonprofit' ? MOD_NONPROFIT : MOD_TEEN) as any[];
  const quizBank = ((QUIZ as any)[track] && (QUIZ as any)[track].core) || [];

  return (
    <div className="min-h-screen" style={{ background: THEME.mist }}>
      <Header track={track as any} tab={tab as any} setTab={setTab as any} setTrack={setTrack as any} />

      <main className="mx-auto max-w-7xl px-4 py-6">
        {tab === 'learn' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Hero track={track as any} />
              {modules.map((m: any) => <ModuleCard key={m.key} module={m} onStart={(lesson: any)=> setActiveLesson({ moduleKey: m.key, lessonId: lesson.id } as any)} />)}
            </div>
            <div className="space-y-6">
              <Section title="Quick Quiz" icon={<Brain className="w-4 h-4" />}>
                <QuickQuiz bank={quizBank} />
              </Section>
              <Section title="Scratchpad" icon={<BookOpen className="w-4 h-4" />}>
                <textarea className="w-full h-40 p-3 rounded-xl border border-black/10 text-sm" placeholder="Ideas, drafts, action items…" value={notes as any} onChange={e=>setNotes((e.target as any).value)} />
              </Section>
            </div>
          </div>
        )}

        {tab === 'explore' && <Explore track={track as any} />}
        {tab === 'deep' && <DeepDive track={track as any} />}
        {tab === 'workbench' && (
          <Workbench mapToken={mapToken as any} csvRows={csvRows as any} setCsvRows={setCsvRows as any} />
        )}
        {tab === 'resources' && <Resources track={track as any} />}
        {tab === 'admin' && (
          <Admin mapToken={mapToken as any} setMapToken={setMapToken as any} />
        )}
      </main>

      {activeLesson && (
        <LessonSheet
          track={track as any}
          modules={modules as any}
          active={activeLesson as any}
          onClose={()=>setActiveLesson(null as any)}
          onJump={(mId: string, lId: string)=> setActiveLesson({ moduleKey: mId, lessonId: lId } as any)}
        />
      )}

      <Footer />
    </div>
  );
}

// ---- Header ----
function Header({ track, tab, setTab, setTrack }: any){
  return (
    <header className="sticky top-0 z-30 backdrop-blur supports-[backdrop-filter]:bg-white/60 bg-white/70 border-b border-black/5">
      <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: THEME.forest }}>
            <Compass className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold" style={{ color: THEME.coal }}>WildPraxis v2</h1>
            <p className="text-xs opacity-70">Deep Dive • String Theory Solutions</p>
          </div>
        </div>
        <nav className="flex items-center gap-2 text-sm">
          <Tab label="Learn" icon={<BookOpen className="w-4 h-4" />} active={tab==='learn'} onClick={()=>setTab('learn')} />
          <Tab label={track==='nonprofit' ? 'Scenarios' : track==='teen' ? 'Studio' : 'Mysteries'} icon={<Lightbulb className="w-4 h-4" />} active={tab==='explore'} onClick={()=>setTab('explore')} />
          <Tab label="Deep Dive" icon={<Heart className="w-4 h-4" />} active={tab==='deep'} onClick={()=>setTab('deep')} />
          <Tab label="Workbench" icon={<FlaskConical className="w-4 h-4" />} active={tab==='workbench'} onClick={()=>setTab('workbench')} />
          <Tab label="Resources" icon={<Globe2 className="w-4 h-4" />} active={tab==='resources'} onClick={()=>setTab('resources')} />
          <Tab label="Admin" icon={<Settings className="w-4 h-4" />} active={tab==='admin'} onClick={()=>setTab('admin')} />
        </nav>
      </div>
      <div className="mx-auto max-w-7xl px-4 pb-3">
        <div className="inline-flex rounded-xl border border-black/10 overflow-hidden">
          <button onClick={()=>setTrack('conservation')} className={classNames("px-3 py-1.5 text-sm", track==='conservation' ? "bg-black/80 text-white" : "hover:bg-black/5")}>Conservation Leaders</button>
          <button onClick={()=>setTrack('nonprofit')} className={classNames("px-3 py-1.5 text-sm", track==='nonprofit' ? "bg-black/80 text-white" : "hover:bg-black/5")}>Nonprofit Leaders</button>
          <button onClick={()=>setTrack('teen')} className={classNames("px-3 py-1.5 text-sm", track==='teen' ? "bg-black/80 text-white" : "hover:bg-black/5")}>Teen Track</button>
        </div>
      </div>
    </header>
  );
}

function Tab({ label, icon, active, onClick }: any){
  return (
    <button onClick={onClick} className={classNames("px-3 py-1.5 rounded-xl flex items-center gap-2 border border-transparent text-sm transition", active ? "bg-black/80 text-white" : "hover:bg-black/5 border-black/10")}>{icon}<span>{label}</span></button>
  );
}

// ---- Hero ----
function Hero({ track }: any){
  const title = track === 'nonprofit' ? 'Understand AI. Build capacity. Protect your mission.' : track === 'teen' ? 'Create with care. Learn how systems work and build things that matter.' : 'Learn AI like a systems thinker. Serve people and places.';
  const tagLeft = track === 'nonprofit' ? 'Nonprofit Leaders' : track === 'teen' ? 'Teen Track' : 'Conservation Leaders';
  const tagRight = track === 'nonprofit' ? 'Capacity • Governance • Impact' : track === 'teen' ? 'Creative Tech • Brand • Ethics' : 'Place based • PA • Appalachia';
  return (
    <div className={classNames(cardBase, "p-6 overflow-hidden relative")} style={{ background: `linear-gradient(120deg, ${THEME.mist}, #ffffff)` }}>
      <div className="relative z-10">
        <div className="inline-flex items-center gap-2 mb-3">
          <span className={pill} style={{ background: THEME.forest, color: 'white' }}>{tagLeft}</span>
          <span className={pill} style={{ background: THEME.gold }}>{tagRight}</span>
        </div>
        <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight" style={{ color: THEME.coal }}>{title}</h2>
        <p className="mt-2 max-w-2xl text-sm md:text-base opacity-80">
          {track === 'teen' ? 'Use AI to explore deeper ideas, not to skip the learning. Your research and your judgment make the difference.' : track === 'nonprofit' ? 'Start small, show value, and add clear guardrails. Draft with AI and finish with your expertise.' : 'We move from mechanics to meaning — tokens and prompts toward watersheds and work.'}
        </p>
      </div>
      <div className="absolute -right-12 -top-12 w-56 h-56 rounded-full blur-2xl opacity-25" style={{ background: track==='teen' ? THEME.teenPink : THEME.leaf }} />
      <div className="absolute -right-20 top-10 w-40 h-40 rounded-full blur-2xl opacity-20" style={{ background: track==='teen' ? THEME.teenIndigo : THEME.gold }} />
    </div>
  );
}

function Section({ title, icon, children, id }: any){
  return (
    <section id={id} className={classNames("mb-8", shadow)} style={{ borderRadius: 24, background: 'white', border: '1px solid rgba(0,0,0,0.05)' }}>
      <div className="flex items-center gap-3 px-5 py-4" style={{ background: THEME.mist, borderTopLeftRadius: 24, borderTopRightRadius: 24 }}>
        <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: THEME.leaf, color: 'white' }}>{icon ?? <Sparkles className="w-4 h-4" />}</div>
        <h3 className="text-lg font-semibold" style={{ color: THEME.coal }}>{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function ModuleCard({ module, onStart }: any){
  const [done] = useLocalState(`wp2.done.${module.key}`, {} as any);
  return (
    <div className={classNames(cardBase, "overflow-hidden")} role="region" aria-label={`${module.title} module`}>
      <div className="px-6 py-5 border-b border-black/5" style={{ background: THEME.mist }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white" style={{ background: THEME.forest }}>{module.icon}</div>
          <div>
            <div className="text-lg font-semibold" style={{ color: THEME.coal }}>{module.title}</div>
            <div className="text-sm opacity-70">{module.subtitle}</div>
          </div>
        </div>
      </div>
      <div className="p-5 grid gap-4">
        {module.lessons.map((l: any) => (
          <button key={l.id}
                  onClick={()=> onStart && onStart(l)}
                  className="text-left p-4 rounded-xl border border-black/10 hover:bg-black/[.03] active:bg-black/[.05] focus:outline-none focus:ring-2 focus:ring-black/10">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-semibold text-base" style={{ color: THEME.coal }}>{l.title}</div>
                <div className="text-sm opacity-70">{l.summary}</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {l.checkpoints.map((c: string, idx: number) => (
                    <span key={idx} className={pill} style={{ background: THEME.leaf, color: 'white' }}>{c}</span>
                  ))}
                </div>
                <div className="mt-3 text-xs opacity-70">~{l.estMins} mins</div>
              </div>
              <span className={classNames("px-2.5 py-1 rounded-lg text-xs border", (done as any)[l.id] ? "border-green-600 text-green-700" : "border-black/10")}>{(done as any)[l.id] ? 'Done' : 'Start'}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ---- iPad-friendly Lesson Sheet ----
function LessonSheet({ track, modules, active, onClose, onJump }: any){
  const { moduleKey, lessonId } = active || {};
  const module = (modules as any[]).find((m: any) => m.key === moduleKey) || (modules as any[])[0];
  const idx = Math.max(0, (module.lessons as any[]).findIndex((l: any) => l.id === lessonId));
  const lesson = (module.lessons as any[])[idx] || (module.lessons as any[])[0];
  const doneKey = `wp2.done.${module.key}`;
  const [done, setDone] = useLocalState(doneKey, {} as any);
  const [checks, setChecks] = useLocalState(`wp2.lesson.${module.key}.${lesson.id}.checks`, Array((lesson.checkpoints as any[]).length).fill(false) as any);
  const [notes, setNotes] = useLocalState(`wp2.lesson.${module.key}.${lesson.id}.notes`, "");

  function markComplete(){ setDone((prev: any) => ({ ...prev, [lesson.id]: true })); }
  function toggleCheck(i: number){ setChecks((prev: any[]) => prev.map((v,idx)=> idx===i ? !v : v)); }
  function nav(delta: number){
    const nextIdx = idx + delta;
    if (nextIdx < 0){
      const mIx = Math.max(0, (modules as any[]).findIndex((m:any)=>m.key===module.key) - 1);
      const prevMod = (modules as any[])[mIx];
      onJump(prevMod.key, (prevMod.lessons as any[])[(prevMod.lessons as any[]).length-1].id);
    } else if (nextIdx >= (module.lessons as any[]).length){
      const mIx = (modules as any[]).findIndex((m:any)=>m.key===module.key) + 1;
      const nextMod = (modules as any[])[mIx] || (modules as any[])[(modules as any[]).length-1];
      onJump(nextMod.key, (nextMod.lessons as any[])[0].id);
    } else {
      onJump(module.key, (module.lessons as any[])[nextIdx].id);
    }
  }

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute inset-x-0 bottom-0 md:inset-y-8 md:mx-auto md:max-w-3xl md:rounded-2xl bg-white border border-black/10 shadow-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-black/10 flex items-center justify-between" style={{ background: THEME.mist }}>
          <div className="flex items-center gap-2">
            <span className={pill} style={{ background: THEME.gold }}>{module.title}</span>
            <span className="text-sm font-semibold" style={{ color: THEME.coal }}>{lesson.title}</span>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-black/[.06]" aria-label="Close"><X className="w-5 h-5"/></button>
        </div>
        <div className="p-4 md:p-6 grid gap-4">
          <div className="text-sm opacity-80">{lesson.summary}</div>
          <div className="grid gap-2">
            <div className="text-sm font-medium" style={{ color: THEME.coal }}>Checklist</div>
            {(lesson.checkpoints as any[]).map((c,i)=> (
              <label key={i} className="flex items-center gap-2 text-sm">
                <input type="checkbox" className="w-5 h-5" checked={!!(checks as any[])[i]} onChange={()=>toggleCheck(i)} />
                <span>{c}</span>
              </label>
            ))}
          </div>
          <div className="grid gap-2">
            <div className="text-sm font-medium" style={{ color: THEME.coal }}>Notes</div>
            <textarea className="w-full h-28 p-3 rounded-xl border border-black/10 text-sm" placeholder="Jot your ideas, actions, or links…" value={notes as any} onChange={e=>setNotes((e.target as any).value)} />
          </div>
        </div>
        <div className="px-4 py-3 border-t border-black/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={()=>nav(-1)} className="px-3 py-2 rounded-lg border border-black/10 flex items-center gap-1 text-sm"><ChevronLeft className="w-4 h-4"/> Prev</button>
            <button onClick={()=>nav(1)} className="px-3 py-2 rounded-lg border border-black/10 flex items-center gap-1 text-sm">Next <ChevronRight className="w-4 h-4"/></button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs opacity-70">~{lesson.estMins} mins</span>
            <button onClick={markComplete} className="px-3 py-2 rounded-lg text-sm text-white" style={{ background: THEME.leaf }}>Mark Complete</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---- Explore ----
function Explore({ track }: any){
  if (track === 'nonprofit') return <NPScenarios/>;
  if (track === 'teen') return <TeenStudio/>;
  return <MysteryCases/>;
}

function CaseCard({ title, tag, summary, prompts }: any){
  const [reveal, setReveal] = useState(false);
  return (
    <div className={`${cardBase} p-4`} onMouseDown={() => setReveal(true)} onMouseUp={() => setReveal(false)} onMouseLeave={() => setReveal(false)}>
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold" style={{ color: THEME.coal }}>{title}</div>
        <span className={pill} style={{ background: THEME.gold }}>{tag}</span>
      </div>
      <p className="mt-2 text-sm opacity-80">{summary}</p>
      <ul className="mt-3 list-disc pl-5 text-sm space-y-1">{(prompts as any[]).map((p, i) => <li key={i}>{p}</li>)}</ul>
      {reveal && (<div className="mt-3 text-xs p-2 rounded-lg" style={{ background: THEME.mist }}><strong>Nudge:</strong> start simple — baseline before complex models.</div>)}
    </div>
  );
}

function MysteryCases(){
  return (
    <div className="grid lg:grid-cols-5 gap-6">
      <div className="lg:col-span-3 space-y-6">
        <Section title="Case Files: The Confluence" icon={<Lightbulb className="w-4 h-4" />}>
          <p className="text-sm opacity-80">Investigate PA and Appalachian scenarios. Balance people, policy, and physics.</p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <CaseCard title="Signal in the Noise" tag="Water quality" summary="Conductivity spikes appear in one reach. Decide which signals demand field checks." prompts={["Draft a sampling plan.", "Pick an alert threshold and why.", "How do you share uncertainty."]} />
            <CaseCard title="Soundscapes" tag="Bioacoustics" summary="Units near a trail capture people and wildlife. Protect privacy while catching target calls." prompts={["Filter at edge or cloud.", "Data you store and how long.", "Who approves public clips."]} />
            <CaseCard title="Mapping with Care" tag="GIS" summary="You have sensitive nest sites and illegal dumping reports. Inform without harm." prompts={["What to buffer or bin.", "Handle takedown requests.", "A tooltip that teaches."]} />
            <CaseCard title="Grant Sprint" tag="NLP" summary="Use outline and retrieval to draft a cross county proposal with clear roles and outcomes." prompts={["Five sections and owners.", "Write why now in eighty words.", "Three outcomes for year one."]} />
          </div>
        </Section>
      </div>
      <div className="lg:col-span-2 space-y-6">
        <Section title="Progress Snapshot" icon={<Leaf className="w-4 h-4" />}>
          <p className="text-sm opacity-80">Finish lessons to unlock more cases. Keep notes and share what you learn.</p>
        </Section>
      </div>
    </div>
  );
}

function NPScenarios(){
  return (
    <div className="grid lg:grid-cols-5 gap-6">
      <div className="lg:col-span-3 space-y-6">
        <Section title="Scenarios for Nonprofit Leaders" icon={<Handshake className="w-4 h-4" />}>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <CaseCard title="Donor Outreach with Dignity" tag="Ethics" summary="Get better outreach without manipulation. Design a consent first journey." prompts={["Define consent touchpoints.", "Write a clear disclosure.", "Pick two dignity aligned metrics."]} />
            <CaseCard title="Grant Copilot" tag="Proposals" summary="Draft a competitive grant using past wins and public data." prompts={["Outline sections and owners.", "Write why now.", "Define year one outcomes."]} />
            <CaseCard title="Volunteer Scheduler" tag="Automation" summary="Match shifts from a form to a calendar with approvals and reminders." prompts={["Sketch the chain.", "Where do humans approve.", "Data to retain and why."]} />
            <CaseCard title="Energy & Access" tag="Equity" summary="Balance benefits with compute cost and access limits." prompts={["One low compute tool.", "Who lacks broadband.", "Plan an offline fallback."]} />
          </div>
        </Section>
      </div>
      <div className="lg:col-span-2 space-y-6">
        <Section title="Board Packet: Talking Points" icon={<Leaf className="w-4 h-4" />}>
          <div className={`${cardBase} p-4 text-sm space-y-2`}>
            <p><strong>Mission fit:</strong> tie pilots to program outcomes and community benefit.</p>
            <p><strong>Risk controls:</strong> approvals, disclosures, and retention limits.</p>
            <p><strong>Budget:</strong> start small, measure, and scale on value.</p>
          </div>
        </Section>
      </div>
    </div>
  );
}

function TeenStudio(){
  const [story, setStory] = useState("");
  const [strengths, setStrengths] = useState("");
  const [weaknesses, setWeaknesses] = useState("");
  const [links, setLinks] = useState("");
  const [resume, setResume] = useState("");
  const [prompts, setPrompts] = useState("");

  function makePrompts(){
    const tpl = `# Brand Builder Prompts

1) Reflect on strengths
Role: coach. Goal: find themes. Inputs: ${strengths || "[paste strengths]"}.
Ask: what themes connect these and which projects fit me.

2) Spot skill gaps
Role: mentor. Goal: plan improvements. Inputs: ${weaknesses || "[paste weaknesses]"}.
Ask: give a two week plan with resources.

3) Portfolio review
Role: hiring manager. Goal: objective feedback. Inputs: ${links || "[links to work]"}.
Ask: what is strongest and what is missing.

4) Resume edit
Role: editor. Goal: clear bullets. Inputs: ${resume || "[paste resume]"}.
Ask: rewrite bullets with action, impact, and evidence.

5) Project starter
Role: product partner. Goal: scope a real project in conservation, art, or science.
Inputs: ${story || "[your story]"}.
Ask: write milestones for four weeks, two hours each week, with deliverables.`;
    setPrompts(tpl);
  }
  function copyAll(){ if (!prompts) return; (navigator as any).clipboard?.writeText(prompts).catch(()=>{}); }

  return (
    <div className="grid lg:grid-cols-5 gap-6">
      <div className="lg:col-span-3 space-y-6">
        <Section title="Studio Projects" icon={<Sparkles className="w-4 h-4" />}>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <CaseCard title="Field Journal" tag="Conservation" summary="Document a local site — photos, notes, a small map, and a question to investigate." prompts={["What evidence do I need.", "How will I share findings.", "Who could I interview."]} />
            <CaseCard title="Micro Exhibit" tag="Arts + Science" summary="Create a short exhibit that explains a topic clearly and beautifully." prompts={["Core message.", "Helpful visuals.", "Audience?"]} />
            <CaseCard title="Community How To" tag="Civic" summary="Make a how to that helps your community: recycling, water testing, native plants." prompts={["Essential steps.", "Safety notes.", "Measure impact."]} />
            <CaseCard title="Personal Brand Kit" tag="Brand" summary="Define your values, tone, and the work you want to be known for." prompts={["Three values.", "What not to do for clicks.", "Next post."]} />
          </div>
        </Section>
      </div>
      <div className="lg:col-span-2 space-y-6">
        <Section title="Brand Lab" icon={<Users className="w-4 h-4" />}>
          <div className={`${cardBase} p-4 grid gap-3 text-sm`}>
            <textarea className="w-full min-h-16 p-2 rounded-lg border border-black/10" placeholder="Your story (what you care about, where you are from)…" value={story} onChange={e=>setStory((e.target as any).value)} />
            <textarea className="w-full min-h-16 p-2 rounded-lg border border-black/10" placeholder="Strengths (skills you are proud of)…" value={strengths} onChange={e=>setStrengths((e.target as any).value)} />
            <textarea className="w-full min-h-16 p-2 rounded-lg border border-black/10" placeholder="Weaknesses (areas to grow)…" value={weaknesses} onChange={e=>setWeaknesses((e.target as any).value)} />
            <textarea className="w-full min-h-16 p-2 rounded-lg border border-black/10" placeholder="Links to work (Drive, GitHub, Canva, YouTube)…" value={links} onChange={e=>setLinks((e.target as any).value)} />
            <textarea className="w-full min-h-16 p-2 rounded-lg border border-black/10" placeholder="Paste resume text (optional)…" value={resume} onChange={e=>setResume((e.target as any).value)} />
            <div className="flex flex-wrap gap-2">
              <button onClick={makePrompts} className="px-3 py-2 rounded-lg text-sm border border-black/10">Generate Prompts</button>
              <button onClick={copyAll} disabled={!prompts} className="px-3 py-2 rounded-lg text-sm border border-black/10 disabled:opacity-50"><Copy className="inline w-4 h-4 mr-1"/> Copy</button>
            </div>
            <textarea className="w-full h-40 p-2 rounded-lg border border-black/10 text-xs" placeholder="Your personalized prompts will appear here…" value={prompts} onChange={e=>setPrompts((e.target as any).value)} />
            <div className="text-xs opacity-70">Your actions shape your brand at school and online. Aim for work you are proud to sign.</div>
          </div>
        </Section>
      </div>
    </div>
  );
}

// ---- Deep Dive ----
function DeepDive({ track }: any){
  return (
    <div className="grid lg:grid-cols-5 gap-6">
      <div className="lg:col-span-3 space-y-6">
        <ValuesCompass track={track} />
        <PurposeBuilder track={track} />
      </div>
      <div className="lg:col-span-2 space-y-6">
        <SocietyMap track={track} />
        <ReflectionJournal track={track} />
      </div>
    </div>
  );
}

function ValuesCompass({ track }: any){
  const KEY = `wp2.values.${track}`;
  const [vals, setVals] = useLocalState(KEY, {
    Integrity: 3, Service: 3, Curiosity: 3, Craft: 3, Community: 3, Sustainability: 3,
  } as any);
  const data = useMemo(() => Object.keys(vals as any).map(k => ({ axis: k, value: Number((vals as any)[k]||0) })), [vals]);
  const set = (k: string, v: any) => setVals((prev: any) => ({ ...prev, [k]: Number(v) }));
  return (
    <Section title="Inner Compass: Values Radar" icon={<Target className="w-4 h-4" />}>
      <div className="grid md:grid-cols-2 gap-4 items-center">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={data as any} outerRadius="80%">
              <PolarGrid />
              <PolarAngleAxis dataKey="axis" tick={{ fontSize: 11 }} />
              <Radar dataKey="value" stroke="#5aa870" fill="#5aa870" fillOpacity={0.35} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          {Object.keys(vals as any).map((k) => (
            <label key={k} className="flex flex-col">
              <span className="mb-1 font-medium" style={{ color: THEME.coal }}>{k}</span>
              <input type="range" min="0" max="5" value={(vals as any)[k]} onChange={(e)=>set(k, (e.target as any).value)} />
            </label>
          ))}
        </div>
      </div>
      <p className="mt-3 text-xs opacity-70">Tip: Adjust as you reflect. The shape is not a score — it is a snapshot to guide choices.</p>
    </Section>
  );
}

function PurposeBuilder({ track }: any){
  const KEY = `wp2.purpose.${track}`;
  const [who, setWho] = useLocalState(KEY+".who", "");
  const [where, setWhere] = useLocalState(KEY+".where", track==='conservation' ? 'our region and watersheds' : track==='nonprofit' ? 'our community and programs' : 'my school and community');
  const [skills, setSkills] = useLocalState(KEY+".skills", "");
  const [values, setValues] = useLocalState(KEY+".values", "integrity, service");
  const [guard, setGuard] = useLocalState(KEY+".guard", "respect privacy, seek consent, and cite sources");
  const statement = useMemo(() => {
    const w = (who as any) || (track==='teen' ? 'I' : 'We');
    return `${w} aim to serve ${where} by using ${(skills as any) || 'thoughtful tools'} — guided by ${values} — in a way that ${guard}.`;
  }, [who, where, skills, values, guard, track]);
  return (
    <Section title="Purpose Builder" icon={<Heart className="w-4 h-4" />}>
      <div className="grid md:grid-cols-2 gap-3 text-sm">
        <input className="p-2 rounded-lg border border-black/10" placeholder={track==='teen' ? 'Who am I becoming' : 'Who we are'} value={who as any} onChange={e=>setWho((e.target as any).value)} />
        <input className="p-2 rounded-lg border border-black/10" placeholder="Where we serve" value={where as any} onChange={e=>setWhere((e.target as any).value)} />
        <input className="p-2 rounded-lg border border-black/10" placeholder="Skills and strengths" value={skills as any} onChange={e=>setSkills((e.target as any).value)} />
        <input className="p-2 rounded-lg border border-black/10" placeholder="Values that guide us" value={values as any} onChange={e=>setValues((e.target as any).value)} />
        <input className="p-2 rounded-lg border border-black/10 md:col-span-2" placeholder="Guardrails (privacy, equity, citations…)" value={guard as any} onChange={e=>setGuard((e.target as any).value)} />
      </div>
      <div className={`${cardBase} p-4 mt-3 text-sm`}>
        <div className="opacity-70">Draft statement</div>
        <div className="mt-1 font-medium" style={{ color: THEME.coal }}>{statement}</div>
      </div>
    </Section>
  );
}

function SocietyMap({ track }: any){
  const KEY = `wp2.society.${track}`;
  const [nodes, setNodes] = useLocalState(KEY, [
    { name: 'Community', type: 'ally' },
    { name: 'Environment', type: 'beneficiary' },
  ] as any);
  const [name, setName] = useState("");
  const [type, setType] = useState("ally");
  const colors: any = { ally: '#5aa870', funder: '#f5a524', regulator: '#2563eb', beneficiary: '#0ea5e9', peer: '#a78bfa' };
  function add(){ if (!name.trim()) return; setNodes((prev: any)=>[...prev, { name: name.trim(), type }]); setName(""); }
  return (
    <Section title="Society Sketch" icon={<Scale className="w-4 h-4" />}>
      <div className="text-sm opacity-80">Map relationships: who benefits, who decides, who helps. Keep names respectful; this stays on your device.</div>
      <div className="mt-3 flex gap-2 text-sm">
        <input className="flex-1 p-2 rounded-lg border border-black/10" placeholder="Add stakeholder (e.g., local watershed group)" value={name} onChange={e=>setName((e.target as any).value)} />
        <select className="p-2 rounded-lg border border-black/10" value={type} onChange={e=>setType((e.target as any).value)}>
          <option value="ally">Ally</option>
          <option value="beneficiary">Beneficiary</option>
          <option value="funder">Funder</option>
          <option value="regulator">Regulator</option>
          <option value="peer">Peer</option>
        </select>
        <button className="px-3 py-2 rounded-lg text-sm border border-black/10" onClick={add}>Add</button>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {(nodes as any[]).map((n, i) => (
          <div key={i} className="px-3 py-2 rounded-lg text-sm border border-black/10 flex items-center justify-between">
            <span>{(n as any).name}</span>
            <span className={pill} style={{ background: colors[(n as any).type]||'#444', color: 'white' }}>{(n as any).type}</span>
          </div>
        ))}
      </div>
    </Section>
  );
}

function ReflectionJournal({ track }: any){
  const KEY = `wp2.journal.${track}`;
  const [page, setPage] = useLocalState(KEY, {
    prompt1: '', prompt2: '', prompt3: ''
  } as any);
  const prompts = track==='teen'
    ? [
        'When did I choose the harder, better path recently?',
        'What research could make my next question stronger?',
        'How do I want classmates to describe my brand one year from now?'
      ]
    : track==='nonprofit'
    ? [
        'Where does our mission meet community dignity today?',
        'What are we measuring that really matters to people we serve?',
        'Which risk makes us hesitate — and how can we test it safely?'
      ]
    : [
        'What place or species shapes my sense of meaning?',
        'Whose perspective have I not included yet?',
        'What is one action I can take this month?'
      ];
  return (
    <Section title="Reflection Journal" icon={<BookOpen className="w-4 h-4" />}>
      <div className="grid gap-3">
        {prompts.map((p, i) => (
          <textarea key={i} className="w-full min-h-20 p-3 rounded-xl border border-black/10 text-sm" placeholder={p} value={(page as any)[`prompt${i+1}`]||''} onChange={e=>setPage((prev:any)=>({ ...prev, [`prompt${i+1}`]: (e.target as any).value }))} />
        ))}
      </div>
      <div className="text-xs opacity-70 mt-2">Private to your browser. Export is coming next if you want a PDF of reflections.</div>
    </Section>
  );
}

// ---- Workbench ----
function Workbench({ mapToken, csvRows, setCsvRows }: any){
  const [status, setStatus] = useState("");
  const [series, setSeries] = useState<any[]>([]);

  function onFile(file: File){
    const r = new FileReader();
    r.onload = () => {
      try {
        const text = String(r.result).trim();
        const lines = text.split(/\r?\n/);
        const headers = lines[0].split(',').map(s=>s.trim());
        const tIdx = headers.findIndex(h => /time|date|t/i.test(h));
        const phIdx = headers.findIndex(h => /ph/i.test(h));
        const tmpIdx = headers.findIndex(h => /temp|celsius|degc/i.test(h));
        const rows = lines.slice(1).map((ln,i)=>{ const parts = ln.split(','); return { t: parts[tIdx] || String(i), pH: phIdx>=0? Number(parts[phIdx]) : undefined, tempC: tmpIdx>=0? Number(parts[tmpIdx]) : undefined }; });
        setCsvRows(rows);
        setSeries(rows.map((r:any,i:number)=> ({ t: r.t || String(i), pH: r.pH ?? (7 + Math.sin(i/3)*0.2), tempC: r.tempC ?? (16 + Math.cos(i/4)*2.0) })));
        setStatus(`Loaded ${rows.length} rows`);
      } catch { setStatus('Could not parse CSV'); }
    };
    r.readAsText(file);
  }

  return (
    <div className="grid lg:grid-cols-5 gap-6">
      <div className="lg:col-span-3 space-y-6">
        <Section title="Upload & Chart" icon={<BookOpen className="w-4 h-4" />}>
          <div className="text-sm opacity-80">Upload a CSV to see quick trends. Use columns like time, pH, tempC.</div>
          <div className="mt-3 flex items-center gap-2">
            <input type="file" accept=".csv" onChange={(e)=>{ const f = (e.target as any).files?.[0]; if (f) onFile(f); }} />
            <span className="text-xs opacity-70">{status}</span>
          </div>
          <div className="h-56 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={series} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="t" tick={{ fontSize: 10 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 10 }} domain={[5, 9]} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} />
                <Tooltip />
                <Line yAxisId="left" type="monotone" dataKey="pH" dot={false} strokeWidth={2} />
                <Line yAxisId="right" type="monotone" dataKey="tempC" dot={false} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Section>

        <Section id="map" title="Map Layers" icon={<Map className="w-4 h-4" />}>
          <MapPane token={mapToken} />
        </Section>
      </div>

      <div className="lg:col-span-2 space-y-6">
        <Section title="Time Budget (Pie)" icon={<Star className="w-4 h-4" />}>
          <TimeBudget />
        </Section>
      </div>
    </div>
  );
}

function TimeBudget(){
  const [items, setItems] = useLocalState('wp2.time', [
    { label: 'Study', value: 6 }, { label: 'Field', value: 4 }, { label: 'Community', value: 3 }, { label: 'Rest', value: 3 }
  ] as any);
  const total = (items as any[]).reduce((a,b)=>a+Number((b as any).value||0),0)||1;
  const colors = ["#5aa870", "#f5a524", "#2563eb", "#a78bfa", "#f472b6", "#111827"];
  function update(i: number, key: string, v: any){ setItems((prev:any[]) => prev.map((it,idx)=> idx===i ? { ...it, [key]: key==='value'? Number(v): v } : it)); }
  function add(){ setItems((prev:any[]) => [...prev, { label: 'New', value: 1 }]); }
  return (
    <div className="grid md:grid-cols-2 gap-4 items-center">
      <div className="h-60">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={items as any[]} dataKey="value" nameKey="label" outerRadius={90}>
              {(items as any[]).map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
            </Pie>
            <Tooltip formatter={(v:any, n:any)=>[`${v} hrs`, n]} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="grid gap-2 text-sm">
        {(items as any[]).map((it:any, i:number) => (
          <div key={i} className="flex gap-2 items-center">
            <input className="flex-1 p-2 rounded-lg border border-black/10" value={it.label} onChange={e=>update(i,'label',(e.target as any).value)} />
            <input type="number" min="0" className="w-20 p-2 rounded-lg border border-black/10" value={it.value} onChange={e=>update(i,'value',(e.target as any).value)} />
            <span className="text-xs opacity-70">{Math.round((Number(it.value||0)/total)*100)}%</span>
          </div>
        ))}
        <button onClick={add} className="mt-1 px-3 py-2 rounded-lg text-sm border border-black/10">Add item</button>
      </div>
    </div>
  );
}

function MapPane({ token }: any){
  const ref = useRef<HTMLDivElement | null>(null);
  const [err, setErr] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let map: any = null; let cleanup = () => {};
    (async () => {
      try {
        const mb = await import(/* @vite-ignore */ 'mapbox-gl').catch(() => null);
        if (!mb || !mb.default) { setErr('Map library unavailable'); return; }
        const mapboxgl = mb.default as any;
        if (token) mapboxgl.accessToken = token;
        const style: any = token ? 'mapbox://styles/mapbox/light-v11' : {
          version: 8,
          sources: { osm: { type: 'raster', tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'], tileSize: 256, attribution: '© OpenStreetMap' } },
          layers: [ { id: 'osm', type: 'raster', source: 'osm' } ]
        };
        map = new mapboxgl.Map({ container: ref.current, style, center: [-79.9959, 40.4406], zoom: 9 });
        map.on('load', () => {
          setReady(true);
          const pts = { type: 'FeatureCollection', features: [
            { type: 'Feature', properties: { name: 'Sample Site A' }, geometry: { type: 'Point', coordinates: [-79.95, 40.44] } },
            { type: 'Feature', properties: { name: 'Sample Site B' }, geometry: { type: 'Point', coordinates: [-80.02, 40.48] } },
          ]};
          map.addSource('sites', { type: 'geojson', data: pts });
          map.addLayer({ id: 'sites', type: 'circle', source: 'sites', paint: { 'circle-radius': 6, 'circle-color': '#2563eb', 'circle-stroke-width': 1, 'circle-stroke-color': '#ffffff' } });
        });
        map.on('error', () => { if (token && !map.getSource('osm')) {
          map.addSource('osm', { type: 'raster', tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'], tileSize: 256 });
          map.addLayer({ id: 'osm', type: 'raster', source: 'osm' }, map.getStyle().layers[0]?.id);
        }});
        cleanup = () => { try { map && map.remove(); } catch {} };
      } catch (e){ setErr('Map init failed'); }
    })();
    return () => cleanup();
  }, [token]);

  return (
    <div>
      <div ref={ref} className="w-full h-72 rounded-xl border border-black/10" />
      {!ready && !err && <div className="text-xs opacity-70 mt-2">Loading map…</div>}
      {err && <div className="text-xs opacity-70 mt-2">{err}. Add a public Mapbox token in Admin to enable vector styles.</div>}
    </div>
  );
}

// ---- Quick Quiz ----
function QuickQuiz({ bank }: any){
  const [idx, setIdx] = useState(0);
  const [val, setVal] = useState("");
  const [res, setRes] = useState(null as any);
  const q = (bank as any[])[idx % ((bank as any[]).length || 1)] || { q: 'No questions yet', a: '' };
  function check(){
    const u = (val||'').toLowerCase();
    const a = (q.a||'').toLowerCase();
    const ok = u && (u.includes(a.split(' ')[0]) || a.includes(u.split(' ')[0]));
    setRes(ok ? 'correct' : 'try again');
  }
  function next(){ setRes(null); setVal(''); setIdx(i => i + 1); }
  return (
    <div>
      <div className="text-sm font-medium" style={{ color: THEME.coal }}>{q.q}</div>
      <input value={val} onChange={e=>setVal((e.target as any).value)} placeholder="Your answer…" className="mt-2 w-full p-2 rounded-lg border border-black/10 text-sm" />
      <div className="mt-2 flex gap-2">
        <button onClick={check} className="px-3 py-1.5 rounded-lg text-sm border border-black/10">Check</button>
        <button onClick={next} className="px-3 py-1.5 rounded-lg text-sm text-white" style={{ background: THEME.leaf }}>Next</button>
      </div>
      {res && (<div className="mt-2 text-sm">{res === 'correct' ? <span className="text-green-700">Nice. That matches the key idea.</span> : <span className="opacity-80">Close. Check wording and key concepts.</span>}</div>)}
    </div>
  );
}

// ---- Resources ----
function Resources({ track }: any){
  const LinkItem = ({ href, label }: any) => (
    <a href={href} target="_blank" rel="noreferrer" className="block px-3 py-2 rounded-lg border border-black/10 hover:bg-black/[.04]">{label}</a>
  );
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
      {track !== 'nonprofit' && (
        <Section title="Conservation AI" icon={<Trees className="w-4 h-4" />}>
          <div className="grid gap-2">
            <LinkItem href="https://www.wildlabs.net/" label="Wildlabs — Wildlife tech community" />
            <LinkItem href="https://globalfishingwatch.org/" label="Global Fishing Watch — Transparency mapping" />
            <LinkItem href="https://developers.planet.com/" label="Planet Labs — Satellite data" />
          </div>
        </Section>
      )}
      <Section title="AI for Good" icon={<Brain className="w-4 h-4" />}>
        <div className="grid gap-2">
          <LinkItem href="https://www.microsoft.com/en-us/ai/ai-for-earth" label="Microsoft AI for Earth" />
          <LinkItem href="https://conservationxlabs.com/" label="Conservation X Labs" />
          <LinkItem href="https://www.codeforamerica.org/" label="Code for America" />
        </div>
      </Section>
      {track === 'teen' && (
        <Section title="Teen Learn" icon={<Sparkles className="w-4 h-4" />}>
          <div className="grid gap-2">
            <LinkItem href="https://p5js.org/" label="p5.js — Creative coding" />
            <LinkItem href="https://www.khanacademy.org/" label="Khan Academy — Foundations" />
            <LinkItem href="https://earthengine.google.com/" label="Earth Engine — Environmental data" />
          </div>
        </Section>
      )}
    </div>
  );
}

// ---- Admin ----
function Admin({ mapToken, setMapToken }: any){
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Section title="Map Settings" icon={<Map className="w-4 h-4" />}>
        <div className="text-sm opacity-80">Add a public Mapbox token to enable vector styles. Without a token we use OSM raster.</div>
        <input value={mapToken} onChange={e=>setMapToken((e.target as any).value)} placeholder="pk. public token" className="mt-2 w-full p-2 rounded-lg border border-black/10 text-sm" />
      </Section>
      <Section title="Guidance" icon={<HelpCircle className="w-4 h-4" />}>
        <ul className="list-disc pl-5 text-sm space-y-1">
          <li>Deep Dive data stays in your browser. For workshops, consider an optional export toggle.</li>
          <li>GitHub Pages ready. Render <code>&lt;WildPraxisV2App /&gt;</code> in your entry file.</li>
        </ul>
      </Section>
    </div>
  );
}

// ---- Footer ----
function Footer(){
  return (
    <footer className="py-10 mt-8 border-t border-black/5">
      <div className="mx-auto max-w-7xl px-4 grid md:grid-cols-3 gap-6 text-sm">
        <div>
          <h4 className="font-semibold mb-1" style={{ color: THEME.coal }}>About</h4>
          <p className="opacity-70">WildPraxis v2 adds an iPad-style Lesson Runner so learners can tap lessons in Literacy, Data, and Implementation.</p>
        </div>
        <div>
          <h4 className="font-semibold mb-1" style={{ color: THEME.coal }}>Branding</h4>
          <p className="opacity-70">Adjust THEME tokens to match Wildlife Leadership Academy palette. Teen accents use pink and indigo.</p>
        </div>
        <div>
          <h4 className="font-semibold mb-1" style={{ color: THEME.coal }}>Credits</h4>
          <p className="opacity-70">Icons: lucide-react • Charts: Recharts • Maps: OpenStreetMap / Mapbox GL (token optional).</p>
        </div>
      </div>
    </footer>
  );
}


