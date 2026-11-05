const { test } = require('node:test');
const assert = require('node:assert/strict');
const P = require('../pointswalk.js');
const q = {id:'q_test',text:'Åtta ben?',a1:'Sex',ax:'Åtta',a2:'Tio',correct:'X'};
function store() {const map=new Map();return P.createStore({getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v)});}
test('Unicode question links preserve the project path and work without browser question storage',()=>{
  const url=new URL(P.questionLink('https://example.test/pointswalk-pages/index.html',q,'walk_test'));
  assert.equal(url.pathname,'/pointswalk-pages/question.html');
  assert.deepEqual(P.decodeQuestion(new URLSearchParams(url.hash.slice(1)).get('q')),q);
});
test('scores normalize 1/X/2, reject duplicate answers, and separate walks',()=>{
  const s=store();s.ensure();s.answer('walk_one',q,'Åsa','×');
  assert.throws(()=>s.answer('walk_one',q,'Åsa','2'),/already answered/);
  s.answer('walk_two',q,'Åsa','2');
  assert.deepEqual(P.scores(s.read().submissions,'walk_one'),[{name:'Åsa',correct:1,answered:1}]);
});
test('multi-device results merge idempotently; malformed batches cannot partially import',()=>{
  const a=store(),b=store(),organizer=store();
  a.ensure();b.ensure();organizer.ensure();a.answer('walk_one',q,'Åsa','X');b.answer('walk_one',q,'Bo','2');
  assert.equal(organizer.importResults([a.exportResults(),b.exportResults()]),2);
  assert.equal(organizer.importResults([a.exportResults()]),0);
  const before=organizer.exportResults();
  assert.throws(()=>organizer.importResults([a.exportResults(),{format:'pointswalk-results',version:1,submissions:[{}]}]));
  assert.deepEqual(organizer.exportResults().submissions,before.submissions);
});
test('question imports validate before replacing data; deleting stays deleted',()=>{
  const s=store();s.ensure();s.setQuestions([q]);
  assert.throws(()=>s.setQuestions([{...q,correct:'3'}]));assert.equal(s.read().questions.length,1);
  s.setQuestions([]);assert.equal(s.read().initialized,true);assert.deepEqual(s.read().questions,[]);
});
test('CSV protects formula-like player names and quotes commas',()=>{
  const csv=P.csv([{name:'=HYPERLINK("bad")',correct:1,answered:1},{name:'A,B',correct:0,answered:1}]);
  assert.match(csv,/"'=HYPERLINK\(""bad""\)"/);assert.match(csv,/"A,B"/);
});
test('corrupted saved data and storage failures are reported rather than silently wiped',()=>{
  const broken=P.createStore({getItem:()=>'{bad',setItem:()=>{throw Error('do not write');}});
  assert.throws(()=>broken.ensure(),/cannot be read/);
  const full=P.createStore({getItem:()=>null,setItem:()=>{throw Error('full');}});
  assert.throws(()=>full.ensure(),/Could not save/);
});
