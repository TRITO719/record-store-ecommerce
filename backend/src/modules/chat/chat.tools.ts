import { productRepository } from '../products/product.repository';
import { orderRepository } from '../orders/order.repository';
import { adminRepository } from '../admin/admin.repository';
import { adminService } from '../admin/admin.service';

export interface UserContext {
  userId: string | null;
  role: 'USER' | 'ADMIN' | 'GUEST';
}

export interface ToolDef {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: any;
  };
}

const PUBLIC_TOOLS: ToolDef[] = [
  {
    type: 'function',
    function: {
      name: 'add_to_cart',
      description:
        'BẠN CÓ KHẢ NĂNG thực sự thêm sản phẩm vào giỏ hàng của user — không phải chỉ gửi link. Dùng tool này MỖI KHI user muốn mua / thêm vào giỏ / "thêm giúp tôi" / "đặt giùm" / xác nhận mua. Quy trình: lần đầu user hỏi mua → tìm sản phẩm bằng search_products, hỏi xác nhận "Bạn xác nhận thêm X vào giỏ chứ?". Khi user đáp "ok/đồng ý/thêm đi/yes/đúng/được/thêm vào giỏ giúp tôi" → GỌI tool này với confirmed=true. TUYỆT ĐỐI KHÔNG bảo user "tự nhấn link" — bạn làm được trực tiếp.',
      parameters: {
        type: 'object',
        properties: {
          productId: {
            type: 'number',
            description: 'ID của sản phẩm cần thêm.',
          },
          quantity: {
            type: 'number',
            description: 'Số lượng muốn thêm. Mặc định 1.',
          },
          confirmed: {
            type: 'boolean',
            description: 'Phải bằng true. Chưa xác nhận thì KHÔNG gọi tool, hãy hỏi user trước.',
          },
        },
        required: ['productId', 'confirmed'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_products',
      description:
        'Tìm kiếm sản phẩm trong cửa hàng Classic Records theo từ khóa, danh mục hoặc khoảng giá. Dùng khi khách hỏi về sản phẩm, đĩa nhạc, nghệ sĩ, vinyl, cd, merch, hoặc muốn tìm theo giá.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Từ khóa tìm kiếm (tên sản phẩm, nghệ sĩ, mô tả). Để trống nếu không có.',
          },
          category: {
            type: 'string',
            enum: ['vinyl', 'cd', 'merch'],
            description: 'Lọc theo danh mục sản phẩm.',
          },
          max_price: {
            type: 'number',
            description: 'Giá tối đa (USD).',
          },
          limit: {
            type: 'number',
            description: 'Số lượng kết quả tối đa, mặc định 5.',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_product_details',
      description: 'Lấy thông tin chi tiết của một sản phẩm theo ID.',
      parameters: {
        type: 'object',
        properties: {
          productId: { type: 'number', description: 'ID của sản phẩm.' },
        },
        required: ['productId'],
      },
    },
  },
];

const USER_TOOLS: ToolDef[] = [
  {
    type: 'function',
    function: {
      name: 'get_my_orders',
      description:
        'Lấy danh sách đơn hàng của chính user đang đăng nhập. Cần đăng nhập. Trả về id, trạng thái, tổng tiền, sản phẩm.',
      parameters: { type: 'object', properties: {} },
    },
  },
];

const ADMIN_TOOLS: ToolDef[] = [
  {
    type: 'function',
    function: {
      name: 'list_all_orders',
      description:
        'CHỈ ADMIN: Liệt kê tất cả đơn hàng trong hệ thống, có thể lọc theo trạng thái.',
      parameters: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['PENDING', 'COMPLETED', 'CANCELLED'],
            description: 'Lọc theo trạng thái đơn hàng.',
          },
          limit: { type: 'number', description: 'Số lượng tối đa, mặc định 10.' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_order_details',
      description: 'CHỈ ADMIN: Lấy thông tin chi tiết một đơn hàng theo ID.',
      parameters: {
        type: 'object',
        properties: {
          orderId: { type: 'string', description: 'ID đơn hàng (UUID).' },
        },
        required: ['orderId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_order_status',
      description:
        'CHỈ ADMIN: Cập nhật trạng thái đơn hàng. LUÔN xác nhận với user trước khi gọi tool này.',
      parameters: {
        type: 'object',
        properties: {
          orderId: { type: 'string', description: 'ID đơn hàng.' },
          status: {
            type: 'string',
            enum: ['PENDING', 'COMPLETED', 'CANCELLED'],
            description: 'Trạng thái mới.',
          },
          confirmed: {
            type: 'boolean',
            description:
              'Phải bằng true để xác nhận. Nếu user chưa xác nhận rõ ràng, hãy hỏi lại thay vì gọi tool.',
          },
        },
        required: ['orderId', 'status', 'confirmed'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'delete_order',
      description:
        'CHỈ ADMIN: XÓA VĨNH VIỄN đơn hàng khỏi hệ thống. Hành động này KHÔNG THỂ HOÀN TÁC. BẮT BUỘC phải hỏi xác nhận rõ ràng từ user và chỉ gọi khi user đã đồng ý.',
      parameters: {
        type: 'object',
        properties: {
          orderId: { type: 'string', description: 'ID đơn hàng cần xóa.' },
          confirmed: {
            type: 'boolean',
            description:
              'Phải bằng true. Nếu user chưa nói "đồng ý/xác nhận/xóa đi" thì KHÔNG được gọi tool, hãy hỏi lại.',
          },
        },
        required: ['orderId', 'confirmed'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_statistics',
      description:
        'CHỈ ADMIN: Lấy thống kê tổng quan (số user, số sản phẩm, số đơn, doanh thu).',
      parameters: { type: 'object', properties: {} },
    },
  },
];

export function getToolsForRole(role: UserContext['role']): ToolDef[] {
  if (role === 'ADMIN') return [...PUBLIC_TOOLS, ...USER_TOOLS, ...ADMIN_TOOLS];
  if (role === 'USER') return [...PUBLIC_TOOLS, ...USER_TOOLS];
  return PUBLIC_TOOLS;
}

const trimProduct = (p: any) => ({
  id: p.id,
  title: p.title,
  artist: p.artist,
  price: p.price,
  category: p.category,
  stock: p.stock,
  imgUrl: p.imgUrl,
  description: p.description ?? null,
});

const trimOrder = (o: any) => ({
  id: o.id,
  status: o.status,
  totalAmount: o.totalAmount,
  customerEmail: o.customerEmail,
  customerPhone: o.customerPhone,
  shippingAddr: o.shippingAddr,
  createdAt: o.createdAt,
  user: o.user
    ? { id: o.user.id, fullName: o.user.fullName, email: o.user.email }
    : null,
  items: (o.orderItems || []).map((it: any) => ({
    productId: it.productId,
    title: it.product?.title,
    quantity: it.quantity,
    priceAtTime: it.priceAtTime,
  })),
});

export interface ToolExecutionResult {
  result: any;
  action?: { type: 'add_to_cart'; product: any; quantity: number };
}

export async function executeTool(
  name: string,
  args: any,
  ctx: UserContext,
): Promise<ToolExecutionResult> {
  switch (name) {
    case 'add_to_cart': {
      if (!args.confirmed) {
        return {
          result: {
            error:
              'Chưa xác nhận. Tuyệt đối KHÔNG thêm vào giỏ khi user chưa đồng ý rõ ràng. Hãy hỏi lại.',
          },
        };
      }
      const product = await productRepository.findById(Number(args.productId));
      if (!product) {
        return { result: { error: 'Không tìm thấy sản phẩm với ID đó.' } };
      }
      const quantity = Math.max(1, Math.floor(Number(args.quantity) || 1));
      if (product.stock < quantity) {
        return {
          result: {
            error: `Sản phẩm "${product.title}" chỉ còn ${product.stock} trong kho, không đủ ${quantity}.`,
          },
        };
      }
      return {
        result: {
          success: true,
          message: `Đã thêm ${quantity} x "${product.title}" vào giỏ.`,
          product: trimProduct(product),
          quantity,
        },
        action: {
          type: 'add_to_cart',
          product: trimProduct(product),
          quantity,
        },
      };
    }

    case 'search_products': {
      const all = await productRepository.findMany(args.category);
      const query = (args.query || '').toLowerCase().trim();
      let filtered = all;
      if (query) {
        filtered = filtered.filter((p: any) =>
          `${p.title} ${p.artist} ${p.category} ${p.description || ''}`
            .toLowerCase()
            .includes(query),
        );
      }
      if (typeof args.max_price === 'number') {
        filtered = filtered.filter((p: any) => p.price <= args.max_price);
      }
      const limit = typeof args.limit === 'number' ? args.limit : 5;
      return {
        result: {
          count: filtered.length,
          products: filtered.slice(0, limit).map(trimProduct),
        },
      };
    }

    case 'get_product_details': {
      const product = await productRepository.findById(Number(args.productId));
      if (!product) return { result: { error: 'Không tìm thấy sản phẩm.' } };
      return { result: trimProduct(product) };
    }

    case 'get_my_orders': {
      if (!ctx.userId) {
        return { result: { error: 'Bạn cần đăng nhập để xem đơn hàng của mình.' } };
      }
      const orders = await orderRepository.findMyOrders(ctx.userId);
      return {
        result: {
          count: orders.length,
          orders: orders.map(trimOrder),
        },
      };
    }

    case 'list_all_orders': {
      if (ctx.role !== 'ADMIN') return { result: { error: 'Chỉ admin được dùng chức năng này.' } };
      const result: any = await adminService.getOrders();
      const all: any[] = Array.isArray(result) ? result : result.data || [];
      const filtered = args.status ? all.filter((o) => o.status === args.status) : all;
      const limit = typeof args.limit === 'number' ? args.limit : 10;
      return {
        result: {
          count: filtered.length,
          orders: filtered.slice(0, limit).map(trimOrder),
        },
      };
    }

    case 'get_order_details': {
      if (ctx.role !== 'ADMIN') return { result: { error: 'Chỉ admin được dùng chức năng này.' } };
      const order = await adminRepository.findOrderById(String(args.orderId));
      if (!order) return { result: { error: 'Không tìm thấy đơn hàng.' } };
      return { result: trimOrder(order) };
    }

    case 'update_order_status': {
      if (ctx.role !== 'ADMIN') return { result: { error: 'Chỉ admin được dùng chức năng này.' } };
      if (!args.confirmed) {
        return {
          result: { error: 'Chưa xác nhận. Hãy hỏi user xác nhận trước khi cập nhật trạng thái.' },
        };
      }
      try {
        const updated = await adminService.updateOrderStatus(
          String(args.orderId),
          String(args.status),
        );
        return {
          result: { success: true, order: { id: updated.id, status: updated.status } },
        };
      } catch (e: any) {
        return { result: { error: e?.message || 'Lỗi khi cập nhật đơn hàng.' } };
      }
    }

    case 'delete_order': {
      if (ctx.role !== 'ADMIN') return { result: { error: 'Chỉ admin được phép xóa đơn hàng.' } };
      if (!args.confirmed) {
        return {
          result: { error: 'Chưa xác nhận. Tuyệt đối KHÔNG xóa khi user chưa đồng ý rõ ràng.' },
        };
      }
      try {
        const deleted = await adminService.deleteOrder(String(args.orderId));
        return { result: { success: true, deletedOrderId: deleted.id } };
      } catch (e: any) {
        if (e?.code === 'P2025') return { result: { error: 'Đơn hàng không tồn tại.' } };
        return { result: { error: e?.message || 'Lỗi khi xóa đơn hàng.' } };
      }
    }

    case 'get_statistics': {
      if (ctx.role !== 'ADMIN') return { result: { error: 'Chỉ admin được dùng chức năng này.' } };
      return { result: await adminService.getStats() };
    }

    default:
      return { result: { error: `Tool không tồn tại: ${name}` } };
  }
}
