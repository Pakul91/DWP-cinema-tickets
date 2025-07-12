import TicketTypeRequest from "./lib/TicketTypeRequest.js";
import InvalidPurchaseException from "./lib/InvalidPurchaseException.js";

export default class TicketService {
  #ticketPrices = {
    INFANT: 0,
    CHILD: 15,
    ADULT: 25,
  };

  #ticketsLimit = 25;

  purchaseTickets(accountId, ...ticketTypeRequests) {
    try {
      // Validate account ID
      this.#validateAccountId(accountId);
      // Validate ticket request
      this.#validateTicketRequests(ticketTypeRequests);
      // Calculate totals
      const totals = this.#calculateTotals(ticketTypeRequests);
      // Validate order
      this.#validateOrder(totals);
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
    return ticketTypeRequests.reduce((totals, request) => {
      const ticketType = request.getTicketType();
      const noOfTickets = request.getNoOfTickets();

      if (!totals[ticketType]) {
        totals[ticketType] = {
          quantity: 0,
          totalPrice: 0,
        };
      }

      totals[ticketType].quantity += noOfTickets;
      totals[ticketType].totalPrice +=
        noOfTickets * this.#ticketPrices[ticketType];

      return totals;
    }, {});
  }

  #validateOrder(totals) {
    if (!totals["ADULT"]?.quantity) {
      throw new Error("At least 1 adult ticket is required");
    }

    const ticketsTotal = Object.values(totals).reduce((total, ticketType) => {
      return total + ticketType.quantity;
    }, 0);

    if (ticketsTotal > this.#ticketsLimit) {
      throw new Error("Maximum tickets number per order exceeded ");
    }
  }
}
