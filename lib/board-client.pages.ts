import seed from '@/data/trivia.json';
import { validateTrivia, type Trivia } from './trivia';
export const storageDescription='GitHub Pages edition: edits are saved in this browser. Export JSON for a backup. To update the board for everyone, commit data/trivia.json to GitHub.';
const key='trivia-showdown:board:v1';
type Stored={trivia:Trivia|null;revision:number};
function read():Stored {
 const raw=localStorage.getItem(key);
 if(!raw)return {trivia:null,revision:0};
 let data:Stored;
 try{data=JSON.parse(raw);if(!data||!Number.isSafeInteger(data.revision)||data.revision<0)throw new Error();if(data.trivia!==null)data.trivia=validateTrivia(data.trivia);}
 catch{throw new Error('The saved board in this browser could not be read. Export any open draft before clearing this site’s browser data.');}
 return data;
}
export async function loadBoard():Promise<{trivia:Trivia;revision:number}> {
 const data=read();return {trivia:data.trivia??validateTrivia(seed),revision:data.revision};
}
export async function saveBoard(input:unknown,revision:number):Promise<{trivia:Trivia;revision:number}> {
 const trivia=validateTrivia(input);
 const persist=()=>{
  const current=read();
  if(current.revision!==revision)throw new Error('This board changed in another tab. Export your draft, then reload the saved board before saving.');
  // Saving the repository board removes the local override so future commits remain visible.
  const data:Stored={trivia:JSON.stringify(trivia)===JSON.stringify(validateTrivia(seed))?null:trivia,revision:revision+1};
  try{localStorage.setItem(key,JSON.stringify(data));}catch{throw new Error('This browser could not save the board. Export your draft as JSON to keep it.');}
  return {trivia,revision:data.revision};
 };
 return navigator.locks?navigator.locks.request(key,persist):persist();
}
export function exportBoard(trivia:Trivia) {
 const url=URL.createObjectURL(new Blob([JSON.stringify(trivia,null,2)],{type:'application/json'}));
 const a=document.createElement('a');a.href=url;a.download='trivia.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
