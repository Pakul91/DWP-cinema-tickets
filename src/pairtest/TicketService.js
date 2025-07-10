import TicketTypeRequest from "./lib/TicketTypeRequest.js";
import InvalidPurchaseException from "./lib/InvalidPurchaseException.js";

export default class TicketService {
  purchaseTickets(accountId, ...ticketTypeRequests) {
    try {
      // Validate account ID
      this.#validateAccountId(accountId);
    } catch (error) {
      throw new InvalidPurchaseException(
        `Failed to purchase tickets: ${error.message}`
      );
    }
  }

  #validateAccountId(accountId) {
    if (!Number.isInteger(accountId) || accountId <= 0) {
      throw new Error("Invalid account id");
    }
  }
}
