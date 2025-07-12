import { describe, test, beforeEach, afterEach, vi } from "vitest";

import InvalidPurchaseException from "../src/pairtest/lib/InvalidPurchaseException";
import TicketService from "../src/pairtest/TicketService";
import TicketRepository from "../src/pairtest/repository/TicketRepository";
import TicketTypeRequest from "../src/pairtest/lib/TicketTypeRequest";
import TicketPaymentService from "../src/thirdparty/paymentgateway/TicketPaymentService";

const ticketPrices = {
  INFANT: 0,
  CHILD: 15,
  ADULT: 25,
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

describe("TicketService", () => {
  let ticketService;
  let ticketRepositorySpy;
  let paymentServiceSpy;

  beforeEach(() => {
    ticketService = new TicketService();
    ticketRepositorySpy = vi
      .spyOn(TicketRepository.prototype, "getTicketPrices")
      .mockImplementation(() => {
        return ticketPrices;
      });
    paymentServiceSpy = vi
      .spyOn(TicketPaymentService.prototype, "makePayment")
      .mockImplementation(() => {});
  });

  afterEach(() => {
    vi.clearAllMocks();
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

    test("Should accept valid account ID", () => {
      expect(() =>
        ticketService.purchaseTickets(validId, validTicketRequest)
      ).not.toThrow();
    });
  });

  describe("Ticket requests validation", () => {
    test("should throw error if no ticket requests are provided", () => {
      expect(() => ticketService.purchaseTickets(validId)).toThrow(
        InvalidPurchaseException
      );
    });

    test("should throw error wrong ticket request is provided", () => {
      const validRequest = new TicketTypeRequest("ADULT", 1);
      expect(() => ticketService.purchaseTickets(validId, [])).toThrow(
        InvalidPurchaseException
      );
      expect(() =>
        ticketService.purchaseTickets(validId, [validRequest])
      ).toThrow(InvalidPurchaseException);
      expect(() =>
        ticketService.purchaseTickets(1, validRequest, null)
      ).toThrow(InvalidPurchaseException);
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
    test("should throw error when there is no adults ticket in the order", () => {
      const orderList = createTicketTypeRequest([
        { type: "ADULT", quantity: 0 },
        { type: "CHILD", quantity: 1 },
        { type: "INFANT", quantity: 1 },
      ]);

      expect(() =>
        ticketService.purchaseTickets(validId, ...orderList)
      ).toThrow(InvalidPurchaseException);
    });

    test("should throw error when there are more tickets for infants than there is for adults", () => {
      const orderList = createTicketTypeRequest([
        { type: "ADULT", quantity: 1 },
        { type: "INFANT", quantity: 2 },
      ]);

      expect(() =>
        ticketService.purchaseTickets(validId, ...orderList)
      ).toThrow(InvalidPurchaseException);
    });

    test("should throw error when there is to many tickets in order", () => {
      const orderList = createTicketTypeRequest([
        { type: "ADULT", quantity: 25 },
        { type: "CHILD", quantity: 1 },
      ]);

      expect(() =>
        ticketService.purchaseTickets(validId, ...orderList)
      ).toThrow(InvalidPurchaseException);
    });

    test("should not throw with valid order", () => {
      const orderList = createTicketTypeRequest([
        { type: "ADULT", quantity: 2 },
        { type: "CHILD", quantity: 1 },
        { type: "INFANT", quantity: 1 },
      ]);

      expect(() =>
        ticketService.purchaseTickets(validId, ...orderList)
      ).not.toThrow(InvalidPurchaseException);
    });
  });

  describe("Payment service interactions", () => {
    test("should not call repository when account ID is invalid", () => {
      const orderList = createTicketTypeRequest([
        { type: "ADULT", quantity: 2 },
      ]);

      expect(() => ticketService.purchaseTickets(0, ...orderList)).toThrow(
        InvalidPurchaseException
      );

      expect(paymentServiceSpy).not.toHaveBeenCalled();
    });

    test("should not call repository when ticket request is invalid or missing", () => {
      expect(() => ticketService.purchaseTickets(validId, null)).toThrow(
        InvalidPurchaseException
      );
      expect(paymentServiceSpy).not.toHaveBeenCalled();
    });

    test("should calculate correct payment for single adult ticket", () => {
      const orderList = createTicketTypeRequest([
        { type: "ADULT", quantity: 1 },
      ]);

      ticketService.purchaseTickets(validId, ...orderList);
      expect(paymentServiceSpy).toHaveBeenCalledOnce();
      expect(paymentServiceSpy).toHaveBeenCalledWith(validId, 25);
    });

    test("should calculate correct payment for multiple adult tickets", () => {
      const orderList = createTicketTypeRequest([
        { type: "ADULT", quantity: 3 },
      ]);

      ticketService.purchaseTickets(validId, ...orderList);
      expect(paymentServiceSpy).toHaveBeenCalledWith(validId, 75); // 3 * 25 = 75
    });

    test("should calculate correct payment for mixed ticket types", () => {
      const orderList = createTicketTypeRequest([
        { type: "ADULT", quantity: 2 },
        { type: "CHILD", quantity: 3 },
        { type: "INFANT", quantity: 1 },
      ]);

      ticketService.purchaseTickets(validId, ...orderList);

      // 2 adults @ £25 = £50
      // 3 children @ £15 = £45
      // 1 infant @ £0 = £0
      // Total: £95
      expect(paymentServiceSpy).toHaveBeenCalledWith(validId, 95);
    });

    test("should handle zero quantities correctly", () => {
      const orderList = createTicketTypeRequest([
        { type: "ADULT", quantity: 1 },
        { type: "CHILD", quantity: 0 },
        { type: "INFANT", quantity: 0 },
      ]);

      ticketService.purchaseTickets(validId, ...orderList);

      expect(paymentServiceSpy).toHaveBeenCalledWith(validId, 25); // Only the adult ticket is charged
    });
  });
});
