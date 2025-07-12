import { describe, test, beforeEach } from "vitest";

import InvalidPurchaseException from "../src/pairtest/lib/InvalidPurchaseException";
import TicketService from "../src/pairtest/TicketService";
import TicketTypeRequest from "../src/pairtest/lib/TicketTypeRequest";

const createTicketTypeRequest = (ticketTypes) => {
  if (!Array.isArray(ticketTypes)) {
    throw new Error("You need to pass an array");
  }

  console.log("ticket types", ticketTypes);
  return ticketTypes.map(
    (ticketType) => new TicketTypeRequest(ticketType.type, ticketType.quantity)
  );
};

const validId = 1;

describe("TicketService", () => {
  let ticketService;

  beforeEach(() => {
    ticketService = new TicketService();
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
      (id) => {
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
});
