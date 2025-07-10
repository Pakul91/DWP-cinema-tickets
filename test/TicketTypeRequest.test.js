import TicketTypeRequest from "../src/pairtest/lib/TicketTypeRequest";
import { describe, test } from "vitest";

describe("TicketTypeRequest", () => {
  test("should return error if wrong type of ticket is requested", () => {
    expect(() => new TicketTypeRequest("wrongType", 1)).toThrow(TypeError);
  });
});
