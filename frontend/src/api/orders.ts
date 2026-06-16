import request from './request';
import {
  CreateOrderRequest,
  GroupOrderListItem,
  OrderDetail,
  AddOrderItemRequest,
  UpdateOrderItemRequest,
  BatchAddOrderItemsRequest,
  CopyOrderItemsRequest,
  Merchant,
  Dish,
  CreateMerchantRequest,
  UpdateMerchantRequest,
  CreateDishRequest,
  UpdateDishRequest,
  UpdateOrderDeadlineRequest,
  UpdateOrderMinParticipantsRequest,
} from '../types';

export function getMerchants() {
  return request.get<any, { merchants: Merchant[] }>('/orders/merchants');
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

export function batchAddOrderItems(id: string, data: BatchAddOrderItemsRequest) {
  return request.post<any, OrderDetail>(`/orders/${id}/items/batch`, data);
}

export function copyOrderItems(id: string, data: CopyOrderItemsRequest) {
  return request.post<any, OrderDetail>(`/orders/${id}/items/copy`, data);
}

export function clearMyOrderItems(id: string) {
  return request.delete<any, OrderDetail>(`/orders/${id}/items/clear`);
}

export function updateOrderDeadline(
  id: string,
  data: UpdateOrderDeadlineRequest
) {
  return request.put<any, OrderDetail>(`/orders/${id}/deadline`, data);
}

export function updateOrderMinParticipants(
  id: string,
  data: UpdateOrderMinParticipantsRequest
) {
  return request.put<any, OrderDetail>(`/orders/${id}/min-participants`, data);
}

export function getMerchantList() {
  return request.get<any, { merchants: Merchant[] }>('/merchants');
}

export function getMerchantDetail(id: string) {
  return request.get<any, { merchant: Merchant; dishes: Dish[] }>(`/merchants/${id}`);
}

export function createMerchant(data: CreateMerchantRequest) {
  return request.post<any, { merchant: Merchant }>('/merchants', data);
}

export function updateMerchant(
  id: string,
  data: UpdateMerchantRequest
) {
  return request.put<any, { merchant: Merchant }>(`/merchants/${id}`, data);
}

export function deleteMerchant(id: string) {
  return request.delete<any, { success: boolean }>(`/merchants/${id}`);
}

export function getMerchantDishes(merchantId: string) {
  return request.get<any, { dishes: Dish[] }>(`/merchants/${merchantId}/dishes`);
}

export function createDish(
  merchantId: string,
  data: CreateDishRequest
) {
  return request.post<any, { dish: Dish }>(`/merchants/${merchantId}/dishes`, data);
}

export function updateDish(
  merchantId: string,
  dishId: string,
  data: UpdateDishRequest
) {
  return request.put<any, { dish: Dish }>(`/merchants/${merchantId}/dishes/${dishId}`, data);
}

export function deleteDish(merchantId: string, dishId: string) {
  return request.delete<any, { success: boolean }>(`/merchants/${merchantId}/dishes/${dishId}`);
}
