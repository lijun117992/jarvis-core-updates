const assert=require('assert/strict'),fs=require('fs'),path=require('path'),vm=require('vm');
const parser=require('@babel/parser'),core=require('../src/CompanionCore.js');
const app=fs.readFileSync(path.join(__dirname,'../src/app.js'),'utf8'),tree=parser.parse(app,{plugins:['jsx']});
let count=0;function test(name,fn){fn();count++;console.log('PASS '+name);}
const base=[{name:'原男声',id:'voice-a'},{name:'原女声',id:'voice-b'}];
test('newline ID import tolerates BOM, CRLF, blanks and comment lines',()=>{const p=core.planFishImport(base,'\uFEFFvoice-c\r\n\r\n# comment\r\nvoice-d',false);assert.equal(p.added,2);assert.equal(p.items.length,4);assert.equal(p.errors.length,0);});
test('named import accepts comma, fullwidth comma and tab; spaces in names preserved',()=>{const p=core.planFishImport([],'温柔 男声,voice-a\n女声，voice-b\n少年\tvoice-c',false);assert.deepEqual(p.items.map(v=>v.name),['温柔 男声','女声','少年']);});
test('JSON accepts both string IDs and name/id objects',()=>{const p=core.planFishImport([],JSON.stringify(['voice-a',{id:'voice-b',name:'明朗'}]),false);assert.equal(p.added,2);assert.equal(p.items[1].name,'明朗');});
test('existing and within-batch duplicates counted; first occurrence wins',()=>{const p=core.planFishImport(base,'新名,voice-a\n新声,voice-c\n后名,voice-c',false);assert.equal(p.duplicates,2);assert.equal(p.added,1);assert.equal(p.items[0].name,'原男声');assert.equal(p.items[2].name,'新声');});
test('explicit overwrite renames existing ID but blank names never erase labels',()=>{const p=core.planFishImport(base,'新名,voice-a\nvoice-b',true);assert.equal(p.updated,1);assert.equal(p.duplicates,1);assert.equal(p.items[1].name,'原女声');});
test('invalid rows are reported without leaking accidental key contents',()=>{const p=core.planFishImport([], 'voice-a\n名称,https://example.test/voice\nsk-not-a-voice\na,b,c',false);assert.equal(p.added,1);assert.equal(p.errors.length,3);assert.equal(p.errors[0].row,2);assert(!JSON.stringify(p.errors).includes('sk-not-a-voice'));});
test('malformed JSON, non-array JSON, empty and excessive input fail without mutations',()=>{for(const raw of['','[{bad}]','{"id":"voice-a"}','x'.repeat(200001)])assert.throws(()=>core.planFishImport(base,raw,false));assert.throws(()=>core.planFishImport(base,'a\n'.repeat(2001),false));assert.deepEqual(base,[{name:'原男声',id:'voice-a'},{name:'原女声',id:'voice-b'}]);});
test('preview never mutates original records',()=>{const before=JSON.stringify(base);const p=core.planFishImport(base,'改名,voice-a',true);p.items[0].name='changed again';assert.equal(JSON.stringify(base),before);});
test('remove handles selected, all, none and unknown IDs without mutating original',()=>{assert.deepEqual(core.removeFishVoices(base,['voice-a']),[base[1]]);assert.equal(core.removeFishVoices(base,['voice-a','voice-b']).length,0);assert.deepEqual(core.removeFishVoices(base,[]),base);assert.deepEqual(core.removeFishVoices(base,['missing']),base);assert.equal(base.length,2);});
test('batch renaming follows list order and never changes IDs',()=>{const result=core.renameFishVoices(base,['voice-b','voice-a'],'收藏');assert.deepEqual(result,[{name:'收藏 1',id:'voice-a'},{name:'收藏 2',id:'voice-b'}]);assert.equal(base[0].name,'原男声');assert.throws(()=>core.renameFishVoices(base,[],' '));});
function makeRuntime(){
 const storage={},state={voice:'voice-a',raw:'新声,voice-c',overwrite:false,enabled:false,report:'',confirm:null};
 const env={Companion:core,fishVoicePresets:JSON.parse(JSON.stringify(base)),selectedFishIds:['voice-a'],fishImportPlan:null,
 C:{voice:'voice-a',provider:'fish',key:'test-key'},updatingFishList:false,
 ui:{voice:{text:()=>state.voice,setText:v=>state.voice=v},fishVoiceName:{setText:()=>{}},voiceBatchInput:{text:()=>state.raw},voiceImportOverwrite:{isChecked:()=>state.overwrite},applyVoiceImport:{setEnabled:v=>state.enabled=v},voiceImportReport:{setText:v=>state.report=v}},
 store:{put:(k,v)=>storage[k]=JSON.parse(JSON.stringify(v)),get:(k,d)=>Object.prototype.hasOwnProperty.call(storage,k)?JSON.parse(JSON.stringify(storage[k])):d,remove:k=>delete storage[k]},
 renderFishVoiceList:()=>{},renderFishManagerRows:()=>{},status:()=>{},safeError:String,
 confirmFishOperation:(title,message,fn)=>state.confirm=fn};
 const box=vm.createContext(env);
 const names=['backupFishVoices','commitFishVoiceList','previewFishImport','applyFishImport','deleteSelectedFishVoices','undoFishVoiceList'];
 vm.runInContext(names.map(name=>{const n=tree.program.body.find(n=>n.type==='FunctionDeclaration'&&n.id.name===name);return app.slice(n.start,n.end);}).join('\n'),box);
 return {box,state,storage};
}
test('preview writes no storage; applying merges and backs up original selection',()=>{const {box:b,state:s,storage}=makeRuntime();b.previewFishImport();assert.equal(Object.keys(storage).length,0);assert(s.enabled);b.applyFishImport();assert.equal(storage.fishVoicePresetsV45.length,3);assert.equal(storage.fishVoiceUndoV47.items.length,2);assert.equal(storage.fishVoiceUndoV47.voiceId,'voice-a');assert.equal(b.C.key,'test-key');});
test('edited paste, changed overwrite policy or changed base invalidates preview',()=>{for(const change of[(b,s)=>s.raw+='\nvoice-d',(b,s)=>s.overwrite=true,(b,s)=>b.fishVoicePresets.push({name:'late',id:'voice-z'})]){const {box:b,state:s,storage}=makeRuntime();b.previewFishImport();change(b,s);b.applyFishImport();assert.equal(Object.keys(storage).length,0);assert.equal(s.enabled,false);}});
test('delete requires explicit callback and clears selected ID; undo restores on restart',()=>{const {box:b,state:s,storage}=makeRuntime();b.deleteSelectedFishVoices();assert.equal(b.fishVoicePresets.length,2);assert.equal(Object.keys(storage).length,0);assert.equal(typeof s.confirm,'function');s.confirm();assert.equal(storage.fishVoicePresetsV45.length,1);assert.equal(storage.voiceId,'');assert.equal(b.C.voice,'');b.fishVoicePresets=JSON.parse(JSON.stringify(storage.fishVoicePresetsV45));b.undoFishVoiceList();assert.equal(storage.fishVoicePresetsV45.length,2);assert.equal(storage.voiceId,'voice-a');assert.equal(b.C.voice,'voice-a');assert.equal(storage.fishVoiceUndoV47,undefined);});
test('stale delete confirmation refuses to change newer list',()=>{const {box:b,state:s,storage}=makeRuntime();b.deleteSelectedFishVoices();b.fishVoicePresets.push({name:'late',id:'voice-z'});assert.throws(()=>s.confirm(),/名单已变化/);assert.equal(Object.keys(storage).length,0);});
test('deleting another candidate keeps the active ID and does not alter an audio snapshot',()=>{const {box:b,state:s,storage}=makeRuntime();const activePlayback={voice:b.C.voice};b.selectedFishIds=['voice-b'];b.deleteSelectedFishVoices();s.confirm();assert.equal(storage.voiceId,'voice-a');assert.equal(activePlayback.voice,'voice-a');});
const root=path.resolve(__dirname,'..');fs.mkdirSync(path.join(root,'.work'),{recursive:true});
fs.writeFileSync(path.join(root,'.work/voice-batch-verification.json'),JSON.stringify({tests:count,passed:count,nativeAndroid:'NOT RUN',userData:'synthetic only'},null,2));
console.log(JSON.stringify({voiceBatchTests:count,passed:count}));
