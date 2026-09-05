import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { gameReducer as reduce, initialGame, aiProfile } from '../lib/game-engine.ts';
import { validateTrivia, isCorrect } from '../lib/trivia.ts';
const board=JSON.parse(readFileSync(new URL('../data/trivia.json',import.meta.url),'utf8'));
const clue={...board.categories[0].clues[0],value:200,category:'Science'};
const open=()=>reduce(reduce(initialGame(),{type:'pick',clue}),{type:'ready'});
test('starter board has six complete categories with unique IDs',()=>assert.equal(validateTrivia(board).categories.length,6));
test('answers accept question phrasing, case and explicit aliases but reject substrings',()=>{
 assert.equal(isCorrect('What is MARS?',clue),true);assert.equal(isCorrect('marsupial',clue),false);assert.equal(isCorrect('',clue),false);
 assert.equal(isCorrect('Who was van Gogh?',board.categories[3].clues[3]),true);
});
test('buzzes are locked while reading and first buzzer wins atomically',()=>{
 const reading=reduce(initialGame(),{type:'pick',clue});assert.equal(reduce(reading,{type:'buzz',player:0}).phase,'reading');
 const buzzed=reduce(open(),{type:'buzz',player:0});assert.equal(reduce(buzzed,{type:'buzz',player:1}).contestant,0);
});
test('wrong answers subtract value, lock the player out and let others rebound',()=>{
 let game=reduce(open(),{type:'buzz',player:0});game=reduce(game,{type:'resolve',correct:false,answer:'Venus'});
 assert.equal(game.scores[0],-200);assert.equal(game.phase,'buzz');assert.equal(reduce(game,{type:'buzz',player:0}).phase,'buzz');
 game=reduce(game,{type:'buzz',player:1});game=reduce(game,{type:'resolve',correct:true,answer:'Mars'});
 assert.deepEqual(game.scores,[-200,200,0]);assert.equal(game.picker,1);assert.equal(game.phase,'reveal');
 assert.deepEqual(reduce(game,{type:'resolve',correct:true,answer:'Mars'}).scores,game.scores);
});
test('all three misses reveal the answer without changing board control',()=>{
 let game=open();for(const player of [0,1,2]){game=reduce(game,{type:'buzz',player});game=reduce(game,{type:'resolve',correct:false,answer:'wrong'});}
 assert.equal(game.phase,'reveal');assert.deepEqual(game.scores,[-200,-200,-200]);assert.equal(game.picker,0);
});
test('expired clue reveals, played clues cannot be picked again, and 30 clues end the game',()=>{
 let game=reduce(open(),{type:'expire'});game=reduce(game,{type:'continue'});assert.equal(game.phase,'board');assert.deepEqual(reduce(game,{type:'pick',clue}),game);
 const final=reduce({...game,phase:'reveal',used:Array.from({length:30},(_,i)=>String(i))},{type:'continue'});assert.equal(final.phase,'finished');assert.deepEqual(reduce(final,{type:'reset'}),initialGame());
});
test('higher difficulty improves AI speed and accuracy; expensive clues lower accuracy',()=>{
 assert.ok(aiProfile(1,200,'expert').accuracy>aiProfile(1,200,'relaxed').accuracy);
 assert.ok(aiProfile(2,200,'expert').delay<aiProfile(2,200,'relaxed').delay);
 assert.ok(aiProfile(1,1000,'standard').accuracy<aiProfile(1,200,'standard').accuracy);
});
test('invalid or incomplete imported boards fail without mutation',()=>{
 const draft=structuredClone(board);draft.categories[0].clues[0].id=draft.categories[1].id;assert.throws(()=>validateTrivia(draft),/unique/);
 const incomplete=structuredClone(board);incomplete.categories.pop();assert.throws(()=>validateTrivia(incomplete),/6 categories/);
 assert.equal(board.categories.length,6);assert.throws(()=>validateTrivia({}),/6 categories/);
});
