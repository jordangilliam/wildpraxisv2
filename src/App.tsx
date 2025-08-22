/* The full WildPraxis v2 app provided by the user, adapted to TSX with no raw '>' in JSX */
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Brain, Trees, Users, Compass, BookOpen, Lightbulb, FlaskConical, Globe2, Settings,
  HelpCircle, CheckCircle2, Circle, Leaf, FileDown, Copy, Sparkles, Handshake, Map,
  Heart, Target, Scale, Star
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, Radar,
  PieChart, Pie, Cell
} from "recharts";

const THEME = { forest: "#1f3d2a", leaf: "#5aa870", gold: "#f5a524", coal: "#0f172a", mist: "#f7faf7", teenPink: "#f472b6", teenIndigo: "#6366f1" } as const;
const shadow = "shadow-[0_10px_30px_rgba(0,0,0,0.12)]";
const cardBase = `rounded-2xl ${shadow} border border-black/5 bg-white`;
const pill = "px-2.5 py-1 rounded-full text-xs font-semibold";

function useLocalState<T = any>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try { const raw = localStorage.getItem(key); return raw ? (JSON.parse(raw) as T) : initial; } catch { return initial; }
  });
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} }, [key, value]);
  return [value, setValue] as const;
}

function classNames(...xs: Array<string | false | null | undefined>) { return xs.filter(Boolean).join(" "); }

// ---- Helpers ----
// Text similarity helpers (no regex literals so the canvas patcher stays happy)
function tokenizeWords(s: string){ s=(s||'').toLowerCase(); const words: string[]=[]; let cur=''; for(const ch of s){ const code=ch.charCodeAt(0); const isAlnum=(code>=48&&code<=57)||(code>=97&&code<=122); if(isAlnum){ cur+=ch; } else { if(cur){ words.push(cur); cur=''; } } } if(cur) words.push(cur); return words; }
function jaccardTokens(a: string,b: string){ const A=new Set(tokenizeWords(a)); const B=new Set(tokenizeWords(b)); const inter=[...A].filter(x=>B.has(x)).length; return inter/Math.max(1, A.size+B.size-inter); }
function collapseWhitespace(s: string){ let out=''; let ws=false; for(const ch of (s||'').toLowerCase()){ const isSpace=(ch===' '||ch==='\n'||ch==='\t'||ch==='\r'); if(isSpace){ if(!ws){ out+=' '; ws=true; } } else { out+=ch; ws=false; } } return out; }
function ngramVecStr(s: string,n=3){ const t=collapseWhitespace(s); const m=new Map<string, number>(); for(let i=0;i<=Math.max(0,t.length-n); i++){ const g=t.slice(i,i+n); if(g.indexOf(' ')>=0) continue; m.set(g,(m.get(g)||0)+1); } return m; }
function cosineSimStr(a: string,b: string){ const A=ngramVecStr(a), B=ngramVecStr(b); const keys=new Set<string>([...A.keys(),...B.keys()]); let dot=0,na=0,nb=0; keys.forEach(k=>{ const va=A.get(k)||0, vb=B.get(k)||0; dot+=va*vb; na+=va*va; nb+=vb*vb; }); return dot/(Math.sqrt(na||1)*Math.sqrt(nb||1)); }

// Modules (trimmed to user content)
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
];

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
];

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
];

const QUIZ: any = {
  conservation: { core: [ { q: "Embeddings help with?", a: "Semantic search and retrieval." } ] },
  nonprofit: { core: [ { q: "Context window is?", a: "How much recent text a model can see at once." } ] },
  teen: { core: [ { q: "Prompt skeleton?", a: "Role, goal, constraints, steps; include an example." } ] }
};

export default function WildPraxisV2App(){
  const [track, setTrack] = useLocalState("wp2.track", "conservation");
  const [tab, setTab] = useLocalState("wp2.tab", "learn");
  const [notes, setNotes] = useLocalState("wp2.notes", "");
  const [mapToken, setMapToken] = useLocalState("wp2.mapToken", "");
  const [csvRows, setCsvRows] = useState<any[] | null>(null);
  const [activeLesson, setActiveLesson] = useLocalState("wp2.activeLesson", null as any);
  const modules = track === 'conservation' ? MOD_CONSERVATION : track === 'nonprofit' ? MOD_NONPROFIT : MOD_TEEN;
  const quizBank = (QUIZ as any)[track].core || [];

  return (
    <div className="min-h-screen" style={{ background: THEME.mist }}>
      <Header track={track as any} tab={tab as any} setTab={setTab as any} setTrack={setTrack as any} />

      <main className="mx-auto max-w-7xl px-4 py-6">
        {tab === 'learn' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Hero track={track as any} />
              {activeLesson ? (
                <LessonRunner active={activeLesson as any} track={track as any} onExit={()=>setActiveLesson(null as any)} />
              ) : (
                modules.map(m => (
                  <ModuleCard
                    key={m.key}
                    module={m}
                    onStart={(lesson: any)=>setActiveLesson({ moduleKey: m.key, lessonId: lesson.id, title: lesson.title } as any)}
                  />
                ))
              )}
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
        {tab === 'workbench' && <Workbench mapToken={mapToken as any} csvRows={csvRows as any} setCsvRows={setCsvRows as any} />}
        {tab === 'resources' && <Resources track={track as any} />}
        {tab === 'admin' && <Admin mapToken={mapToken as any} setMapToken={setMapToken as any} />}
      </main>

      <Footer />
    </div>
  );
}

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
  const [done, setDone] = useLocalState(`wp2.done.${module.key}`, {} as any);
  return (
    <div className={classNames(cardBase, "overflow-hidden")}>
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
          <div key={l.id} className="p-4 rounded-xl border border-black/10">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-semibold" style={{ color: THEME.coal }}>{l.title}</div>
                <div className="text-sm opacity-70">{l.summary}</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {l.checkpoints.map((c: string, idx: number) => (
                    <span key={idx} className={pill} style={{ background: THEME.leaf, color: 'white' }}>{c}</span>
                  ))}
                </div>
                <div className="mt-3 text-xs opacity-70">~{l.estMins} mins</div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={()=> onStart && onStart(l)} className="px-3 py-1.5 rounded-lg text-sm border border-black/10">Start</button>
                <button onClick={() => setDone((prev: any) => ({ ...prev, [l.id]: !prev[l.id] }))} className={classNames("px-3 py-1.5 rounded-lg text-sm border", (done as any)[l.id] ? "border-green-600 text-green-700" : "border-black/10")}>
                  {(done as any)[l.id] ? <CheckCircle2 className="inline w-4 h-4 mr-1" /> : <Circle className="inline w-4 h-4 mr-1" />}Done
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

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
      <ul className="mt-3 list-disc pl-5 text-sm space-y-1">{prompts.map((p: string, i: number) => <li key={i}>{p}</li>)}</ul>
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
    const tpl = `# Brand Builder Prompts\n\n1) Reflect on strengths\nRole: coach. Goal: find themes. Inputs: ${strengths || "[paste strengths]"}.\nAsk: what themes connect these and which projects fit me.\n\n2) Spot skill gaps\nRole: mentor. Goal: plan improvements. Inputs: ${weaknesses || "[paste weaknesses]"}.\nAsk: give a two week plan with resources.\n\n3) Portfolio review\nRole: hiring manager. Goal: objective feedback. Inputs: ${links || "[links to work]"}.\nAsk: what is strongest and what is missing.\n\n4) Resume edit\nRole: editor. Goal: clear bullets. Inputs: ${resume || "[paste resume]"}.\nAsk: rewrite bullets with action, impact, and evidence.\n\n5) Project starter\nRole: product partner. Goal: scope a real project in conservation, art, or science.\nInputs: ${story || "[your story]"}.\nAsk: write milestones for four weeks, two hours each week, with deliverables.`;
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
  const [vals, setVals] = useLocalState(KEY, { Integrity: 3, Service: 3, Curiosity: 3, Craft: 3, Community: 3, Sustainability: 3 });
  const data = useMemo(() => Object.keys(vals).map(k => ({ axis: k, value: Number((vals as any)[k]||0) })), [vals]);
  const set = (k: string, v: any) => setVals((prev: any) => ({ ...prev, [k]: Number(v) }));
  return (
    <Section title="Inner Compass: Values Radar" icon={<Target className="w-4 h-4" />}>
      <div className="grid md:grid-cols-2 gap-4 items-center">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={data} outerRadius="80%">
              <PolarGrid />
              <PolarAngleAxis dataKey="axis" tick={{ fontSize: 11 }} />
              <Radar dataKey="value" stroke="#5aa870" fill="#5aa870" fillOpacity={0.35} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          {Object.keys(vals).map((k) => (
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
  const [nodes, setNodes] = useLocalState(KEY, [ { name: 'Community', type: 'ally' }, { name: 'Environment', type: 'beneficiary' } ]);
  const [name, setName] = useState("");
  const [type, setType] = useState("ally");
  const colors: any = { ally: '#5aa870', funder: '#f5a524', regulator: '#2563eb', beneficiary: '#0ea5e9', peer: '#a78bfa' };
  function add(){ const nm = name.trim(); if (!nm) return; setNodes((prev: any)=>[...prev, { name: nm, type }]); setName(""); }
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
  const [page, setPage] = useLocalState(KEY, { prompt1: '', prompt2: '', prompt3: '' } as any);
  const prompts = track==='teen'
    ? [ 'When did I choose the harder, better path recently?', 'What research could make my next question stronger?', 'How do I want classmates to describe my brand one year from now?' ]
    : track==='nonprofit'
    ? [ 'Where does our mission meet community dignity today?', 'What are we measuring that really matters to people we serve?', 'Which risk makes us hesitate — and how can we test it safely?' ]
    : [ 'What place or species shapes my sense of meaning?', 'Whose perspective have I not included yet?', 'What is one action I can take this month?' ];
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
  const [items, setItems] = useLocalState('wp2.time', [ { label: 'Study', value: 6 }, { label: 'Field', value: 4 }, { label: 'Community', value: 3 }, { label: 'Rest', value: 3 } ]);
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


// ---- Interactive Lessons ----
function LessonRunner({ active, track, onExit }: any){
  const { lessonId, title } = active || {};
  return (
    <div className={classNames(cardBase, "p-5")}>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs opacity-70">Interactive Lesson</div>
          <h3 className="text-lg font-semibold" style={{ color: THEME.coal }}>{title}</h3>
        </div>
        <button onClick={onExit} className="px-3 py-1.5 rounded-lg text-sm border border-black/10">Exit</button>
      </div>
      <div className="mt-4">
        {lessonId === 'foundations' && <LessonCoreFoundations />}
        {lessonId === 'ethics' && <LessonEthics />}
        {lessonId === 'sensors' && <LessonSensorsAlerts />}
        {lessonId === 'gis' && <LessonGISCare />}
        {lessonId === 'auto' && <LessonAutomationsTrust />}
        {!['foundations','ethics','sensors','gis','auto'].includes(lessonId) && (
          <div className="text-sm opacity-70">Lesson coming soon.</div>
        )}
      </div>
    </div>
  );
}

function LessonCoreFoundations(){
  const [text, setText] = useState("Brook trout prefer cold, clean streams with shade.");
  const [win, setWin] = useState(1024);
  const approxTokens = Math.max(1, Math.round(tokenizeWords(text).length * 1.3));
  const pct = Math.min(100, Math.round((approxTokens / win) * 100));

  const [p1, setP1] = useState("water quality is rising in spring");
  const [p2, setP2] = useState("spring conductivity increases as snow melts");
  const sim = Math.round(cosineSimStr(p1, p2) * 100);

  const corpus = [
    { id: 'a', t: 'Brook trout habitat', body: 'Cold, shaded streams with dissolved oxygen and groundwater inputs.' },
    { id: 'b', t: 'Grant timeline', body: 'Outline roles, milestones, and a clear budget with community partners.' },
    { id: 'c', t: 'Sensors and alerts', body: 'Conductivity spikes may indicate road salt or discharge; verify in field.' },
    { id: 'd', t: 'Mapping with care', body: 'Buffer sensitive sites and consider hex binning on public maps.' }
  ];
  const [q, setQ] = useState("conductivity spikes");
  const hits = useMemo(()=> corpus.map(c=>({ c, s: jaccardTokens(q, c.body) })).sort((a,b)=> b.s-a.s).slice(0,2), [q]);

  return (
    <div className="grid md:grid-cols-2 gap-5 text-sm">
      <div className="p-4 rounded-xl border border-black/10">
        <div className="font-semibold" style={{ color: THEME.coal }}>Token Explorer</div>
        <textarea className="w-full h-24 p-2 rounded-lg border border-black/10 mt-2" value={text} onChange={e=>setText((e.target as any).value)} />
        <div className="mt-2 flex items-center gap-2">
          <input type="range" min="128" max="8192" value={win} onChange={e=>setWin(Number((e.target as any).value))} />
          <span className="text-xs opacity-70">Window: {win} tokens</span>
        </div>
        <div className="mt-2 h-2 rounded bg-black/10 overflow-hidden"><div style={{ width: pct+"%", background: THEME.leaf }} className="h-2" /></div>
        <div className="mt-1 text-xs opacity-70">Approx {approxTokens} tokens · {pct}% of window</div>
      </div>
      <div className="p-4 rounded-xl border border-black/10">
        <div className="font-semibold" style={{ color: THEME.coal }}>Embedding Similarity</div>
        <input className="w-full p-2 rounded-lg border border-black/10 mt-2" value={p1} onChange={e=>setP1((e.target as any).value)} />
        <input className="w-full p-2 rounded-lg border border-black/10 mt-2" value={p2} onChange={e=>setP2((e.target as any).value)} />
        <div className="mt-2 h-2 rounded bg-black/10 overflow-hidden"><div style={{ width: Math.min(100, Math.max(0, sim))+"%", background: THEME.gold }} className="h-2" /></div>
        <div className="mt-1 text-xs opacity-70">Similarity (cosine on 3-grams): {sim}%</div>
      </div>
      <div className="md:col-span-2 p-4 rounded-xl border border-black/10">
        <div className="font-semibold" style={{ color: THEME.coal }}>Mini Retrieval</div>
        <input className="w-full p-2 rounded-lg border border-black/10 mt-2" placeholder="Ask a question…" value={q} onChange={e=>setQ((e.target as any).value)} />
        <div className="mt-2 grid gap-2">
          {hits.map((h,i)=> (
            <div key={i} className="p-3 rounded-lg border border-black/10">
              <div className="text-xs opacity-70">{h.c.t} · score {h.s.toFixed(2)}</div>
              <div>{h.c.body}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function LessonSensorsAlerts(){
  const base = useMemo(()=> Array.from({length:72}, (_,i)=>{ const spike = (i%23===0?0.9:0) + (i%37===0?1.2:0); return { t: i, pH: 7 + Math.sin(i/8)*0.25 + spike + (Math.random()-0.5)*0.05 }; }), []);
  const [thr, setThr] = useState(7.6);
  const [minC, setMinC] = useState(2);
  const series = useMemo(()=> base.map((r)=> ({ ...r, thresh: thr, alertVal: (r as any).pH >= thr ? (r as any).pH : null })), [base, thr]);
  const alerts = useMemo(()=> countAlerts(base.map((b:any)=>b.pH), thr, minC), [base, thr, minC]);

  return (
    <div className="grid md:grid-cols-2 gap-5 text-sm">
      <div className="p-4 rounded-xl border border-black/10">
        <div className="font-semibold" style={{ color: THEME.coal }}>Set Thresholds</div>
        <div className="mt-2 flex items-center gap-2"><input type="range" min="7.0" max="8.5" step="0.05" value={thr} onChange={e=>setThr(Number((e.target as any).value))}/><span className="text-xs">Threshold {thr.toFixed(2)}</span></div>
        <div className="mt-2 flex items-center gap-2"><input type="range" min="1" max="5" step="1" value={minC} onChange={e=>setMinC(Number((e.target as any).value))}/><span className="text-xs">Consecutive points {minC}</span></div>
        <div className="mt-2 text-xs opacity-70">Alerts detected: {alerts.count} · Visit recommendation: {alerts.count>=2? 'Yes' : 'Maybe'}.</div>
      </div>
      <div className="p-4 rounded-xl border border-black/10">
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={series as any} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="t" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Line type="monotone" dataKey="pH" dot={false} strokeWidth={2} />
              <Line type="linear" dataKey="thresh" dot={false} strokeWidth={1} />
              <Line type="linear" dataKey="alertVal" strokeWidth={0} dot />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
function countAlerts(arr: Array<number>, thr: number, k: number){ let count=0; let run=0; for(const v of arr){ if(v>=thr){ run++; if(run===k){ count++; } } else { run=0; } } return { count }; }

function LessonGISCare(){
  const [sens, setSens] = useState('medium');
  const [aud, setAud] = useState('public');
  const [buf, setBuf] = useState(1.0);
  const [delay, setDelay] = useState(true);
  const rec = useMemo(()=>{
    const items: string[]=[];
    if(aud==='public') items.push('Use hex bins or 1 km grid.'); else items.push('Show buffered points to partners.');
    if(sens==='high') items.push('Omit precise locations; only show presence by region.');
    if(buf>=1) items.push(`Buffer sensitive sites by ${buf.toFixed(1)} km.`);
    if(delay) items.push('Delay publishing 7 days to avoid real-time risks.');
    return items;
  }, [sens,aud,buf,delay]);
  return (
    <div className="grid md:grid-cols-2 gap-5 text-sm">
      <div className="p-4 rounded-xl border border-black/10">
        <div className="font-semibold" style={{ color: THEME.coal }}>Sharing Controls</div>
        <label className="block mt-2">Sensitivity
          <select className="w-full mt-1 p-2 rounded-lg border border-black/10" value={sens} onChange={e=>setSens((e.target as any).value)}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </label>
        <label className="block mt-2">Audience
          <select className="w-full mt-1 p-2 rounded-lg border border-black/10" value={aud} onChange={e=>setAud((e.target as any).value)}>
            <option value="public">Public</option>
            <option value="partners">Partners</option>
            <option value="internal">Internal</option>
          </select>
        </label>
        <div className="mt-2 flex items-center gap-2"><input type="range" min="0" max="5" step="0.5" value={buf} onChange={e=>setBuf(Number((e.target as any).value))}/><span className="text-xs">Buffer {buf.toFixed(1)} km</span></div>
        <label className="mt-2 text-xs flex items-center gap-2"><input type="checkbox" checked={delay} onChange={e=>setDelay((e.target as any).checked)} /> Delay 7 days</label>
      </div>
      <div className="p-4 rounded-xl border border-black/10">
        <div className="font-semibold" style={{ color: THEME.coal }}>Recommended Public Map Treatment</div>
        <ul className="list-disc pl-5 mt-2">
          {rec.map((r,i)=>(<li key={i}>{r}</li>))}
        </ul>
        <div className="text-xs opacity-70 mt-2">Goal: inform without harm; protect sensitive species and private land.</div>
      </div>
    </div>
  );
}

function LessonAutomationsTrust(){
  const [steps, setSteps] = useState([
    { id: 'form', label: 'Intake form', enabled: true },
    { id: 'review', label: 'Human review', enabled: true },
    { id: 'notify', label: 'Notify team', enabled: true },
    { id: 'publish', label: 'Publish to map', enabled: false },
  ] as Array<{id:string,label:string,enabled:boolean}>);
  const [controls, setControls] = useState({ approvals: true, logs: true, disclosure: true });
  const [req, setReq] = useState('Report an illegal dump with a photo and location.');
  const riskPass = (controls as any).approvals && (controls as any).disclosure;
  const spec = useMemo(()=> ({ steps: (steps as any[]).filter((s:any)=>s.enabled).map((s:any)=>s.id), controls }), [steps,controls]);
  return (
    <div className="grid md:grid-cols-2 gap-5 text-sm">
      <div className="p-4 rounded-xl border border-black/10">
        <div className="font-semibold" style={{ color: THEME.coal }}>Flow Builder</div>
        <div className="mt-2 grid gap-2">
          {steps.map((s:any,i:number)=> (
            <label key={s.id} className="flex items-center justify-between p-2 rounded-lg border border-black/10">
              <span>{s.label}</span>
              <input type="checkbox" checked={s.enabled} onChange={e=> setSteps(prev=> (prev as any).map((x:any,idx:number)=> idx===i? {...x, enabled: (e.target as any).checked}: x))} />
            </label>
          ))}
        </div>
        <div className="mt-3 grid gap-2">
          <label className="text-xs flex items-center gap-2"><input type="checkbox" checked={(controls as any).approvals} onChange={e=>setControls((prev:any)=>({...prev, approvals: (e.target as any).checked}))}/> Require approvals</label>
          <label className="text-xs flex items-center gap-2"><input type="checkbox" checked={(controls as any).logs} onChange={e=>setControls((prev:any)=>({...prev, logs: (e.target as any).checked}))}/> Keep audit logs</label>
          <label className="text-xs flex items-center gap-2"><input type="checkbox" checked={(controls as any).disclosure} onChange={e=>setControls((prev:any)=>({...prev, disclosure: (e.target as any).checked}))}/> Show public disclosure</label>
        </div>
      </div>
      <div className="p-4 rounded-xl border border-black/10">
        <div className="font-semibold" style={{ color: THEME.coal }}>Simulate</div>
        <textarea className="w-full h-20 p-2 rounded-lg border border-black/10" value={req} onChange={e=>setReq((e.target as any).value)} />
        <div className="mt-2 text-xs">Risk checklist: {riskPass? 'PASS' : 'Needs disclosure/approval'}</div>
        <div className="mt-2 p-2 rounded-lg border border-black/10 bg-black/[.02]">
          <div className="text-xs opacity-70">Audit log preview</div>
          <div>1. Received: {req.slice(0,60)}…</div>
          {(controls as any).approvals && <div>2. Awaiting human approval…</div>}
          {(controls as any).logs && <div>3. Logged in system with redaction.</div>}
          <div>4. {(steps as any[]).find((s:any)=>s.id==='publish' && s.enabled) ? 'Ready to publish after approval.' : 'Holding internal only.'}</div>
        </div>
        <div className="mt-2 text-xs opacity-70">Spec JSON (for handoff)</div>
        <pre className="text-xs bg-black/[.04] p-2 rounded">{JSON.stringify(spec, null, 2)}</pre>
      </div>
    </div>
  );
}

function LessonEthics(){
  const [aud, setAud] = useState('public kiosk');
  const [data, setData] = useState(['photos','locations'] as string[]);
  const [opts, setOpts] = useState({ retention: '30 days', contact: 'info@example.org' });
  const toggle = (v: string)=> setData(prev=> (prev as any).includes(v)? (prev as any).filter((x:string)=>x!==v): [...(prev as any),v]);
  const text = useMemo(()=> {
    return `We use an assistive system to help review contributions. It processes ${data.join(', ')} to improve conservation decisions. We respect privacy and avoid sensitive site disclosure. You can opt out or request deletion anytime by contacting ${opts.contact}. We retain data for ${opts.retention}.`;
  }, [data, opts]);
  return (
    <div className="grid md:grid-cols-2 gap-5 text-sm">
      <div className="p-4 rounded-xl border border-black/10">
        <div className="font-semibold" style={{ color: THEME.coal }}>Disclosure Builder</div>
        <div className="mt-2">Audience:
          <select className="ml-2 p-1.5 rounded border border-black/10" value={aud} onChange={e=>setAud((e.target as any).value)}>
            <option value="public kiosk">Public kiosk</option>
            <option value="volunteer portal">Volunteer portal</option>
            <option value="staff tool">Staff tool</option>
          </select>
        </div>
        <div className="mt-2">Data types:</div>
        <label className="text-xs flex items-center gap-2"><input type="checkbox" checked={(data as any).includes('photos')} onChange={()=>toggle('photos')}/> Photos</label>
        <label className="text-xs flex items-center gap-2"><input type="checkbox" checked={(data as any).includes('locations')} onChange={()=>toggle('locations')}/> Locations</label>
        <label className="text-xs flex items-center gap-2"><input type="checkbox" checked={(data as any).includes('contact info')} onChange={()=>toggle('contact info')}/> Contact info</label>
        <div className="mt-2 grid gap-2">
          <input className="p-2 rounded border border-black/10" value={opts.contact} onChange={e=>setOpts((prev:any)=>({...prev, contact: (e.target as any).value}))} placeholder="Contact email"/>
          <input className="p-2 rounded border border-black/10" value={opts.retention} onChange={e=>setOpts((prev:any)=>({...prev, retention: (e.target as any).value}))} placeholder="Retention (e.g., 30 days)"/>
        </div>
      </div>
      <div className="p-4 rounded-xl border border-black/10">
        <div className="font-semibold" style={{ color: THEME.coal }}>Draft text</div>
        <textarea className="w-full h-40 p-2 rounded-lg border border-black/10" value={text} onChange={()=>{}} />
        <div className="text-xs opacity-70 mt-2">Checkpoints: includes audience, data types, consent/opt-out path, retention, and contact.</div>
      </div>
    </div>
  );
}

// ---- Admin & Resources ----
function Admin({ mapToken, setMapToken }: any){
  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <Section title="Mapbox Token" icon={<Globe2 className="w-4 h-4" />}>
        <div className="text-sm opacity-80">Optional: add a public Mapbox token to enable vector styles. OSM fallback will still work.</div>
        <input className="mt-2 w-full p-2 rounded-lg border border-black/10" value={mapToken} onChange={e=>setMapToken((e.target as any).value)} placeholder="pk.***" />
      </Section>
      <Section title="Help & Support" icon={<HelpCircle className="w-4 h-4" />}>
        <div className="text-sm opacity-80">Questions or ideas? Capture notes in the Scratchpad and share with your facilitator.</div>
      </Section>
      <Section title="Dev Tests" icon={<CheckCircle2 className="w-4 h-4" />}>
        <DevTests />
      </Section>
    </div>
  );
}

function Resources({ track }: any){
  return (
    <div className="grid gap-4">
      <Section title="Getting Started" icon={<BookOpen className="w-4 h-4" />}>
        <div className="text-sm opacity-80">Short reading list and links tailored to your track: {track}.</div>
      </Section>
    </div>
  );
}

function DevTests(){
  const [out, setOut] = useState([] as Array<{name:string, pass:boolean}>);
  function run(){
    const results: Array<{name:string, pass:boolean}> = [];
    const s1 = cosineSimStr('brook trout habitat', 'habitat for trout in brooks') > 0.35;
    results.push({ name: 'Cosine similar phrases', pass: s1 });
    const s2 = jaccardTokens('conductivity rises in spring', 'spring conductivity up') > 0.3;
    results.push({ name: 'Token overlap basic', pass: s2 });
    const arr=[1,2,7,8,9,2];
    const a = (function(arr:number[],thr:number,k:number){ let c=0,r=0; for(const v of arr){ if(v>=thr){ r++; if(r===k){ c++; } } else { r=0; } } return c; })(arr,7,2);
    results.push({ name: 'Alert counter cluster', pass: a===1 });
    setOut(results);
  }
  return (
    <div className="text-sm">
      <button onClick={run} className="px-3 py-2 rounded-lg text-sm border border-black/10">Run tests</button>
      <ul className="mt-2 grid gap-1">
        {out.map((r,i)=> (<li key={i} className="flex items-center gap-2"><span className={pill} style={{ background: r.pass? THEME.leaf : '#ef4444', color:'white' }}>{r.pass? 'PASS' : 'FAIL'}</span> {r.name}</li>))}
      </ul>
    </div>
  );
}
