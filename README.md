# Cinema Ticket Service

A Node.js implementation of a cinema ticket purchasing service that handles ticket types, payment processing, and seat reservation according to specific business rules.

## Project Overview

This application implements a ticket booking system for a cinema with the following features:

- Purchase tickets of different types (Adult, Child, Infant)
- Validate purchases according to business rules
- Process payments
- Reserve seats

## Setup Requirements

### Prerequisites

- Node.js (v18 or newer)
- npm or yarn

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd DWP-cinema-tickets
```

2. Install dependencies:

```bash
npm install
```

### Running Tests

```bash
npm test
```

## Project Structure

```
DWP-cinema-tickets/
├── src/
│   ├── pairtest/
│   │   ├── TicketService.js            # Main service for processing ticket purchases
│   │   ├── repository/
│   │   │   └── TicketRepository.js     # Repository providing ticket price and seat data
│   │   └── lib/
│   │       ├── InvalidPurchaseException.js  # Custom exception for invalid purchases
│   │       └── TicketTypeRequest.js    # Value object for ticket requests
│   └── thirdparty/                    # External services
│       ├── paymentgateway/
│       │   └── TicketPaymentService.js # Service for processing payments
│       └── seatbooking/
│           └── SeatReservationService.js # Service for reserving seats
└── test/                              # Unit tests
    ├── TicketService.test.js
    ├── TicketTypeRequest.test.js
    └── TicketRepository.test.js
```
