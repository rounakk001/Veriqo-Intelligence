import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";

async function test() {
  const model = new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash",
    apiKey: "AIzaSyFakeKeyButValidFormat1234567890",
    maxRetries: 0,
  });

  try {
    console.log("Invoking...");
    await model.invoke([
      new SystemMessage("System"),
      new HumanMessage("Hello"),
    ]);
  } catch (err: any) {
    console.log("--- ERROR ---");
    console.log("Message:", err.message);
    console.log("Status:", err.status || err.statusCode);
    console.log("Name:", err.name);
    console.log("Full:", JSON.stringify(err, null, 2));
  }
}

test();
