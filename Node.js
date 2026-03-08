// server.js — simple Express proxy for OpenAI Chat Completions
import express from "express";
import fetch from "node-fetch"; // node 18+ has fetch; otherwise install node-fetch
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(express.json());

// Rate-limit / auth: add simple token check (set CLIENT_SECRET env on server)
const CLIENT_SECRET = process.env.CLIENT_SECRET || "";

function checkAuth(req){
  // optional: pass secret in header x-client-secret
  if(!CLIENT_SECRET) return true;
  return req.headers['x-client-secret'] === CLIENT_SECRET;
}

app.post("/api/chat", async (req, res) => {
  try{
    if(!checkAuth(req)) return res.status(401).json({error:"unauthorized"});
    const { messages, model } = req.body;
    if(!messages || !Array.isArray(messages)) return res.status(400).json({error:"messages array required"});

    const OPENAI_KEY = process.env.OPENAI_API_KEY;
    if(!OPENAI_KEY) return res.status(500).json({error:"server missing OPENAI_API_KEY"});

    // Choose model or default
    const chosenModel = model || "gpt-4o-mini"; // change as desired on your account

    const payload = {
      model: chosenModel,
      messages: messages,
      temperature: 0.2,
      max_tokens: 900
    };

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if(!r.ok){
      const errTxt = await r.text();
      console.error("OpenAI error", r.status, errTxt);
      return res.status(502).json({error:"OpenAI API error", status: r.status, details: errTxt});
    }

    const j = await r.json();
    // Return a simple structure for frontend
    const assistantText = j.choices?.[0]?.message?.content ?? JSON.stringify(j);
    res.json({ reply: assistantText, raw: j });
  }catch(e){
    console.error(e);
    res.status(500).json({error: e.message});
  }
});

const port = process.env.PORT || 3000;
app.listen(port, ()=>console.log("SMP AI proxy running on", port));
