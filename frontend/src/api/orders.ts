import request from './request';
import {
  CreateOrderRequest,
  GroupOrderListItem,
  OrderDetail,
  AddOrderItemRequest,
  UpdateOrderItemRequest,
} from '../types';

export function getMerchants() {
  return request.get<any, { merchants: string[] }>('/orders/merchants');
}

export function createOrder(data: CreateOrderRequest) {
  return request.post<any, { orderId: string }>('/orders', data);
}

export function getOrders(status: 'all' | 'active' | 'finished' = 'all') {
  return request.get<any, { orders: GroupOrderListItem[] }>('/orders', {
    params: { status },
  });
}

export function getOrderDetail(id: string) {
  return request.get<any, OrderDetail>(`/orders/${id}`);
}

export function joinOrder(id: string) {
  return request.post<any, OrderDetail>(`/orders/${id}/join`);
}

export function leaveOrder(id: string) {
  return request.post<any, OrderDetail>(`/orders/${id}/leave`);
}

export function finishOrder(id: string) {
  return request.post<any, OrderDetail>(`/orders/${id}/finish`);
}

export function deleteOrder(id: string) {
  return request.delete<any, { success: boolean }>(`/orders/${id}`);
}

export function removeParticipant(id: string, userId: string) {
  return request.post<any, OrderDetail>(`/orders/${id}/remove-participant`, {
    userId,
  });
}

export function addOrderItem(id: string, data: AddOrderItemRequest) {
  return request.post<any, OrderDetail>(`/orders/${id}/items`, data);
}

export function updateOrderItem(
  id: string,
  itemId: string,
  data: UpdateOrderItemRequest
) {
  return request.put<any, OrderDetail>(`/orders/${id}/items/${itemId}`, data);
}

export function deleteOrderItem(id: string, itemId: string) {
  return request.delete<any, OrderDetail>(`/orders/${id}/items/${itemId}`);
}
