import TicketTypeRequest from "./lib/TicketTypeRequest.js";
import InvalidPurchaseException from "./lib/InvalidPurchaseException.js";

export default class TicketService {
  #ticketPrices = {
    INFANT: 0,
    CHILD: 15,
    ADULT: 25,
  };

  purchaseTickets(accountId, ...ticketTypeRequests) {
    try {
      // Validate account ID
      this.#validateAccountId(accountId);
      // Validate ticket request
      this.#validateTicketRequests(ticketTypeRequests);
      // Calculate totals
      const totals = this.#calculateTotals(ticketTypeRequests);
      // Validate order
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
        throw new Error(
          "All ticket requests must be TicketTypeRequest instances"
        );
      }
    }
  }

  #calculateTotals(ticketTypeRequests) {
    return ticketTypeRequests.reduce((summary, request) => {
      const ticketType = request.getTicketType();
      const noOfTickets = request.getNoOfTickets();

      if (!summary[ticketType]) {
        summary[ticketType] = {
          quantity: 0,
          totalPrice: 0,
        };
      }

      summary[ticketType].quantity += noOfTickets;
      summary[ticketType].totalPrice +=
        noOfTickets * this.#ticketPrices[ticketType];

      return summary;
    }, {});
  }
}
