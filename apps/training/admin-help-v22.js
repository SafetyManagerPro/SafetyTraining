/* SafetyTraining v22.3.2 — contextual help across administration, additive and read-only. */
(() => {
  'use strict';
  const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const guides={
    'Gestione immagini':{
      title:'Guida · Gestione immagini e filtri',
      steps:[
       'Apri Esplora immagini e scegli Archivio. I filtri avanzati si applicano alle Tavole PDF complete importate, mentre gli altri archivi mantengono la ricerca per tema.',
       'Usa Esaminate per le tavole con analisi visiva registrata (individuale o per gruppo). Solo screening preliminare indica tavole che non hanno ancora una scheda visiva.',
       'Usa Da associare per proposte non attive e Associate per figure effettivamente collocabili nel corso amministrativo, con entrambe le revisioni approvate; nessun filtro concede automaticamente i diritti.',
       'Scegli Corso e, successivamente, Modulo. Gli elenchi provengono dai corsi attivi pubblicati e non congelati. I filtri cercano in tutto l’archivio, non soltanto nelle 24 figure visibili.',
       'Per modificare gli esiti apri Esamina / cambia stato di revisione nella scheda, indicando la motivazione tecnica e i documenti relativi ai diritti.',
       'Se una figura non è pertinente, scegli Escludi dalle presentazioni; usa Ripristina per tornare indietro senza cancellare il file originale.',
       'Usa le frecce Precedenti e Successive per sfogliare il risultato filtrato; la voce Cerca per tema restringe ulteriormente la ricerca.',
       'Nella presentazione apri ⏱ Aula → Controlla figure del corso: filtra per modulo, individua i metadati da rivedere e usa Apri slide. Poi apri ⏱ Aula → Controlla figure slide per verificare il caricamento reale. Usa Guida didattica per leggere note e attività già scritte dal docente; non aggiunge procedure o risposte ai test. Nessuno dei controlli approva pertinenza, autorizzazioni o diritti.'
      ],
      note:'Esaminata ≠ approvata ≠ associata. Le associazioni proposte e le pagine private non vengono pubblicate ai corsisti. Le verifiche tecniche, cliniche e dei diritti restano sotto responsabilità del revisore.'
    },

    'Stampa lezioni':{title:'Guida · Stampa lezioni',steps:['Seleziona un corso e una versione pubblicata.','Verifica che siano presenti tutti i moduli e le Learning Unit.','Stampa da browser oppure scegli Salva in PDF nella finestra di stampa.'],note:'La dispensa non contiene soluzioni dei test e non è un attestato o registro presenze.'},
    'Controllo percorsi':{title:'Guida · Controllo percorsi',steps:['Seleziona l’edizione da esaminare.','Controlla iscrizioni, qualità didattica, frequenze, test ed evidenze.','Riconcilia anomalie e documenti con docente e registri prima di emettere un attestato.'],note:'I dati sono indicativi e limitati dall’accesso RLS. Nessun rilascio automatico di attestati.'},
    'Dashboard':{
      title:'Guida · Dashboard amministrativa',
      steps:['Consulta i contatori di aziende, corsisti, edizioni e iscrizioni.','Per una nuova formazione usa «Avvia percorso»: seleziona azienda, corso, edizione e corsisti senza passare da più sezioni.','Usa le sezioni laterali per manutenzione puntuale, controlli e monitoraggio.'],
      note:'I contatori sono indicatori operativi, non certificano da soli frequenza, verifiche o completamento.'},
    'Organizzazioni':{
      title:'Guida · Organizzazioni',
      steps:['Seleziona l’organizzazione corretta prima di creare anagrafiche o edizioni.','Le organizzazioni separano i dati di amministrazione: controlla sempre il contesto prima di modificare.','Disattiva un’organizzazione soltanto dopo aver valutato gli accessi e i percorsi collegati.'],
      note:'Il ruolo company_admin non è abilitato; non usare questa schermata per ampliare i permessi.'},
    'Aziende':{
      title:'Guida · Aziende',
      steps:['Premi «Nuova azienda» per registrare ragione sociale, P.IVA/CF e codice ATECO.','Per correggere i dati usa «Modifica», senza creare una seconda azienda.','Se un’azienda non è più utilizzata, «Disattiva» la conserva per i percorsi storici.'],
      note:'Eliminazione definitiva non disponibile: sarà ammessa solo dopo verifica server delle dipendenze e delle esigenze di conservazione. La semplice cancellazione può alterare appartenenze e storico.'},
    'Corsisti':{
      title:'Guida · Corsisti',
      steps:['Usa «Nuovo corsista» o il percorso guidato per creare anagrafiche aziendali.','Ricerca per nome, email, codice fiscale o azienda: evita di creare duplicati.','Controlla account e inviti, poi apri le iscrizioni per vedere corso e avanzamento.'],
      note:'«Disattiva» conserva i dati formativi. Un’eventuale eliminazione o richiesta privacy deve valutare iscrizioni, inviti, evidenze e account collegati; non è attivata da questa guida.'},
    'Corsi':{
      title:'Guida · Corsi',
      steps:['Controlla famiglia, durata, governance e versione del corso.','Per costruire o modificare contenuti usa le funzioni editoriali esistenti e i controlli di qualità.','Un corso entra in una nuova edizione soltanto se la versione risulta approvata e pubblicata.'],
      note:'I 27 corsi congelati restano esclusi dalle modifiche e dall’avvio automatico di nuove edizioni.'},
    'Edizioni':{
      title:'Guida · Edizioni',
      steps:['Scegli un corso/versione approvato, organizzazione, azienda e modalità di erogazione.','Imposta lo stato e le date di disponibilità prima di creare l’edizione.','Gestisci i corsisti o chiudi/archivia l’edizione quando non deve più ricevere iscrizioni.'],
      note:'«Disattiva» archivia senza eliminare le iscrizioni. Eliminare fisicamente un’edizione potrebbe cancellare a cascata iscrizioni e storico: la cancellazione non è abilitata.'},
    'Iscrizioni':{
      title:'Guida · Iscrizioni',
      steps:['Seleziona un’edizione aperta e uno o più corsisti compatibili.','Conferma l’iscrizione multipla e controlla lo stato degli inviti di accesso.','Segui progresso, tempo attivo e verifiche: se un’assegnazione non è più valida usa «Revoca».'],
      note:'La revoca conserva il tracciato. La futura eliminazione sarà consentita soltanto per iscrizioni inserite per errore e mai utilizzate, senza eventi, frequenze, prove o evidenze.'},
    'Attività':{
      title:'Guida · Attività',
      steps:['Consulta gli eventi di apprendimento più recenti per individuare accessi e progressi.','Filtra per tipo di evento e risali a corsista, edizione e corso collegati.','Confronta gli eventi con registri e verifiche quando serve una conferma formativa.'],
      note:'Il tempo attivo, da solo, non certifica gli obblighi di frequenza o il completamento del corso.'},
    'Catalogo corsi SafetyManager':{
      title:'Guida · Catalogo SafetyManager',
      steps:['Individua il codice amministrativo del corso nel catalogo collegato.','Controlla che la mappatura punti a un percorso didattico SafetyTraining idoneo.','Usa l’anteprima Learning Unit per verificare la composizione prima della pubblicazione esplicita.'],
      note:'Il catalogo amministrativo non equivale automaticamente a contenuti pubblicati o a un corso erogabile.'},
    'Blueprint corsi e Master Registry':{
      title:'Guida · Blueprint e Master Registry',
      steps:['Il Master Registry collega codici e regole ai modelli di corso.','I Blueprint descrivono strutture riutilizzabili; i moduli sono i contenitori del corso effettivamente assegnato.','Controlla varianti e regole prima di dichiarare completa una struttura.'],
      note:'Gli stati parziali e i percorsi ibridi non devono essere forzati per ottenere una falsa completezza.'},
    'Readiness corsi':{
      title:'Guida · Readiness corsi',
      steps:['Risolvi prima i blocchi strutturali su moduli, verifiche o requisiti pratici.','Poi completa le configurazioni richieste e sottoponi la versione a revisione.','Pubblica solo con un’azione amministrativa esplicita, dopo i controlli.'],
      note:'I corsi congelati o fuori roadmap devono rimanere esclusi dalla finalizzazione automatica.'},
    'Qualità didattica v22':{
      title:'Guida · Qualità didattica',
      steps:['Individua il corso con ricerca e filtri.','Verifica contenuti operativi, scenari specifici, Practice Lab, fonti e percorso di verifica.','Intervieni sui gap reali prima di dichiarare un corso didatticamente completo.'],
      note:'Il punteggio da solo non basta: per il livello Gold servono almeno 85 punti e zero gap.'},
    'Accessi & import':{
      title:'Guida · Accessi e import',
      steps:['Verifica anagrafiche e indirizzi email dei corsisti prima di inviare gli accessi.','Gestisci gli inviti personali e i canali alternativi già disponibili.','Controlla la consegna e il collegamento dell’account, evitando invii duplicati.'],
      note:'Mai trasmettere password tramite WhatsApp o SMS; non registrare token di invito in chiaro.'},
    'Requisiti pratici':{
      title:'Guida · Requisiti pratici',
      steps:['Apri i requisiti e il Practice Lab collegato all’iscrizione.','Compila checklist e osservazioni del docente mantenendo anche note e moduli tradizionali.','Usa la validazione pratica separata solo dopo verifica effettiva della competenza.'],
      note:'La checklist compilata non completa automaticamente l’iscrizione e non sostituisce le evidenze cartacee necessarie.'}
  };
  function helpFor(title){
    const text=String(title||'').trim();
    if(guides[text])return guides[text];
    if(/qualit[aà].*didattica/i.test(text))return guides['Qualità didattica v22'];
    if(/accessi.*import/i.test(text))return guides['Accessi & import'];
    if(/gate|requisit.*pratic|practice lab/i.test(text))return guides['Requisiti pratici'];
    if(/readiness|pubblicabilit/i.test(text))return guides['Readiness corsi'];
    return {title:'Guida · '+(text||'Amministrazione'),steps:[
      'Controlla il titolo della sezione e i filtri prima di effettuare un’operazione.',
      'Usa le azioni esistenti e verifica i dati prima di salvare o confermare.',
      'Per il percorso completo azienda → edizione → corsista → invito usa «Avvia percorso».'],
      note:'Le operazioni irreversibili e le modifiche ai permessi non vengono eseguite dalla guida.'};
  }
  let shownTitle='',open=false;
  function nodes(){
    if(typeof document==='undefined')return {};
    return {button:document.getElementById('adminHelpToggle'),panel:document.getElementById('adminHelpPanel'),
      title:document.getElementById('adminTitle')?.textContent?.trim()||'Dashboard'};
  }
  function paint(){
    const {button,panel,title}=nodes();if(!button||!panel)return;
    const hidden=title==='Avvia percorso'; // The wizard already has step-specific '?'.
    if(shownTitle!==title){shownTitle=title;open=false;}
    button.hidden=hidden;button.setAttribute('aria-expanded',String(open&&!hidden));
    panel.hidden=!open||hidden;
    if(!open||hidden){panel.textContent='';return;}
    const guide=helpFor(title);
    panel.innerHTML='<h2 tabindex="-1" id="adminHelpHeading">'+esc(guide.title)+'</h2><ol>'+
      guide.steps.map(item=>'<li>'+esc(item)+'</li>').join('')+'</ol><p class="admin-help-note">'+esc(guide.note)+'</p>'+
      '<button type="button" data-admin-help-close>Chiudi guida</button>';
  }
  function sync(){paint();}
  function closeHelp(focus=true){
    if(!open)return;
    open=false;paint();if(focus)nodes().button?.focus();
  }
  function toggle(){
    const {button,title}=nodes();if(!button||title==='Avvia percorso')return;
    open=!open;paint();
    if(open)nodes().panel?.querySelector('#adminHelpHeading')?.focus();else button.focus();
  }
  function boot(){
    const shell=document.getElementById('adminShell'),button=shell?.querySelector('#adminHelpToggle');
    if(!shell||!button||shell.dataset.helpV22Bound)return;
    shell.dataset.helpV22Bound='1';
    button.addEventListener('click',toggle);
    shell.querySelector('#adminHelpPanel')?.addEventListener('click',event=>{
      if(event.target.closest('[data-admin-help-close]'))closeHelp();
    });
    shell.addEventListener('keydown',event=>{
      if(event.key==='Escape'&&open&&!document.getElementById('adminModal')){
        event.preventDefault();closeHelp();
      }
    });
    sync();
  }
  window.SAFETY_ADMIN_HELP_RULES_V22={helpFor};
  window.SAFETY_ADMIN_HELP_V22={sync,boot};
  if(typeof document!=='undefined'){
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
    else boot();
  }
})();
