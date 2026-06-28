import { ChatOpenAI } from "@langchain/openai";

async function test() {
  try {
    const model = new ChatOpenAI({
      modelName: "grok-beta", // or "grok-2"
      apiKey: process.env.XAI_API_KEY || "test_key",
      configuration: {
        baseURL: "https://api.x.ai/v1",
      },
      temperature: 0.2,
      maxTokens: 4096,
    });

    console.log("Invoking model...");
    const res = await model.invoke("Hello, who are you?");
    console.log("Success:", res);
  } catch (error: any) {
    console.error("HTTP ERROR:", error);
    if (error.response) {
      console.error("RESPONSE DATA:", error.response.data);
      console.error("STATUS:", error.response.status);
      console.error("HEADERS:", error.response.headers);
    }
  }
}

test().catch(console.error);
