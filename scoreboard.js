'use strict';
(function(){
  const P=PointsWalk,store=P.createStore(localStorage),$=id=>document.getElementById(id);
  const status=text=>{$('status').textContent=text;};
  function render(){
    const state=store.ensure(),previous=$('walkFilter').value||new URLSearchParams(location.search).get('walk');
    const walks=[...new Set([state.walkId,...state.submissions.map(s=>s.walkId)])];
    $('walkFilter').replaceChildren(...walks.map(walk=>{const option=document.createElement('option');option.value=walk;option.textContent=walk===state.walkId?'This device’s walk':walk;return option;}));
    if(walks.includes(previous)&&state.submissions.some(s=>s.walkId===previous))$('walkFilter').value=previous;
    else if(state.submissions.length)$('walkFilter').value=state.submissions[state.submissions.length-1].walkId;
    const rows=P.scores(state.submissions,$('walkFilter').value);$('tbody').replaceChildren();
    rows.forEach((r,i)=>{const tr=document.createElement('tr');for(const v of [i+1,r.name,r.correct,r.answered,Math.round(r.correct/r.answered*100)+'%']){const td=document.createElement('td');td.textContent=v;tr.append(td);}$('tbody').append(tr);});
    $('meta').textContent=rows.length?'Players: '+rows.length+' · Scores on this device':'No answers saved for this walk on this device.';
  }
  $('btnRefresh').onclick=()=>{try{render();}catch(error){status(error.message);}};
  $('walkFilter').onchange=render;
  $('btnExportJson').onclick=()=>P.download(JSON.stringify(store.exportResults(),null,2),'pointswalk-results.json','application/json');
  $('btnExportCsv').onclick=()=>P.download(P.csv(P.scores(store.read().submissions,$('walkFilter').value)),'pointswalk-scores.csv','text/csv;charset=utf-8');
  $('btnImportJson').onclick=()=>$('resultsFile').click();
  $('resultsFile').onchange=async e=>{
    try{
      const values=[];for(const file of e.target.files){if(file.size>10000000)throw Error('Results file is too large.');values.push(JSON.parse(await file.text()));}
      const added=store.importResults(values);render();status('Imported '+added+' new answers. Existing answers were kept.');
    }catch(error){status(error.message);}finally{e.target.value='';}
  };
  $('btnReset').onclick=()=>{if(confirm('Delete ALL scores stored on this device? Export first to keep them. Other devices are unaffected.')){store.resetScores();render();status('Scores reset on this device.');}};
  try{render();}catch(error){status(error.message);}
})();
