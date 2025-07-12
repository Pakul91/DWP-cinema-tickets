/**
 * Repository for ticket-related data
 * This repository had been added to emulate accessing database
 * This allows for easier testing wit full control over ticket prices without keeping tests in sync with price
 */
export default class TicketRepository {
  /**
   * Returns the current ticket prices for all ticket types
   * @returns {Object} An object mapping ticket types to their prices
   */
  getTicketPrices() {
    return {
      INFANT: 0,
      CHILD: 15,
      ADULT: 25,
    };
  }
}
