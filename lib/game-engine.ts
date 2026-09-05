import type { Clue } from './trivia.ts';
export type Difficulty = 'relaxed' | 'standard' | 'expert';
export type ActiveClue = Clue & { category: string; value: number };
export type GameState = {
  phase: 'board'|'reading'|'buzz'|'answer'|'ai'|'reveal'|'finished';
  scores: number[]; used: string[]; picker: number; active: ActiveClue|null;
  attempted: number[]; contestant: number|null; log: string[]; result: string;
};
export const contestants = ['You','Atlas','Nova'];
export const initialGame = (): GameState => ({phase:'board',scores:[0,0,0],used:[],picker:0,active:null,attempted:[],contestant:null,log:[],result:''});
export type GameAction = {type:'reset'} | {type:'pick';clue:ActiveClue} | {type:'ready'} | {type:'buzz';player:number} | {type:'resolve';correct:boolean;answer:string} | {type:'expire'} | {type:'continue'};
export const money = (n: number) => `${n<0?'−':''}$${Math.abs(n).toLocaleString('en-US')}`;
export function gameReducer(state:GameState, action:GameAction):GameState {
  if(action.type==='reset') return initialGame();
  if(action.type==='pick' && state.phase==='board' && !state.used.includes(action.clue.id)) return {...state,phase:'reading',active:action.clue,used:[...state.used,action.clue.id],attempted:[],contestant:null,log:[],result:''};
  if(action.type==='ready' && state.phase==='reading') return {...state,phase:'buzz'};
  if(action.type==='buzz' && state.phase==='buzz' && [0,1,2].includes(action.player) && !state.attempted.includes(action.player)) return {...state,phase:action.player===0?'answer':'ai',contestant:action.player,attempted:[...state.attempted,action.player]};
  if(action.type==='resolve' && (state.phase==='answer'||state.phase==='ai') && state.contestant!==null && state.active) {
    const player=state.contestant, scores=[...state.scores]; scores[player]+=state.active.value*(action.correct?1:-1);
    const log=[...state.log,`${contestants[player]}: ${action.answer || '(no answer)'} — ${action.correct?'+':'−'}${money(state.active.value)}`];
    return {...state,scores,log,contestant:null,phase:action.correct || state.attempted.length===3?'reveal':'buzz',picker:action.correct?player:state.picker,result:action.correct?`${player===0?'You got it':`${contestants[player]} got it`}!`:'No correct responses.'};
  }
  if(action.type==='expire' && state.phase==='buzz') return {...state,phase:'reveal',result:'Time’s up. No more responses.'};
  if(action.type==='continue' && state.phase==='reveal') return {...state,phase:state.used.length===30?'finished':'board',active:null};
  return state;
}
export function aiProfile(player:number, value:number, difficulty:Difficulty) {
  const shift = {relaxed:-.2,standard:0,expert:.16}[difficulty];
  return { accuracy:Math.min(.97, Math.max(.18, (player===1?.86:.76)-(value/200-1)*.075+shift)),
    delay:(player===1?3000:2100) + ({relaxed:1600,standard:0,expert:-900}[difficulty]) };
}
