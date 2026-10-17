create table if not exists public.training_scenarios_v22 (
  id uuid primary key default extensions.gen_random_uuid(),
  stable_key text not null unique,
  title text not null,
  scenario_type text not null default 'decision' check (scenario_type in ('decision','hazard_spotting','tabletop','incident_analysis','role_play')),
  role_focus text,
  intro text,
  prompt text not null,
  decisions jsonb not null default '[]'::jsonb,
  debrief jsonb not null default '{}'::jsonb,
  visuals jsonb not null default '[]'::jsonb,
  media jsonb not null default '[]'::jsonb,
  sources jsonb not null default '[]'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.practice_labs_v22 (
  id uuid primary key default extensions.gen_random_uuid(),
  stable_key text not null unique,
  title text not null,
  lab_type text not null check (lab_type in ('digital','demonstration','physical','hybrid')),
  objective text not null,
  briefing text,
  steps jsonb not null default '[]'::jsonb,
  checklist jsonb not null default '[]'::jsonb,
  critical_errors jsonb not null default '[]'::jsonb,
  stop_conditions jsonb not null default '[]'::jsonb,
  media jsonb not null default '[]'::jsonb,
  sources jsonb not null default '[]'::jsonb,
  requires_physical_validation boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.course_scenarios_v22 (
  course_id uuid not null references public.courses(id) on delete cascade,
  scenario_id uuid not null references public.training_scenarios_v22(id) on delete cascade,
  position integer not null default 1,
  required boolean not null default true,
  context jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  primary key(course_id, scenario_id)
);

create table if not exists public.course_practice_labs_v22 (
  course_id uuid not null references public.courses(id) on delete cascade,
  practice_lab_id uuid not null references public.practice_labs_v22(id) on delete cascade,
  position integer not null default 1,
  required boolean not null default true,
  context jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  primary key(course_id, practice_lab_id)
);

create index if not exists course_scenarios_v22_course_idx on public.course_scenarios_v22(course_id,position);
create index if not exists course_practice_labs_v22_course_idx on public.course_practice_labs_v22(course_id,position);

alter table public.training_scenarios_v22 enable row level security;
alter table public.practice_labs_v22 enable row level security;
alter table public.course_scenarios_v22 enable row level security;
alter table public.course_practice_labs_v22 enable row level security;

drop policy if exists training_scenarios_v22_read on public.training_scenarios_v22;
create policy training_scenarios_v22_read on public.training_scenarios_v22 for select to authenticated using (active);
drop policy if exists training_scenarios_v22_admin on public.training_scenarios_v22;
create policy training_scenarios_v22_admin on public.training_scenarios_v22 for all to authenticated using (private.is_platform_admin()) with check (private.is_platform_admin());

drop policy if exists practice_labs_v22_read on public.practice_labs_v22;
create policy practice_labs_v22_read on public.practice_labs_v22 for select to authenticated using (active);
drop policy if exists practice_labs_v22_admin on public.practice_labs_v22;
create policy practice_labs_v22_admin on public.practice_labs_v22 for all to authenticated using (private.is_platform_admin()) with check (private.is_platform_admin());

drop policy if exists course_scenarios_v22_read on public.course_scenarios_v22;
create policy course_scenarios_v22_read on public.course_scenarios_v22 for select to authenticated using (exists(select 1 from public.training_scenarios_v22 s where s.id=scenario_id and s.active));
drop policy if exists course_scenarios_v22_admin on public.course_scenarios_v22;
create policy course_scenarios_v22_admin on public.course_scenarios_v22 for all to authenticated using (private.is_platform_admin()) with check (private.is_platform_admin());

drop policy if exists course_practice_labs_v22_read on public.course_practice_labs_v22;
create policy course_practice_labs_v22_read on public.course_practice_labs_v22 for select to authenticated using (exists(select 1 from public.practice_labs_v22 p where p.id=practice_lab_id and p.active));
drop policy if exists course_practice_labs_v22_admin on public.course_practice_labs_v22;
create policy course_practice_labs_v22_admin on public.course_practice_labs_v22 for all to authenticated using (private.is_platform_admin()) with check (private.is_platform_admin());

grant select,insert,update,delete on public.training_scenarios_v22,public.practice_labs_v22,public.course_scenarios_v22,public.course_practice_labs_v22 to authenticated;
grant all on public.training_scenarios_v22,public.practice_labs_v22,public.course_scenarios_v22,public.course_practice_labs_v22 to service_role;
revoke all on public.training_scenarios_v22,public.practice_labs_v22,public.course_scenarios_v22,public.course_practice_labs_v22 from anon;

insert into public.training_scenarios_v22(stable_key,title,scenario_type,role_focus,intro,prompt,decisions,debrief,visuals,media,sources) values
('v22:hazard-spotting','Trova i pericoli prima di iniziare','hazard_spotting','lavoratore','Una scena di lavoro contiene segnali deboli, comportamenti e condizioni da leggere prima che diventino incidente.','Individua almeno cinque criticità, ordinali per priorità e spiega cosa faresti prima di iniziare il lavoro.','[{"choice":"Elimino o isolo il pericolo prima di partire","effect":"Riduce il rischio alla fonte"},{"choice":"Parto e correggo dopo","effect":"Espone subito al rischio"}]'::jsonb,'{"questions":["Qual è il pericolo più grave?","Quale controllo viene prima del DPI?","Quando devi fermarti e segnalare?"]}'::jsonb,'[{"asset":"piramide-pericoli.svg"},{"asset":"idea-risk-cycle.svg"}]'::jsonb,'[{"kind":"video_hub","title":"Napo - film e clip sulla sicurezza","url":"https://www.napofilm.net/it"}]'::jsonb,'[{"authority":"EU-OSHA/Napo","url":"https://www.napofilm.net/it"}]'::jsonb),
('v22:preposto-stop','Preposto: osserva, intervieni, verifica','decision','preposto','Il preposto vede una lavorazione che si sta allontanando dalla procedura.','Decidi quando intervenire, cosa dire e quali condizioni devono essere verificate prima della ripresa.','[{"choice":"Intervengo subito sulla condizione pericolosa","effect":"Interruzione e ripristino"},{"choice":"Aspetto la fine del turno","effect":"Il rischio resta attivo"}]'::jsonb,'{"questions":["Che cosa osservi?","Quale deviazione è tollerabile?","Quando serve escalation?"]}'::jsonb,'[{"asset":"idea-inspection-flow.svg"},{"asset":"stop-segnala-ripristina.svg"}]'::jsonb,'[{"kind":"video_hub","title":"Napo - leadership e comportamenti sicuri","url":"https://www.napofilm.net/it"}]'::jsonb,'[{"authority":"INAIL","url":"https://www.inail.it/"}]'::jsonb),
('v22:management-decision','Decisione manageriale sotto pressione','tabletop','dirigente/datore','Produzione, tempi e sicurezza entrano in conflitto.','Scegli priorità, risorse, responsabilità e controllo finale senza scaricare il rischio verso il basso.','[{"choice":"Riprogetto attività e risorse","effect":"Controllo organizzativo"},{"choice":"Chiedo di procedere con maggiore attenzione","effect":"Rischio non trattato"}]'::jsonb,'{"questions":["Quale decisione elimina il rischio?","Chi deve essere coinvolto?","Come verifichi che la misura funzioni?"]}'::jsonb,'[{"asset":"idea-safety-system.svg"},{"asset":"organigramma-sicurezza.svg"}]'::jsonb,'[{"kind":"video_hub","title":"Napo - organizzazione e prevenzione","url":"https://www.napofilm.net/it"}]'::jsonb,'[{"authority":"INAIL","url":"https://www.inail.it/"}]'::jsonb),
('v22:rls-walkthrough','RLS: sopralluogo e consultazione','role_play','RLS','Durante un sopralluogo emergono una criticità tecnica e una organizzativa.','Raccogli fatti, ascolta i lavoratori, formula osservazioni verificabili e costruisci una richiesta di miglioramento.','[{"choice":"Documento evidenze e confronto misure","effect":"Consultazione efficace"},{"choice":"Mi limito a una contestazione generica","effect":"Bassa trasferibilità"}]'::jsonb,'{"questions":["Quali fatti servono?","Cosa va chiesto nel DVR?","Come segui la chiusura dell’azione?"]}'::jsonb,'[{"asset":"idea-rls-consult.svg"},{"asset":"idea-rls-cycle.svg"}]'::jsonb,'[{"kind":"video_hub","title":"Napo - partecipazione dei lavoratori","url":"https://www.napofilm.net/it"}]'::jsonb,'[{"authority":"INAIL","url":"https://www.inail.it/"}]'::jsonb),
('v22:evacuation','Evacuazione: decisioni nei primi minuti','tabletop','addetti/lavoratori','Scatta un allarme con una via abituale non utilizzabile.','Decidi come instradare le persone, comunicare, assistere chi ha bisogno e verificare il punto di raccolta.','[{"choice":"Uso la via alternativa prevista","effect":"Evacuazione controllata"},{"choice":"Torno indietro a recuperare oggetti","effect":"Aumento esposizione"}]'::jsonb,'{"questions":["Quale informazione deve passare subito?","Come gestisci una persona in difficoltà?","Chi fa il conteggio?"]}'::jsonb,'[{"asset":"idea-emergency-steps.svg"},{"asset":"procedura-operativa-5-fasi.svg"}]'::jsonb,'[{"kind":"video_hub","title":"Napo - emergenze","url":"https://www.napofilm.net/it"}]'::jsonb,'[{"authority":"INAIL","url":"https://www.inail.it/"}]'::jsonb),
('v22:fire-response','Incendio: riconosci, allerta, intervieni solo se sicuro','decision','addetto antincendio','Un principio d’incendio è visibile e l’ambiente sta cambiando rapidamente.','Valuta allarme, esodo, mezzo di estinzione, via di fuga e condizioni che impongono di non intervenire.','[{"choice":"Mantengo sempre una via di fuga e interrompo se le condizioni peggiorano","effect":"Intervento controllato"},{"choice":"Mi avvicino comunque per spegnere","effect":"Perdita della via di fuga"}]'::jsonb,'{"questions":["Che cosa deve essere verificato prima dell’uso dell’estintore?","Quando devi abbandonare il tentativo?","Come coordini allarme ed esodo?"]}'::jsonb,'[{"asset":"idea-fire-response.svg"},{"asset":"idea-fire-practice.svg"}]'::jsonb,'[{"kind":"reference","title":"Vigili del Fuoco - materiale corsi addetti antincendio","url":"https://www.vigilfuoco.it/comando-vvf-rimini/formazione-abilitazione-e-aggiornamento-addetti-antincendio"}]'::jsonb,'[{"authority":"Corpo Nazionale Vigili del Fuoco","url":"https://www.vigilfuoco.it/comando-vvf-rimini/formazione-abilitazione-e-aggiornamento-addetti-antincendio"}]'::jsonb),
('v22:first-aid-scene','Primo soccorso: scena, priorità e handover','decision','addetto primo soccorso','Una persona è a terra e il pericolo che ha causato l’evento non è ancora chiaro.','Proteggi la scena, riconosci i segnali critici, attiva i soccorsi e descrivi ciò che fai senza improvvisare manovre non apprese.','[{"choice":"Rendo possibile il soccorso senza creare una seconda vittima","effect":"Sequenza corretta"},{"choice":"Mi precipito sulla persona senza leggere la scena","effect":"Possibile secondo infortunato"}]'::jsonb,'{"questions":["Qual è il pericolo per il soccorritore?","Quando chiami 112/118?","Quali informazioni consegni ai sanitari?"]}'::jsonb,'[{"asset":"idea-emergency-steps.svg"},{"asset":"procedura-operativa-5-fasi.svg"}]'::jsonb,'[{"kind":"video","title":"Croce Rossa Italiana - Il primo soccorso salva la vita","url":"https://www.youtube.com/watch?v=J0iegcSFowI"},{"kind":"reference","title":"INAIL - Primo soccorso nei luoghi di lavoro","url":"https://www.inail.it/portale/it/inail-comunica/news/notizia.2018.10.primo-soccorso-nei-luoghi-di-lavoro-online-un-nuovo-manuale-inail.html"}]'::jsonb,'[{"authority":"Croce Rossa Italiana","url":"https://www.youtube.com/watch?v=J0iegcSFowI"},{"authority":"INAIL","url":"https://www.inail.it/portale/it/inail-comunica/news/notizia.2018.10.primo-soccorso-nei-luoghi-di-lavoro-online-un-nuovo-manuale-inail.html"}]'::jsonb),
('v22:equipment-preuse','Attrezzatura: controllo pre-uso e area di lavoro','hazard_spotting','operatore','Prima dell’avviamento devi capire se macchina, ambiente e persone sono compatibili con la manovra.','Esegui un pre-use check, individua difetti/ostacoli, definisci la zona operativa e stabilisci le condizioni di stop.','[{"choice":"Isolo l’attrezzatura se un controllo critico fallisce","effect":"Guasto non portato in esercizio"},{"choice":"Uso comunque la macchina per poco tempo","effect":"Difetto trasformato in esposizione"}]'::jsonb,'{"questions":["Quali controlli sono critici?","Chi deve stare fuori dalla zona?","Quando la macchina va fermata?"]}'::jsonb,'[{"asset":"idea-inspection-flow.svg"},{"asset":"piramide-pericoli.svg"}]'::jsonb,'[{"kind":"reference","title":"INAIL - corso abilitazione operatori attrezzature","url":"https://www.inail.it/portale/formazione/it/corsi-inail/catalogo-corsi/dettaglio-corso.2024.01.corso-di-formazione-per-l-abilitazione-degli-operatori-delle-attrezzature.html"},{"kind":"reference","title":"INAIL - attrezzature marcate CE","url":"https://www.inail.it/portale/prevenzione-e-sicurezza/it/come-fare-per/conoscere-il-rischio/attrezzature-di-lavoro/attrezzature-marcate-CE.html"}]'::jsonb,'[{"authority":"INAIL","url":"https://www.inail.it/portale/formazione/it/corsi-inail/catalogo-corsi/dettaglio-corso.2024.01.corso-di-formazione-per-l-abilitazione-degli-operatori-delle-attrezzature.html"}]'::jsonb),
('v22:height-plan','Lavori in quota: sistema, ancoraggio, spazio libero e recupero','decision','lavoratore/addetto','L’attività in quota può iniziare solo se protezione collettiva, sistema anticaduta e recupero sono coerenti con la situazione.','Scegli protezione, sistema, ancoraggio e piano di recupero; individua le condizioni che impediscono l’avvio.','[{"choice":"Privilegio protezioni collettive e verifico il sistema prima dell’uso","effect":"Gerarchia corretta"},{"choice":"Indosso l’imbracatura e considero risolto il rischio","effect":"Sistema incompleto"}]'::jsonb,'{"questions":["Quale misura viene prima del DPI?","Come verifichi compatibilità del sistema?","Chi recupera una persona sospesa?"]}'::jsonb,'[{"asset":"idea-working-height-safe.svg"},{"asset":"idea-dpi-hierarchy.svg"}]'::jsonb,'[{"kind":"reference","title":"INAIL - guida tecnica ancoraggi e cadute dall’alto","url":"https://www.inail.it/content/dam/inail-hub-site/documenti/2019/07/Guidancoraggi%2C0.pdf"}]'::jsonb,'[{"authority":"INAIL","url":"https://www.inail.it/content/dam/inail-hub-site/documenti/2019/07/Guidancoraggi%2C0.pdf"}]'::jsonb),
('v22:dl-spp-control','DL SPP: dal DVR alla misura verificabile','tabletop','datore di lavoro SPP','Un rischio noto continua a produrre quasi incidenti nonostante una procedura esistente.','Rivaluta il rischio, scegli una misura più efficace, assegna responsabilità e definisci una verifica oggettiva.','[{"choice":"Cambio la misura e verifico indicatori","effect":"Miglioramento controllabile"},{"choice":"Ripeto la stessa comunicazione","effect":"Nessun cambiamento del sistema"}]'::jsonb,'{"questions":["Qual è la causa organizzativa?","Quale misura è più alta nella gerarchia?","Come misuri efficacia?"]}'::jsonb,'[{"asset":"idea-dvr-reading.svg"},{"asset":"idea-safety-system.svg"}]'::jsonb,'[{"kind":"video_hub","title":"Napo - gestione del rischio","url":"https://www.napofilm.net/it"}]'::jsonb,'[{"authority":"INAIL","url":"https://www.inail.it/"}]'::jsonb),
('v22:construction-prestart','Cantiere: coordinamento prima dell’avvio','tabletop','datore/preposto','Più imprese stanno per iniziare attività interferenti nella stessa zona.','Individua interferenze, sequenza, segregazioni, comunicazioni e autorizzazioni prima dell’avvio.','[{"choice":"Riprogrammo e separo le attività incompatibili","effect":"Interferenza ridotta alla fonte"},{"choice":"Lascio che i preposti si coordinino sul momento","effect":"Controllo debole"}]'::jsonb,'{"questions":["Quali attività non possono sovrapporsi?","Chi autorizza l’avvio?","Come verifichi il ripristino?"]}'::jsonb,'[{"asset":"idea-duvri.svg"},{"asset":"idea-inspection-flow.svg"}]'::jsonb,'[{"kind":"video_hub","title":"Napo - sicurezza nei cantieri","url":"https://www.napofilm.net/it"}]'::jsonb,'[{"authority":"INAIL","url":"https://www.inail.it/"}]'::jsonb)
on conflict (stable_key) do nothing;

insert into public.practice_labs_v22(stable_key,title,lab_type,objective,briefing,steps,checklist,critical_errors,stop_conditions,media,sources,requires_physical_validation) values
('v22:hazard-lab','Laboratorio: osserva → valuta → controlla','digital','Trasformare un contenuto teorico in una decisione operativa osservabile.','Lavora su una scena reale o fotografica del contesto aziendale.','["osserva senza intervenire per 60 secondi","elenca pericoli e persone esposte","ordina per gravità/urgenza","proponi controllo alla fonte","definisci chi verifica e quando"]'::jsonb,'["pericoli identificati","priorità motivate","misure coerenti","condizioni di stop","responsabile della verifica"]'::jsonb,'["partire dal DPI senza valutare eliminazione/sostituzione","confondere pericolo con danno","proporre solo attenzione e prudenza"]'::jsonb,'["mancano informazioni essenziali","il pericolo non è controllabile dal ruolo presente"]'::jsonb,'[{"kind":"video_hub","title":"Napo - sicurezza sul lavoro","url":"https://www.napofilm.net/it"}]'::jsonb,'[{"authority":"EU-OSHA/Napo","url":"https://www.napofilm.net/it"}]'::jsonb,false),
('v22:preposto-lab','Laboratorio preposto: osservazione e intervento','hybrid','Allenare osservazione, comunicazione, stop work, ripristino e follow-up.','Il docente assegna una scena o una simulazione con almeno due deviazioni dalla procedura.','["osserva fatti e condizioni","intervieni sulla situazione urgente","spiega il perché senza ambiguità","attiva il livello superiore se necessario","verifica la ripresa sicura","registra il follow-up"]'::jsonb,'["tempestività","chiarezza","capacità di fermare","escalation corretta","verifica finale"]'::jsonb,'["rimandare l’intervento","discutere solo la persona e non la condizione","autorizzare la ripresa senza verifica"]'::jsonb,'["pericolo grave o immediato","mancano competenze/autorità per ripristinare"]'::jsonb,'[{"kind":"video_hub","title":"Napo - comportamenti e prevenzione","url":"https://www.napofilm.net/it"}]'::jsonb,'[{"authority":"INAIL","url":"https://www.inail.it/"}]'::jsonb,false),
('v22:management-lab','Tabletop manageriale: decisioni e risorse','digital','Allenare decisioni organizzative che riducano realmente l’esposizione.','Usa un caso con conflitto tra tempi, costi, produzione e sicurezza.','["definisci il rischio","individua vincoli e responsabilità","scegli misure secondo gerarchia","assegna risorse e scadenze","definisci indicatore di efficacia","riesamina"]'::jsonb,'["misura alla fonte","responsabilità chiare","risorse adeguate","verifica oggettiva"]'::jsonb,'["scaricare tutto sul comportamento individuale","misure senza responsabile","scadenze senza verifica"]'::jsonb,'["misura non sostenibile","rischio residuo non accettabile"]'::jsonb,'[{"kind":"video_hub","title":"Napo - prevenzione e organizzazione","url":"https://www.napofilm.net/it"}]'::jsonb,'[{"authority":"INAIL","url":"https://www.inail.it/"}]'::jsonb,false),
('v22:rls-lab','Laboratorio RLS: sopralluogo, evidenze, proposta','hybrid','Saper trasformare osservazioni e segnalazioni in richieste tecniche verificabili.','Eseguire un sopralluogo reale o simulato con check-list e colloquio ai lavoratori.','["raccogli fatti","ascolta i lavoratori","collega i rilievi al DVR/procedure","formula proposte","concorda follow-up","verifica chiusura"]'::jsonb,'["evidenze","consultazione","tracciabilità","proposta concreta","follow-up"]'::jsonb,'["contestazione generica","assenza di evidenze","nessun controllo sulla chiusura"]'::jsonb,'["rischio grave/immediato da segnalare subito"]'::jsonb,'[{"kind":"video_hub","title":"Napo - partecipazione e comunicazione","url":"https://www.napofilm.net/it"}]'::jsonb,'[{"authority":"INAIL","url":"https://www.inail.it/"}]'::jsonb,false),
('v22:evacuation-lab','Drill evacuazione e punto di raccolta','physical','Allenare allarme, instradamento, assistenza, comunicazione e verifica presenze.','La prova usa il piano reale aziendale e deve terminare con debriefing.','["briefing ruoli","attivazione allarme simulata","uso vie previste","assistenza persone fragili secondo piano","punto di raccolta","conteggio e comunicazione","debriefing"]'::jsonb,'["tempi","vie libere","porte e uscite","comunicazione","conteggio","criticità emerse"]'::jsonb,'["rientrare senza autorizzazione","bloccare vie di esodo","mancato conteggio"]'::jsonb,'["condizioni reali di emergenza","via prevista non sicura"]'::jsonb,'[{"kind":"video_hub","title":"Napo - emergenze","url":"https://www.napofilm.net/it"}]'::jsonb,'[{"authority":"INAIL","url":"https://www.inail.it/"}]'::jsonb,true),
('v22:fire-lab','Pratica antincendio: estintore, naspo/idrante, sorveglianza','physical','Eseguire le manovre previste con attrezzature reali, mantenendo via di fuga e condizioni di sicurezza.','La dimostrazione digitale prepara la sequenza; capacità e idoneità si verificano nella pratica prevista.','["riconosci mezzo e limiti","controlla ambiente e via di fuga","attiva allarme/assistenza","usa il mezzo secondo addestramento","interrompi se le condizioni peggiorano","sorveglianza e ripristino"]'::jsonb,'["scelta mezzo","posizione sicura","via di fuga","tecnica d’uso","stop condition","sorveglianza"]'::jsonb,'["voltare le spalle alla via di fuga","avvicinarsi troppo","continuare con fumo/calore crescenti"]'::jsonb,'["perdita della via di fuga","fumo o calore non controllabili","mezzo non idoneo"]'::jsonb,'[{"kind":"reference","title":"Vigili del Fuoco - materiale didattico addetti antincendio","url":"https://www.vigilfuoco.it/comando-vvf-rimini/formazione-abilitazione-e-aggiornamento-addetti-antincendio"}]'::jsonb,'[{"authority":"Corpo Nazionale Vigili del Fuoco","url":"https://www.vigilfuoco.it/comando-vvf-rimini/formazione-abilitazione-e-aggiornamento-addetti-antincendio"}]'::jsonb,true),
('v22:first-aid-lab','Pratica primo soccorso: scena, valutazione, RCP/DAE e handover','physical','Allenare in presenza le abilità manuali e decisionali previste dal percorso con manichino e presidi didattici.','Il digitale non certifica la capacità manuale: il formatore osserva e corregge ogni passaggio.','["sicurezza scena","valutazione iniziale","allertamento","abilità pratiche previste dal corso","uso DAE didattico quando previsto","gestione trauma/emorragia secondo addestramento","handover"]'::jsonb,'["sequenza","allertamento","tecnica su manichino","sicurezza DAE","uso DPI","handover"]'::jsonb,'["ritardare la chiamata","improvvisare diagnosi o farmaci","eseguire tecniche non apprese"]'::jsonb,'["scena non sicura","situazione oltre la formazione dell’addetto"]'::jsonb,'[{"kind":"video","title":"Croce Rossa Italiana - Il primo soccorso salva la vita","url":"https://www.youtube.com/watch?v=J0iegcSFowI"},{"kind":"reference","title":"INAIL - Primo soccorso nei luoghi di lavoro","url":"https://www.inail.it/portale/it/inail-comunica/news/notizia.2018.10.primo-soccorso-nei-luoghi-di-lavoro-online-un-nuovo-manuale-inail.html"}]'::jsonb,'[{"authority":"Croce Rossa Italiana","url":"https://www.youtube.com/watch?v=J0iegcSFowI"},{"authority":"INAIL","url":"https://www.inail.it/portale/it/inail-comunica/news/notizia.2018.10.primo-soccorso-nei-luoghi-di-lavoro-online-un-nuovo-manuale-inail.html"}]'::jsonb,true),
('v22:equipment-lab','Pratica attrezzature: pre-use, manovre, emergenza e messa a riposo','physical','Trasferire la conoscenza alla conduzione reale della specifica attrezzatura, con valutazione dell’istruttore.','La checklist va adattata al modello reale, al manuale del fabbricante, agli accessori e all’ambiente.','["identificazione e manuale","controlli pre-uso","accesso e regolazioni","area e persone","manovre fondamentali","carico/accessorio quando pertinente","emergenza/arresto","parcheggio e messa in sicurezza"]'::jsonb,'["ispezione","comandi","zona operativa","manovre","comunicazione","emergenza","fine uso"]'::jsonb,'["saltare controlli","persone nella zona di pericolo","manovra fuori limiti macchina/accessorio","parcheggio non sicuro"]'::jsonb,'["difetto critico","stabilità non garantita","visibilità/segregazione insufficienti","condizione oltre manuale o addestramento"]'::jsonb,'[{"kind":"reference","title":"INAIL - corso per abilitazione operatori attrezzature","url":"https://www.inail.it/portale/formazione/it/corsi-inail/catalogo-corsi/dettaglio-corso.2024.01.corso-di-formazione-per-l-abilitazione-degli-operatori-delle-attrezzature.html"},{"kind":"reference","title":"INAIL - attrezzature marcate CE","url":"https://www.inail.it/portale/prevenzione-e-sicurezza/it/come-fare-per/conoscere-il-rischio/attrezzature-di-lavoro/attrezzature-marcate-CE.html"}]'::jsonb,'[{"authority":"INAIL","url":"https://www.inail.it/portale/formazione/it/corsi-inail/catalogo-corsi/dettaglio-corso.2024.01.corso-di-formazione-per-l-abilitazione-degli-operatori-delle-attrezzature.html"}]'::jsonb,true),
('v22:height-lab','Pratica lavori in quota e DPI anticaduta','physical','Saper selezionare, controllare, indossare e collegare il sistema coerentemente con lavoro, ancoraggio e recupero.','La prova deve usare DPI e sistemi reali compatibili, sotto guida di persona competente.','["valuta protezione collettiva","ispeziona DPI","indossa e regola","verifica compatibilità collegamenti/ancoraggio","considera tirante d’aria/pendolo","simula spostamento sicuro","prova piano di recupero"]'::jsonb,'["ispezione","vestizione","connessioni","ancoraggio","spazio libero","recupero"]'::jsonb,'["DPI non compatibili","ancoraggio non verificato","nessun piano di recupero","collegamento che crea caduta libera eccessiva"]'::jsonb,'["DPI danneggiato o dubbio","ancoraggio non definito","recupero non praticabile"]'::jsonb,'[{"kind":"reference","title":"INAIL - guida tecnica ancoraggi","url":"https://www.inail.it/content/dam/inail-hub-site/documenti/2019/07/Guidancoraggi%2C0.pdf"}]'::jsonb,'[{"authority":"INAIL","url":"https://www.inail.it/content/dam/inail-hub-site/documenti/2019/07/Guidancoraggi%2C0.pdf"}]'::jsonb,true),
('v22:dl-spp-lab','Laboratorio DL SPP: DVR → azione → verifica','digital','Trasformare la valutazione del rischio in una misura concreta con responsabilità, scadenza e indicatore.','Usare un rischio reale o simulato dell’azienda.','["descrivi scenario/esposizione","identifica cause e controlli esistenti","scegli misura più efficace","assegna responsabilità e risorse","definisci data e indicatore","verifica e riesamina"]'::jsonb,'["coerenza DVR","gerarchia misure","responsabile","scadenza","indicatore","riesame"]'::jsonb,'["azione generica","nessun proprietario","nessun criterio di chiusura"]'::jsonb,'["rischio residuo non controllato"]'::jsonb,'[{"kind":"video_hub","title":"Napo - gestione del rischio","url":"https://www.napofilm.net/it"}]'::jsonb,'[{"authority":"INAIL","url":"https://www.inail.it/"}]'::jsonb,false),
('v22:construction-lab','Laboratorio cantiere: pre-start e interferenze','hybrid','Verificare prima dell’avvio che sequenza, aree, accessi, mezzi, persone e comunicazioni siano coerenti.','Applicare il lab a una fase di cantiere reale o a planimetria/scenario.','["leggi attività simultanee","individua interferenze","segrega e programma","briefing ruoli/segnali","walk-around pre-start","autorizza avvio","verifica a fine fase"]'::jsonb,'["interferenze","segregazione","viabilità","briefing","autorizzazione","ripristino"]'::jsonb,'["coordinamento solo verbale","accessi non controllati","attività incompatibili simultanee"]'::jsonb,'["interferenza non risolta","condizioni diverse dal piano"]'::jsonb,'[{"kind":"video_hub","title":"Napo - sicurezza nei cantieri","url":"https://www.napofilm.net/it"}]'::jsonb,'[{"authority":"INAIL","url":"https://www.inail.it/"}]'::jsonb,false)
on conflict (stable_key) do nothing;

insert into public.course_scenarios_v22(course_id,scenario_id,position,required,context)
select c.id,s.id,1,true,jsonb_build_object('assigned_by','v22_001','course_title',c.title)
from public.courses c
join public.training_scenarios_v22 s on s.stable_key = case
  when c.stable_key='mod_cantieri' then 'v22:construction-prestart'
  when lower(c.family) like '%antincendio%' or lower(c.family)='fire' then 'v22:fire-response'
  when lower(c.family) like '%primo_soccorso%' then 'v22:first-aid-scene'
  when lower(c.family) like '%attrezzature%' then 'v22:equipment-preuse'
  when c.stable_key='lav_quota' then 'v22:height-plan'
  when lower(c.family)='rls' then 'v22:rls-walkthrough'
  when lower(c.family) like '%dl spp%' then 'v22:dl-spp-control'
  when lower(c.family) like '%datore di lavoro%' then 'v22:management-decision'
  when lower(c.family) like '%ruoli della prevenzione%' and c.stable_key like '%prep%' then 'v22:preposto-stop'
  when lower(c.family) like '%ruoli della prevenzione%' then 'v22:management-decision'
  when lower(c.family)='emergenze' then 'v22:evacuation'
  else 'v22:hazard-spotting'
end
where c.active and coalesce(c.metadata->>'freeze_scope','')=''
on conflict do nothing;

insert into public.course_practice_labs_v22(course_id,practice_lab_id,position,required,context)
select c.id,p.id,1,true,jsonb_build_object('assigned_by','v22_001','course_title',c.title,'nominal_minutes',c.nominal_minutes)
from public.courses c
join public.practice_labs_v22 p on p.stable_key = case
  when c.stable_key='mod_cantieri' then 'v22:construction-lab'
  when lower(c.family) like '%antincendio%' or lower(c.family)='fire' then 'v22:fire-lab'
  when lower(c.family) like '%primo_soccorso%' then 'v22:first-aid-lab'
  when lower(c.family) like '%attrezzature%' then 'v22:equipment-lab'
  when c.stable_key='lav_quota' then 'v22:height-lab'
  when lower(c.family)='rls' then 'v22:rls-lab'
  when lower(c.family) like '%dl spp%' then 'v22:dl-spp-lab'
  when lower(c.family) like '%datore di lavoro%' then 'v22:management-lab'
  when lower(c.family) like '%ruoli della prevenzione%' and c.stable_key like '%prep%' then 'v22:preposto-lab'
  when lower(c.family) like '%ruoli della prevenzione%' then 'v22:management-lab'
  when lower(c.family)='emergenze' then 'v22:evacuation-lab'
  else 'v22:hazard-lab'
end
where c.active and coalesce(c.metadata->>'freeze_scope','')=''
on conflict do nothing;

create or replace function public.get_course_quality_v22()
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare v_result jsonb;
begin
  if not private.is_platform_admin() then raise exception 'platform admin required'; end if;
  with latest as (
    select distinct on (cv.course_id) cv.id course_version_id,cv.course_id,cv.version_number,cv.status
    from public.course_versions cv order by cv.course_id,cv.version_number desc
  ), content_stats as (
    select l.course_id,
      count(cmu.id)::int unit_count,
      count(cmu.id) filter(where luv.content ? 'operational')::int operational_units,
      count(cmu.id) filter(where luv.content ? 'case' or luv.content ? 'teacher_activity')::int scenario_units,
      count(cmu.id) filter(where luv.content ? 'idea_images' or luv.content ? 'visuals')::int explicit_visual_units,
      count(cmu.id) filter(where luv.content ? 'evidence_sources' or luv.content ? 'sources')::int sourced_units
    from latest l
    left join public.course_modules cm on cm.course_version_id=l.course_version_id
    left join public.course_module_units cmu on cmu.module_id=cm.id
    left join public.learning_unit_versions luv on luv.id=cmu.unit_version_id
    group by l.course_id
  ), exp as (
    select c.id course_id,
      count(distinct cs.scenario_id)::int scenario_count,
      count(distinct cp.practice_lab_id)::int practice_lab_count,
      coalesce(sum(case when jsonb_typeof(pl.media)='array' then jsonb_array_length(pl.media) else 0 end),0)::int media_count,
      coalesce(sum(case when jsonb_typeof(pl.sources)='array' then jsonb_array_length(pl.sources) else 0 end),0)::int lab_source_count,
      bool_or(coalesce(pl.requires_physical_validation,false)) physical_validation_present
    from public.courses c
    left join public.course_scenarios_v22 cs on cs.course_id=c.id
    left join public.course_practice_labs_v22 cp on cp.course_id=c.id
    left join public.practice_labs_v22 pl on pl.id=cp.practice_lab_id and pl.active
    group by c.id
  ), ver as (
    select l.course_id,
      count(distinct vr.id) filter(where vr.required)::int verification_count,
      count(distinct vr.id) filter(where vr.required and (vr.verification_mode in ('test','test_and_practical') or (vr.verification_mode='test_or_interview' and vr.selected_mode='test')))::int required_test_count,
      max(vr.minimum_questions) filter(where vr.required and (vr.verification_mode in ('test','test_and_practical') or (vr.verification_mode='test_or_interview' and vr.selected_mode='test')))::int min_questions
    from latest l left join public.course_verification_requirements vr on vr.course_version_id=l.course_version_id group by l.course_id
  ), tst as (
    select l.course_id,count(distinct t.id) filter(where t.active)::int active_tests,
      count(distinct q.id) filter(where t.active and q.active)::int active_questions
    from latest l left join public.tests t on t.course_version_id=l.course_version_id
    left join public.test_questions tq on tq.test_id=t.id left join public.questions q on q.id=tq.question_id
    group by l.course_id
  ), scored as (
    select c.id,c.stable_key,c.title,c.family,c.nominal_minutes,c.metadata,l.version_number,l.status version_status,
      coalesce(cs.unit_count,0) unit_count,coalesce(cs.operational_units,0) operational_units,coalesce(cs.scenario_units,0) scenario_units,
      coalesce(cs.explicit_visual_units,0) explicit_visual_units,coalesce(cs.sourced_units,0) sourced_units,
      coalesce(e.scenario_count,0) scenario_count,coalesce(e.practice_lab_count,0) practice_lab_count,coalesce(e.media_count,0) media_count,
      coalesce(e.lab_source_count,0) lab_source_count,coalesce(e.physical_validation_present,false) physical_validation_present,
      coalesce(v.verification_count,0) verification_count,coalesce(v.required_test_count,0) required_test_count,coalesce(v.min_questions,0) min_questions,
      coalesce(t.active_tests,0) active_tests,coalesce(t.active_questions,0) active_questions,
      (
        case when l.course_version_id is not null and coalesce(cs.unit_count,0)>0 then 10 else 0 end +
        case when coalesce(cs.unit_count,0)>0 and cs.operational_units*2>=cs.unit_count then 10 when cs.operational_units>0 then 5 else 0 end +
        case when coalesce(cs.unit_count,0)>0 and cs.scenario_units*2>=cs.unit_count then 10 when cs.scenario_units>0 then 5 else 0 end +
        case when coalesce(cs.unit_count,0)>0 and cs.explicit_visual_units*3>=cs.unit_count then 10 when cs.explicit_visual_units>0 then 5 else 0 end +
        case when coalesce(e.scenario_count,0)>0 then 15 else 0 end +
        case when coalesce(e.practice_lab_count,0)>0 then 20 else 0 end +
        case when coalesce(e.media_count,0)>0 then 10 else 0 end +
        case when coalesce(cs.sourced_units,0)>0 or coalesce(e.lab_source_count,0)>0 then 5 else 0 end +
        case when coalesce(v.verification_count,0)>0 and (coalesce(v.required_test_count,0)=0 or (coalesce(t.active_tests,0)>=v.required_test_count and coalesce(t.active_questions,0)>=greatest(coalesce(v.min_questions,0),1))) then 10 else 0 end
      )::int quality_score
    from public.courses c left join latest l on l.course_id=c.id left join content_stats cs on cs.course_id=c.id left join exp e on e.course_id=c.id left join ver v on v.course_id=c.id left join tst t on t.course_id=c.id
    where c.active and coalesce(c.metadata->>'freeze_scope','')=''
  ), final as (
    select s.*,
      case when quality_score>=85 then 'gold' when quality_score>=70 then 'silver' when quality_score>=55 then 'bronze' else 'incomplete' end quality_grade,
      array_remove(array[
        case when unit_count=0 then 'missing_learning_units' end,
        case when operational_units=0 then 'missing_operational_content' end,
        case when scenario_units=0 then 'missing_scenario_content' end,
        case when explicit_visual_units=0 then 'missing_authored_visuals' end,
        case when scenario_count=0 then 'missing_safety_scenario' end,
        case when practice_lab_count=0 then 'missing_practice_lab' end,
        case when media_count=0 then 'missing_media_or_demo' end,
        case when sourced_units=0 and lab_source_count=0 then 'missing_sources' end,
        case when verification_count=0 then 'missing_verification_path' end,
        case when required_test_count>0 and (active_tests<required_test_count or active_questions<greatest(min_questions,1)) then 'test_bank_incomplete' end
      ],null)::text[] quality_gaps
    from scored s
  )
  select jsonb_build_object(
    'standard','v22.001','generated_at',now(),
    'summary',jsonb_build_object('total',count(*),'gold',count(*) filter(where quality_grade='gold'),'silver',count(*) filter(where quality_grade='silver'),'bronze',count(*) filter(where quality_grade='bronze'),'incomplete',count(*) filter(where quality_grade='incomplete'),'frozen_excluded',(select count(*) from public.courses x where x.active and coalesce(x.metadata->>'freeze_scope','')<>'')),
    'courses',coalesce(jsonb_agg(jsonb_build_object('course_id',id,'stable_key',stable_key,'title',title,'family',family,'nominal_minutes',nominal_minutes,'version_number',version_number,'version_status',version_status,'quality_score',quality_score,'quality_grade',quality_grade,'quality_gaps',to_jsonb(quality_gaps),'unit_count',unit_count,'operational_units',operational_units,'scenario_units',scenario_units,'explicit_visual_units',explicit_visual_units,'sourced_units',sourced_units,'scenario_count',scenario_count,'practice_lab_count',practice_lab_count,'media_count',media_count,'physical_validation_present',physical_validation_present,'verification_count',verification_count,'active_tests',active_tests,'active_questions',active_questions) order by quality_score,title),'[]'::jsonb)
  ) into v_result from final;
  return v_result;
end;
$function$;

revoke all on function public.get_course_quality_v22() from public,anon;
grant execute on function public.get_course_quality_v22() to authenticated,service_role;
comment on function public.get_course_quality_v22() is 'SafetyTraining v22 didactic quality audit for non-frozen active courses. Published status is not treated as proof of training quality.';
