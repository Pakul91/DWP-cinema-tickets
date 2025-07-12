import { describe, test, expect } from "vitest";
import TicketRepository from "../src/pairtest/repository/TicketRepository";

describe("TicketRepository", () => {
  test("should have all required ticket types", () => {
    const repository = new TicketRepository();
    const ticketsData = repository.getTicketsData();

    // Check that all required ticket types exist
    const requiredTypes = ["INFANT", "CHILD", "ADULT"];
    requiredTypes.forEach((type) => {
      expect(ticketsData).toHaveProperty(type);
    });
  });

  test("should have required properties for each ticket type", () => {
    const repository = new TicketRepository();
    const ticketsData = repository.getTicketsData();

    // Check that each ticket type has price and seats properties
    Object.values(ticketsData).forEach((ticketData) => {
      expect(ticketData).toHaveProperty("price");
      expect(ticketData).toHaveProperty("seats");
    });
  });

  test("should have numeric values for price and seats", () => {
    const repository = new TicketRepository();
    const ticketsData = repository.getTicketsData();

    // Check that all price and seats values are numbers
    Object.values(ticketsData).forEach((ticketData) => {
      expect(typeof ticketData.price).toBe("number");
      expect(typeof ticketData.seats).toBe("number");
    });
  });
});
