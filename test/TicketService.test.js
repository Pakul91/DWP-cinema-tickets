import { describe, test, beforeEach, afterEach, vi } from "vitest";

import InvalidPurchaseException from "../src/pairtest/lib/InvalidPurchaseException";
import TicketService from "../src/pairtest/TicketService";
import TicketRepository from "../src/pairtest/repository/TicketRepository";
import TicketTypeRequest from "../src/pairtest/lib/TicketTypeRequest";
import TicketPaymentService from "../src/thirdparty/paymentgateway/TicketPaymentService";
import SeatReservationService from "../src/thirdparty/seatbooking/SeatReservationService";

const ticketPrices = {
  INFANT: { price: 0, seats: 0 },
  CHILD: { price: 15, seats: 1 },
  ADULT: { price: 25, seats: 1 },
};
const validId = 1;

const createTicketTypeRequest = (ticketTypes) => {
  if (!Array.isArray(ticketTypes)) {
    throw new Error("You need to pass an array");
  }
  return ticketTypes.map(
    (ticketType) => new TicketTypeRequest(ticketType.type, ticketType.quantity)
  );
};

const calculateOrderPrice = (order) => {
  return order.reduce((total, item) => {
    const { type, quantity } = item;
    return total + ticketPrices[type].price * quantity;
  }, 0);
};

const calculateTotalSeats = (order) => {
  return order.reduce((total, item) => {
    const { type, quantity } = item;
    return total + ticketPrices[type].seats * quantity;
  }, 0);
};

describe("TicketService", () => {
  let ticketService;
  let ticketRepositorySpy;
  let paymentServiceSpy;
  let reservationServiceSpy;

  beforeEach(() => {
    ticketService = new TicketService();

    ticketRepositorySpy = vi
      .spyOn(TicketRepository.prototype, "getTicketsData")
      .mockImplementation(() => {
        return ticketPrices;
      });

    paymentServiceSpy = vi
      .spyOn(TicketPaymentService.prototype, "makePayment")
      .mockImplementation(() => {});

    reservationServiceSpy = vi
      .spyOn(SeatReservationService.prototype, "reserveSeat")
      .mockImplementation(() => {});
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("Account ID validation", () => {
    let validTicketRequest;

    beforeEach(() => {
      validTicketRequest = new TicketTypeRequest("ADULT", 1);
    });

    test.each([
      ["empty string", ""],
      ["zero", 0],
      ["negative number", -1],
      ["string number", "1"],
      ["null", null],
      ["object", {}],
      ["undefined", undefined],
      ["array", [1]],
      ["NaN", NaN],
      ["float", 1.5],
    ])(
      "should throw InvalidPurchaseException for invalid account ID: %s",
      (_, id) => {
        expect(() =>
          ticketService.purchaseTickets(id, validTicketRequest)
        ).toThrow(InvalidPurchaseException);
      }
    );

    test("should accept valid account ID", () => {
      expect(() =>
        ticketService.purchaseTickets(validId, validTicketRequest)
      ).not.toThrow();
    });
  });

  describe("Ticket requests validation", () => {
    const validRequest = new TicketTypeRequest("ADULT", 1);

    test.each([
      ["no ticket requests", []],
      ["empty array", [[]]],
      ["array of valid requests", [[validRequest]]],
      ["null as a ticket request", [validRequest, null]],
      ["undefined as a ticket request", [validRequest, undefined]],
      ["non-TicketTypeRequest object", [{ type: "ADULT", quantity: 1 }]],
      ["string primitive", ["ADULT"]],
      ["number primitive", [3]],
    ])("should throw error when %s is provided", (_, args) => {
      expect(() => ticketService.purchaseTickets(validId, ...args)).toThrow(
        InvalidPurchaseException
      );
    });

    test("should accept multiple valid ticket requests", () => {
      const adultTicket = new TicketTypeRequest("ADULT", 2);
      const childTicket = new TicketTypeRequest("CHILD", 1);

      expect(() =>
        ticketService.purchaseTickets(validId, adultTicket, childTicket)
      ).not.toThrow();
    });
  });

  describe("Ticket repository interactions", () => {
    test("should not call repository when account ID is invalid", () => {
      const orderList = createTicketTypeRequest([
        { type: "ADULT", quantity: 2 },
      ]);
      expect(() => ticketService.purchaseTickets(0, ...orderList)).toThrow(
        InvalidPurchaseException
      );
      expect(ticketRepositorySpy).not.toHaveBeenCalled();
    });

    test("should not call repository when ticket request is invalid or missing", () => {
      expect(() => ticketService.purchaseTickets(validId, null)).toThrow(
        InvalidPurchaseException
      );
      expect(ticketRepositorySpy).not.toHaveBeenCalled();
    });

    test("should call repository with valid request", () => {
      const orderList = createTicketTypeRequest([
        { type: "ADULT", quantity: 2 },
      ]);

      ticketService.purchaseTickets(validId, ...orderList);
      expect(ticketRepositorySpy).toHaveBeenCalledOnce();
    });
  });

  describe("Order validation", () => {
    const noAdultOrder = [
      { type: "ADULT", quantity: 0 },
      { type: "CHILD", quantity: 1 },
      { type: "INFANT", quantity: 1 },
    ];
    const tooManyInfantsOrder = [
      { type: "ADULT", quantity: 1 },
      { type: "INFANT", quantity: 2 },
    ];
    const tooLargeOrder = [
      { type: "ADULT", quantity: 25 },
      { type: "CHILD", quantity: 1 },
    ];
    const validMixedOrder = [
      { type: "ADULT", quantity: 2 },
      { type: "CHILD", quantity: 1 },
      { type: "INFANT", quantity: 1 },
    ];
    const edgeSizeOrder = [{ type: "ADULT", quantity: 25 }];
    const equalInfantsOrder = [
      { type: "ADULT", quantity: 2 },
      { type: "INFANT", quantity: 2 },
    ];

    test("should throw error when there is no adults ticket in the order", () => {
      const orderList = createTicketTypeRequest(noAdultOrder);
      expect(() =>
        ticketService.purchaseTickets(validId, ...orderList)
      ).toThrow(InvalidPurchaseException);
    });

    test("should throw error when there are more tickets for infants than there is for adults", () => {
      const orderList = createTicketTypeRequest(tooManyInfantsOrder);
      expect(() =>
        ticketService.purchaseTickets(validId, ...orderList)
      ).toThrow(InvalidPurchaseException);
    });

    test("should throw error when there are too many tickets in order", () => {
      const orderList = createTicketTypeRequest(tooLargeOrder);
      expect(() =>
        ticketService.purchaseTickets(validId, ...orderList)
      ).toThrow(InvalidPurchaseException);
    });

    test("should not throw with valid order", () => {
      const orderList = createTicketTypeRequest(validMixedOrder);
      expect(() =>
        ticketService.purchaseTickets(validId, ...orderList)
      ).not.toThrow(InvalidPurchaseException);
    });

    test("should not throw with order on the limit", () => {
      const orderList = createTicketTypeRequest(edgeSizeOrder);
      expect(() =>
        ticketService.purchaseTickets(validId, ...orderList)
      ).not.toThrow(InvalidPurchaseException);
    });

    test("should not throw with order with equal infants to adults", () => {
      const orderList = createTicketTypeRequest(equalInfantsOrder);
      expect(() =>
        ticketService.purchaseTickets(validId, ...orderList)
      ).not.toThrow(InvalidPurchaseException);
    });
  });

  describe("Payment service interactions", () => {
    const singleAdultOrder = [{ type: "ADULT", quantity: 1 }];
    const multipleAdultsOrder = [{ type: "ADULT", quantity: 3 }];
    const mixedOrder = [
      { type: "ADULT", quantity: 2 },
      { type: "CHILD", quantity: 3 },
      { type: "INFANT", quantity: 1 },
    ];
    const zeroQuantitiesMixedOrder = [
      { type: "ADULT", quantity: 1 },
      { type: "CHILD", quantity: 0 },
      { type: "INFANT", quantity: 0 },
    ];

    test("should not call payment service when account ID is invalid", () => {
      const orderList = createTicketTypeRequest(singleAdultOrder);
      expect(() => ticketService.purchaseTickets(0, ...orderList)).toThrow(
        InvalidPurchaseException
      );
      expect(paymentServiceSpy).not.toHaveBeenCalled();
    });

    test("should not call payment service when ticket request is invalid or missing", () => {
      expect(() => ticketService.purchaseTickets(validId, null)).toThrow(
        InvalidPurchaseException
      );
      expect(paymentServiceSpy).not.toHaveBeenCalled();
    });

    test("should calculate correct payment for single adult ticket", () => {
      const orderList = createTicketTypeRequest(singleAdultOrder);
      const expectedPrice = calculateOrderPrice(singleAdultOrder);
      ticketService.purchaseTickets(validId, ...orderList);
      expect(paymentServiceSpy).toHaveBeenCalledOnce();
      expect(paymentServiceSpy).toHaveBeenCalledWith(validId, expectedPrice);
    });

    test("should calculate correct payment for multiple adult tickets", () => {
      const orderList = createTicketTypeRequest(multipleAdultsOrder);
      const expectedPrice = calculateOrderPrice(multipleAdultsOrder);
      ticketService.purchaseTickets(validId, ...orderList);
      expect(paymentServiceSpy).toHaveBeenCalledWith(validId, expectedPrice);
    });

    test("should calculate correct payment for mixed ticket types", () => {
      const orderList = createTicketTypeRequest(mixedOrder);
      const expectedPrice = calculateOrderPrice(mixedOrder);
      ticketService.purchaseTickets(validId, ...orderList);
      expect(paymentServiceSpy).toHaveBeenCalledWith(validId, expectedPrice);
    });

    test("should handle zero quantities correctly", () => {
      const orderList = createTicketTypeRequest(zeroQuantitiesMixedOrder);
      const expectedPrice = calculateOrderPrice(zeroQuantitiesMixedOrder);
      ticketService.purchaseTickets(validId, ...orderList);
      expect(paymentServiceSpy).toHaveBeenCalledWith(validId, expectedPrice);
    });
  });

  describe("Seat reservation service interactions", () => {
    const singleAdultOrder = [{ type: "ADULT", quantity: 1 }];
    const multipleAdultsOrder = [{ type: "ADULT", quantity: 3 }];
    const mixedOrder = [
      { type: "ADULT", quantity: 2 },
      { type: "CHILD", quantity: 3 },
      { type: "INFANT", quantity: 1 },
    ];
    const infantsWithAdultsOrder = [
      { type: "ADULT", quantity: 2 },
      { type: "INFANT", quantity: 2 },
    ];
    const zeroQuantitiesOrder = [
      { type: "ADULT", quantity: 1 },
      { type: "CHILD", quantity: 0 },
      { type: "INFANT", quantity: 0 },
    ];

    test("should not call reservation service when account ID is invalid", () => {
      const orderList = createTicketTypeRequest(singleAdultOrder);

      expect(() => ticketService.purchaseTickets(0, ...orderList)).toThrow(
        InvalidPurchaseException
      );

      expect(reservationServiceSpy).not.toHaveBeenCalled();
    });

    test("should not call reservation service when ticket request is invalid or missing", () => {
      expect(() => ticketService.purchaseTickets(validId, null)).toThrow(
        InvalidPurchaseException
      );
      expect(reservationServiceSpy).not.toHaveBeenCalled();
    });

    test("should reserve correct number of seats for single adult ticket", () => {
      const orderList = createTicketTypeRequest(singleAdultOrder);
      const expectedSeats = calculateTotalSeats(singleAdultOrder);
      ticketService.purchaseTickets(validId, ...orderList);
      expect(reservationServiceSpy).toHaveBeenCalledOnce();
      expect(reservationServiceSpy).toHaveBeenCalledWith(
        validId,
        expectedSeats
      );
    });

    test("should reserve correct number of seats for multiple adult tickets", () => {
      const orderList = createTicketTypeRequest(multipleAdultsOrder);
      const expectedSeats = calculateTotalSeats(multipleAdultsOrder);
      ticketService.purchaseTickets(validId, ...orderList);
      expect(reservationServiceSpy).toHaveBeenCalledWith(
        validId,
        expectedSeats
      );
    });

    test("should reserve correct number of seats for mixed ticket types", () => {
      const orderList = createTicketTypeRequest(mixedOrder);
      const expectedSeats = calculateTotalSeats(mixedOrder);
      ticketService.purchaseTickets(validId, ...orderList);
      expect(reservationServiceSpy).toHaveBeenCalledWith(
        validId,
        expectedSeats
      );
    });

    test("should handle infant tickets correctly (no seats required)", () => {
      const orderList = createTicketTypeRequest(infantsWithAdultsOrder);
      const expectedSeats = calculateTotalSeats(infantsWithAdultsOrder);
      ticketService.purchaseTickets(validId, ...orderList);
      expect(reservationServiceSpy).toHaveBeenCalledWith(
        validId,
        expectedSeats
      );
    });

    test("should handle zero quantities correctly", () => {
      const orderList = createTicketTypeRequest(zeroQuantitiesOrder);
      const expectedSeats = calculateTotalSeats(zeroQuantitiesOrder);
      ticketService.purchaseTickets(validId, ...orderList);
      expect(reservationServiceSpy).toHaveBeenCalledWith(
        validId,
        expectedSeats
      );
    });
  });
});
