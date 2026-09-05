import { validateTrivia, type Trivia } from './trivia';
export async function loadBoard():Promise<{trivia:Trivia;revision:number}> {
 const response=await fetch('/api/trivia',{cache:'no-store'}), data=await response.json() as {trivia:unknown;revision:number;error?:string};
 if(!response.ok) throw new Error(data.error || 'Could not load trivia.');
 return {trivia:validateTrivia(data.trivia),revision:data.revision};
}
export async function saveBoard(trivia:unknown,revision:number):Promise<{trivia:Trivia;revision:number}> {
 const valid=validateTrivia(trivia);
 const response=await fetch('/api/trivia',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({trivia:valid,revision})}),data=await response.json() as {trivia:Trivia;revision:number;error?:string};
 if(!response.ok) throw new Error(data.error || 'Could not save trivia.');
 return {trivia:validateTrivia(data.trivia),revision:data.revision};
}
export function exportBoard(trivia:Trivia) {
 const url=URL.createObjectURL(new Blob([JSON.stringify(trivia,null,2)],{type:'application/json'}));
 const a=document.createElement('a');a.href=url;a.download='trivia.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
