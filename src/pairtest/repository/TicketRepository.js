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
  getTicketsData() {
    return {
      INFANT: { price: 0, seats: 0 },
      CHILD: { price: 15, seats: 1 },
      ADULT: { price: 25, seats: 1 },
    };
  }
}
