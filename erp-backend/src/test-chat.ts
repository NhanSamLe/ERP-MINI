import { chatService } from "./modules/ai-chatbot/services/chat.service";
import { sequelize } from "./models";

async function test() {
  try {
    console.log("Processing message...");
    const conv = await chatService.createConversation(1, 1, "Test Conversation");
    console.log("Conversation created with ID:", conv.id);
    
    const response = await chatService.processMessage(
      conv.id,
      1, // user id
      1, // branch id
      "dummy_token",
      "Hiện tại có đơn mua hàng (PO) nào đang ở trạng thái Đã nhận không?"
    );
    console.log("Response:", response.toJSON());
  } catch (err: any) {
    console.error("Chat failed with error:", err);
  } finally {
    await sequelize.close();
  }
}

test();
