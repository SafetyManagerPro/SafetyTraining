# SafetyTraining — stato progetto / hand-off

Ultimo aggiornamento: 2026-10-16

Questo file è il punto di ripartenza rapido quando si cambia chat. Va aggiornato a ogni blocco sostanziale completato.

## Regole operative da NON perdere

- Nuovi contenuti/versioni sempre `draft`.
- Mai auto-publish e mai auto-link/relink nei corsi attivi.
- Test Builder finale congelato/pausato finché non richiesto esplicitamente; i check interni restano formativi e separati.
- Ogni domanda didattica deve avere spiegazione.
- Delivery rules (presenza/VCS/e-learning/pratica) sono metadata/regole e non riducono il contenuto didattico.
- Contenuto authored deve includere: cosa fare, come procedere, chi coinvolgere, errori, STOP, casi/scenari, domanda+spiegazione, attività docente, takeaway/visual quando utile.
- Fonti: priorità a normativa/Ministeri/VVF/INAIL, poi fonti pubbliche tecniche; contenuti sempre riscritti originalmente.
- Se si analizza un PDF normativo sul web, usare screenshot delle pagine pertinenti.
- Catalogo di riferimento: 92 corsi attivi / 92 con materiale / 0 vuoti.
- Gli RSPP/ASPP esterni sono CONGELATI e non vanno proseguiti salvo nuova istruzione esplicita.

## Stato authored completato

### Ruoli / governance
- Preposto base + aggiornamento: `role-authored-v3` — completato.
- Dirigente base + aggiornamento: `role-authored-v3` — completato.
- Datore di lavoro 16h + aggiornamento 6h: `datore-authored-v3` — completato.
- RLS base + aggiornamenti: `rls-authored-v3` — completato.

### Lavoratori
- Formazione lavoratori/job profiles + aggiornamento: `worker-authored-v3` — completato.
- Unità generali condivise: `general-authored-v4` — completato.

### Primo soccorso
- Base + aggiornamenti: `first-aid-authored-v3` — 16 LU draft.
- Gate pratici separati; la fruizione digitale non certifica la competenza pratica.

### Antincendio
- Livelli + aggiornamenti: `fire-authored-v3` — 23 LU draft.

### Attrezzature
- Blocco attrezzature e aggiornamenti: `equipment-authored-v3` — 63 LU authored draft distribuite sui 26 corsi/aggiornamenti del catalogo.
- Migration di completamento: `v20_078_equipment_authored_completion`.

### Emergenze / evacuazione e lavori in quota
- `emergenze_evacuazione`: candidato composto da `general-authored-v4` + `emergency-authored-v3` + `fire-authored-v3`; percorso interno non certificante.
- `lav_quota`: 8/8 LU `height-authored-v3`; pratica/addestramento separati dalla fruizione digitale.
- Migration: `20261016160609_v20_080_emergency_height_authored_completion.sql`.

### DL-RSPP del Datore
- Modulo comune + Agricoltura + Pesca + Chimico/Petrolchimico + aggiornamento: `dl-rspp-authored-v3` — completati.
- Costruzioni: 18 LU / 960 min `dl-rspp-authored-v3` — completato con `v20_081a–d`.
- Il percorso Costruzioni completo è 8h comune + 16h settore = 24h, dopo il corso Datore.

### Modulo aggiuntivo Cantieri — impresa affidataria
Il contenitore catalogo è volutamente unico: `mod_cantieri` (6h / 360 min). Il Blueprint `employer_construction_addon` risolve il ruolo tramite `audience_rule`; NON creare un nuovo 93° corso.

**Variante Datore**
- `datore-cantieri-authored-v3`
- 6 LU / 360 min
- prerequisito: `employer_initial` / corso `dl_base` 16h
- 25 evidence refs
- 0 auto-link
- migration: `20261016163358_v20_082_datore_cantieri_authored_completion.sql`

**Variante Dirigente — ultimo blocco completato**
- `dirigente-cantieri-authored-v3`
- 6 LU / 360 min
- prerequisito: `dirigente_initial` / corso `dirigente` 12h
- percorso complessivo ruolo + modulo: 18h
- 25 evidence refs
- 0 auto-link
- distingue esplicitamente poteri del Dirigente, obblighi del Datore, vigilanza del Preposto e funzioni del CSE
- nessun obbligo aggiuntivo autonomo di aggiornamento Cantieri inventato: resta l'aggiornamento generale Dirigente 6h quinquennale, da contestualizzare ai fabbisogni reali
- migration: `20261016164702_v20_083_dirigente_cantieri_authored_completion.sql`

## RSPP/ASPP esterni — CONGELATI

Migration di freeze: `20261016155345_v20_079_freeze_external_rspp_aspp`.

Già modernizzati prima del freeze:
- Modulo A: 5 LU `rspp-aspp-authored-v3`
- Modulo B comune: 12 LU `rspp-aspp-authored-v3`

Da NON proseguire finché l'utente non lo sblocca:
- B-SP1 Agricoltura
- B-SP2 Pesca
- B-SP3 Costruzioni
- B-SP4 Sanità
- B-SP5 Chimico/Petrolchimico
- Modulo C
- aggiornamenti ASPP/RSPP

## Cantieri / lavori specialistici ancora da modernizzare

Sono presenti contenuti v2 ma non ancora portati allo standard authored finale:
- CSP/CSE 120h (`csp-cse-v2`, 30 LU) + aggiornamento 40h (`csp-cse-update-v2`, 10 LU)
- Ponteggi 28h (`ponteggi-v2`, 14 LU) + aggiornamento (`ponteggi-update-v2`, 2 LU)
- Lavori su funi (`funi-v2`, 13 LU) + aggiornamento (`funi-update-v2`, 4 LU)
- Preposto/sorvegliante funi (`funi-preposto-v2`, 4 LU) + aggiornamento (`funi-preposto-update-v2`, 1 LU)

Altri blocchi differiti:
- spazi confinati
- segnaletica stradale / viabilità (`road-sign-v2` e update)

## Migrazioni recenti da Primo Soccorso in avanti

- `20261016132900_v20_076_first_aid_authored_completion`
- `20261016134027_v20_077_fire_authored_completion`
- `20261016154330_v20_078_equipment_authored_completion`
- `20261016155345_v20_079_freeze_external_rspp_aspp`
- `20261016160609_v20_080_emergency_height_authored_completion`
- `20261016162021_v20_081a_dl_rspp_costruzioni_sources_metadata`
- `20261016162106_v20_081b_dl_rspp_costruzioni_authored_part1`
- `20261016162143_v20_081c_dl_rspp_costruzioni_authored_part2`
- `20261016162235_v20_081d_dl_rspp_costruzioni_provenance_audit`
- `20261016163358_v20_082_datore_cantieri_authored_completion`
- `20261016164702_v20_083_dirigente_cantieri_authored_completion`

## Ultimo audit DB

Dopo `v20_083`:
- Dirigente Cantieri: 6 draft / 360 min
- 6/6 quality gate
- 25 evidence refs / 6 LU con provenance
- 0 link delle nuove versioni authored
- Datore Cantieri invariato: `datore-cantieri-authored-v3`
- prerequisiti role-specific corretti nel corso condiviso `mod_cantieri`
- catalogo: 92 attivi / 92 con materiale / 0 vuoti

## Prossimo punto di lavoro

Il Modulo Cantieri Datore e Dirigente è chiuso lato contenuti candidati. Il prossimo blocco specialistico NON è ancora scelto. Candidati naturali: CSP/CSE, ponteggi, oppure lavori su funi. RSPP/ASPP esterni restano congelati.

## Servizi / repository

- GitHub: `SafetyManagerPro/SafetyTraining`
- Supabase project: `ejkwvatmzdqqjozpxntk`
- Vercel project: `safety-training`
- Produzione: `safety-training-safety-manager.vercel.app`
