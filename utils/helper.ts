export class Helper {
  /**
   * Converts a price string (e.g. "$602.00") to a number (e.g. 602)
   * @param price - Price text containing currency symbols or separators
   * @returns The numeric price value
   */
  static convertPriceToNumber(price: string): number {
    return Number(price.replace(/[^0-9.]/g, ""));
  }

  /**
   * Returns the fixed product details used in the shopping tests
   */
  static getProductDetails() {
    return {
      productName: "MacBook",
      productQuantity: "1",
      totalPrice: "$602.00",
    };
  }

  /**
   * Returns the fixed login credentials of the registered test customer
   */
  static getLoginDetails() {
    return {
      email: "pavanol@xyz.com",
      password: "test@123",
    };
  }
}
