'use strict';
(async function(){
  const P=PointsWalk,store=P.createStore(localStorage),$=id=>document.getElementById(id),params=new URLSearchParams(location.search);
  let q,walkId,selected=null;
  function message(text,ok){$('msg').textContent=text;$('msg').className='msg '+(ok?'ok':'err');}
  function lock(){for(const e of document.querySelectorAll('button,input'))e.disabled=true;}
  function showPlayer(name){$('nameBox').hidden=true;$('nameLine').textContent='Spelarnamn: '+name;$('nameLine').hidden=false;}
  try{
    const state=store.ensure(),encoded=new URLSearchParams(location.hash.slice(1)).get('q');
    walkId=params.get('walk')||'sample';if(!/^[a-zA-Z0-9_-]{1,100}$/.test(walkId))throw Error('Ogiltig promenad i länken.');
    if(encoded)q=P.decodeQuestion(encoded);
    else{
      q=state.questions.find(item=>item.id===params.get('id'));
      if(!q){const response=await fetch('questions.json');if(!response.ok)throw Error('Kunde inte ladda frågorna.');q=P.questions(await response.json()).find(item=>item.id===params.get('id'));}
    }
    if(!q||(params.get('id')&&q.id!==params.get('id')))throw Error('Frågan hittades inte. Kontakta arrangören.');
    $('qTitle').textContent=q.text;$('btn1').textContent='1 — '+q.a1;$('btnX').textContent='X — '+q.ax;$('btn2').textContent='2 — '+q.a2;
    $('scoresLink').href='scoreboard.html?walk='+encodeURIComponent(walkId);
    if(state.player)showPlayer(state.player);
    if(state.player&&store.hasAnswer(walkId,q.id,state.player)){message('Du har redan svarat på denna fråga.',true);lock();return;}
    for(const e of document.querySelectorAll('button'))e.disabled=false;
  }catch(error){$('qTitle').textContent='Kunde inte öppna frågan';message(error.message,false);lock();return;}
  for(const button of document.querySelectorAll('[data-choice]'))button.onclick=()=>{
    selected=button.dataset.choice;for(const b of document.querySelectorAll('[data-choice]')){b.classList.toggle('sel',b===button);b.setAttribute('aria-pressed',String(b===button));}$('msg').className='msg';
  };
  $('btnClear').onclick=()=>{selected=null;for(const b of document.querySelectorAll('[data-choice]')){b.classList.remove('sel');b.setAttribute('aria-pressed','false');}};
  $('btnSubmit').onclick=()=>{
    try{
      if(!selected)throw Error('Välj 1, X eller 2.');
      const player=store.read().player||$('nameInput').value.trim();if(!player)throw Error('Skriv ditt namn.');
      store.answer(walkId,q,player,selected);showPlayer(player);message('Svar sparat på den här enheten!',true);lock();
    }catch(error){message(error.message,false);}
  };
})();
