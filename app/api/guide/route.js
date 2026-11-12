import { runBefore, runAfter, runJudge } from "../../../lib/guide.js";

export const maxDuration = 60;

export async function POST(req) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json(
      { error: "ANTHROPIC_API_KEY is not set. Add it to .env.local (local) or the Vercel project settings." },
      { status: 500 }
    );
  }
  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Send JSON with a mode and a question." }, { status: 400 });
  }
  const question = String(body.question || "").trim().slice(0, 1000);
  if (!question) return Response.json({ error: "Enter a question for Guide." }, { status: 400 });
  try {
    if (body.mode === "judge") {
      const answer = String(body.answer || "").trim().slice(0, 4000);
      if (!answer) return Response.json({ error: "There is no answer to score." }, { status: 400 });
      return Response.json(await runJudge({ question, answer, author: body.author === "team" ? "team" : "guide" }));
    }
    const result = body.mode === "before" ? await runBefore(question) : await runAfter(question);
    return Response.json(result);
  } catch (err) {
    console.error(err);
    return Response.json({ error: `Guide could not complete the request: ${err.message}` }, { status: 502 });
  }
}
