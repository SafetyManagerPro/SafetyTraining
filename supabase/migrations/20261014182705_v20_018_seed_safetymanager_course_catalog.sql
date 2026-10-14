-- SafetyTraining v20.018
-- Mirror the active administrative course catalog from SafetyManager into SafetyTraining.
-- These rows are catalog metadata only; they do not assert that an equivalent online delivery path exists.

with catalog(code,title,minutes,requires_presence) as (
  values
    ('lav_basso','Formazione Lavoratori - Rischio Basso',480,false),
    ('lav_medio','Formazione Lavoratori - Rischio Medio',720,false),
    ('lav_alto','Formazione Lavoratori - Rischio Alto',960,false),
    ('dl_base','Datore di Lavoro - Corso Base (16h)',960,false),
    ('dl_spp_comune','DL SPP - Modulo Comune (Senza Rischio Specifico) (8h)',480,false),
    ('dl_spp_agri','DL SPP - Modulo Comune + Agricoltura/Zootecnica (24h)',1440,false),
    ('dl_spp_pesca','DL SPP - Modulo Comune + Pesca (20h)',1200,false),
    ('dl_spp_costruzioni','DL SPP - Modulo Comune + Costruzioni (24h)',1440,false),
    ('dl_spp_chimico','DL SPP - Modulo Comune + Chimico-Petrolchimico (24h)',1440,false),
    ('preposto','Preposto Vigilanza Attiva (12h)',720,false),
    ('dirigente','Dirigente Sicurezza (12h)',720,false),
    ('mod_cantieri','Modulo Aggiuntivo Cantieri (DL/Dirigente) (6h)',360,false),
    ('amb_confinati','Ambienti Sospetti Inquinamento o Confinati (12h)',720,true),
    ('attr_carrelli_ind','Carrelli Elevatori Industriali Semoventi (12h)',720,true),
    ('attr_carrelli_all','Carrelli Elev. Ind + Telescopici + Rotativi (16h)',960,true),
    ('attr_ple','Piattaforme Lavoro Elevabili PLE (10h)',600,true),
    ('attr_mmt_esc','Macchine Movimento Terra/Escavatori Idraulici (10h)',600,true),
    ('attr_mmt_all','Macchine Movimento Terra (Esc+Pale+Terne) (16h)',960,true),
    ('attr_gru_autocarro','Gru per Autocarro (12h)',720,true),
    ('attr_gru_torre','Gru a Torre rotazione basso e alto (14h)',840,true),
    ('attr_pompe','Pompe per Calcestruzzo (14h)',840,true),
    ('attr_trattori','Trattori Agricoli o Forestali (8h)',480,true),
    ('attr_crf','Macchina agricola raccoglifrutta CRF (8h)',480,true),
    ('attr_cmm','Caricatori per movimentazione materiali CMM (8h)',480,true),
    ('attr_carroponte_10h','Carroponte / Gru a cavalletto - una tipologia comando (10h)',600,true),
    ('attr_carroponte_all_11h','Carroponte / Gru a cavalletto - tutte le tipologie comando (11h)',660,true),
    ('lav_quota','Lavori in Quota e DPI 3° Categoria (8h)',480,true),
    ('rls','Rappresentante Lavoratori Sicurezza RLS (32h)',1920,false),
    ('primo_soccorso_12h','Addetto al Primo Soccorso (Gruppo B/C) - 12h',720,true),
    ('antincendio_liv2','Addetto Emergenze e Antincendio (Livello 2) - 8h',480,true),
    ('agg_lav','Aggiornamento Lavoratori (6h)',360,false),
    ('agg_prep','Aggiornamento Preposto (6h) - Biennale',360,false),
    ('agg_dir','Aggiornamento Dirigente (6h)',360,false),
    ('agg_dl','Aggiornamento Datore di Lavoro (6h)',360,false),
    ('agg_dl_spp','Aggiornamento DL SPP (Ex RSPP) (8h)',480,false),
    ('agg_attr_carrelli_ind_4h','Aggiornamento Carrelli Elevatori Industriali Semoventi (4h)',240,true),
    ('agg_attr_carrelli_all_4h','Aggiornamento Carrelli elevatori industriali + telescopici + rotativi (4h)',240,true),
    ('agg_attr_ple_4h','Aggiornamento Piattaforme di Lavoro Elevabili PLE (4h)',240,true),
    ('agg_attr_mmt_esc_4h','Aggiornamento Macchine movimento terra / escavatori idraulici (4h)',240,true),
    ('agg_attr_mmt_all_4h','Aggiornamento Macchine movimento terra (escavatori + pale + terne) (4h)',240,true),
    ('agg_attr_gru_autocarro_4h','Aggiornamento Gru per autocarro (4h)',240,true),
    ('agg_attr_gru_torre_4h','Aggiornamento Gru a torre rotazione basso e alto (4h)',240,true),
    ('agg_attr_pompe_4h','Aggiornamento Pompe per calcestruzzo (4h)',240,true),
    ('agg_attr_trattori_4h','Aggiornamento Trattori agricoli o forestali (4h)',240,true),
    ('agg_attr_crf_4h','Aggiornamento Macchina agricola raccoglifrutta CRF (4h)',240,true),
    ('agg_attr_cmm_4h','Aggiornamento Caricatori per movimentazione materiali CMM (4h)',240,true),
    ('agg_attr_carroponte_10h_4h','Aggiornamento Carroponte / gru a cavalletto - una tipologia comando (4h)',240,true),
    ('agg_attr_carroponte_all_11h_4h','Aggiornamento Carroponte / gru a cavalletto - tutte le tipologie comando (4h)',240,true),
    ('agg_spazi_confinati_4h','Aggiornamento ambienti sospetti di inquinamento o confinati (4h)',240,true),
    ('agg_primo_soccorso_4h','Aggiornamento Primo Soccorso (Gr. B/C) - 4h',240,true),
    ('agg_antincendio_liv2_5h','Aggiornamento Antincendio (Livello 2) - 5h',300,true),
    ('agg_rls_4h','Aggiornamento RLS (4h - Imprese 15-50 dip.)',240,false),
    ('agg_rls_8h','Aggiornamento RLS (8h - Imprese >50 dip.)',480,false)
)
insert into public.integration_course_catalog(
  source_system,external_course_code,title,nominal_minutes,delivery_status,metadata,last_seen_at
)
select
  'safetymanager',code,title,minutes,
  case
    when code='rls' then 'ready'
    when code='antincendio_liv2' then 'hybrid'
    else 'needs_configuration'
  end,
  jsonb_build_object('requires_presence',requires_presence,'catalog_seed','SafetyManager DB_CORSI'),
  now()
from catalog
on conflict (source_system,external_course_code) do update
set title=excluded.title,
    nominal_minutes=excluded.nominal_minutes,
    metadata=public.integration_course_catalog.metadata || excluded.metadata,
    last_seen_at=now(),
    updated_at=now();
