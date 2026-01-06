import { createGatewayProvider } from "@ai-sdk/gateway";

export const gateway = createGatewayProvider({
  apiKey: process.env.AI_SDK_API_KEY,
  baseURL: process.env.AI_SDK_BASE_URL,
});
