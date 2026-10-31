import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
function setup(){
 const window={addEventListener(){}},document={addEventListener(){},body:{classList:{contains(){return false}}},querySelector(){return null}};
 runInNewContext(read('apps/training/teacher-equipment-cases-v46-3.js'),{window});
 runInNewContext(read('apps/training/lesson-enrichment-v46-4.js'),{window,document,location:{hash:''}});
 return window;
}
const scenarios={
 attr_carrelli_ind:['Comandi, freni e dispositivi di sicurezza','Componenti, montanti e organi di presa','Controlli, manutenzione e procedure operative','Fisica dei carichi, baricentro e stabilità','Fonti di energia, batterie e sistemi di ricarica','Portata, targhette, diagrammi e condizioni di equilibrio','Regole di circolazione e utilizzo in sicurezza','Tipologie di carrelli e principali rischi'],
 attr_gru_autocarro:['Comandi, limitatori e controlli pre-utilizzo','Fisica, stabilità e tabelle di carico','Posizionamento, uso sicuro e segnaletica gestuale','Tipologie, componenti e organi di presa'],
 attr_ple:['Categorie, componenti e caratteristiche delle PLE','Dispositivi di comando, sicurezza e DPI','Procedure operative e salvataggio in emergenza','Rischi, controlli e utilizzo in sicurezza'],
 lav_quota:['Ancoraggi, tirante d’aria, pendolo e percorso di caduta','Imbracature, connettori, cordini e dispositivi: controllo pre-uso','Lavoro in quota: scelta delle misure e gerarchia di protezione','Movimento protetto, transizioni e mantenimento del collegamento','Scenario operativo: accesso, lavoro, interferenze e chiusura','Sospensione, emergenza e piano di recupero','Trattenuta, posizionamento e arresto caduta: sistemi e limiti','Vestizione, regolazione e prova dei DPI'],
 lav_alto:['Rumore e vibrazioni nel verde','Sostanze e rifiuti sconosciuti','Prevenzione e protezione']
};
const expected={attr_carrelli_ind:6,attr_gru_autocarro:4,attr_ple:3,lav_quota:4,lav_alto:1};
test('v46.4 matches real published course unit titles without inventing a match for unrelated lessons',()=>{
 const window=setup(),api=window.SAFETY_LESSON_ENRICHMENT_V46_4;
 for(const [id,titles] of Object.entries(scenarios)){
  const c={id,db_status:'published',presentation_generated_from_db:true,metadata:{}};
  let count=0;
  for(const title of titles){
   const result=api.forTopic(c,{id:title,title,db_backed:true});
   if(result){
    count++;
    assert.ok(existsSync(new URL('../apps/training/'+result.src,import.meta.url)),id+': '+result.src);
    assert.ok(result.source.url.startsWith('https://www.inail.it/'));
   }
  }
  assert.equal(count,expected[id],'Course matching coverage for '+id);
 }
});
test('v46.4 matches do not overwrite original course content, assessment or program metadata',()=>{
 const app=read('apps/training/app.js');
 assert.ok(app.includes('SAFETY_LESSON_ENRICHMENT_V46_4?.renderForTopic?.(c,t)'));
 assert.ok(app.includes('const mins=allocateSlideMinutes(t.minutes,projectedSlides.map(x=>x.weight))'));
 assert.match(read('apps/training/lesson-enrichment-v46-4.js'),/presentation_generated_from_db===true/);
 assert.doesNotMatch(read('apps/training/lesson-enrichment-v46-4.js'),/active_seconds|enrollment|quiz\.correct|\.rpc\(/);
 const source=read('apps/training/teacher-equipment-cases-v46-3.js');
 assert.match(source,/gp02-forklift-battery/);
 assert.match(source,/gp04-stabilizzatori-gru/);
 assert.match(source,/gp02-ppe-harness-check/);
});
