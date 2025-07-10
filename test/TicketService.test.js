import { describe, test, beforeEach } from "vitest";

import InvalidPurchaseException from "../src/pairtest/lib/InvalidPurchaseException";
import TicketService from "../src/pairtest/TicketService";
import TicketTypeRequest from "../src/pairtest/lib/TicketTypeRequest";

describe("TicketService", () => {
  describe("Account ID validation", () => {
    let ticketService;
    let validTicketRequest;

    beforeEach(() => {
      ticketService = new TicketService();
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
});
