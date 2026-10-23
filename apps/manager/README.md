# SafetyManager Pro — gestionale indipendente

SafetyManager Pro vive nel repository `SafetyManagerPro/SafetyManager` e utilizza il proprio progetto Supabase, separato da SafetyTraining.

SafetyTraining si trova in `SafetyManagerPro/SafetyTraining` e utilizza un secondo progetto Supabase, con proprie identità, aziende, corsisti, corsi, iscrizioni e documenti.

**Nessuna funzione di SafetyManager deve dipendere dal funzionamento di SafetyTraining e viceversa.** L'esportazione JSON da SafetyManager e la relativa importazione in SafetyTraining sono solo opzioni manuali. Non ci sono chiavi o autenticazioni condivise fra i due sistemi.

Nota aggiornata al 23/10/2026: le precedenti indicazioni di architettura v19 sul database condiviso sono superate.
