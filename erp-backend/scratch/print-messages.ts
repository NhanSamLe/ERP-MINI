import { sequelize } from "../src/config/db";
import { chatService } from "../src/modules/ai-chatbot/services/chat.service";

async function main() {
  await sequelize.authenticate();
  const conversationId = 20;
  
  // @ts-ignore
  const contextMsgs = await chatService._getContextWindow(conversationId);
  console.log("=== MAPPED CONTEXT MESSAGES FOR OPENAI ===");
  console.log(JSON.stringify(contextMsgs, null, 2));
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
