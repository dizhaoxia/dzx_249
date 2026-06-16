export interface User {
  id: string;
  phone: string;
  nickname: string;
  created_at?: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface RegisterRequest {
  phone: string;
  password: string;
  nickname: string;
}

export interface LoginRequest {
  phone: string;
  password: string;
}

export interface Merchant {
  id: string;
  name: string;
  cover_image: string | null;
  description: string | null;
  owner_id: string;
  is_shared: number;
  created_at: string;
  updated_at: string;
  dish_count?: number;
  is_preset?: boolean;
}

export interface Dish {
  id: string;
  merchant_id: string;
  name: string;
  price: number;
  image: string | null;
  category: string | null;
  created_at: string;
  updated_at: string;
}

export interface GroupOrder {
  id: string;
  name: string;
  merchant: string;
  merchant_id: string | null;
  deadline: string | null;
  min_participants: number;
  owner_id: string;
  status: 'active' | 'finished';
  created_at: string;
  finished_at: string | null;
}

export interface GroupOrderListItem extends GroupOrder {
  participant_count: number;
  total_amount: number;
}

export interface OrderItem {
  id: string;
  order_id: string;
  user_id: string;
  dish_name: string;
  price: number;
  quantity: number;
  dish_id: string | null;
  created_at: string;
  updated_at: string;
  nickname: string;
}

export interface Participant {
  order_id: string;
  user_id: string;
  joined_at: string;
  nickname: string;
}

export interface OrderDetail {
  order: GroupOrder;
  participants: Participant[];
  orderItems: OrderItem[];
  myAmount: number;
  totalAmount: number;
  participantCount: number;
  aaAmount: number;
  isOwner: boolean;
  isParticipant: boolean;
  merchant?: Merchant;
  dishes?: Dish[];
}

export interface CreateOrderRequest {
  name: string;
  merchant: string;
  merchant_id?: string;
  deadline?: string;
  min_participants?: number;
}

export interface AddOrderItemRequest {
  dish_name: string;
  price: number;
  quantity: number;
  dish_id?: string;
}

export interface UpdateOrderItemRequest {
  dish_name?: string;
  price?: number;
  quantity?: number;
}

export interface BatchAddOrderItemsRequest {
  items: Array<{
    dish_name: string;
    price: number;
    quantity: number;
    dish_id?: string;
  }>;
}

export interface CopyOrderItemsRequest {
  from_user_id: string;
}

export interface CreateMerchantRequest {
  name: string;
  cover_image?: string;
  description?: string;
  is_shared?: boolean;
}

export interface UpdateMerchantRequest {
  name?: string;
  cover_image?: string | null;
  description?: string | null;
  is_shared?: boolean;
}

export interface CreateDishRequest {
  name: string;
  price: number;
  image?: string;
  category?: string;
}

export interface UpdateDishRequest {
  name?: string;
  price?: number;
  image?: string | null;
  category?: string | null;
}

export interface UpdateOrderDeadlineRequest {
  deadline: string;
}

export interface UpdateOrderMinParticipantsRequest {
  min_participants: number;
}
