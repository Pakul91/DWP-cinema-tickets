import TicketTypeRequest from "./lib/TicketTypeRequest.js";
import TicketRepository from "./repository/TicketRepository.js";
import InvalidPurchaseException from "./lib/InvalidPurchaseException.js";
import TicketPaymentService from "../thirdparty/paymentgateway/TicketPaymentService.js";

export default class TicketService {
  #ticketsLimit = 25;

  #ticketsData;
  #accountId;
  #ticketTypeRequests;
  #totals;

  purchaseTickets(accountId, ...ticketTypeRequests) {
    try {
      this.#accountId = accountId;
      this.#ticketTypeRequests = ticketTypeRequests;
      this.#totals = {};

      // Validate account ID
      this.#validateAccountId();
      // Validate ticket request
      this.#validateTicketRequests();
      // Get prices from repository
      this.#getTicketsData();
      // Calculate totals
      this.#calculateTotals();
      // Validate order
      this.#validateOrder();
      // Pay for tickets
      this.#payForTickets();
    } catch (error) {
      throw new InvalidPurchaseException(
        `Failed to purchase tickets: ${error.message || error}`
      );
    }
  }

  #validateAccountId() {
    if (!Number.isInteger(this.#accountId) || this.#accountId <= 0) {
      throw new Error("Invalid account id");
    }
  }

  #validateTicketRequests() {
    if (!this.#ticketTypeRequests?.length) {
      throw new Error("At lest ticket request is required");
    }

    for (const request of this.#ticketTypeRequests) {
      if (!(request instanceof TicketTypeRequest)) {
        throw new Error(
          "All ticket requests must be TicketTypeRequest instances"
        );
      }
    }
  }

  #getTicketsData() {
    const repository = new TicketRepository();
    this.#ticketsData = repository.getTicketsData();
  }

  #calculateTotals() {
    this.#totals = this.#ticketTypeRequests.reduce((totals, request) => {
      const ticketType = request.getTicketType();
      const noOfTickets = request.getNoOfTickets();

      if (!totals[ticketType]) {
        totals[ticketType] = {
          quantity: 0,
          totalPrice: 0,
          totalSeats: 0,
        };
      }

      totals[ticketType].quantity += noOfTickets;
      totals[ticketType].totalPrice +=
        noOfTickets * this.#ticketsData[ticketType].price;
      totals[ticketType].totalSeats +=
        noOfTickets * this.#ticketsData[ticketType].seats;

      return totals;
    }, {});
  }

  #validateOrder() {
    const totals = this.#totals;

    if (!totals["ADULT"]?.quantity) {
      throw new Error("At least 1 adult ticket is required");
    }

    if (totals["ADULT"].quantity < (totals["INFANT"]?.quantity || 0)) {
      throw new Error(
        "Number of infant tickets cannot exceed number of adult tickets"
      );
    }

    const ticketsTotal = Object.values(totals).reduce((total, ticketType) => {
      return total + ticketType.quantity;
    }, 0);

    if (ticketsTotal > this.#ticketsLimit) {
      throw new Error("Maximum tickets number per order exceeded ");
    }
  }

  #payForTickets() {
    const service = new TicketPaymentService();

    const totalPayment = Object.values(this.#totals).reduce(
      (total, ticketType) => {
        return total + ticketType.totalPrice;
      },
      0
    );
    service.makePayment(this.#accountId, totalPayment);
  }
}
