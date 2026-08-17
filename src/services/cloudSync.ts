import { TableOrder, RestaurantTable, MenuItem, ServiceCall, OrderStatus } from '../types';

export type CloudSyncEvent =
  | { type: 'NEW_ORDER' | 'new_order'; order?: TableOrder; data?: any }
  | { type: 'ORDER_STATUS' | 'order_status'; orderId?: string; status?: OrderStatus; itemId?: string; itemStatus?: string; tableNumber?: string; orderNumber?: string; message?: string; data?: any }
  | { type: 'PAY_ORDER' | 'order_paid'; orderId?: string; id?: string; paymentMethod?: string; tableNumber?: string; amount?: number; order?: TableOrder; transaction?: import('../types').CashTransaction; transactions?: import('../types').CashTransaction[]; data?: any }
  | { type: 'RESET_TABLE' | 'reset_table'; tableNumber?: string; data?: any }
  | { type: 'SERVICE_CALL' | 'service_call'; serviceCall?: ServiceCall; data?: any }
  | { type: 'RESOLVE_SERVICE_CALL' | 'service_call_resolved'; callId?: string; data?: any }
  | { type: 'MENU_UPDATE' | 'menu_update' | 'menu_updated'; menuItems?: MenuItem[]; data?: any }
  | { type: 'TABLES_UPDATE' | 'tables_update' | 'tables_updated'; tables?: RestaurantTable[]; data?: any }
  | { type: 'CASHFLOW_ADD' | 'cashflow_add' | 'cashflow_updated' | 'CASHFLOW_UPDATE' | 'cashflow_bulk_updated'; transaction?: import('../types').CashTransaction; transactions?: import('../types').CashTransaction[]; data?: any }
  | { type: 'CASHFLOW_DELETE' | 'cashflow_deleted'; transactionId?: string; data?: any }
  | { type: 'CASHFLOW_CLEAR' | 'cashflow_cleared'; data?: any }
  | { type: 'CASHFLOW_RESET' | 'cashflow_reset'; transactions?: import('../types').CashTransaction[]; data?: any }
  | { type: 'SYNC_STATE_REQUEST' }
  | { type: 'SYNC_STATE_RESPONSE'; state: { orders: TableOrder[]; tables: RestaurantTable[]; serviceCalls: ServiceCall[]; transactions?: import('../types').CashTransaction[] } };

// Unique channel identifier for this restaurant instance
const SYNC_TOPIC = 'nhahang_dinein_sync_a575441b47b64559';
const NTFY_PUBLISH_URL = `https://ntfy.sh/${SYNC_TOPIC}`;
const NTFY_SSE_URL = `https://ntfy.sh/${SYNC_TOPIC}/sse`;

// Cross-tab broadcast channel
const localBroadcast = typeof window !== 'undefined' && 'BroadcastChannel' in window
  ? new BroadcastChannel('nhahang_local_sync')
  : null;

let isCloudSSEConnected = false;
let isLocalServerAvailable = true;

/**
 * Publish an event to all connected devices (Phones, Kitchen, POS, Cashier)
 */
export async function broadcastRealtimeEvent(event: CloudSyncEvent): Promise<void> {
  const payload = JSON.stringify(event);

  // 1. Broadcast to local tabs on same device/browser (0ms latency)
  if (localBroadcast) {
    try {
      localBroadcast.postMessage(event);
    } catch {
      // Safe fallback
    }
  }

  // 2. Cross-window localStorage ping fallback
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('qr_realtime_ping', JSON.stringify({ event, t: Date.now() }));
    } catch {}
  }

  // 3. Broadcast to local backend server if available
  if (isLocalServerAvailable) {
    try {
      const res = await fetch('/api/sync-relay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload
      });
      if (!res.ok && res.status === 404) {
        isLocalServerAvailable = false;
      }
    } catch {
      isLocalServerAvailable = false;
    }
  }

  // 4. Broadcast to global Cloud Real-Time PubSub (ntfy.sh) - works across Cloudflare, 4G, Wifi, WAN
  try {
    fetch(NTFY_PUBLISH_URL, {
      method: 'POST',
      body: payload
    }).catch(err => {
      console.warn('[CLOUD_SYNC] Direct cloud publish warning:', err);
    });
  } catch (err) {
    console.warn('[CLOUD_SYNC] Direct cloud publish fallback:', err);
  }
}

/**
 * Subscribe to real-time events from all devices
 */
export function subscribeToRealtimeSync(
  onEvent: (event: CloudSyncEvent) => void,
  onStatusChange?: (status: { isCloudConnected: boolean; isLocalConnected: boolean; mode: 'server' | 'edge_cloud' | 'local_p2p' }) => void
): () => void {
  let isSubscribed = true;
  let sseCloud: EventSource | null = null;
  let sseLocal: EventSource | null = null;
  let reconnectTimer: NodeJS.Timeout | null = null;

  const notifyStatus = () => {
    if (onStatusChange) {
      onStatusChange({
        isCloudConnected: isCloudSSEConnected,
        isLocalConnected: isLocalServerAvailable,
        mode: isLocalServerAvailable ? 'server' : (isCloudSSEConnected ? 'edge_cloud' : 'local_p2p')
      });
    }
  };

  // Handler for incoming messages
  const handleIncomingMessage = (rawJson: string) => {
    if (!isSubscribed) return;
    try {
      if (typeof rawJson !== 'string') return;
      const data = JSON.parse(rawJson);
      if (data && data.type) {
        onEvent(data as CloudSyncEvent);
      }
    } catch {
      // Not a valid JSON payload
    }
  };

  // 1. Listen to Local Tab BroadcastChannel
  if (localBroadcast) {
    localBroadcast.onmessage = (e) => {
      if (!isSubscribed) return;
      if (e.data && e.data.type) {
        onEvent(e.data as CloudSyncEvent);
      }
    };
  }

  // 2. Storage event listener (for Safari / cross-window P2P)
  const handleStorageEvent = (e: StorageEvent) => {
    if (!isSubscribed) return;
    if (e.key === 'qr_realtime_ping' && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue);
        if (parsed && parsed.event && parsed.event.type) {
          onEvent(parsed.event as CloudSyncEvent);
        }
      } catch {}
    }
  };
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', handleStorageEvent);
  }

  // 3. Connect to Local Server SSE (if full-stack Node server exists)
  try {
    sseLocal = new EventSource('/api/events');
    sseLocal.onopen = () => {
      isLocalServerAvailable = true;
      notifyStatus();
    };
    sseLocal.onmessage = (e) => {
      handleIncomingMessage(e.data);
    };
    sseLocal.onerror = () => {
      // On Cloudflare Pages or static export, /api/events won't exist
      isLocalServerAvailable = false;
      if (sseLocal) {
        sseLocal.close();
        sseLocal = null;
      }
      notifyStatus();
    };
  } catch {
    isLocalServerAvailable = false;
  }

  // 4. Connect to Global Cloud Real-Time SSE (ntfy.sh)
  const connectCloudSSE = () => {
    if (!isSubscribed) return;
    try {
      sseCloud = new EventSource(NTFY_SSE_URL);

      sseCloud.onopen = () => {
        isCloudSSEConnected = true;
        notifyStatus();
      };
      
      sseCloud.onmessage = (e) => {
        try {
          const ntfyMsg = JSON.parse(e.data);
          // ntfy.sh wraps the body in ntfyMsg.message
          if (ntfyMsg && ntfyMsg.message) {
            handleIncomingMessage(ntfyMsg.message);
          } else if (ntfyMsg && ntfyMsg.type) {
            handleIncomingMessage(e.data);
          }
        } catch {
          handleIncomingMessage(e.data);
        }
      };

      sseCloud.onerror = () => {
        isCloudSSEConnected = false;
        notifyStatus();
        if (sseCloud) {
          sseCloud.close();
          sseCloud = null;
        }
        if (isSubscribed) {
          reconnectTimer = setTimeout(connectCloudSSE, 2500);
        }
      };
    } catch (err) {
      isCloudSSEConnected = false;
      notifyStatus();
      console.warn('[CLOUD_SYNC] SSE Connection error, retrying in 2.5s:', err);
      if (isSubscribed) {
        reconnectTimer = setTimeout(connectCloudSSE, 2500);
      }
    }
  };

  connectCloudSSE();

  // Cleanup function
  return () => {
    isSubscribed = false;
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', handleStorageEvent);
    }
    if (reconnectTimer) clearTimeout(reconnectTimer);
    if (sseCloud) sseCloud.close();
    if (sseLocal) sseLocal.close();
  };
}
