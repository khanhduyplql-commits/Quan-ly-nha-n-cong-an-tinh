import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { INITIAL_MENU_ITEMS, INITIAL_TABLES, INITIAL_ORDERS, INITIAL_TRANSACTIONS } from "./src/data/mockData";
import { TableOrder, RestaurantTable, MenuItem, ServiceCall, CashTransaction } from "./src/types";

// Persistent disk storage path
const DATA_FILE = path.join(process.cwd(), "restaurant_data.json");

// Helper to load persistent state from disk or fallback to initial
function loadInitialData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, "utf-8");
      const parsed = JSON.parse(content);
      return {
        menuItems: parsed.menuItems || [...INITIAL_MENU_ITEMS],
        tables: (parsed.tables && parsed.tables.length >= 30) ? parsed.tables : [...INITIAL_TABLES],
        orders: parsed.orders || [...INITIAL_ORDERS],
        serviceCalls: parsed.serviceCalls || [],
        transactions: parsed.transactions || [...INITIAL_TRANSACTIONS]
      };
    }
  } catch (err) {
    console.warn("[STORAGE] Could not load saved data, initializing defaults:", err);
  }
  return {
    menuItems: [...INITIAL_MENU_ITEMS],
    tables: [...INITIAL_TABLES],
    orders: [...INITIAL_ORDERS],
    transactions: [...INITIAL_TRANSACTIONS],
    serviceCalls: [
      {
        id: 'sc-1',
        tableNumber: '03',
        tableName: 'Bàn 03',
        type: 'refill_water',
        message: 'Xin thêm bình trà đá',
        createdAt: Date.now() - 1000 * 60 * 5,
        status: 'pending'
      } as ServiceCall
    ]
  };
}

const initialSaved = loadInitialData();
let serverMenuItems: MenuItem[] = initialSaved.menuItems;
let serverTables: RestaurantTable[] = initialSaved.tables;
let serverOrders: TableOrder[] = initialSaved.orders;
let serverServiceCalls: ServiceCall[] = initialSaved.serviceCalls;
let serverTransactions: CashTransaction[] = initialSaved.transactions;
let lastUpdated = Date.now();

// Connected SSE clients for live push
const sseClients: express.Response[] = [];

function saveStateToDisk() {
  try {
    const payload = JSON.stringify({
      menuItems: serverMenuItems,
      tables: serverTables,
      orders: serverOrders,
      serviceCalls: serverServiceCalls,
      transactions: serverTransactions,
      lastUpdated
    }, null, 2);
    fs.writeFileSync(DATA_FILE, payload, "utf-8");
  } catch (err) {
    console.error("[STORAGE] Failed to write restaurant_data.json:", err);
  }
}

function broadcastUpdate(type: string, data?: unknown) {
  lastUpdated = Date.now();
  saveStateToDisk();
  const message = `data: ${JSON.stringify({ type, data, lastUpdated })}\n\n`;
  for (let i = sseClients.length - 1; i >= 0; i--) {
    try {
      sseClients[i].write(message);
    } catch {
      sseClients.splice(i, 1);
    }
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // CORS middleware for all origins & mobile devices
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });

  app.use(express.json());

  // 1. Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: Date.now(), ordersCount: serverOrders.length });
  });

  // 2. Server-Sent Events (SSE) for zero-delay push to Kitchen & POS
  app.get("/api/events", (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    sseClients.push(res);

    // Send initial ping
    res.write(`data: ${JSON.stringify({ type: 'connected', time: Date.now() })}\n\n`);

    req.on("close", () => {
      const idx = sseClients.indexOf(res);
      if (idx !== -1) {
        sseClients.splice(idx, 1);
      }
    });
  });

  // 3. Full State Synchronization Endpoint
  app.get("/api/state", (req, res) => {
    res.json({
      menuItems: serverMenuItems,
      tables: serverTables,
      orders: serverOrders,
      serviceCalls: serverServiceCalls,
      transactions: serverTransactions,
      lastUpdated
    });
  });

  // 4. Create New Order (From Customer Phone or POS)
  app.post("/api/orders", (req, res) => {
    try {
      const orderData = req.body as TableOrder;
      if (!orderData || !orderData.items || orderData.items.length === 0) {
        return res.status(400).json({ error: "Invalid order data" });
      }

      const newOrder: TableOrder = {
        ...orderData,
        id: orderData.id || `ord-${Date.now()}`,
        createdAt: orderData.createdAt || Date.now(),
        status: orderData.status || 'pending',
        paymentStatus: orderData.paymentStatus || 'unpaid'
      };

      // Ensure no duplicate if client retried
      const existingIdx = serverOrders.findIndex(o => o.id === newOrder.id);
      if (existingIdx !== -1) {
        serverOrders[existingIdx] = newOrder;
      } else {
        serverOrders = [newOrder, ...serverOrders];
      }

      // Update table status to eating
      serverTables = serverTables.map(t => {
        if (t.number === newOrder.tableNumber) {
          return {
            ...t,
            status: 'eating',
            activeOrderId: newOrder.id
          };
        }
        return t;
      });

      console.log(`[ORDER CREATED] Table ${newOrder.tableNumber} - Order #${newOrder.orderNumber} (${newOrder.totalAmount} VND)`);
      broadcastUpdate('new_order', newOrder);

      return res.status(201).json({ success: true, order: newOrder });
    } catch (err) {
      console.error("Error creating order:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // 5. Update Order Status (Kitchen cooking/served, etc.)
  app.patch("/api/orders/:id/status", (req, res) => {
    const { id } = req.params;
    const { status, itemId, itemStatus } = req.body;

    let updated = false;

    serverOrders = serverOrders.map(o => {
      if (o.id === id) {
        updated = true;
        if (itemId && itemStatus) {
          const nextItems = o.items.map(item => item.id === itemId ? { ...item, status: itemStatus } : item);
          const allServed = nextItems.every(i => i.status === 'served' || i.status === 'cancelled');
          const anyCooking = nextItems.some(i => i.status === 'cooking');
          const nextOrderStatus = allServed ? 'served' : (anyCooking ? 'cooking' : o.status);
          return { ...o, items: nextItems, status: nextOrderStatus };
        } else if (status) {
          const updatedItems = o.items.map(item => ({
            ...item,
            status: status === 'served' ? ('served' as const) : item.status
          }));
          return { ...o, status, items: updatedItems };
        }
      }
      return o;
    });

    if (updated) {
      broadcastUpdate('order_status_updated', { id, status });
      return res.json({ success: true });
    }
    return res.status(404).json({ error: "Order not found" });
  });

  // 6. Pay Order
  app.post("/api/orders/:id/pay", (req, res) => {
    const { id } = req.params;
    const { paymentMethod, amount, order: incomingOrder } = req.body;

    let foundOrder: TableOrder | undefined = serverOrders.find(o => o.id === id);

    if (!foundOrder && incomingOrder) {
      foundOrder = incomingOrder;
      serverOrders = [incomingOrder, ...serverOrders];
    }

    if (foundOrder) {
      serverOrders = serverOrders.map(o => {
        if (o.id === id) {
          return {
            ...o,
            paymentStatus: 'paid',
            status: 'paid',
            paymentMethod: paymentMethod || o.paymentMethod || 'vietqr'
          };
        }
        return o;
      });

      // Only set table to empty if no remaining unpaid orders exist for this table
      const remainingUnpaidForTable = serverOrders.filter(
        o => o.tableNumber === foundOrder?.tableNumber && o.id !== id && o.paymentStatus === 'unpaid'
      );
      if (remainingUnpaidForTable.length === 0) {
        serverTables = serverTables.map(t => {
          if (t.number === foundOrder?.tableNumber) {
            return { ...t, status: 'empty', activeOrderId: undefined };
          }
          return t;
        });
      }

      const effectivePaid = (typeof amount === 'number' && amount > 0) ? amount : foundOrder.totalAmount;

      // Auto-record Income transaction in Cashflow ledger if not already recorded
      const existingTxIdx = serverTransactions.findIndex(tx => tx.orderId === foundOrder?.id);
      const d = new Date();
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      const itemsSummary = foundOrder.items && foundOrder.items.length > 0 
        ? foundOrder.items.map(i => `${i.name} (x${i.quantity})`).join(', ')
        : 'Thực đơn gọi món';

      const autoReceipt: CashTransaction = {
        id: `tx-auto-${foundOrder.id}-${Date.now()}`,
        receiptNumber: `PT-${dateStr.replace(/-/g, '')}-${String(serverTransactions.length + 1).padStart(3, '0')}`,
        type: 'income',
        category: 'sales',
        categoryName: 'Doanh thu bán hàng',
        amount: effectivePaid,
        title: `Thu tiền ${foundOrder.tableName || `Bàn ${foundOrder.tableNumber}`} (${foundOrder.orderNumber})`,
        description: `Thanh toán ${(paymentMethod || foundOrder.paymentMethod || 'vietqr').toUpperCase()}. Món: ${itemsSummary}`,
        paymentMethod: (paymentMethod || foundOrder.paymentMethod || 'vietqr') as any,
        recordedBy: 'Hệ thống POS Thu ngân',
        payerOrRecipient: foundOrder.customerName || `Khách ${foundOrder.tableName || `Bàn ${foundOrder.tableNumber}`}`,
        createdAt: Date.now(),
        dateString: dateStr,
        orderId: foundOrder.id,
        tableNumber: foundOrder.tableNumber
      };

      if (existingTxIdx !== -1) {
        serverTransactions[existingTxIdx] = autoReceipt;
      } else if (effectivePaid > 0) {
        serverTransactions = [autoReceipt, ...serverTransactions];
      }
      console.log(`[CASHFLOW] Auto-recorded income: ${effectivePaid} VND for order ${foundOrder.orderNumber}`);

      saveStateToDisk();
      broadcastUpdate('order_paid', { id, tableNumber: foundOrder.tableNumber, transactions: serverTransactions });
      broadcastUpdate('cashflow_updated', serverTransactions);
      return res.json({ success: true, transactions: serverTransactions, transaction: autoReceipt });
    }

    return res.status(404).json({ error: "Order not found" });
  });

  // 6b. Pay Multiple Orders in Batch (e.g. multiple rounds/guests at the same table)
  app.post("/api/orders/pay-batch", (req, res) => {
    const { payments } = req.body;
    if (!Array.isArray(payments) || payments.length === 0) {
      return res.status(400).json({ error: "Invalid payments array" });
    }

    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    const processedReceipts: CashTransaction[] = [];
    const affectedTableNumbers = new Set<string>();

    for (let idx = 0; idx < payments.length; idx++) {
      const item = payments[idx];
      const { id, paymentMethod, amount, order: incomingOrder } = item;
      let foundOrder = serverOrders.find(o => o.id === id);
      if (!foundOrder && incomingOrder) {
        foundOrder = incomingOrder;
        serverOrders = [incomingOrder, ...serverOrders];
      }
      if (!foundOrder) continue;

      affectedTableNumbers.add(foundOrder.tableNumber);

      // Mark order paid
      serverOrders = serverOrders.map(o => {
        if (o.id === id) {
          return {
            ...o,
            paymentStatus: 'paid',
            status: 'paid',
            paymentMethod: paymentMethod || o.paymentMethod || 'vietqr'
          };
        }
        return o;
      });

      const effectivePaid = (typeof amount === 'number' && amount > 0) ? amount : foundOrder.totalAmount;
      if (effectivePaid > 0) {
        const existingTxIdx = serverTransactions.findIndex(tx => tx.orderId === foundOrder?.id);
        const itemsSummary = foundOrder.items && foundOrder.items.length > 0 
          ? foundOrder.items.map(i => `${i.name} (x${i.quantity})`).join(', ')
          : 'Thực đơn gọi món';

        const autoReceipt: CashTransaction = {
          id: `tx-auto-${foundOrder.id}-${Date.now()}-${idx}`,
          receiptNumber: `PT-${dateStr.replace(/-/g, '')}-${String(serverTransactions.length + processedReceipts.length + 1).padStart(3, '0')}`,
          type: 'income',
          category: 'sales',
          categoryName: 'Doanh thu bán hàng',
          amount: effectivePaid,
          title: `Thu tiền ${foundOrder.tableName || `Bàn ${foundOrder.tableNumber}`} (${foundOrder.orderNumber})`,
          description: `Thanh toán ${(paymentMethod || foundOrder.paymentMethod || 'vietqr').toUpperCase()}. Món: ${itemsSummary}`,
          paymentMethod: (paymentMethod || foundOrder.paymentMethod || 'vietqr') as any,
          recordedBy: 'Hệ thống POS Thu ngân',
          payerOrRecipient: foundOrder.customerName || `Khách ${foundOrder.tableName || `Bàn ${foundOrder.tableNumber}`}`,
          createdAt: Date.now() + idx,
          dateString: dateStr,
          orderId: foundOrder.id,
          tableNumber: foundOrder.tableNumber
        };

        if (existingTxIdx !== -1) {
          serverTransactions[existingTxIdx] = autoReceipt;
        } else {
          serverTransactions = [autoReceipt, ...serverTransactions];
        }
        processedReceipts.push(autoReceipt);
      }
    }

    // Check table status for each affected table
    affectedTableNumbers.forEach(tableNum => {
      const remainingUnpaid = serverOrders.filter(
        o => o.tableNumber === tableNum && o.paymentStatus === 'unpaid'
      );
      if (remainingUnpaid.length === 0) {
        serverTables = serverTables.map(t => {
          if (t.number === tableNum) {
            return { ...t, status: 'empty', activeOrderId: undefined };
          }
          return t;
        });
      }
    });

    saveStateToDisk();
    broadcastUpdate('orders_paid_batch', { payments, receipts: processedReceipts, transactions: serverTransactions });
    broadcastUpdate('cashflow_updated', serverTransactions);
    return res.json({ success: true, transactions: serverTransactions, receipts: processedReceipts });
  });

  // 7. Reset Table Session
  app.post("/api/tables/:tableNumber/reset", (req, res) => {
    const { tableNumber } = req.params;
    serverTables = serverTables.map(t => t.number === tableNumber ? { ...t, status: 'empty', activeOrderId: undefined } : t);
    serverOrders = serverOrders.map(o => (o.tableNumber === tableNumber && o.paymentStatus === 'unpaid') ? { ...o, paymentStatus: 'paid', status: 'paid' } : o);
    broadcastUpdate('table_reset', { tableNumber });
    return res.json({ success: true });
  });

  // 8. Service Calls
  app.post("/api/service-calls", (req, res) => {
    const newCall = req.body as ServiceCall;
    if (!newCall || !newCall.tableNumber) {
      return res.status(400).json({ error: "Invalid service call" });
    }
    serverServiceCalls = [newCall, ...serverServiceCalls];
    broadcastUpdate('new_service_call', newCall);
    return res.status(201).json({ success: true, serviceCall: newCall });
  });

  app.patch("/api/service-calls/:id/resolve", (req, res) => {
    const { id } = req.params;
    serverServiceCalls = serverServiceCalls.map(c => c.id === id ? { ...c, status: 'resolved' } : c);
    broadcastUpdate('service_call_resolved', { id });
    return res.json({ success: true });
  });

  // 9. Menu items management
  app.get("/api/menu", (req, res) => {
    res.json(serverMenuItems);
  });

  app.put("/api/menu", (req, res) => {
    if (Array.isArray(req.body) && req.body.length > 0) {
      serverMenuItems = req.body;
      broadcastUpdate('menu_updated', serverMenuItems);
      console.log(`[MENU] Updated full menu with ${serverMenuItems.length} items`);
      return res.json({ success: true, count: serverMenuItems.length });
    }
    return res.status(400).json({ error: "Invalid menu data" });
  });

  app.post("/api/menu", (req, res) => {
    try {
      const dish = req.body as MenuItem;
      if (!dish || !dish.name) {
        return res.status(400).json({ error: "Missing dish name" });
      }
      const newDish: MenuItem = {
        ...dish,
        id: dish.id || `m-${Date.now()}`
      };
      serverMenuItems = [newDish, ...serverMenuItems];
      broadcastUpdate('menu_updated', serverMenuItems);
      console.log(`[MENU] Added new dish: ${newDish.name}`);
      return res.status(201).json({ success: true, dish: newDish });
    } catch (err) {
      return res.status(500).json({ error: "Failed to add dish" });
    }
  });

  app.put("/api/menu/:id", (req, res) => {
    const { id } = req.params;
    const dishData = req.body;
    let found = false;
    serverMenuItems = serverMenuItems.map(item => {
      if (item.id === id) {
        found = true;
        return { ...item, ...dishData, id };
      }
      return item;
    });
    if (found) {
      broadcastUpdate('menu_updated', serverMenuItems);
      console.log(`[MENU] Updated dish ${id}`);
      return res.json({ success: true, menu: serverMenuItems });
    }
    return res.status(404).json({ error: "Dish not found" });
  });

  app.delete("/api/menu/:id", (req, res) => {
    const { id } = req.params;
    const initialLen = serverMenuItems.length;
    serverMenuItems = serverMenuItems.filter(item => item.id !== id);
    if (serverMenuItems.length !== initialLen) {
      broadcastUpdate('menu_updated', serverMenuItems);
      console.log(`[MENU] Deleted dish ${id}`);
      return res.json({ success: true, menu: serverMenuItems });
    }
    return res.status(404).json({ error: "Dish not found" });
  });

  // 10. Tables management
  app.put("/api/tables", (req, res) => {
    if (Array.isArray(req.body)) {
      serverTables = req.body;
      broadcastUpdate('tables_updated', serverTables);
      return res.json({ success: true });
    }
    return res.status(400).json({ error: "Invalid tables data" });
  });

  // 11. Real-time Event Relay
  app.post("/api/sync-relay", (req, res) => {
    const event = req.body;
    if (event && event.type) {
      if (event.type === 'NEW_ORDER' && event.order) {
        const o = event.order;
        const existingIdx = serverOrders.findIndex(existing => existing.id === o.id);
        if (existingIdx === -1) {
          serverOrders = [o, ...serverOrders];
        } else {
          serverOrders[existingIdx] = o;
        }
        serverTables = serverTables.map(t => t.number === o.tableNumber ? { ...t, status: 'eating', activeOrderId: o.id } : t);
        saveStateToDisk();
      } else if (event.type === 'ORDER_STATUS' && event.orderId) {
        serverOrders = serverOrders.map(o => {
          if (o.id === event.orderId) {
            if (event.itemId && event.itemStatus) {
              const nextItems = o.items.map(i => i.id === event.itemId ? { ...i, status: event.itemStatus as any } : i);
              return { ...o, items: nextItems, status: event.status || o.status };
            }
            return { ...o, status: event.status || o.status };
          }
          return o;
        });
        saveStateToDisk();
      } else if ((event.type === 'PAY_ORDER' || event.type === 'order_paid') && (event.orderId || event.data?.payments || event.data?.orderId)) {
        if (event.data?.payments && Array.isArray(event.data.payments)) {
          // Batch payment
          const payments = event.data.payments;
          payments.forEach((p: any) => {
            serverOrders = serverOrders.map(o => o.id === p.id ? { ...o, paymentStatus: 'paid', status: 'paid', paymentMethod: p.paymentMethod || o.paymentMethod } : o);
          });
          if (event.data.transactions && Array.isArray(event.data.transactions)) {
            event.data.transactions.forEach((incomingTx: CashTransaction) => {
              const eIdx = serverTransactions.findIndex(t => t.id === incomingTx.id || (incomingTx.orderId && t.orderId === incomingTx.orderId));
              if (eIdx !== -1) {
                serverTransactions[eIdx] = incomingTx;
              } else {
                serverTransactions = [incomingTx, ...serverTransactions];
              }
            });
          }
          saveStateToDisk();
        } else {
          const targetOrderId = event.orderId || event.data?.orderId;
          const pOrder = serverOrders.find(o => o.id === targetOrderId) || event.order;
          if (pOrder) {
            serverOrders = serverOrders.map(o => o.id === targetOrderId ? { ...o, paymentStatus: 'paid', status: 'paid', paymentMethod: event.paymentMethod || o.paymentMethod } : o);
            
            const remainingUnpaid = serverOrders.filter(o => o.tableNumber === (event.tableNumber || pOrder.tableNumber) && o.id !== targetOrderId && o.paymentStatus === 'unpaid');
            if (remainingUnpaid.length === 0) {
              serverTables = serverTables.map(t => t.number === (event.tableNumber || pOrder.tableNumber) ? { ...t, status: 'empty', activeOrderId: undefined } : t);
            }

            const effectivePaid = event.amount || pOrder.totalAmount;
            const existingTxIdx = serverTransactions.findIndex(tx => tx.orderId === pOrder.id);
            const d = new Date();
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            const dateStr = `${year}-${month}-${day}`;

            const autoReceipt: CashTransaction = event.transaction || {
              id: `tx-auto-${pOrder.id}-${Date.now()}`,
              receiptNumber: `PT-${dateStr.replace(/-/g, '')}-${String(serverTransactions.length + 1).padStart(3, '0')}`,
              type: 'income',
              category: 'sales',
              categoryName: 'Doanh thu bán hàng',
              amount: effectivePaid,
              title: `Thu tiền ${pOrder.tableName || `Bàn ${pOrder.tableNumber}`} (${pOrder.orderNumber})`,
              description: `Thanh toán ${(event.paymentMethod || pOrder.paymentMethod || 'vietqr').toUpperCase()}`,
              paymentMethod: (event.paymentMethod || pOrder.paymentMethod || 'vietqr') as any,
              recordedBy: 'Hệ thống POS Thu ngân',
              payerOrRecipient: pOrder.customerName || `Khách Bàn ${pOrder.tableNumber}`,
              createdAt: Date.now(),
              dateString: dateStr,
              orderId: pOrder.id,
              tableNumber: pOrder.tableNumber
            };

            if (existingTxIdx !== -1) {
              serverTransactions[existingTxIdx] = autoReceipt;
            } else if (effectivePaid > 0) {
              serverTransactions = [autoReceipt, ...serverTransactions];
            }
            saveStateToDisk();
          }
        }
      } else if (event.type === 'RESET_TABLE' && event.tableNumber) {
        serverTables = serverTables.map(t => t.number === event.tableNumber ? { ...t, status: 'empty', activeOrderId: undefined } : t);
        saveStateToDisk();
      } else if (event.type === 'SERVICE_CALL' && event.serviceCall) {
        const sc = event.serviceCall;
        if (!serverServiceCalls.some(existing => existing.id === sc.id)) {
          serverServiceCalls = [sc, ...serverServiceCalls];
        }
        saveStateToDisk();
      } else if (event.type === 'RESOLVE_SERVICE_CALL' && event.callId) {
        serverServiceCalls = serverServiceCalls.map(c => c.id === event.callId ? { ...c, status: 'resolved' } : c);
        saveStateToDisk();
      } else if (event.type === 'MENU_UPDATE' && Array.isArray(event.menuItems) && event.menuItems.length > 0) {
        serverMenuItems = event.menuItems;
        saveStateToDisk();
      } else if (event.type === 'TABLES_UPDATE' && Array.isArray(event.tables)) {
        serverTables = event.tables;
        saveStateToDisk();
      } else if (event.type === 'CASHFLOW_ADD' && event.transaction) {
        const tx = event.transaction;
        const existingIdx = serverTransactions.findIndex(
          t => t.id === tx.id || (tx.orderId && t.orderId === tx.orderId)
        );
        if (existingIdx !== -1) {
          serverTransactions[existingIdx] = tx;
        } else {
          serverTransactions = [tx, ...serverTransactions];
        }
        saveStateToDisk();
      } else if (event.type === 'CASHFLOW_DELETE' && event.transactionId) {
        serverTransactions = serverTransactions.filter(t => t.id !== event.transactionId);
        saveStateToDisk();
      } else if (event.type === 'CASHFLOW_CLEAR') {
        serverTransactions = [];
        saveStateToDisk();
      } else if (event.type === 'CASHFLOW_RESET' && Array.isArray(event.transactions)) {
        serverTransactions = event.transactions;
        saveStateToDisk();
      }
      broadcastUpdate(event.type.toLowerCase(), event);
      return res.json({ success: true, serverTransactions });
    }
    return res.status(400).json({ error: "Invalid event" });
  });

  // 12. Cashflow Transactions (Thu - Chi)
  app.get("/api/cashflow", (req, res) => {
    res.json(serverTransactions);
  });

  app.post("/api/cashflow", (req, res) => {
    try {
      const tx = req.body as CashTransaction;
      if (!tx || !tx.amount || !tx.type || !tx.title) {
        return res.status(400).json({ error: "Missing required transaction fields" });
      }

      // Check if this transaction or an auto-receipt for this order already exists
      const existingIdx = serverTransactions.findIndex(
        t => t.id === tx.id || (tx.orderId && t.orderId === tx.orderId)
      );

      const d = new Date(tx.createdAt || Date.now());
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = tx.dateString || `${year}-${month}-${day}`;
      const prefix = tx.type === 'income' ? 'PT' : 'PC';
      const receiptNumber = tx.receiptNumber || `${prefix}-${dateStr.replace(/-/g, '')}-${String(serverTransactions.length + 1).padStart(3, '0')}`;

      const finalTx: CashTransaction = {
        ...tx,
        id: tx.id || `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        receiptNumber,
        createdAt: tx.createdAt || Date.now(),
        dateString: dateStr,
        paymentMethod: tx.paymentMethod || 'cash'
      };

      if (existingIdx !== -1) {
        serverTransactions[existingIdx] = finalTx;
      } else {
        serverTransactions = [finalTx, ...serverTransactions];
      }

      saveStateToDisk();
      broadcastUpdate('cashflow_updated', serverTransactions);
      return res.json({ success: true, transaction: finalTx, transactions: serverTransactions });
    } catch (err) {
      return res.status(500).json({ error: "Failed to create transaction" });
    }
  });

  app.put("/api/cashflow", (req, res) => {
    if (Array.isArray(req.body)) {
      serverTransactions = req.body;
      saveStateToDisk();
      broadcastUpdate('cashflow_bulk_updated', serverTransactions);
      return res.json({ success: true, count: serverTransactions.length });
    }
    return res.status(400).json({ error: "Invalid transactions array" });
  });

  app.post("/api/cashflow/reset", (req, res) => {
    serverTransactions = [...INITIAL_TRANSACTIONS];
    saveStateToDisk();
    broadcastUpdate('cashflow_reset', serverTransactions);
    console.log("[CASHFLOW] Reset transactions to default template");
    return res.json({ success: true, transactions: serverTransactions });
  });

  app.delete("/api/cashflow/all", (req, res) => {
    serverTransactions = [];
    saveStateToDisk();
    broadcastUpdate('cashflow_cleared', []);
    console.log("[CASHFLOW] Cleared all transactions");
    return res.json({ success: true, message: "Cleared all transactions" });
  });

  app.delete("/api/cashflow/:id", (req, res) => {
    const { id } = req.params;
    if (id === 'all') {
      serverTransactions = [];
      saveStateToDisk();
      broadcastUpdate('cashflow_cleared', []);
      return res.json({ success: true, message: "Cleared all transactions" });
    }
    const initialLen = serverTransactions.length;
    serverTransactions = serverTransactions.filter(t => t.id !== id);
    if (serverTransactions.length !== initialLen) {
      saveStateToDisk();
      broadcastUpdate('cashflow_deleted', { id });
      return res.json({ success: true });
    }
    return res.status(404).json({ error: "Transaction not found" });
  });

  // Vite middleware for development vs Production Static serving
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);

    // Fallback for HTML pages with query params or deep links in dev mode
    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      try {
        const indexPath = path.resolve(process.cwd(), 'index.html');
        let template = fs.readFileSync(indexPath, 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        next(e);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[SERVER] Kitchen & QR Dining Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
