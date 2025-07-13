import TicketTypeRequest from "./lib/TicketTypeRequest.js";
import TicketRepository from "./repository/TicketRepository.js";
import InvalidPurchaseException from "./lib/InvalidPurchaseException.js";
import TicketPaymentService from "../thirdparty/paymentgateway/TicketPaymentService.js";
import SeatReservationService from "../thirdparty/seatbooking/SeatReservationService.js";

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
      // Book seats
      this.#bookSeats();

      return {
        success: true,
        message: "Your tickets have been booked successfully",
      };
    } catch (error) {
      throw new InvalidPurchaseException(
        `Failed to purchase tickets: ${error.message || error}`
      );
    }
  }

  /**
   * Validates that the account ID is a positive integer
   * @private
   * @throws {Error} When account ID is not a positive integer
   */
  #validateAccountId() {
    if (!Number.isInteger(this.#accountId) || this.#accountId <= 0) {
      throw new Error("Invalid account id");
    }
  }

  /**
   * Validates ticket requests are present and of correct type
   * @private
   * @throws {Error} When no ticket requests are provided or requests are invalid
   */
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

  /**
   * Fetches ticket pricing and seating data from repository
   * @private
   */
  #getTicketsData() {
    const repository = new TicketRepository();
    this.#ticketsData = repository.getTicketsData();
  }

  /**
   * Calculates totals for tickets, price, and seats required
   * Aggregates results by ticket type and overall
   * @private
   */
  #calculateTotals() {
    this.#totals = this.#ticketTypeRequests.reduce(
      (totals, request) => {
        const ticketType = request.getTicketType();
        const noOfTickets = request.getNoOfTickets();

        if (!totals.byType[ticketType]) {
          totals.byType[ticketType] = {
            totalQuantity: 0,
            totalPrice: 0,
            totalSeats: 0,
          };
        }

        const priceForRequest =
          noOfTickets * this.#ticketsData[ticketType].price;
        const seatsForRequest =
          noOfTickets * this.#ticketsData[ticketType].seats;

        // Update totals for the specific ticket
        totals.byType[ticketType].totalQuantity += noOfTickets;
        totals.byType[ticketType].totalPrice += priceForRequest;
        totals.byType[ticketType].totalSeats += seatsForRequest;
        // Update overall totals
        totals.totalQuantity += noOfTickets;
        totals.totalPrice += priceForRequest;
        totals.totalSeats += seatsForRequest;

        return totals;
      },
      {
        byType: {},
        totalQuantity: 0,
        totalPrice: 0,
        totalSeats: 0,
      }
    );
  }

  /**
   * Validates order against business rules:
   * @private
   * @throws {Error} When business rules are violated
   */
  #validateOrder() {
    const totals = this.#totals;

    if (!totals.byType["ADULT"]?.totalQuantity) {
      throw new Error("At least 1 adult ticket is required");
    }

    // We assume that ADULT can't have more than 1 infant on their lap
    if (
      totals.byType["ADULT"].totalQuantity <
      (totals.byType["INFANT"]?.totalQuantity || 0)
    ) {
      throw new Error(
        "Number of infant tickets cannot exceed number of adult tickets"
      );
    }

    const ticketsTotal = this.#totals.totalQuantity;

    if (ticketsTotal > this.#ticketsLimit) {
      throw new Error("Maximum tickets number per order exceeded ");
    }
  }

  /**
   * Processes payment for tickets through payment service
   * @private
   */
  #payForTickets() {
    const service = new TicketPaymentService();
    const totalPayment = this.#totals.totalPrice;
    service.makePayment(this.#accountId, totalPayment);
  }

  /**
   * Books required seats through reservation service
   * @private
   */
  #bookSeats() {
    const service = new SeatReservationService();
    const totalSeats = this.#totals.totalSeats;
    service.reserveSeat(this.#accountId, totalSeats);
  }
}
