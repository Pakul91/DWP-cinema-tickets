import { describe, test, expect } from "vitest";
import TicketRepository from "../src/pairtest/repository/TicketRepository";

describe("TicketRepository", () => {
  test("should have all required ticket types", () => {
    const repository = new TicketRepository();
    const prices = repository.getTicketPrices();

    // Check that all required ticket types exist
    const requiredTypes = ["INFANT", "CHILD", "ADULT"];
    requiredTypes.forEach((type) => {
      expect(prices).toHaveProperty(type);
    });
  });

  test("should have numeric values for all ticket types", () => {
    const repository = new TicketRepository();
    const prices = repository.getTicketPrices();

    // Check that all price values are numbers
    Object.values(prices).forEach((price) => {
      expect(typeof price).toBe("number");
    });
  });
});
