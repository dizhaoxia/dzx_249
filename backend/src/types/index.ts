export interface User {
  id: string;
  phone: string;
  password: string;
  nickname: string;
  created_at: string;
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

export interface OrderItem {
  id: string;
  order_id: string;
  user_id: string;
  dish_name: string;
  price: number;
  quantity: number;
  created_at: string;
  updated_at: string;
}

export interface Participant {
  order_id: string;
  user_id: string;
  joined_at: string;
}

export interface JwtPayload {
  userId: string;
  phone: string;
  nickname: string;
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
