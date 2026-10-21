# SafetyTraining — START HERE per collaboratori

Aggiornato: 15 ottobre 2026

Questo documento è la fonte operativa principale per chi entra nel progetto o deve riprendere lo sviluppo senza conoscere le conversazioni precedenti. I documenti `ARCHITECTURE_V19.md`, `CURRENT_SUPABASE_AUDIT.md`, `COURSE_SCOPE.md` e il vecchio `IMPLEMENTATION_PLAN.md` descrivono fasi storiche importanti, ma alcune decisioni lì contenute sono state superate. In caso di conflitto, usare questo documento e `VERSION_HISTORY_V20.md` come riferimento più recente.

## 1. Visione del progetto

SafetyTraining non deve essere una semplice raccolta di slide. È la piattaforma didattica del sistema SafetyManager e deve poter gestire percorsi di salute e sicurezza sul lavoro in modo professionale, tracciabile e progressivamente compatibile con D.Lgs. 81/08, Accordo Stato-Regioni 17/04/2025 e normative specialistiche.

Architettura concettuale:

- **SafetyManager** = catalogo master, anagrafiche, aziende, rischi, progetti/edizioni, presenze, fascicoli, attestati, scadenze e contesto organizzativo;
- **SafetyTraining** = Blueprint -> Learning Unit -> regole di erogazione -> prerequisiti -> aggiornamenti -> verifiche -> qualificazione;
- database condiviso Supabase;
- front-end distinti ma dati e identità condivisi;
- Learning Unit riutilizzabili, versionate e componibili in più corsi.

## 2. Principi NON negoziabili emersi durante lo sviluppo

### 2.1 Materiale completo indipendentemente dalla modalità di erogazione

La modalità legale di erogazione (aula, videoconferenza sincrona, e-learning, pratica obbligatoria, ecc.) **non deve mai impoverire o nascondere il materiale didattico**. Ogni corso deve contenere tutto ciò che serve a docente e corsista per capire l'argomento. I vincoli di erogazione sono metadata/regole, non una scusa per rimuovere contenuto.

### 2.2 Corso censito != corso didatticamente completo

Separare sempre:

- esistenza nel catalogo;
- presenza di struttura/Blueprint;
- presenza delle Learning Unit;
- completezza del materiale;
- validazione normativa;
- stato pubblicabile;
- verifica finale/test.

Un corso può essere correttamente censito ma non ancora pronto per il corsista.

### 2.3 Draft/hidden per impostazione predefinita

Le nuove famiglie e le revisioni importanti restano in **draft / learner hidden** fino a revisione completa. Non pubblicare automaticamente materiali appena creati.

### 2.4 Test Builder ancora sospeso

Il lavoro sul **Test Builder / banca domande finale / verifica finale** è volutamente sospeso. Le Learning Unit possono contenere micro-domande didattiche con spiegazione, ma il sistema di test finali non va riattivato finché non viene deciso esplicitamente.

### 2.5 Dopo ogni domanda deve esserci spiegazione

Una domanda non deve limitarsi a dire giusto/sbagliato. Va aggiunta una spiegazione utile che chiarisca perché la risposta è corretta e cosa deve ricordare il corsista.

### 2.6 Materiale operativo, non solo normativo

Ogni unità deve rispondere, dove pertinente, a:

- cosa fare;
- come farlo;
- cosa controllare prima;
- quali errori evitare;
- quando fermarsi;
- come segnalare/ripristinare;
- cosa cambia in emergenza;
- come si applica il concetto in un caso reale.

La norma va spiegata attraverso situazioni concrete, non trasformata in pagine di articoli copiati.

### 2.7 Gerarchia della prevenzione

Quando si propone una misura, privilegiare la gerarchia reale delle misure: eliminazione/riduzione alla fonte, misure tecniche e collettive, organizzazione/procedure, DPI come ultimo livello quando appropriato. Evitare una didattica centrata solo sul comportamento individuale.

### 2.8 Separare durata normativa e allocazione didattica interna

Non dichiarare mai come durata minima legale universale una durata scelta internamente per esigenze didattiche. Esempio già applicato: `lav_quota` usa 8 ore come allocazione interna SafetyTraining, ma il metadata specifica che non è una pretesa di durata minima universale derivata dall'art. 77.

### 2.9 Riutilizzo delle Learning Unit

Se due corsi condividono contenuti ufficialmente sovrapponibili, riutilizzare la stessa Learning Unit invece di duplicarla. Esempi già applicati:

- aggiornamento primo soccorso Gruppo A riusa le 4 ore comuni;
- aggiornamento RLS 8h riusa le unità comuni del percorso 4h;
- funi siti/alberi condividono il modulo base;
- contenuti trasversali possono essere riutilizzati tra RSPP/ASPP, dirigenti, preposti, lavoratori, ecc.

## 3. Stato piattaforma al 15/10/2026

Snapshot operativo verificato prima di questa documentazione:

- repository: `SafetyManagerPro/SafetyTraining`;
- ramo principale: `main`;
- baseline HEAD prima dei commit documentali: `06c6c10767971f302760da60d490425ffe291dc3`;
- migration più recente versionata: `v20_046_training_source_library`;
- GitHub Actions `SafetyTraining checks` run #102 su `06c6c107...`: **success**;
- Supabase project ref: `ejkwvatmzdqqjozpxntk`;
- Vercel project id: `prj_u0IT97WJ3ARGJJUhuYUWA6MyS24U`;
- alias noti: `training-six-livid.vercel.app`, `safety-training-safety-manager.vercel.app`.

Ultimo conteggio verificato del catalogo live dopo il completamento delle famiglie mancanti:

- **92 corsi attivi**;
- **92 con materiale**;
- **0 corsi attivi senza Learning Unit/materiale**.

Nota importante: questo conteggio descrive il database live. Parte delle aggiunte più recenti è stata realizzata direttamente in Supabase ed è ancora da riallineare integralmente in migration riproducibili nel repository; vedere la sezione "Debito tecnico prioritario".

## 4. Evoluzione front-end già realizzata

Sono già stati aggiunti/aggiornati:

- catalogo completo DB-backed per admin/docenti;
- route libreria `#library/<stable_key>`;
- Home v3 con browser del catalogo;
- navigazione mobile off-canvas e correzioni responsive;
- editor admin corso migliorato (metadata e accesso diretto al materiale);
- PWA con icone PNG reali e manifest corretto;
- service worker aggiornato;
- RPC catalogo/materiale con correzione security invoker;
- Home/catalogo non più limitati ai soli layer JS locali.

File principali introdotti/aggiornati in questa fase:

- `apps/training/catalog-browser.js`
- `apps/training/home-v2.js`
- `apps/training/responsive-v2.css`
- `apps/training/admin-enhanced.js`
- `apps/training/index.html`
- `apps/training/sw.js`
- `apps/training/icons/*`

Limite noto: l'editor admin non è ancora un editor completo e granulare di moduli/Learning Unit.

## 5. Famiglie formative già costruite o approfondite

### 5.1 Fondamentali e ruoli

Già sviluppati con materiale didattico approfondito:

- formazione generale lavoratori;
- lavoratori / aggiornamenti;
- preposto / aggiornamento;
- dirigente / aggiornamento;
- datore di lavoro / aggiornamento;
- RLS / aggiornamenti;
- primo soccorso;
- antincendio;
- ambienti confinati;
- lavori in quota;
- attrezzature art. 73;
- cantieri.

### 5.2 DL-RSPP

Struttura sviluppata:

- modulo comune: 8 LU / 480 min;
- agricoltura A01-A02: 16h / 11 LU;
- pesca A03: 12h / 13 LU;
- costruzioni F: 16h / 18 LU;
- chimico/petrolchimico C19-C20: 16h / 13 LU;
- aggiornamento DL-RSPP: 8h / 8 LU.

### 5.3 RSPP/ASPP

Famiglia completata in struttura/materiale:

- Modulo A: 28h / 5 LU;
- Modulo B comune: 48h / 12 LU;
- B-SP1: 16h / 11 LU;
- B-SP2: 12h / 13 LU;
- B-SP3: 16h / 18 LU;
- B-SP4 sanità: 12h / 15 LU;
- B-SP5: 16h / 13 LU;
- Modulo C: 24h / 4 LU;
- aggiornamento ASPP: 20h / 5 LU;
- aggiornamento RSPP: 40h / 8 LU.

## 6. I 22 corsi che erano censiti ma senza materiale

Sono stati completati sistematicamente nel database live:

1. `agg_attr_cmm_4h`
2. `agg_attr_carrelli_all_4h`
3. `agg_attr_carrelli_ind_4h`
4. `agg_attr_carroponte_all_11h_4h`
5. `agg_attr_carroponte_10h_4h`
6. `agg_attr_gru_torre_4h`
7. `agg_attr_gru_autocarro_4h`
8. `agg_attr_crf_4h`
9. `agg_attr_mmt_all_4h`
10. `agg_attr_mmt_esc_4h`
11. `agg_attr_ple_4h`
12. `agg_attr_pompe_4h`
13. `agg_attr_trattori_4h`
14. `agg_lav`
15. `agg_primo_soccorso_4h`
16. `agg_primo_soccorso_a_6h`
17. `agg_spazi_confinati_4h`
18. `lav_quota`
19. `agg_rls_4h`
20. `agg_rls_8h`
21. `agg_dir`
22. `agg_prep`

Le 13 attrezzature hanno aggiornamento pratico integrato da 240 minuti con quattro blocchi: pre-uso/GO-NO GO, assetto/stabilità/area, manovre/visibilità/interferenze, anomalie/emergenza/prova integrata. Il contenuto è specifico per attrezzatura e non è filler generico.

## 7. Nuove famiglie aggiunte dopo il completamento dei 22 corsi

### CSP/CSE

- `csp_cse_120h`: 7200 min, 30 LU, draft;
- `agg_csp_cse_40h`: 2400 min, 10 LU, draft.

Il 120h è strutturato in blocchi giuridico, tecnico, metodologico-organizzativo e pratico. La verifica finale resta separata dal materiale didattico.

### Antincendio

Il catalogo aveva già un corso legacy 8h. Sono state aggiunte le parti mancanti della famiglia:

- `antincendio_l1` 4h;
- `antincendio_l3` 16h;
- `agg_antincendio_l1` 2h;
- `agg_antincendio_l2` 5h;
- `agg_antincendio_l3` 8h.

Riferimento principale: D.M. 2/9/2021 + materiali ufficiali Vigili del Fuoco.

### Ponteggi

- `ponteggi_28h`: 1680 min / 14 LU;
- `agg_ponteggi_4h`: 240 min / 2 LU.

Struttura coerente con art. 136 e Allegato XXI, con distinzione teoria/tecnica/pratica e verifica separata.

### Lavori su funi

- `funi_siti_32h`;
- `funi_alberi_32h`;
- `agg_funi_siti_8h`;
- `agg_funi_alberi_8h`;
- `preposto_funi_8h`;
- `agg_preposto_funi_4h`.

I due percorsi da 32h condividono il modulo base e hanno parte specifica per direzione operativa.

### Segnaletica stradale / traffico

- `segnaletica_stradale_lav_8h`;
- `segnaletica_stradale_prep_12h`;
- `segnaletica_stradale_prep_integ_4h`;
- `agg_segnaletica_stradale_lav_6h`;
- `agg_segnaletica_stradale_prep_6h`.

Riferimento principale: Decreto interministeriale 22 gennaio 2019.

## 8. Source Library e provenienza dei materiali

Con `v20_046` è stata introdotta una vera Source Library:

- tabella `training_sources`;
- tabella `learning_unit_sources`;
- RLS per accesso amministrativo;
- mapping fonte -> Learning Unit con scopo (`normative_validation`, `technical_reference`, `incident_evidence`, `didactic_benchmark`, ecc.).

Snapshot live immediatamente dopo l'introduzione:

- 9 fonti registrate;
- 509 relazioni fonte/LU;
- 375 Learning Unit collegate.

Fonti iniziali registrate:

- Regione Emilia-Romagna — materiali per docenti/figure della prevenzione;
- Comune di Milano — materiale didattico SSL;
- ANFOS/Sicurezza.com — benchmark;
- Corpo Nazionale Vigili del Fuoco — antincendio;
- INAIL — Quaderni tecnici cantieri;
- INAIL Infor.MO — carrelli elevatori;
- INAIL Infor.MO — ambienti confinati;
- Regione Piemonte — indicazioni operative post ASR 2025;
- catalogo pubblicazioni INAIL.

Regola di utilizzo:

- **fonti normative/istituzionali**: validazione e riferimento tecnico;
- **fonti open/adattabili**: adattare rispettando licenza/attribuzione;
- **fonti senza licenza aperta verificata**: studiare, confrontare e riscrivere; non copiare testi/immagini;
- aggiornare sempre riferimenti datati prima di inserirli come contenuto normativo vigente.

## 9. Stile didattico richiesto

Le slide/LU devono essere professionali, leggibili e operative. Preferire:

- spiegazioni progressive;
- casi realistici;
- immagini/diagrammi originali;
- checklist;
- flowchart;
- matrici rischio;
- scenari “cosa faresti?”;
- near miss;
- GO/NO-GO;
- condizioni di STOP;
- errori comuni;
- indicazioni docente;
- attività guidate;
- debriefing;
- takeaway finale.

Asset grafici già previsti/riutilizzabili:

- `organigramma-sicurezza.svg`;
- `piramide-pericoli.svg`;
- `modello-farfalla-rischio.svg`;
- `procedura-operativa-5-fasi.svg`;
- `stop-segnala-ripristina.svg`.

Quando una fonte esterna ha una buona idea grafica, **ridisegnarla nello stile SafetyTraining** invece di incorporare screenshot protetti.

## 10. Debito tecnico PRIORITARIO

### 10.1 Drift database -> repository

Il database live contiene materiale creato direttamente via SQL che non è ancora integralmente rappresentato da migration nel repository. La priorità prima di aggiungere molte altre famiglie è generare migration idempotenti/reproducibili per:

- completamento dei 22 corsi precedentemente vuoti;
- CSP/CSE + aggiornamento;
- famiglia antincendio aggiuntiva;
- ponteggi + aggiornamento;
- funi + preposto + aggiornamenti;
- segnaletica stradale + aggiornamenti;
- integrazioni evidence-based aggiunte a carrelli/confinati/CSP/ponteggi/antincendio.

Attenzione ai riusi: primo soccorso, RLS e funi condividono Learning Unit; una migration non deve creare duplicati.

### 10.2 Editor contenuti

L'admin editor attuale non è ancora un authoring system completo per moduli/LU. Futuro obiettivo: editing granulare con versioning, preview e tracciabilità delle fonti.

### 10.3 Sicurezza Supabase

Gli advisor del 15/10/2026 mostrano warning preesistenti da affrontare separatamente:

- 7 funzioni `SECURITY DEFINER` eseguibili da `authenticated`;
- leaked-password protection disabilitata;
- alcune policy RLS con `auth.*` ricalcolato per riga;
- più policy permissive sovrapposte;
- una FK senza indice di copertura su `training_blueprint_rules`.

Non correggere meccanicamente queste voci senza prima capire il modello autorizzativo esistente: alcune funzioni possono essere intenzionalmente privilegiate.

## 11. Prossime famiglie da valutare dopo il riallineamento migration

Eseguire un audit normativo prima di creare corsi con durate fisse. Candidati:

- lavori elettrici / PES-PAV-PEI (D.Lgs. 81/08 art. 82 + CEI 11-27; durata non va inventata come minimo di legge nazionale se non prevista);
- amianto (quadro nazionale + regionale; distinguere ruoli e requisiti locali);
- altri percorsi specialistici di settore.

Non creare corsi autonomi con durata “di legge” se il quadro normativo prevede invece formazione commisurata al rischio o non definisce un monte ore nazionale unico.

## 12. Regole per continuare il lavoro

Prima di ogni nuova grande famiglia:

1. verificare fonte normativa vigente;
2. verificare eventuale ASR/DM/allegato specifico;
3. distinguere durata obbligatoria da allocazione interna;
4. controllare Learning Unit già riutilizzabili;
5. creare contenuti in draft;
6. aggiungere fonti a `training_sources` e mapping `learning_unit_sources`;
7. usare esempi/casi originali;
8. verificare minuti nominali = minuti materiale dove previsto;
9. verificare che il catalogo non generi corsi vuoti;
10. versionare la modifica in migration GitHub;
11. eseguire CI;
12. verificare produzione/database.

## 13. Convenzione di versione

Le versioni `v20_xxx` identificano principalmente blocchi di migration/schema/contenuti. I commit puramente documentali non richiedono necessariamente un nuovo numero `v20_xxx`.

Usare nomi descrittivi e timestamp crescenti. Evitare di inventare numerazioni senza verificare l'ultima migration presente in `supabase/migrations/`.

Vedere `docs/VERSION_HISTORY_V20.md` per la progressione corrente.

## 14. Documenti utili

- `docs/START_HERE_COLLABORATORS.md` — questo documento, stato e decisioni correnti;
- `docs/VERSION_HISTORY_V20.md` — cronologia evolutiva v20;
- `docs/IMPLEMENTATION_PLAN.md` — roadmap corrente;
- `docs/ARCHITECTURE_V19.md` — origine dell'architettura single database/two frontends;
- `docs/SECURITY_MIGRATION.md` — principi di migrazione RLS;
- `docs/COMPLETION_RULES.md` — regole di completamento;
- `supabase/migrations/` — fonte canonica delle modifiche DB già versionate.

## 15. Stato che NON va perso

La direzione del progetto è passata da “portare online corsi esistenti” a costruire una **piattaforma e-learning/formazione completa**, capace di gestire materiale docente/corsista, frequenza, tracking, test/verifiche, categorie e rischi, mantenendo compatibilità con la gestione cartacea e digitale. Il modello deve restare ibrido: supportare la progressiva digitalizzazione senza presumere che ogni aula disponga già di hardware per firme o processi totalmente digitali.

Il valore principale del lavoro didattico non è la quantità di slide, ma la qualità: contenuti verificati, comprensibili, riutilizzabili, operativi e tracciati fino alla fonte.

## Aggiornamento 21/10/2026 — selezione immagini slide

- Corretto nell'editor `apps/training/slide-image-editor-v33.js` il comportamento del selettore: scegliere un'immagine ora **sostituisce** la selezione precedente per impostazione predefinita, anziché aggiungerla sopra/in galleria.
- L'aggiunta di più immagini è una modalità esplicita, attivata col comando **Modalità: aggiungi alla galleria**; resta il limite di 3 immagini.
- Il salvataggio continua a utilizzare `save_slide_images_v33` e mantiene i vincoli owner/admin già previsti.
- Correzione frontend commit `01d3f2c`; verificare deployment Vercel, prova interattiva del salvataggio e resa della stampa PDF prima di dichiarare risolto definitivamente.

### Audit continuato — sincronizzazione editor/slide (21/10/2026)

- Verificata la logica di navigazione `deckView`, la stampa `admin-print-slides-v23.js` e la strategia cache del service worker: JS/CSS in network-first, immagini in cache-first.
- Riscontrato rischio di race condition: due rendering asincroni della stessa slide o richieste concorrenti di override potevano completarsi in ordine inverso. Mitigato tramite revisione incrementale su caricamento override e proiezione del DOM, invalidata anche ai cambi di autenticazione (commit `19c14b1`).
- Non è stato eseguito un collaudo manuale end-to-end nel browser: rimangono da verificare durante navigazione rapida, persistenza tra refresh e stampa PDF; non dichiarare l'intera app priva di bug.
