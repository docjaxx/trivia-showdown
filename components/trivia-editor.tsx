'use client';
import { useRef, useState } from 'react';
import { Download, Upload, Save } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogContent, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel, AlertDialogFooter } from '@/components/ui/alert-dialog';
import { exportBoard, loadBoard, saveBoard } from '@/lib/board-client';
import { validateTrivia, type Trivia } from '@/lib/trivia';
export default function TriviaEditor({trivia,revision,onClose,onSaved}:{trivia:Trivia;revision:number;onClose:()=>void;onSaved:(trivia:Trivia,revision:number)=>void}) {
 const [draft,setDraft]=useState<Trivia>(()=>structuredClone(trivia));
 const [baseRevision,setBaseRevision]=useState(revision),[category,setCategory]=useState(0),[busy,setBusy]=useState(false),[error,setError]=useState(''),[confirm,setConfirm]=useState<'save'|'close'|'reload'|null>(null);
 const file=useRef<HTMLInputElement>(null);
 const dirty=JSON.stringify(draft)!==JSON.stringify(trivia);
 const update=(fn:(copy:Trivia)=>void)=>setDraft(old=>{const copy=structuredClone(old);fn(copy);return copy;});
 async function save() {setBusy(true);setError('');try {const result=await saveBoard(draft,baseRevision);onSaved(result.trivia,result.revision);}catch(e){setError((e as Error).message);}finally {setBusy(false);setConfirm(null);}}
 async function reload(){setBusy(true);try{const result=await loadBoard();setDraft(result.trivia);setBaseRevision(result.revision);setError('');}catch(e){setError((e as Error).message);}finally{setBusy(false);setConfirm(null);}}
 return <>
 <Dialog open onOpenChange={open=>{if(!open&&!busy){if(dirty)setConfirm('close');else onClose();}}}>
 <DialogContent className="modal"><DialogTitle>Trivia studio</DialogTitle><DialogDescription>Make the board your own. Each category has five clues, from $200 to $1,000. Saving starts a fresh game.</DialogDescription>
 <div className="actions"><button className="btn" disabled={busy} onClick={()=>exportBoard(draft)}><Download size={16}/>Export JSON</button><button className="btn" disabled={busy} onClick={()=>file.current?.click()}><Upload size={16}/>Import JSON</button><button className="btn" disabled={busy} onClick={()=>setConfirm('reload')}>Reload saved board</button></div>
 <input ref={file} type="file" accept=".json,application/json" hidden onChange={async e=>{const selected=e.target.files?.[0];e.target.value='';if(!selected)return;try{if(selected.size>100_000)throw new Error('Choose a JSON file smaller than 100 KB.');setDraft(validateTrivia(JSON.parse(await selected.text())));setCategory(0);setError('');}catch(err){setError((err as Error).message);}}}/>
 <label className="field">Board title<input maxLength={80} value={draft.title} onChange={e=>update(d=>{d.title=e.target.value;})}/></label>
 <div className="editor-nav" aria-label="Choose category to edit">{draft.categories.map((c,i)=><button key={c.id} className={`btn ${category===i?'selected':''}`} aria-pressed={category===i} onClick={()=>setCategory(i)}>{i+1}. {c.name||'Untitled'}</button>)}</div>
 <label className="field">Category name<input maxLength={45} value={draft.categories[category].name} onChange={e=>update(d=>{d.categories[category].name=e.target.value;})}/></label>
 {draft.categories[category].clues.map((clue,i)=><div className="editor-row" key={clue.id}><div className="eyebrow">${((i+1)*200).toLocaleString()}</div><label className="field">Clue<textarea value={clue.question} maxLength={600} onChange={e=>update(d=>{d.categories[category].clues[i].question=e.target.value;})}/></label><div className="editor-grid"><label className="field">Correct answer<input value={clue.answer} maxLength={120} onChange={e=>update(d=>{d.categories[category].clues[i].answer=e.target.value;})}/></label><label className="field">Accepted alternatives (separate with ;)<input value={clue.aliases.join(';')} onChange={e=>update(d=>{d.categories[category].clues[i].aliases=e.target.value.split(';');})}/></label></div></div>)}
 {error&&<p className="notice" role="alert">{error}</p>}
 <p className="muted">Export a board to have Codex edit it, then import the updated file here. Imported changes are applied only when you save.</p>
 <div className="actions"><button className="btn gold" disabled={busy} onClick={()=>{try{const cleaned=structuredClone(draft);for(const c of cleaned.categories)for(const q of c.clues)q.aliases=q.aliases.map(a=>a.trim()).filter(Boolean);validateTrivia(cleaned);setDraft(cleaned);setConfirm('save');setError('');}catch(e){setError((e as Error).message);}}}><Save size={16}/>{busy?'Saving…':'Save & start new game'}</button><button className="btn" disabled={busy} onClick={()=>dirty?setConfirm('close'):onClose()}>Cancel</button></div>
 </DialogContent></Dialog>
 <AlertDialog open={confirm!==null} onOpenChange={open=>{if(!open&&!busy)setConfirm(null);}}><AlertDialogContent><AlertDialogTitle>{confirm==='save'?'Save this board?':confirm==='reload'?'Reload the saved board?':'Discard unsaved changes?'}</AlertDialogTitle><AlertDialogDescription>{confirm==='save'?'Your categories and clues will be saved. The current game and scores will restart.':confirm==='reload'?'Your unsaved draft will be replaced with the latest saved board. Export your draft first if you want to keep it.':'Your saved board will stay available. Changes in this draft will be discarded.'}</AlertDialogDescription><AlertDialogFooter><AlertDialogCancel disabled={busy}>Keep editing</AlertDialogCancel><AlertDialogAction disabled={busy} onClick={()=>confirm==='save'?void save():confirm==='reload'?void reload():onClose()}>{busy?'Working…':'Confirm'}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
 </>;
}
