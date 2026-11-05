(function(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.PointsWalk = api;
})(globalThis, function() {
  'use strict';
  const STORAGE_KEY = 'pointswalk.pages.v1';
  function text(v, max, label) {
    if (typeof v !== 'string' || !v.trim() || v.length > max) throw Error('Invalid ' + label + '.');
    return v.trim().normalize('NFC');
  }
  function id(v) {
    if (typeof v !== 'string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(v)) throw Error('Invalid ID.');
    return v;
  }
  function choice(v) {
    const s = String(v ?? '').trim().toUpperCase().replace(/[×✕❌]/g, 'X');
    if (!['1','X','2'].includes(s)) throw Error('Choose 1, X or 2.');
    return s;
  }
  function question(q) {
    if (!q || typeof q !== 'object') throw Error('Invalid question.');
    return {id:id(q.id),text:text(q.text,1000,'question'),a1:text(q.a1,300,'answer'),ax:text(q.ax,300,'answer'),a2:text(q.a2,300,'answer'),correct:choice(q.correct)};
  }
  function questions(values) {
    if (!Array.isArray(values) || values.length > 200) throw Error('Expected up to 200 questions.');
    const result = values.map(question);
    if (new Set(result.map(q=>q.id)).size !== result.length) throw Error('Question IDs must be unique.');
    return result;
  }
  function submission(s) {
    if (!s || typeof s.correct !== 'boolean' || typeof s.ts !== 'string' || !Number.isFinite(Date.parse(s.ts))) throw Error('Invalid result.');
    return {walkId:id(s.walkId),questionId:id(s.questionId),player:text(s.player,80,'player name'),choice:choice(s.choice),correct:s.correct,ts:s.ts};
  }
  function resultKey(s) { return JSON.stringify([s.walkId,s.player,s.questionId]); }
  function resultFile(f) {
    if (!f || f.format !== 'pointswalk-results' || f.version !== 1 || !Array.isArray(f.submissions) || f.submissions.length > 50000) throw Error('Choose a Points Walk results JSON export.');
    return f.submissions.map(submission);
  }
  function randomId() { return 'q_' + globalThis.crypto.randomUUID().replace(/-/g,''); }
  function createStore(storage) {
    function read() {
      const raw = storage.getItem(STORAGE_KEY);
      if (!raw) return {version:1,walkId:'walk_'+randomId(),initialized:false,player:'',questions:[],submissions:[]};
      let s;
      try { s = JSON.parse(raw); } catch { throw Error('Saved data cannot be read. Recover your browser data before resetting.'); }
      if (s.version !== 1 || !Array.isArray(s.submissions)) throw Error('Unsupported saved data.');
      return {version:1,walkId:id(s.walkId),initialized:!!s.initialized,player:s.player?text(s.player,80,'player name'):'',questions:questions(s.questions),submissions:s.submissions.map(submission)};
    }
    function write(s) {
      try { storage.setItem(STORAGE_KEY,JSON.stringify(s)); }
      catch { throw Error('Could not save on this device. Check storage space and browser permissions.'); }
      return s;
    }
    return {
      read,
      ensure() { const s=read(); if (!storage.getItem(STORAGE_KEY)) write(s); return s; },
      setQuestions(values) { const q=questions(values),s=read();s.questions=q;s.initialized=true;return write(s); },
      answer(walk,q,name,selected) {
        q=question(q);name=text(name,80,'player name');selected=choice(selected);
        const s=read(),r=submission({walkId:walk,questionId:q.id,player:name,choice:selected,correct:selected===q.correct,ts:new Date().toISOString()});
        if (s.submissions.some(a=>resultKey(a)===resultKey(r))) throw Error('You have already answered this question.');
        s.player=name;s.submissions.push(r);write(s);return r;
      },
      hasAnswer(walk,q,name) {return read().submissions.some(s=>s.walkId===walk&&s.questionId===q&&s.player===name);},
      exportResults() {return {format:'pointswalk-results',version:1,exportedAt:new Date().toISOString(),submissions:read().submissions};},
      importResults(files) {
        const incoming=files.flatMap(resultFile),s=read(),keys=new Set(s.submissions.map(resultKey));
        let added=0;
        for (const r of incoming) if (!keys.has(resultKey(r))) {s.submissions.push(r);keys.add(resultKey(r));added++;}
        write(s);return added;
      },
      resetScores() {const s=read();s.submissions=[];return write(s);}
    };
  }
  function encodeQuestion(q) {
    const bytes=new TextEncoder().encode(JSON.stringify(question(q)));
    return btoa(Array.from(bytes,b=>String.fromCharCode(b)).join('')).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
  }
  function decodeQuestion(s) {
    if (typeof s!=='string'||s.length>12000||!/^[A-Za-z0-9_-]+$/.test(s)) throw Error('Invalid question link.');
    try {return question(JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0)))));}
    catch {throw Error('Invalid question link.');}
  }
  function questionLink(base,q,walk) {
    const u=new URL('question.html',base);u.searchParams.set('id',question(q).id);u.searchParams.set('walk',id(walk));
    u.hash=new URLSearchParams({q:encodeQuestion(q)}).toString();return u.href;
  }
  function scores(values,walk) {
    const rows=new Map();
    for (const value of values) {
      const s=submission(value);if (s.walkId!==walk) continue;
      const row=rows.get(s.player)||{name:s.player,correct:0,answered:0};
      row.answered++;row.correct+=s.correct?1:0;rows.set(s.player,row);
    }
    return [...rows.values()].sort((a,b)=>b.correct-a.correct||a.answered-b.answered||a.name.localeCompare(b.name));
  }
  function csv(rows) {
    function cell(v) {let s=String(v);if(/^\s*[=+\-@\t\r\n]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';}
    return '\uFEFF'+[['rank','name','correct','answered','percent'],...rows.map((r,i)=>[i+1,r.name,r.correct,r.answered,r.answered?Math.round(r.correct/r.answered*100)+'%':''])].map(row=>row.map(cell).join(',')).join('\r\n');
  }
  function download(content,name,type) {
    const url=URL.createObjectURL(new Blob([content],{type})),a=document.createElement('a');
    a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  return {STORAGE_KEY,choice,question,questions,submission,createStore,randomId,encodeQuestion,decodeQuestion,questionLink,scores,csv,download};
});
