const assert=require('assert/strict'),fs=require('fs'),path=require('path'),vm=require('vm'),parser=require('@babel/parser');
const src=fs.readFileSync(path.join(__dirname,'../src/app.js'),'utf8'),tree=parser.parse(src,{plugins:['jsx']});
function load(names,env){const b=vm.createContext(env);vm.runInContext(names.map(name=>{const f=tree.program.body.find(n=>n.type==='FunctionDeclaration'&&n.id.name===name);assert(f,name);return src.slice(f.start,f.end)}).join('\n'),b);return b;}
let count=0;function test(name,f){f();count++;console.log('PASS '+name);}
test('outside watcher preserves flags, keeps touch non-modal and leaves inside events alone',()=>{
 let listener,updated,queued=[],dismissed=[];const params={flags:8};const root={getLayoutParams:()=>params,setOnTouchListener:f=>listener=f};const win={root:{getRootView:()=>root}};
 const b=load(['watchOutsideCard'],{android:{view:{WindowManager:{LayoutParams:{FLAG_NOT_TOUCH_MODAL:32,FLAG_WATCH_OUTSIDE_TOUCH:262144}},MotionEvent:{ACTION_OUTSIDE:4}},content:{Context:{WINDOW_SERVICE:'window'}}},context:{getSystemService:()=>({updateViewLayout:(v,p)=>updated=[v,p]})},main:f=>queued.push(f),dismissOutsideCard:(w,k)=>dismissed.push([w,k]),status:()=>{throw Error('unexpected fallback')},safeError:String});
 b.watchOutsideCard(win,'editor');assert.equal(params.flags,8|32|262144);assert.equal(updated[0],root);
 for(const action of [0,1,2])assert.equal(listener(root,{getActionMasked:()=>action}),false);
 assert.equal(queued.length,0);assert.equal(listener(root,{getActionMasked:()=>4}),false);assert.equal(dismissed.length,0);queued[0]();assert.deepEqual(dismissed,[[win,'editor']]);
});
test('watcher failure keeps manual close available without breaking the card',()=>{
 let message;const b=load(['watchOutsideCard'],{status:s=>message=s,safeError:String});b.watchOutsideCard({root:{getRootView:()=>{throw Error('unsupported host')}}},'panel');assert(message.includes('仍可点'));
});
test('outside input close preserves draft and hides its keyboard without sending text',()=>{
 const win={input:{text:()=> '尚未发送的草稿',getWindowToken:()=> 'ime'},disableFocus:()=>{win.unfocused=true},close:()=>{win.closed=true}};let hidden,docked=0;
 const b=load(['dismissOutsideCard','closeEditor'],{editor:win,panel:null,editorText:'',android:{content:{Context:{INPUT_METHOD_SERVICE:'ime'}}},context:{getSystemService:()=>({hideSoftInputFromWindow:t=>hidden=t})},scheduleDock:()=>docked++});
 b.dismissOutsideCard(win,'editor');assert.equal(b.editor,null);assert.equal(b.editorText,'尚未发送的草稿');assert.equal(hidden,'ime');assert(win.closed&&win.unfocused);assert.equal(docked,1);
});
test('stale outside event cannot close a replacement editor or reply',()=>{
 let closed=0,cancelled=0;const win={};const b=load(['dismissOutsideCard'],{editor:{},panel:{},listening:true,closeEditor:()=>closed++,closePanel:()=>closed++,stopListening:()=>cancelled++});b.dismissOutsideCard(win,'editor');b.dismissOutsideCard(win,'panel');assert.equal(closed,0);assert.equal(cancelled,0);
});
test('hiding a listening card invalidates recognition callbacks and retains reply text',()=>{
 let cancelled=0,closed=0;const win={close:()=>closed++};const b=load(['dismissOutsideCard','closePanel','stopListening'],{panel:win,editor:null,listening:true,recognitionId:7,recognizer:{cancel:()=>cancelled++,destroy:()=>{}},speechTimer:null,compatRecognition:null,state:'LISTENING',bubbleWanted:true,lastAnswer:'保留全文',scheduleDock:()=>{}});
 b.dismissOutsideCard(win,'panel');assert.equal(b.recognitionId,8);assert.equal(cancelled,1);assert.equal(b.panel,null);assert.equal(b.bubbleWanted,false);assert.equal(b.lastAnswer,'保留全文');assert.equal(closed,1);
});
test('outside reply close keeps existing audio session playing',()=>{
 const win={};let closed=0;const b=load(['dismissOutsideCard'],{panel:win,editor:null,listening:false,speechSession:{serial:12},closePanel:()=>closed++,stopListening:()=>{throw Error('not listening')}});b.dismissOutsideCard(win,'panel');assert.equal(closed,1);assert.equal(b.speechSession.serial,12);
});
test('normal client-error bubble is short; foreground diagnostics remain available; stale errors ignored',()=>{
 const f=tree.program.body.find(n=>n.type==='FunctionDeclaration'&&n.id.name==='startListening');let callback;
 function walk(n){if(!n||typeof n!=='object')return;if(n.type==='ObjectProperty'&&n.key.name==='onError')callback=n.value;for(const v of Object.values(n))if(Array.isArray(v))v.forEach(walk);else if(v&&typeof v==='object')walk(v);}walk(f);assert(callback);
 for(const diagnostic of [false,true]){let answer;const b=vm.createContext({id:3,recognitionId:3,testOnly:diagnostic,main:f=>f(),stopListening:()=>{},recognitionFailure:()=> 'ERROR_CLIENT 完整诊断',status:()=>{},showAnswer:(t,s)=>answer=s});vm.runInContext('var onError='+src.slice(callback.start,callback.end),b);b.onError(5);assert.equal(answer.includes('ERROR_CLIENT'),diagnostic);answer=null;b.recognitionId=4;b.onError(5);assert.equal(answer,null);}
});
test('whitespace-only recognition service is described truthfully',()=>{const b=load(['recognitionFailure'],{android:{provider:{Settings:{Secure:{getString:()=> '  '}}}},context:{getContentResolver:()=>({})}});assert(b.recognitionFailure(5).includes('系统默认，未公开组件名'));});
console.log(JSON.stringify({outsideCardTests:count,passed:count,android:'Outside taps/IME require device acceptance'}));
