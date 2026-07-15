export const INVENTORY_REGISTRY_ID =
  'propertyos.core.inventory';

export const INVENTORY_PERMISSIONS = {
  READ: 'inventory.read',
  CREATE: 'inventory.create',
  UPDATE: 'inventory.update',
  MANAGE: 'inventory.manage',
  ITEMS: 'inventory.items',
  STORES: 'inventory.stores',
  STOCK: 'inventory.stock',
  TRANSFER: 'inventory.transfer',
  ADJUST: 'inventory.adjust',
  ISSUE: 'inventory.issue',
  RETURN: 'inventory.return',
  COUNT: 'inventory.count',
  CONFIGURE: 'inventory.configure',
} as const;

export const INVENTORY_EVENTS = {
  CATEGORY_CREATED:
    'inventory.category.created',
  CATEGORY_UPDATED:
    'inventory.category.updated',

  UNIT_CREATED:
    'inventory.unit.created',
  UNIT_UPDATED:
    'inventory.unit.updated',

  BRAND_CREATED:
    'inventory.brand.created',
  BRAND_UPDATED:
    'inventory.brand.updated',

  ITEM_CREATED:
    'inventory.item.created',
  ITEM_UPDATED:
    'inventory.item.updated',
  ITEM_ACTIVATED:
    'inventory.item.activated',
  ITEM_DEACTIVATED:
    'inventory.item.deactivated',

  STORE_CREATED:
    'inventory.store.created',
  STORE_UPDATED:
    'inventory.store.updated',
  STORE_ACTIVATED:
    'inventory.store.activated',
  STORE_DEACTIVATED:
    'inventory.store.deactivated',

  BIN_CREATED:
    'inventory.bin.created',
  BIN_UPDATED:
    'inventory.bin.updated',

  STOCK_RECEIVED:
    'inventory.stock.received',
  STOCK_ISSUED:
    'inventory.stock.issued',
  MATERIAL_ISSUE_CREATED:
    'inventory.material_issue.created',
  MATERIAL_ISSUE_POSTED:
    'inventory.material_issue.posted',
  MATERIAL_ISSUE_CANCELLED:
    'inventory.material_issue.cancelled',

  MATERIAL_RETURN_CREATED:
    'inventory.material_return.created',
  MATERIAL_RETURN_POSTED:
    'inventory.material_return.posted',
  MATERIAL_RETURN_CANCELLED:
    'inventory.material_return.cancelled',

  STOCK_TRANSFERRED:
    'inventory.stock.transferred',
  STOCK_ADJUSTED:
    'inventory.stock.adjusted',
  STOCK_RESERVED:
    'inventory.stock.reserved',
  STOCK_RELEASED:
    'inventory.stock.released',
  STOCK_LOW:
    'inventory.stock.low',
  STOCK_OUT:
    'inventory.stock.out',
} as const;

export const INVENTORY_SEARCH_PROVIDER =
  'inventory';
