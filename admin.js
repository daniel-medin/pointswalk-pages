'use strict';
(async function() {
  const P=PointsWalk,store=P.createStore(localStorage),$=id=>document.getElementById(id);
  let selectedId=null;
  const status=m=>{$('status').textContent=m;};
  function clear() {$('questionForm').reset();$('editingId').value='';$('btnAdd').textContent='Add question';}
  function selected() {return store.read().questions.find(q=>q.id===selectedId);}
  function link(q) {return P.questionLink(location.href,q,store.read().walkId);}
  function draw(q) {
    $('liveQR').replaceChildren();selectedId=q?q.id:null;$('btnDownloadQR').disabled=$('btnCopyLink').disabled=!q;
    if(q)try{new QRCode($('liveQR'),{text:link(q),width:240,height:240,correctLevel:QRCode.CorrectLevel.M});}
    catch{status('This question is too long for a QR code. Shorten its text or answers.');}
  }
  function button(label,action,dangerous) {const b=document.createElement('button');b.textContent=label;if(dangerous)b.className='btn-danger';b.onclick=action;return b;}
  function render() {
    const state=store.read();$('statTotal').textContent=state.questions.length;$('list').replaceChildren();
    for(const [i,q] of state.questions.entries()) {
      const card=document.createElement('div');card.className='card listcard';
      const info=document.createElement('div'),h=document.createElement('h3'),answers=document.createElement('p');
      h.textContent=(i+1)+'. '+q.text;answers.textContent='1: '+q.a1+' · X: '+q.ax+' · 2: '+q.a2+' · Correct: '+q.correct;
      const open=document.createElement('a');open.textContent='Open question';open.href=link(q);open.target='_blank';open.rel='noopener';info.append(h,answers,open);
      const actions=document.createElement('div');actions.className='actions';
      actions.append(button('Select QR',()=>draw(q)),button('Edit',()=>{
        $('editingId').value=q.id;$('qText').value=q.text;$('qCorrect').value=q.correct;
        $('a1').value=q.a1;$('ax').value=q.ax;$('a2').value=q.a2;$('btnAdd').textContent='Save question';$('qText').focus();
      }),button('Delete',()=>{
        if(confirm('Delete this question? Existing printed QR codes still contain their original copy.')){
          store.setQuestions(store.read().questions.filter(item=>item.id!==q.id));if(selectedId===q.id)draw(null);render();
        }
      },true));card.append(info,actions);$('list').append(card);
    }
    if(selectedId)draw(selected()||null);
  }
  $('questionForm').onsubmit=e=>{
    e.preventDefault();
    try{
      const q=P.question({id:$('editingId').value||P.randomId(),text:$('qText').value,a1:$('a1').value,ax:$('ax').value,a2:$('a2').value,correct:$('qCorrect').value});
      const items=store.read().questions,existing=items.findIndex(item=>item.id===q.id);
      if(existing===-1)items.push(q);else items[existing]=q;
      store.setQuestions(items);clear();render();draw(q);status('Question saved on this device.');
    }catch(error){status(error.message);}
  };
  $('btnResetForm').onclick=clear;
  $('btnExport').onclick=()=>P.download(JSON.stringify(store.read().questions,null,2),'questions.json','application/json');
  $('btnImport').onclick=()=>$('importFile').click();
  $('importFile').onchange=async e=>{
    try{
      const file=e.target.files[0];if(!file)return;if(file.size>2000000)throw Error('Question file is too large.');
      const items=P.questions(JSON.parse(await file.text()));
      if(!confirm('Replace the questions on this device?'))return;
      store.setQuestions(items);draw(null);clear();render();status('Questions imported.');
    }catch(error){status(error.message);}finally{e.target.value='';}
  };
  $('btnWipe').onclick=()=>{if(confirm('Delete all questions on this device? Scores and other devices are unaffected.')){store.setQuestions([]);clear();draw(null);render();}};
  $('btnCopyLink').onclick=async()=>{try{await navigator.clipboard.writeText(link(selected()));status('Question link copied.');}catch{status('Could not copy. Use Open question instead.');}};
  $('btnDownloadQR').onclick=()=>{
    try{
      const holder=document.createElement('div');new QRCode(holder,{text:link(selected()),width:768,height:768,correctLevel:QRCode.CorrectLevel.M});
      const canvas=holder.querySelector('canvas');if(!canvas)throw Error('QR generation failed.');
      const output=document.createElement('canvas');output.width=output.height=864;
      const ctx=output.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,864,864);ctx.drawImage(canvas,48,48);
      const a=document.createElement('a');a.download='qr_'+selectedId+'.png';a.href=output.toDataURL('image/png');a.click();
    }catch(error){status(error.message);}
  };
  try{
    const state=store.ensure();
    if(!state.initialized){const response=await fetch('questions.json');if(!response.ok)throw Error('Could not load sample questions.');store.setQuestions(await response.json());}
    render();
  }catch(error){status(error.message);}
})();
