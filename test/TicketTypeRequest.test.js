import { describe, test } from "vitest";
import TicketTypeRequest from "../src/pairtest/lib/TicketTypeRequest";

describe("TicketTypeRequest", () => {
  test.each([
    ["wrong string type", "wrongType"],
    ["null", null],
    ["object", {}],
    ["empty array", []],
    ["array with valid type", ["ADULT"]],
    ["number", 1]
  ])("should throw type error if wrong type of ticket is requested: %s", (_, invalidType) => {
    expect(() => new TicketTypeRequest(invalidType, 1)).toThrow(TypeError);
  });

  test.each([
    ["string number", "1"],
    ["null", null],
    ["undefined", undefined],
    ["object", {}],
    ["array", []],
    ["NaN", NaN],
    ["float", 1.5]
  ])("should throw type error if invalid number of tickets is provided: %s", (_, invalidNumber) => {
    expect(() => new TicketTypeRequest("ADULT", invalidNumber)).toThrow(
      "noOfTickets must be an integer"
    );
  });

  test("should return correct ticket type when getTicketType is called", () => {
    expect(new TicketTypeRequest("ADULT", 1).getTicketType()).toBe("ADULT");
    expect(new TicketTypeRequest("CHILD", 2).getTicketType()).toBe("CHILD");
    expect(new TicketTypeRequest("INFANT", 3).getTicketType()).toBe("INFANT");
  });

  test("should return correct number of tickets when getNoOfTickets is called", () => {
    expect(new TicketTypeRequest("ADULT", 1).getNoOfTickets()).toBe(1);
    expect(new TicketTypeRequest("CHILD", 2).getNoOfTickets()).toBe(2);
    expect(new TicketTypeRequest("INFANT", 3).getNoOfTickets()).toBe(3);
  });

  test("should accept zero tickets as valid input", () => {
    expect(() => new TicketTypeRequest("ADULT", 0)).not.toThrow();
    expect(new TicketTypeRequest("ADULT", 0).getNoOfTickets()).toBe(0);
  });

  test("should throw error if negative number of tickets is provided", () => {
    expect(() => new TicketTypeRequest("ADULT", -1)).toThrow(
      "noOfTickets cannot be negative"
    );
  });
});
