/* SafetyTraining v45.3 — read-only Learning Unit explorer (admin/docente only). */
(() => {
  'use strict';
  const normalize=value=>String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('it');
  function mount(root,modules){
    if(!root||root.querySelector('.v45-library-toolbar'))return;
    const sections=[...root.querySelectorAll('.library-module')];
    const records=[];
    sections.forEach((section,mi)=>{
      const module=modules[mi]||{},units=Array.isArray(module.units)?module.units:[];
      const details=[...section.querySelectorAll('.library-unit')];
      units.forEach((unit,i)=>{
        const detail=details[i];if(!detail)return;
        const content=JSON.stringify(unit.content||{});
        records.push({section,detail,text:normalize([module.title,unit.title,unit.summary,unit.source_group,content].join(' '))});
      });
      const heading=section.querySelector('h2');
      if(heading){
        const count=document.createElement('span');
        count.className='v45-library-module-count';
        count.textContent=details.length+' unità';
        heading.appendChild(count);
        section.dataset.libraryCount=String(details.length);
      }
    });
    if(!records.length)return;
    const toolbar=document.createElement('section');
    toolbar.className='v45-library-toolbar';
    toolbar.setAttribute('aria-label','Strumenti Learning Unit');
    toolbar.innerHTML='<label class="v45-library-label" for="libraryUnitSearch">Cerca nelle Learning Unit<input id="libraryUnitSearch" type="search" autocomplete="off" placeholder="Titolo, argomento, procedura o normativa…"></label><div class="v45-library-actions"><button type="button" data-library-expand>Apri tutte</button><button type="button" data-library-collapse>Chiudi tutte</button><button type="button" data-library-clear>Ripristina</button></div><p class="v45-library-status" id="libraryUnitCount" role="status" aria-live="polite"></p><p class="v45-library-no-results" id="libraryUnitEmpty" hidden>Nessuna Learning Unit corrisponde alla ricerca.</p>';
    sections[0].before(toolbar);
    const search=toolbar.querySelector('#libraryUnitSearch');
    const count=toolbar.querySelector('#libraryUnitCount');
    const empty=toolbar.querySelector('#libraryUnitEmpty');
    const expand=toolbar.querySelector('[data-library-expand]');
    const collapse=toolbar.querySelector('[data-library-collapse]');
    const clear=toolbar.querySelector('[data-library-clear]');
    function refresh(){
      const query=normalize(search.value.trim());
      let matches=0;
      const firstOpen=new Set();
      const perSection=new Map();
      for(const entry of records){
        const visible=!query||entry.text.includes(query);
        entry.detail.hidden=!visible;
        if(visible){
          matches++;
          perSection.set(entry.section,(perSection.get(entry.section)||0)+1);
          if(query&&!firstOpen.has(entry.section)){
            entry.detail.open=true;
            firstOpen.add(entry.section);
          }
        }
      }
      for(const section of sections){
        const visible=perSection.get(section)||0;
        section.hidden=visible===0;
        const badge=section.querySelector('.v45-library-module-count');
        if(badge)badge.textContent=visible+' / '+section.dataset.libraryCount+' unità';
      }
      count.textContent=matches+' di '+records.length+' Learning Unit visibili';
      empty.hidden=matches!==0;
      expand.disabled=collapse.disabled=matches===0;
      clear.disabled=!query;
    }
    search.addEventListener('input',refresh);
    expand.addEventListener('click',()=>{records.filter(x=>!x.detail.hidden).forEach(x=>{x.detail.open=true;});});
    collapse.addEventListener('click',()=>{records.filter(x=>!x.detail.hidden).forEach(x=>{x.detail.open=false;});});
    clear.addEventListener('click',()=>{search.value='';refresh();search.focus();});
    refresh();
  }
  window.SAFETY_LIBRARY_UX={mount};
})();
