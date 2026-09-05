'use client';
import { useEffect, useReducer, useRef, useState } from 'react';
import { Bot, Settings2, Zap, UserRound, BookOpen, RotateCcw, Trophy, ArrowRight } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogContent, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel, AlertDialogFooter } from '@/components/ui/alert-dialog';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import TriviaEditor from './trivia-editor';
import seed from '@/data/trivia.json';
import { isCorrect, type Trivia } from '@/lib/trivia';
import { loadBoard, saveBoard } from '@/lib/board-client';
import { aiProfile, contestants, gameReducer, initialGame, money, type Difficulty } from '@/lib/game-engine';
import { registerTriviaTools } from '@/lib/agent-tools';

export default function Game() {
 const [trivia,setTrivia]=useState<Trivia>(seed),[revision,setRevision]=useState(0),[loaded,setLoaded]=useState(false),[error,setError]=useState('');
 const [game,dispatch]=useReducer(gameReducer,undefined,initialGame);
 const [menu,setMenu]=useState(false),[editor,setEditor]=useState(false),[restart,setRestart]=useState(false),[difficulty,setDifficulty]=useState<Difficulty>('standard');
 const [answer,setAnswer]=useState(''),[seconds,setSeconds]=useState(0),[notice,setNotice]=useState('');
 const latest=useRef({trivia,revision,game,editor});latest.current={trivia,revision,game,editor};
 const saving=useRef(false);
 async function refresh(){setError('');try{const result=await loadBoard();setTrivia(result.trivia);setRevision(result.revision);setLoaded(true);}catch(e){setError((e as Error).message);}}
 useEffect(()=>{void refresh();},[]);
 function saved(board:Trivia,rev:number){setTrivia(board);setRevision(rev);setLoaded(true);setEditor(false);setMenu(false);setNotice('Your board is saved. A fresh game is ready.');dispatch({type:'reset'});}
 useEffect(()=>registerTriviaTools({
  read:()=>({trivia:latest.current.trivia,revision:latest.current.revision}),
  save:async(input,expectedRevision)=>{
    if(saving.current)throw new Error('A save is already in progress.');
    if(latest.current.editor)throw new Error('Close the trivia editor before applying an agent update, to protect unsaved changes.');
    if(expectedRevision!==latest.current.revision)throw new Error('Read the current board before updating it.');
    saving.current=true;try{const result=await saveBoard(input,expectedRevision);saved(result.trivia,result.revision);return {saved:true,revision:result.revision,gameRestarted:true};}finally{saving.current=false;}
  },
 }),[]);
 // One phase owns its timers. Leaving it cancels all outstanding buzzes and answers.
 useEffect(()=>{
  if(menu||editor||restart||!loaded)return;
  const timers:ReturnType<typeof setTimeout>[]=[];
  let interval:ReturnType<typeof setInterval>|undefined;
  const later=(fn:()=>void,ms:number)=>timers.push(setTimeout(fn,ms));
  const countdown=(ms:number,fn:()=>void)=>{const end=Date.now()+ms;setSeconds(Math.ceil(ms/1000));interval=setInterval(()=>setSeconds(Math.max(0,Math.ceil((end-Date.now())/1000))),200);later(fn,ms);};
  if(game.phase==='board'&&game.picker!==0){later(()=>{const available=trivia.categories.flatMap(c=>c.clues.map((q,i)=>({...q,category:c.name,value:(i+1)*200}))).filter(q=>!game.used.includes(q.id));if(available.length)dispatch({type:'pick',clue:available[Math.floor(Math.random()*available.length)]});},1800);}
  if(game.phase==='reading'&&game.active){setAnswer('');countdown(Math.min(12000,Math.max(4000,game.active.question.split(/\s+/).length*280)),()=>dispatch({type:'ready'}));}
  if(game.phase==='buzz'&&game.active){
    countdown(8000,()=>dispatch({type:'expire'}));
    for(const player of [1,2])if(!game.attempted.includes(player))later(()=>dispatch({type:'buzz',player}),aiProfile(player,game.active.value,difficulty).delay+Math.random()*1300);
  }
  if(game.phase==='answer')countdown(15000,()=>dispatch({type:'resolve',correct:false,answer:'(time expired)'}));
  if(game.phase==='ai'&&game.active&&game.contestant!==null){const active=game.active,player=game.contestant;later(()=>{const correct=Math.random()<aiProfile(player,active.value,difficulty).accuracy;const alternatives=trivia.categories.flatMap(c=>c.clues).filter(c=>!isCorrect(c.answer,active));dispatch({type:'resolve',correct,answer:correct?active.answer:(alternatives[Math.floor(Math.random()*alternatives.length)]?.answer??'I don’t know')});},1300);}
  return ()=>{timers.forEach(clearTimeout);if(interval)clearInterval(interval);};
 },[game,menu,editor,restart,loaded,trivia,difficulty]);
 useEffect(()=>{const key=(event:KeyboardEvent)=>{if(event.code==='Space'&&!event.repeat&&game.phase==='buzz'&&!menu&&!editor&&!game.attempted.includes(0)&&!(event.target instanceof HTMLElement&&event.target.closest('input,textarea,[contenteditable="true"]'))){event.preventDefault();dispatch({type:'buzz',player:0});}};window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);},[game.phase,game.attempted,menu,editor]);
 const title=game.phase==='finished'?'That’s a wrap.':game.picker===0?'The board is yours.':`${contestants[game.picker]} is choosing…`;
 const winners=contestants.filter((_,i)=>game.scores[i]===Math.max(...game.scores));
 return <main className="shell">
 <header className="topbar"><div className="brand"><div className="brand-icon"><Zap/></div><div><h1>Trivia Showdown</h1><p>Your seat. Your buzzer.</p></div></div><button className="btn" onClick={()=>setMenu(true)} disabled={!['board','finished'].includes(game.phase)}><Settings2 size={16}/> Game menu</button></header>
 {error&&<div className="notice" role="alert">{error} <button className="btn" onClick={()=>void refresh()}>Try again</button></div>}
 {notice&&<div className="notice" role="status">{notice} <button className="btn" onClick={()=>setNotice('')}>Dismiss</button></div>}
 <section className="roundline"><div><div className="eyebrow">{trivia.title} · Main round</div><h2>{loaded?title:'Getting the board ready…'}</h2></div><p>{game.used.length}/30 clues played · {difficulty[0].toUpperCase()+difficulty.slice(1)} opponents</p></section>
 <div className="board-scroll"><div className="board">{trivia.categories.map(c=><div className="category" key={c.id}>{c.name}</div>)}{[0,1,2,3,4].flatMap(row=>trivia.categories.map(c=>{const clue=c.clues[row],used=game.used.includes(clue.id);return <button className={`clue ${used?'used':''}`} key={clue.id} aria-label={`${c.name}, ${money((row+1)*200)}${used?', played':''}`} disabled={!loaded||used||game.phase!=='board'||game.picker!==0||menu||editor} onClick={()=>{setNotice('');dispatch({type:'pick',clue:{...clue,category:c.name,value:(row+1)*200}});}}>{used?'—':money((row+1)*200)}</button>;}))}</div></div>
 <section className="podiums" aria-label="Contestant scores">{contestants.map((p,i)=><div className={`podium ${i===0?'you':''}`} key={p}><div className="person">{i?<Bot size={18}/>:<UserRound size={18}/>} {p}<span>{i?'AI':'PLAYER'}</span></div><div className="score" aria-live="polite">{money(game.scores[i])}</div><p>{game.contestant===i?'On the buzzer':game.picker===i&&game.phase==='board'?'Choosing the next clue':['Ready for your moment','Thoughtful & steady','Quick & adventurous'][i]}</p></div>)}</section>
 <footer className="foot"><span><span className="dot"/>{game.phase==='board'&&game.picker===0?'Choose any unplayed clue.':'Correct response wins control of the board.'}</span><span>Buzz with <kbd>Space</kbd> · Simulated AI opponents</span></footer>

 <Dialog open={menu} onOpenChange={setMenu}><DialogContent className="modal"><DialogTitle>Game menu</DialogTitle><DialogDescription>Set the challenge, customize the board, or start fresh.</DialogDescription>
 <div className="field"><span id="difficulty-label">Opponent difficulty</span><Select value={difficulty} onValueChange={v=>{if(v)setDifficulty(v as Difficulty);}}><SelectTrigger aria-labelledby="difficulty-label"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="relaxed">Relaxed</SelectItem><SelectItem value="standard">Standard</SelectItem><SelectItem value="expert">Expert</SelectItem></SelectContent></Select></div>
 <p className="muted">Atlas is slower and more accurate. Nova buzzes faster and takes more risks. Harder clues are tougher for both.</p>
 <div className="actions"><button className="btn gold" disabled={!loaded} onClick={()=>{setMenu(false);setEditor(true);}}><BookOpen size={16}/>Edit categories & questions</button><button className="btn" disabled={!loaded} onClick={()=>setRestart(true)}><RotateCcw size={16}/>New game</button></div>
 <div className="result"><strong>How to play</strong><ol className="history"><li>Choose a clue. Everyone gets a few seconds to read it.</li><li>When the buzzer opens, press Space or tap Buzz in.</li><li>You have 15 seconds to type your answer. “What is…” is optional.</li><li>A correct answer adds the clue’s value; a wrong answer subtracts it. Other contestants can try after a miss.</li><li>The last correct contestant picks next. Highest score after 30 clues wins; ties share the win.</li></ol></div>
 <button className="btn" onClick={()=>setMenu(false)}>Return to game</button></DialogContent></Dialog>

 {editor&&<TriviaEditor trivia={trivia} revision={revision} onClose={()=>setEditor(false)} onSaved={saved}/>}
 <AlertDialog open={restart} onOpenChange={setRestart}><AlertDialogContent><AlertDialogTitle>Start a new game?</AlertDialogTitle><AlertDialogDescription>Your scores will reset and all 30 clues will be available again. Your saved categories and questions stay in place.</AlertDialogDescription><AlertDialogFooter><AlertDialogCancel>Keep playing</AlertDialogCancel><AlertDialogAction onClick={()=>{dispatch({type:'reset'});setRestart(false);setMenu(false);}}>New game</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>

 <Dialog open={game.active!==null} onOpenChange={()=>{}}><DialogContent className="modal" showCloseButton={false}><DialogTitle>{game.active?.category} · {money(game.active?.value??0)}</DialogTitle><DialogDescription>Read the clue, then race to the buzzer.</DialogDescription><div className="question-panel"><p className="question-text">{game.active?.question}</p>
 {game.phase==='reading'&&<div className="result" role="status">Read the clue. Buzzers open in <span className="timer">{seconds}s</span></div>}
 {game.phase==='buzz'&&<><button className="btn gold buzzer" disabled={game.attempted.includes(0)} onClick={()=>dispatch({type:'buzz',player:0})}><Zap/>{game.attempted.includes(0)?'Waiting for the other contestants…':'Buzz in · Space'}</button><p className="muted">Buzzers open · <span className="timer">{seconds}s</span></p></>}
 {game.phase==='answer'&&<form onSubmit={e=>{e.preventDefault();if(game.active&&answer.trim())dispatch({type:'resolve',correct:isCorrect(answer,game.active),answer:answer.trim()});}}><label className="field">Your answer · <span className="timer">{seconds}s remaining</span><input autoFocus value={answer} onChange={e=>setAnswer(e.target.value)} maxLength={160} autoComplete="off" placeholder="What is…"/></label><button className="btn gold buzzer" style={{marginTop:14}} disabled={!answer.trim()} type="submit">Lock in answer <ArrowRight size={18}/></button></form>}
 {game.phase==='ai'&&<div className="result" role="status"><Bot style={{display:'inline',marginRight:8}}/>{contestants[game.contestant??1]} buzzed in and is answering…</div>}
 {game.log.length>0&&<ul className="history" aria-live="polite">{game.log.map((line,i)=><li key={i}>{line}</li>)}</ul>}
 {game.phase==='reveal'&&<><div className="result"><div className="eyebrow">{game.result}</div><p style={{fontSize:25,margin:'12px 0 0'}}>{game.active?.answer}</p></div><button className="btn gold buzzer" onClick={()=>dispatch({type:'continue'})}>{game.used.length===30?'See final scores':'Back to the board'}<ArrowRight size={18}/></button></>}
 </div></DialogContent></Dialog>
 <Dialog open={game.phase==='finished'} onOpenChange={()=>{}}><DialogContent className="modal" showCloseButton={false}><Trophy size={44} color="#f2cb75"/><DialogTitle>{winners.length===1?`${winners[0]==='You'?'You win':`${winners[0]} wins`}!`:'A shared victory!'}</DialogTitle><DialogDescription>{winners.length>1?`${winners.join(', ')} tied for first.`:'All 30 clues are complete. Here are the final scores.'}</DialogDescription>{contestants.map((p,i)=><div className="result" key={p} style={{display:'flex',justifyContent:'space-between',margin:0}}><span>{p}</span><strong>{money(game.scores[i])}</strong></div>)}<div className="actions"><button className="btn gold" onClick={()=>dispatch({type:'reset'})}>Play again</button><button className="btn" onClick={()=>{dispatch({type:'reset'});setEditor(true);}}>Customize the next board</button></div></DialogContent></Dialog>
 </main>;
}
