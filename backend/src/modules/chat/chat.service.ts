import { env } from '../../config/env';
import { productRepository } from '../products/product.repository';
import { executeTool, getToolsForRole, UserContext } from './chat.tools';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | null;
  tool_calls?: Array<{
    id: string;
    type: 'function';
    function: { name: string; arguments: string };
  }>;
  tool_call_id?: string;
  name?: string;
}

const MAX_TOOL_HOPS = 5;

const buildSystemPrompt = (ctx: UserContext, cartItems: any[], path: string): string => {
  const roleLabel =
    ctx.role === 'ADMIN'
      ? 'ADMIN (toàn quyền: xem mọi đơn, sửa/xóa đơn, xem thống kê)'
      : ctx.role === 'USER'
        ? 'KHÁCH ĐÃ ĐĂNG NHẬP (chỉ xem đơn của mình)'
        : 'KHÁCH (chưa đăng nhập)';

  const cartSummary =
    Array.isArray(cartItems) && cartItems.length > 0
      ? `Giỏ hàng hiện tại có ${cartItems.length} sản phẩm: ${cartItems
          .map((c: any) => `${c.title} x${c.quantity}`)
          .join(', ')}.`
      : 'Giỏ hàng đang trống.';

  return `Bạn là trợ lý AI của cửa hàng Classic Records (bán Vinyl, CD, Merch).
Trả lời bằng tiếng Việt, ngắn gọn, thân thiện. Có thể dùng HTML cơ bản (<br/>, <strong>, <a>) để format.

QUYỀN HẠN HIỆN TẠI CỦA USER: ${roleLabel}.
Đường dẫn user đang xem: ${path || 'không rõ'}.
${cartSummary}

NGUYÊN TẮC QUAN TRỌNG:
1. Khi user hỏi về sản phẩm/đơn hàng/thống kê → BẮT BUỘC gọi tool tương ứng để lấy dữ liệu thật, KHÔNG được bịa.
2. Bạn CÓ KHẢ NĂNG thêm sản phẩm vào giỏ hàng thật của user qua tool 'add_to_cart'. KHÔNG BAO GIỜ bảo user "tự bấm link để thêm" — bạn làm được trực tiếp.
   - Khi user nói "mua", "thêm vào giỏ", "đặt", "lấy đi"… → tìm sản phẩm bằng search_products, sau đó hỏi xác nhận một câu duy nhất: "Bạn xác nhận thêm <tên> vào giỏ chứ?".
   - Khi user đáp đồng ý dù bằng bất kỳ cách nào ("ok", "có", "thêm đi", "yes", "đồng ý", "đúng rồi", "thêm vào giỏ giúp tôi", "ok thêm giúp")  → GỌI NGAY add_to_cart với confirmed=true. Không hỏi lại lần 2.
3. Với hành động ghi/xóa (update_order_status, delete_order):
   - PHẢI hỏi xác nhận rõ ràng trước.
   - Chỉ truyền confirmed=true khi user đã đồng ý ("xóa", "đồng ý", "ok xóa", "có", "yes"…).
   - Nếu user chưa xác nhận, trả lời bằng câu hỏi xác nhận thay vì gọi tool.
4. Nếu user (không phải admin) đòi thao tác admin → lịch sự từ chối, gợi ý liên hệ admin.
5. Khi liệt kê sản phẩm/đơn hàng, format gọn: tên, giá, trạng thái. Không cần lặp lại ID dài nếu không cần.`;
};

const callDeepseek = async (
  messages: ChatMessage[],
  tools: any[],
): Promise<any> => {
  if (!env.DEEPSEEK_API_KEY) throw new Error('Missing DEEPSEEK_API_KEY');

  const response = await fetch(env.DEEPSEEK_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.DEEPSEEK_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: env.DEEPSEEK_MODEL,
      messages,
      tools: tools.length ? tools : undefined,
      tool_choice: tools.length ? 'auto' : undefined,
      temperature: 0.5,
      max_tokens: 1024,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`DeepSeek Error ${response.status}: ${body}`);
  }

  return response.json();
};

const simpleFallback = async (message: string): Promise<string> => {
  const lower = message.toLowerCase();
  try {
    const products = await productRepository.findMany();
    const hits = products.filter((p: any) =>
      `${p.title} ${p.artist} ${p.category}`.toLowerCase().includes(lower),
    );
    if (hits.length > 0) {
      const list = hits
        .slice(0, 5)
        .map((p: any) => `• <strong>${p.title}</strong> — ${p.artist} — $${p.price}`)
        .join('<br/>');
      return `Mình tạm chưa kết nối được AI, nhưng đây là kết quả tìm được:<br/>${list}`;
    }
  } catch {
    /* ignore */
  }
  return 'Xin lỗi, hiện mình chưa kết nối được dịch vụ AI. Vui lòng thử lại sau hoặc liên hệ hotline 1800-CLASSIC.';
};

export interface ChatActionPayload {
  type: 'add_to_cart';
  product: any;
  quantity: number;
}

export interface ChatResult {
  response: string;
  actions: ChatActionPayload[];
}

export const chatService = {
  generateResponse: async (
    message: string,
    history: any[],
    context: any = {},
    userCtx: UserContext = { userId: null, role: 'GUEST' },
  ): Promise<ChatResult> => {
    if (!env.DEEPSEEK_API_KEY) {
      return { response: await simpleFallback(message), actions: [] };
    }

    const cartItems = Array.isArray(context?.cart) ? context.cart : [];
    const path = context?.path || '';

    const tools = getToolsForRole(userCtx.role).map((t) => ({
      type: t.type,
      function: t.function,
    }));

    const systemMsg: ChatMessage = {
      role: 'system',
      content: buildSystemPrompt(userCtx, cartItems, path),
    };

    const recentHistory: ChatMessage[] = (history || [])
      .slice(-8)
      .map((h: any) => ({
        role: h.role === 'assistant' ? 'assistant' : 'user',
        content: String(h.content || ''),
      }));

    const messages: ChatMessage[] = [
      systemMsg,
      ...recentHistory,
      { role: 'user', content: message },
    ];

    const collectedActions: ChatActionPayload[] = [];

    try {
      for (let hop = 0; hop < MAX_TOOL_HOPS; hop++) {
        const data = await callDeepseek(messages, tools);
        const choice = data?.choices?.[0];
        const aiMessage = choice?.message;
        if (!aiMessage) break;

        const toolCalls = aiMessage.tool_calls;

        if (toolCalls && toolCalls.length > 0) {
          messages.push({
            role: 'assistant',
            content: aiMessage.content ?? null,
            tool_calls: toolCalls,
          });

          for (const call of toolCalls) {
            let args: any = {};
            try {
              args = call.function.arguments ? JSON.parse(call.function.arguments) : {};
            } catch {
              args = {};
            }
            const { result, action } = await executeTool(call.function.name, args, userCtx);
            if (action) collectedActions.push(action as ChatActionPayload);
            messages.push({
              role: 'tool',
              tool_call_id: call.id,
              name: call.function.name,
              content: JSON.stringify(result),
            });
          }
          continue;
        }

        return {
          response:
            (aiMessage.content as string) || 'Mình chưa rõ câu hỏi, bạn nói lại giúp nhé.',
          actions: collectedActions,
        };
      }
      return {
        response:
          'Mình cần nhiều bước hơn để xử lý. Bạn có thể tách câu hỏi thành các phần nhỏ giúp mình không?',
        actions: collectedActions,
      };
    } catch (err: any) {
      console.error('DeepSeek chat error:', err?.message || err);
      return { response: await simpleFallback(message), actions: collectedActions };
    }
  },
};
