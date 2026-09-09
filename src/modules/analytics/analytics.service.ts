import { PrismaClient, OrderStatus, TableStatus } from "@prisma/client";

const prisma = new PrismaClient();

export async function getDashboardOverview(restaurantId: string) {
  // 1. Total revenue from completed/paid orders
  const paidOrders = await prisma.order.findMany({
    where: {
      restaurantId,
      status: OrderStatus.PAID,
    },
    include: {
      items: {
        include: { menuItem: { select: { price: true } } },
      },
    },
  });

  const totalRevenue = paidOrders.reduce((total, order) => {
    const orderTotal = order.items.reduce((sum, item) => {
      return sum + Number(item.menuItem.price) * item.quantity;
    }, 0);
    return total + orderTotal;
  }, 0);

  // 2. Order counts breakdown
  const totalOrders = await prisma.order.count({ where: { restaurantId } });
  const activeOrders = await prisma.order.count({
    where: {
      restaurantId,
      status: {
        in: [
          OrderStatus.PLACED,
          OrderStatus.ACCEPTED,
          OrderStatus.PREPARING,
          OrderStatus.READY,
        ],
      },
    },
  });

  // 3. Table occupancy stats
  const totalTables = await prisma.table.count({ where: { restaurantId } });
  const occupiedTables = await prisma.table.count({
    where: { restaurantId, status: TableStatus.OCCUPIED },
  });

  return {
    totalRevenue: Number(totalRevenue.toFixed(2)),
    totalOrders,
    activeOrders,
    tables: {
      total: totalTables,
      occupied: occupiedTables,
      free: totalTables - occupiedTables,
    },
  };
}

export async function getTopSellingItems(restaurantId: string, limit = 5) {
  const items = await prisma.orderItem.groupBy({
    by: ["menuItemId"],
    where: {
      order: {
        restaurantId,
        status: OrderStatus.PAID,
      },
    },
    _sum: {
      quantity: true,
    },
    orderBy: {
      _sum: {
        quantity: "desc",
      },
    },
    take: limit,
  });

  if (items.length === 0) return [];

  const itemIds = items.map((i) => i.menuItemId);

  // Optimized single database query to fetch all required menu items
  const menuItems = await prisma.menuItem.findMany({
    where: { id: { in: itemIds }, restaurantId },
    select: { id: true, name: true, price: true, category: true },
  });

  const menuItemMap = new Map(menuItems.map((m) => [m.id, m]));

  return items.map((item) => {
    const details = menuItemMap.get(item.menuItemId);
    return {
      ...details,
      totalSold: item._sum.quantity || 0,
    };
  });
}