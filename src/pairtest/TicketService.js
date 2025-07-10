import TicketTypeRequest from "./lib/TicketTypeRequest.js";
import InvalidPurchaseException from "./lib/InvalidPurchaseException.js";

export default class TicketService {
  purchaseTickets(accountId, ...ticketTypeRequests) {
    try {
      // Validate account ID
      this.#validateAccountId(accountId);
      // Validate ticket request
      this.#validateTicketRequests(ticketTypeRequests);
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

  #validateTicketRequests(ticketTypeRequests) {
    if (!ticketTypeRequests?.length) {
      throw new Error("At lest ticket request is required");
    }

    for (const request of ticketTypeRequests) {
      if (!(request instanceof TicketTypeRequest)) {
        // This will throw because 'request' is an array, not a TicketTypeRequest!
        throw new Error(
          "All ticket requests must be TicketTypeRequest instances"
        );
      }
    }
  }
}
