/* SafetyTraining v42: local navigation bookmark. NOT attendance or accredited learner progress. */
(()=>{'use strict';
const PREFIX='safetyDeckBookmarkV42:';
const actor=()=>String(window.SAFETY_CLOUD?.state?.user?.id||'guest');
const key=course=>PREFIX+encodeURIComponent(actor())+':'+encodeURIComponent(String(course?.id||''));
const version=course=>String(course?.db_version??course?.version_number??'');
const storage=()=>{try{return window.localStorage||localStorage;}catch{return null;}};
function save(course,slides,index){
 const indexNum=Number(index);
 if(!course?.id||!Array.isArray(slides)||!slides.length||!Number.isInteger(indexNum)||indexNum<0||indexNum>=slides.length)return false;
 const current=slides[indexNum];
 const record={courseId:String(course.id),version:version(course),index:indexNum,uid:String(current?.uid||''),total:slides.length,savedAt:Date.now()};
 try{storage()?.setItem(key(course),JSON.stringify(record));return !!storage();}catch{return false;}
}
function has(course){
 if(!course?.id)return false;
 try{const item=JSON.parse(storage()?.getItem(key(course))||'null');
  return !!(item&&item.courseId===String(course.id)&&item.version===version(course)&&Number.isInteger(item.index)&&item.index>=0);
 }catch{return false;}
}
function read(course,slides){
 if(!course?.id||!Array.isArray(slides)||!slides.length)return null;
 let data;
 try{data=JSON.parse(storage()?.getItem(key(course))||'null');}catch{return null;}
 if(!data||data.courseId!==String(course.id)||data.version!==version(course))return null;
 if(!Number.isInteger(data.index)||data.index<0||!Number.isFinite(data.savedAt))return null;
 // A stable UID protects against reordered/expanded decks.
 let index=data.uid?slides.findIndex(s=>s?.uid===data.uid):-1;
 if(index<0&&data.total===slides.length&&data.index<slides.length&&!data.uid)index=data.index;
 if(index<0||index>=slides.length)return null;
 return {index,number:index+1,total:slides.length,title:String(slides[index]?.title||''),savedAt:data.savedAt};
}
function clear(course){try{storage()?.removeItem(key(course));return true;}catch{return false;}}
window.SAFETY_DECK_BOOKMARK_V42={save,read,has,clear};
})();