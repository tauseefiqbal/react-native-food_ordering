import { Client, ID, Permission, Role, TablesDB } from 'node-appwrite';

const toCents = (price) => Math.round(Number(price) * 100);

class AppwriteService {
  constructor(apiKey) {
    const client = new Client()
      .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
      .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
      .setKey(apiKey);

    // TablesDB matches the function's rows.read / rows.write scopes.
    this.tablesDB = new TablesDB(client);
  }

  /**
   * Builds Stripe line items from cart entries, using prices stored in the database.
   * @param {{ id: string, quantity: number, customizations?: { id: string }[] }[]} items
   */
  async buildLineItems(databaseId, menuCollectionId, customizationsCollectionId, items) {
    return Promise.all(
      items.map(async (item) => {
        const quantity = Math.floor(Number(item.quantity));
        if (!item?.id || !Number.isFinite(quantity) || quantity < 1 || quantity > 99) {
          throw new Error(`Invalid cart item: ${JSON.stringify(item)}`);
        }

        const menu = await this.tablesDB.getRow({
          databaseId,
          tableId: menuCollectionId,
          rowId: item.id,
        });
        const customizations = await Promise.all(
          (item.customizations ?? []).map(({ id }) =>
            this.tablesDB.getRow({ databaseId, tableId: customizationsCollectionId, rowId: id })
          )
        );

        const unitAmount =
          toCents(menu.price) + customizations.reduce((sum, c) => sum + toCents(c.price), 0);
        const extras = customizations.map((c) => c.name).join(', ');

        return {
          price_data: {
            unit_amount: unitAmount,
            currency: 'usd',
            product_data: {
              name: menu.name,
              ...(extras && { description: `With: ${extras}` }),
            },
          },
          quantity,
        };
      })
    );
  }

  async createOrder(databaseId, collectionId, userId, orderId) {
    await this.tablesDB.createRow({
      databaseId,
      tableId: collectionId,
      rowId: ID.unique(),
      data: { userId, orderId },
      permissions: [Permission.read(Role.user(userId))],
    });
  }
}

export default AppwriteService;
