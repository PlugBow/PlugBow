import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {

  const { message } = req.body;

  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "You are PlugBow AI, a Minecraft SMP plugin expert speaking Hinglish with emojis 🎮"
      },
      {
        role: "user",
        content: message
      }
    ]
  });

  res.status(200).json({
    reply: completion.choices[0].message.content
  });

}
