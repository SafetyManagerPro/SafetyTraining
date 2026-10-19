/* SafetyTraining Graphic Pack 01 — original SVG visual library. No third-party PDFs embedded.
   Read-only presentation overlay for unfrozen DB-backed courses. */
(() => { 'use strict';
const items=[{"id":"dpi-casco","src":"assets/gp01-dpi-casco.svg","title":"DPI · Protezione del capo","caption":"Elmetto adeguato al rischio, controllato e indossato correttamente"},{"id":"dpi-occhiali","src":"assets/gp01-dpi-occhiali.svg","title":"DPI · Occhi e viso","caption":"Proteggere da schegge, polveri e schizzi con dispositivi idonei"},{"id":"dpi-guanti","src":"assets/gp01-dpi-guanti.svg","title":"DPI · Protezione delle mani","caption":"Scegliere il guanto in base al rischio: non esiste il guanto universale"},{"id":"dpi-scarpe","src":"assets/gp01-dpi-scarpe.svg","title":"DPI · Piedi e calzature","caption":"Selezionare la calzatura per urto, perforazione e scivolamento"},{"id":"dpi-udito","src":"assets/gp01-dpi-udito.svg","title":"DPI · Protezione dell'udito","caption":"La protezione deve corrispondere all'esposizione effettiva"},{"id":"dpi-respiratore","src":"assets/gp01-dpi-respiratore.svg","title":"DPI · Protezione respiratoria","caption":"Filtro e tenuta dipendono dal contaminante e dalle condizioni reali"},{"id":"dpi-imbracatura","src":"assets/gp01-dpi-imbracatura.svg","title":"DPI · Sistemi anticaduta","caption":"Un sistema completo richiede componenti compatibili e piano di recupero"},{"id":"dpi-vs-dpc","src":"assets/gp01-dpi-vs-dpc.svg","title":"DPC prima dei DPI","caption":"La protezione collettiva ha priorità quando è tecnicamente applicabile"},{"id":"segnali-famiglie","src":"assets/gp01-segnali-famiglie.svg","title":"Segnaletica · Le 5 famiglie","caption":"Forma e colore aiutano a interpretare il messaggio"},{"id":"segnali-colori","src":"assets/gp01-segnali-colori.svg","title":"Segnaletica · Codice cromatico","caption":"Il colore integra, ma non sostituisce, simbolo e contesto"},{"id":"segnali-divieto","src":"assets/gp01-segnali-divieto.svg","title":"Segnale di divieto","caption":"Il cerchio rosso con barra diagonale indica un comportamento vietato"},{"id":"segnali-obbligo","src":"assets/gp01-segnali-obbligo.svg","title":"Segnale di prescrizione","caption":"L'indicazione blu circolare impone un comportamento specifico"},{"id":"segnali-avvertimento","src":"assets/gp01-segnali-avvertimento.svg","title":"Segnale di avvertimento","caption":"Il triangolo giallo richiama la presenza di un pericolo"},{"id":"segnali-emergenza","src":"assets/gp01-segnali-emergenza.svg","title":"Salvataggio e antincendio","caption":"Verde: soccorso e percorsi sicuri. Rosso: mezzi antincendio."},{"id":"rischio-caduta","src":"assets/gp01-rischio-caduta.svg","title":"Rischio · Caduta dall'alto","caption":"Delimitazione e protezione sono parte della pianificazione del lavoro"},{"id":"rischio-schiacciamento","src":"assets/gp01-rischio-schiacciamento.svg","title":"Rischio · Schiacciamento","caption":"Separare gli operatori dagli organi mobili e dai punti di presa"},{"id":"rischio-investimento","src":"assets/gp01-rischio-investimento.svg","title":"Rischio · Mezzi e pedoni","caption":"Separare percorsi e gestire incroci, visibilità e punti ciechi"},{"id":"rischio-ribaltamento","src":"assets/gp01-rischio-ribaltamento.svg","title":"Rischio · Stabilità dei mezzi","caption":"Carico, suolo, pendenza e manovra influenzano la stabilità"},{"id":"procedura-preuso","src":"assets/gp01-procedura-preuso.svg","title":"Controlli prima dell'utilizzo","caption":"Osservare, verificare, segnalare e non utilizzare se non sicuro"},{"id":"procedura-emergenza","src":"assets/gp01-procedura-emergenza.svg","title":"Gestione dell'emergenza","caption":"Riconosci, avvisa, proteggiti e segui il piano e i soccorsi"}];
const rules=[
['dpi-casco',/\bcasco\b|\belmett\w*\b|protezione del capo/i],
['dpi-occhiali',/occhial\w*|visiera|protezione (?:degli )?occhi/i],
['dpi-guanti',/guant\w*|protezione delle mani/i],
['dpi-scarpe',/calzatur\w*|scarpe antinfortunistiche|protezione (?:dei )?piedi/i],
['dpi-udito',/otoprotett\w*|\brumore\b|protezione (?:dell[’']?)?udito/i],
['dpi-respiratore',/respirator\w*|mascher\w*|vie respiratorie/i],
['dpi-imbracatura',/imbracatur\w*|sistema (?:di )?arresto cadut/i],
['dpi-vs-dpc',/\bDPI\b|\bDPC\b|protezione collettiva|protezioni individuali/i],
['segnali-famiglie',/segnaletica|cartellonistica|tipi di segnal\w*/i],
['segnali-colori',/colori della sicurezza|codice cromatico|colori (?:dei )?segnali/i],
['segnali-divieto',/segnali? di divieto|cartelli? di divieto|divieti di accesso/i],
['segnali-obbligo',/segnali? di obbligo|segnali? di prescrizione|cartelli? di obbligo/i],
['segnali-avvertimento',/segnali? di avvertimento|cartelli? di pericolo|cartelli? di avvertimento/i],
['segnali-emergenza',/segnali? di emergenza|segnali? antincendio|segnali? di salvataggio/i],
['rischio-caduta',/cadut\w* dall.alto|lavori? in quota|protezioni anticaduta/i],
['rischio-schiacciamento',/schiacciament\w*|cesoiament\w*|organi in movimento|rischio meccanico/i],
['rischio-investimento',/investiment\w*|pedoni e carrelli|punti ciechi|viabilit[àa] aziendale/i],
['rischio-ribaltamento',/ribaltament\w*|stabilit[àa] (?:del|della|dei|delle|macchine|mezzi)|baricentro/i],
['procedura-preuso',/controlli? pre.uso|ispezione prima|verifiche? prima dell.uso|checklist preuso/i],
['procedura-emergenza',/gestione emergenz\w*|piano di emergenza|procedure? di emergenza|evacuazion\w*|primo soccorso/i]
];
const lookup=new Map(items.map(item=>[item.id,item]));
function isFrozen(course){
 const meta=course?.metadata||{};
 return !!(meta.freeze_scope||meta.frozen||meta.is_frozen||meta.course_frozen||course?.frozen);
}
function pick(course,topic){
 if(!course?.presentation_generated_from_db||!topic?.db_backed||isFrozen(course)||topic?.presentation_quality?.visual_mode==='authored')return [];
 const title=String(topic.slide_title||topic.title||'');
 const summary=String(topic.summary||'').slice(0,700);
 const titleMatches=rules.filter(([,re])=>re.test(title)).map(([id])=>id);
 const secondary=rules.filter(([,re])=>re.test(summary)).map(([id])=>id);
 const order=[...new Set([...titleMatches,...secondary])].slice(0,3);
 return order.map(id=>lookup.get(id)).filter(Boolean).map(item=>({src:item.src,caption:item.caption,graphic_pack_id:item.id}));
}
window.SAFETY_GRAPHIC_PACK_01={items,pick,isFrozen};
})();