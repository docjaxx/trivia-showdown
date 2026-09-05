import { validateTrivia, type Trivia } from './trivia';
type Tool = {name:string;title:string;description:string;inputSchema:object;annotations:{readOnlyHint:boolean;untrustedContentHint:boolean};execute:(input:unknown)=>unknown};
type Context = {registerTool:(tool:Tool,options:{signal:AbortSignal})=>void|Promise<void>};
export function registerTriviaTools(actions:{read:()=>{trivia:Trivia;revision:number};save:(trivia:Trivia,revision:number)=>Promise<unknown>}) {
 const context=(document as Document&{modelContext?:Context}).modelContext;
 if(!context?.registerTool)return;
 const lifecycle=new AbortController();
 const tools:Tool[]=[
 {name:'read_trivia_board',title:'Read trivia board',description:'Read the current categories, clues, accepted answers, and revision before editing.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true,untrustedContentHint:true},execute:()=>actions.read()},
 {name:'save_trivia_board',title:'Save trivia board and restart game',description:'Validate and save all six categories and their five clues. Restarts the current game and scores. Use the revision returned by read_trivia_board.',inputSchema:{type:'object',properties:{revision:{type:'integer',minimum:0},trivia:{type:'object',properties:{title:{type:'string'},categories:{type:'array',minItems:6,maxItems:6,items:{type:'object',properties:{id:{type:'string'},name:{type:'string'},clues:{type:'array',minItems:5,maxItems:5,items:{type:'object',properties:{id:{type:'string'},question:{type:'string'},answer:{type:'string'},aliases:{type:'array',items:{type:'string'}}},required:['id','question','answer','aliases'],additionalProperties:false}}},required:['id','name','clues'],additionalProperties:false}}},required:['title','categories'],additionalProperties:false}},required:['revision','trivia'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:true},execute:async(input)=>{const value=input as {trivia:unknown;revision:number};if(!value||!Number.isSafeInteger(value.revision)||value.revision<0)throw new Error('Supply the current revision.');return actions.save(validateTrivia(value.trivia),value.revision);}}
 ];
 for(const tool of tools){try{void Promise.resolve(context.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{});}catch{/* JSON import/export remains available in browsers without WebMCP. */}}
 return ()=>lifecycle.abort();
}
