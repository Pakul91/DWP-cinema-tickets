import { describe, test, beforeEach } from "vitest";

import InvalidPurchaseException from "../src/pairtest/lib/InvalidPurchaseException";
import TicketService from "../src/pairtest/TicketService";
import TicketTypeRequest from "../src/pairtest/lib/TicketTypeRequest";

describe("TicketService", () => {
  let ticketService; // Defined at top level

  beforeEach(() => {
    ticketService = new TicketService(); // Available to all nested tests
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

    test("should accept valid account ID", () => {
      expect(() =>
        ticketService.purchaseTickets(1, validTicketRequest)
      ).not.toThrow();
    });
  });

  describe("Ticket requests validation", () => {
    test("should throw error if no ticket requests are provided", () => {
      expect(() => ticketService.purchaseTickets(1)).toThrow(
        InvalidPurchaseException
      );
    });

    test("should throw error wrong ticket request is provided", () => {
      const validRequest = new TicketTypeRequest("ADULT", 1);
      expect(() => ticketService.purchaseTickets(1, [])).toThrow(
        InvalidPurchaseException
      );
      expect(() => ticketService.purchaseTickets(1, [validRequest])).toThrow(
        InvalidPurchaseException
      );
      expect(() =>
        ticketService.purchaseTickets(1, validRequest, null)
      ).toThrow(InvalidPurchaseException);
    });
  });
});
