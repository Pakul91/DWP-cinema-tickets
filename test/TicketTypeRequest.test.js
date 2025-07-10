import TicketTypeRequest from "../src/pairtest/lib/TicketTypeRequest";
import { describe, test, expect } from "vitest";

describe("TicketTypeRequest", () => {
  test("should throw type error if wrong type of ticket is requested", () => {
    expect(() => new TicketTypeRequest("wrongType", 1)).toThrow(TypeError);
    expect(() => new TicketTypeRequest(null, 1)).toThrow(TypeError);
    expect(() => new TicketTypeRequest({}, 1)).toThrow(TypeError);
    expect(() => new TicketTypeRequest([], 1)).toThrow(TypeError);
    expect(() => new TicketTypeRequest(["ADULT"], 1)).toThrow(TypeError);
    expect(() => new TicketTypeRequest(1)).toThrow(TypeError);
  });

  test("should throw type error if invalid number of tickets is provided", () => {
    expect(() => new TicketTypeRequest("ADULT", "1")).toThrow(
      "noOfTickets must be an integer"
    );
    expect(() => new TicketTypeRequest("ADULT", null)).toThrow(
      "noOfTickets must be an integer"
    );
    expect(() => new TicketTypeRequest("ADULT", undefined)).toThrow(
      "noOfTickets must be an integer"
    );
    expect(() => new TicketTypeRequest("ADULT", {})).toThrow(
      "noOfTickets must be an integer"
    );
    expect(() => new TicketTypeRequest("ADULT", [])).toThrow(
      "noOfTickets must be an integer"
    );
    expect(() => new TicketTypeRequest("ADULT", NaN)).toThrow(
      "noOfTickets must be an integer"
    );
    expect(() => new TicketTypeRequest("ADULT", 1.5)).toThrow(
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
