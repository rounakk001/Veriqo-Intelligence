import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { CircuitBreaker } from "./src/lib/services/ai-gateway/circuit-breaker";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function test() {
  const model = new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash",
    apiKey: process.env.GOOGLE_API_KEY || "AIzaSyFakeKey",
  });

  try {
    console.log("Invoking model...");
    await model.invoke("Hello");
    console.log("Success!");
  } catch (err: any) {
    console.log("ERROR MESSAGE:", err.message);
    console.log("ERROR STATUS:", err.status || err.statusCode);
    console.log("IS TRANSIENT?", CircuitBreaker.isTransientError(err));
  }
}

test();
