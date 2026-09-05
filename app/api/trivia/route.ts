import seed from '@/data/trivia.json';
import { database } from '@/db/client';
import { validateTrivia } from '@/lib/trivia';
export async function GET() {
  try {
    const row=await database().prepare('SELECT data, revision FROM trivia_boards WHERE id = ?').bind('main').first<{data:string;revision:number}>();
    return Response.json({trivia:row?JSON.parse(row.data):seed,revision:row?.revision??0},{headers:{'Cache-Control':'no-store'}});
  } catch { return Response.json({error:'The saved board is unavailable. Please try again.'},{status:503}); }
}
export async function PUT(request:Request) {
  // The hosted site is owner-only. Reject cross-origin writes as an additional CSRF check.
  const origin=request.headers.get('origin');
  if(origin && origin!==new URL(request.url).origin) return Response.json({error:'Cross-origin updates are not allowed.'},{status:403});
  if(!request.headers.get('content-type')?.includes('application/json')) return Response.json({error:'Send JSON.'},{status:415});
  try {
    const body=await request.text();
    if(body.length>100_000) return Response.json({error:'The board is too large.'},{status:413});
    const input=JSON.parse(body), trivia=validateTrivia(input.trivia), revision=input.revision;
    if(!Number.isSafeInteger(revision)||revision<0) throw new Error('A valid board revision is required.');
    const db=database();
    const result=revision===0
      ? await db.prepare('INSERT INTO trivia_boards (id, data, revision) VALUES (?, ?, 1) ON CONFLICT(id) DO NOTHING').bind('main',JSON.stringify(trivia)).run()
      : await db.prepare('UPDATE trivia_boards SET data = ?, revision = revision + 1 WHERE id = ? AND revision = ?').bind(JSON.stringify(trivia),'main',revision).run();
    if(!result.meta.changes) return Response.json({error:'This board changed in another session. Export your draft, then reload the latest board before saving.'},{status:409});
    return Response.json({trivia,revision:revision+1});
  } catch(error) {
    if(error instanceof SyntaxError || error instanceof Error && !/D1|SQLITE|database/i.test(error.message)) return Response.json({error:error instanceof Error?error.message:'Invalid board.'},{status:400});
    return Response.json({error:'Could not save the board. Your draft is still open; please try again.'},{status:503});
  }
}
