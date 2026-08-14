import React, { useState } from "react";
import { Map, Users, Target, Dice5, ArrowRightLeft, Trophy, HelpCircle, Puzzle, Swords, Flag, UserX, Timer, Plus, ChevronDown, ChevronUp } from "lucide-react";
import Card from "../components/UI/Card";
import Button from "../components/UI/Button";
import PageContainer from "../components/UI/PageContainer";
import Navbar from "../components/Navbar/Navbar";

const RuleCard = ({ icon: Icon, title, accent, children }) => (
  <div className={`flex flex-col bg-[#232b36]/80 rounded-2xl shadow-xl border-l-8 ${accent} p-7 mb-8 hover:scale-[1.025] transition-transform duration-200 group relative overflow-hidden`}>  
    <span className={`absolute -left-6 -top-6 opacity-20 group-hover:opacity-30 transition-opacity`}>
      <Icon className="w-24 h-24 text-white" />
    </span>
    <div className="flex items-center gap-3 mb-3 z-10">
      <span className={`rounded-full p-2 bg-gradient-to-br ${accent} shadow-lg`}>
        <Icon className="w-7 h-7 text-white drop-shadow" />
      </span>
      <h2 className="text-xl font-extrabold tracking-tight text-white drop-shadow-lg uppercase">{title}</h2>
    </div>
    <div className="text-gray-200 text-lg leading-relaxed z-10">
      {children}
    </div>
  </div>
);

const steps = [
  {
    icon: Target,
    title: "Scopo del Gioco",
    color: "from-[#38C7D7] to-[#ffd700]",
    content: (
      <span>
        Raggiungi per primo il tuo <b>obiettivo segreto</b> per vincere la partita! Ogni giocatore ha un obiettivo diverso, assegnato casualmente all’inizio.
      </span>
    ),
  },
  {
    icon: Puzzle,
    title: "Componenti",
    color: "from-[#38C7D7] to-[#2eb4c4]",
    content: (
      <ul className="list-disc ml-6 space-y-1">
        <li>Plancia con 42 territori divisi in 6 continenti (ogni territorio ha un valore punti).</li>
        <li>6 eserciti di colore diverso (carrarmati e bandiere).</li>
        <li>6 dadi (3 rossi, 3 blu).</li>
        <li>Mazzo carte “Territori” (42 carte + 2 Jolly).</li>
        <li>Mazzo carte “Obiettivi segreti”.</li>
      </ul>
    ),
  },
  {
    icon: Users,
    title: "Preparazione",
    color: "from-[#ffd700] to-[#38C7D7]",
    content: (
      <ul className="list-disc ml-6 space-y-1">
        <li>Si tira un dado: chi fa il punteggio più alto inizia (in caso di parità si rilancia).</li>
        <li>A turno si sceglie il colore dell’esercito.</li>
        <li>Dotazione iniziale: 35 armate (3 giocatori), 30 (4), 25 (5), 20 (6).</li>
        <li>Ogni giocatore riceve una carta obiettivo e territori assegnati casualmente (occupati con 1 armata).</li>
        <li>A turno si posizionano 3 armate alla volta per rafforzare i propri territori, fino a esaurimento dotazione.</li>
      </ul>
    ),
  },
  {
    icon: Map,
    title: "Come si gioca",
    color: "from-[#38C7D7] to-[#ffd700]",
    content: (
      <span>
        Ogni turno si divide in <b>3 fasi</b>:<br/>
        <b>1. Rinforzi</b> → <b>2. Combattimenti</b> → <b>3. Spostamento strategico</b>.<br/>
        Il turno passa poi al giocatore successivo.
      </span>
    ),
  },
  {
    icon: Plus,
    title: "Fase 1: Rinforzi",
    color: "from-[#38C7D7] to-[#2eb4c4]",
    content: (
      <ul className="list-disc ml-6 space-y-1">
        <li>Ricevi armate pari a territori posseduti diviso 3 (arrotondato per difetto).</li>
        <li>Bonus se controlli interi continenti (es: Asia +7, Europa +5, Nord America +5, Africa +3, Sud America +2, Oceania +2).</li>
        <li>Puoi giocare tris di carte Territorio per ulteriori rinforzi (vedi tabella nella pagina).</li>
        <li>Se il tris contiene territori che possiedi, ottieni 2 armate extra per ciascuno.</li>
        <li>Tutte le armate vanno posizionate prima di passare alla fase successiva.</li>
      </ul>
    ),
  },
  {
    icon: Swords,
    title: "Fase 2: Combattimenti",
    color: "from-[#ffd700] to-[#38C7D7]",
    content: (
      <ul className="list-disc ml-6 space-y-1">
        <li>Decidi se e chi attaccare (non sei obbligato).</li>
        <li>Puoi attaccare via terra (territori adiacenti) o via mare (linee tratteggiate sulla mappa).</li>
        <li>Devi lasciare almeno 1 armata su ogni territorio.</li>
        <li>Puoi attaccare più volte e da più territori, finché hai almeno 2 armate nei territori di partenza.</li>
        <li>Se conquisti almeno un territorio, peschi una carta Territorio a fine turno.</li>
      </ul>
    ),
  },
  {
    icon: Dice5,
    title: "Dettaglio Combattimento",
    color: "from-[#38C7D7] to-[#ffd700]",
    content: (
      <ul className="list-disc ml-6 space-y-1">
        <li>L’attaccante dichiara territorio di partenza e attaccato, poi lancia fino a 3 dadi (max 3 armate).</li>
        <li>Il difensore dichiara quante armate difendono (max 3) e lancia i dadi.</li>
        <li>Si confrontano i dadi in ordine decrescente: chi perde rimuove un’armata per ogni confronto perso (in caso di parità vince il difensore).</li>
        <li>L’attaccante può continuare ad attaccare o fermarsi.</li>
        <li>Se elimina tutte le armate avversarie, occupa il territorio con le armate usate nell’ultimo attacco.</li>
      </ul>
    ),
  },
  {
    icon: ArrowRightLeft,
    title: "Fase 3: Spostamento Strategico",
    color: "from-[#2eb4c4] to-[#ffd700]",
    content: (
      <ul className="list-disc ml-6 space-y-1">
        <li>Al termine del turno puoi spostare armate tra due tuoi territori adiacenti (solo uno spostamento per turno).</li>
        <li>Devi lasciare almeno 1 armata nel territorio di partenza.</li>
        <li>Dopo lo spostamento il turno termina.</li>
      </ul>
    ),
  },
  {
    icon: UserX,
    title: "Eliminazione di un Giocatore",
    color: "from-[#ffd700] to-[#38C7D7]",
    content: (
      <span>
        Se un giocatore perde l’ultima armata sull’ultimo territorio, è eliminato e cede le sue carte all’attaccante. L’eliminazione non può avvenire prima del 4° turno.
      </span>
    ),
  },
  {
    icon: Flag,
    title: "Obiettivi Segreti",
    color: "from-[#38C7D7] to-[#2eb4c4]",
    content: (
      <span>
        Se raggiungi l’obiettivo segreto indicato sulla tua carta, vinci immediatamente la partita!
      </span>
    ),
  },
  {
    icon: Trophy,
    title: "Finale di Partita",
    color: "from-[#2eb4c4] to-[#ffd700]",
    content: (
      <ul className="list-disc ml-6 space-y-1">
        <li>Si può giocare con finale tradizionale (vince chi raggiunge l’obiettivo) o con modalità “Time Attack”.</li>
        <li>In Time Attack: si decide un limite di tempo o di carte. Alla fine, vince chi ha più punti territorio (in caso di parità, più armate; ulteriore parità: spareggio).</li>
        <li>Se un giocatore viene eliminato dopo il primo rimescolamento, la partita finisce subito e si contano i punti.</li>
        <li>In Time Attack, nessuno può avere più di 7 carte in mano.</li>
      </ul>
    ),
  },
  {
    icon: Plus,
    title: "Regola Opzionale: Rinforzi Extra",
    color: "from-[#ffd700] to-[#38C7D7]",
    content: (
      <span>
        Per partite più dinamiche, durante la fase rinforzi aggiungi sempre 1 armata extra a quelle spettanti. Anche chi ha meno di 3 territori riceve almeno 1 armata.
      </span>
    ),
  },
];

const faqs = [
  {
    q: "Quanti giocatori possono partecipare?",
    a: "Da 3 a 6 giocatori per partita.",
  },
  {
    q: "Cosa succede se un giocatore abbandona?",
    a: "Il suo turno viene saltato e le sue truppe restano sulla mappa.",
  },
  {
    q: "Come si vince?",
    a: "Conquistando tutti i territori o completando l'obiettivo segreto (se previsto).",
  },
];

const FAQAccordion = () => {
  const [open, setOpen] = useState(null);
  return (
    <section>
      <div className="flex items-center gap-3 mb-6">
        <span className="rounded-full p-2 bg-gradient-to-br from-[#ffd700] to-[#38C7D7] shadow-lg">
          <HelpCircle className="w-7 h-7 text-white drop-shadow" />
        </span>
        <h2 className="text-2xl font-extrabold tracking-tight text-white drop-shadow-lg uppercase">FAQ</h2>
      </div>
      <div className="space-y-4">
        {faqs.map((faq, i) => (
          <div key={i} className="bg-white/10 rounded-xl shadow-lg border border-[#38C7D7]/30 overflow-hidden">
            <button
              className="w-full flex items-center justify-between px-6 py-4 text-lg font-semibold text-left text-[#38C7D7] hover:bg-[#38C7D7]/10 transition-colors"
              onClick={() => setOpen(open === i ? null : i)}
            >
              {faq.q}
              {open === i ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
            {open === i && (
              <div className="px-6 pb-4 text-gray-200 animate-fade-in">
                {faq.a}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};

const accentText = "text-[#38C7D7]";
const accentBg = "bg-[#1B2227]/90";
const accentBorder = "border-[#38C7D7]/40";
const accentShadow = "shadow-[0_4px_24px_#38C7D7]/10";
const sectionTitle = `text-2xl md:text-3xl font-extrabold tracking-tight text-white drop-shadow-lg uppercase ${accentText}`;
const sectionBox = `rounded-2xl ${accentBg} ${accentShadow} border ${accentBorder} p-8`;
const heroTitle = `text-4xl md:text-5xl font-extrabold tracking-tight text-white drop-shadow-lg uppercase ${accentText}`;
const heroSubtitle = "mt-6 text-lg md:text-xl text-gray-300 max-w-2xl mx-auto animate-fade-in delay-100";

const RulesPage = () => (
  <>
    <Navbar />
    <PageContainer centered={false} className="pt-28 md:pt-32">
      <div className="max-w-4xl mx-auto w-full">
        {/* Hero Section */}
        <Card padding="lg" className="mb-10 flex flex-col items-center bg-gradient-to-br from-[#173C55]/80 to-[#1B2227]/90 border-0">
          <Map className="w-16 h-16 text-[#38C7D7] drop-shadow-lg mb-4 animate-fade-in" />
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white drop-shadow-lg uppercase text-center">Regole di WorldConquer</h1>
          <p className="mt-6 text-lg md:text-xl text-gray-300 max-w-2xl mx-auto animate-fade-in delay-100 text-center">Scopri come conquistare il mondo! Segui i passaggi qui sotto per diventare un vero stratega.</p>
        </Card>
        {/* Timeline Steps as Dotted Path */}
        <div className="relative pl-10 pb-12">
          <div className="absolute left-4 top-0 bottom-0 w-2 flex flex-col items-center">
            {/* Dotted vertical line */}
            <div className="h-full border-l-4 border-dotted border-[#38C7D7]/40"></div>
          </div>
          {steps.map((step, i) => (
            <div key={i} className="relative mb-16 flex items-start animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
              {/* Step Icon as Dot */}
              <span className={`absolute -left-8 top-0 rounded-full bg-gradient-to-br ${step.color} shadow-lg flex items-center justify-center w-12 h-12 border-4 border-[#173C55]`}>
                <step.icon className="w-6 h-6 text-white" />
              </span>
              <Card padding="lg" className="ml-8 w-full">
                <h2 className="text-2xl font-extrabold tracking-tight text-white drop-shadow-lg uppercase mb-2">{step.title}</h2>
                <div className="text-gray-200 text-base md:text-lg leading-relaxed">{step.content}</div>
              </Card>
            </div>
          ))}
        </div>
        {/* FAQ Accordion */}
        <Card padding="lg" className="mb-12">
          <FAQAccordion />
        </Card>
        {/* Floating Button */}
        <div className="flex justify-end">

        </div>
      </div>
    </PageContainer>
  </>
);

export default RulesPage;
