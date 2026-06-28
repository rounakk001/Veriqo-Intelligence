import { AIGateway } from "../src/lib/services/ai-gateway/gateway";
import { GeminiProvider } from "../src/lib/services/ai-gateway/providers/gemini";
import { CircuitBreaker } from "../src/lib/services/ai-gateway/circuit-breaker";

async function verify() {
  console.log("=== Enterprise AI Gateway Verification ===\n");

  // 1. Fallback to GOOGLE_API_KEY
  process.env.GOOGLE_API_KEY = "legacy_key";
  console.log("[1] Testing GOOGLE_API_KEY fallback...");
  let keys = GeminiProvider.getKeys();
  console.log("Keys loaded:", keys.map(k => k.key));
  
  // Reset for next test
  (GeminiProvider as any).keys = [];
  delete process.env.GOOGLE_API_KEY;

  // 2. Discover dynamically
  process.env.GEMINI_API_KEY_A = "key_a";
  process.env.GEMINI_API_KEY_B = "key_b";
  process.env.GEMINI_API_KEY_C = "key_c";
  
  console.log("\n[2] Testing dynamic GEMINI_API_KEY_* discovery...");
  keys = GeminiProvider.getKeys();
  console.log("Keys loaded:", keys.map(k => k.key));

  // 3. Mock Model Instance to test rotation, retry, and circuit breaker
  let requestCount = 0;
  (GeminiProvider as any).getModelInstance = (apiKey: string) => {
    return {
      invoke: async () => {
        requestCount++;
        console.log(`  -> [Mock LLM] Invoked with key: ${apiKey}`);
        
        if (apiKey === "key_a" && requestCount === 1) {
          console.log(`  -> [Mock LLM] Simulating 429 Rate Limit for key_a...`);
          const err: any = new Error("429 Too Many Requests");
          err.status = 429;
          throw err;
        }
        
        return "Success response from " + apiKey;
      }
    };
  };

  const gateway = new AIGateway();
  
  console.log("\n[3] Testing Circuit Breaker & Retry on Failure...");
  console.log("--- Request 1 ---");
  // First call (will use key_a, fail, circuit break, retry with key_b)
  const res1 = await gateway.invoke("test 1" as any);
  console.log("Result 1:", res1);
  
  console.log("\n[4] Testing Round-Robin Rotation & Skipping Unhealthy Keys...");
  console.log("--- Request 2 ---");
  // Second call (key_c because key_a is on cooldown and we used key_b)
  const res2 = await gateway.invoke("test 2" as any);
  console.log("Result 2:", res2);

  console.log("--- Request 3 ---");
  // Third call (key_b because key_a is STILL on cooldown, it loops back to start but skips A)
  const res3 = await gateway.invoke("test 3" as any);
  console.log("Result 3:", res3);
  
  console.log("\n[5] Simulating Cooldown Expiration...");
  // Manually expire cooldown for key_a
  const keyA = keys.find(k => k.key === "key_a");
  if (keyA) {
    keyA.stats.cooldownUntil = new Date(Date.now() - 1000); // 1 second in the past
    console.log("  -> Expired cooldown for key_a.");
  }
  
  console.log("--- Request 4 ---");
  // Fourth call (should be key_c, then next is key_a which is now healthy!)
  // Wait, last used was key_b. Next is key_c.
  const res4 = await gateway.invoke("test 4" as any);
  console.log("Result 4:", res4);

  console.log("--- Request 5 ---");
  const res5 = await gateway.invoke("test 5" as any);
  console.log("Result 5:", res5);

  console.log("\nVerification Complete!");
}

verify().catch(console.error);
