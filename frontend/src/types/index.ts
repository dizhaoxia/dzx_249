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

export interface GroupOrder {
  id: string;
  name: string;
  merchant: string;
  deadline: string | null;
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
}

export interface CreateOrderRequest {
  name: string;
  merchant: string;
  deadline?: string;
}

export interface AddOrderItemRequest {
  dish_name: string;
  price: number;
  quantity: number;
}

export interface UpdateOrderItemRequest {
  dish_name?: string;
  price?: number;
  quantity?: number;
}
