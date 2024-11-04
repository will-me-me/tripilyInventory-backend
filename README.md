# Triply Backend Microservices

This project consists of a set of microservices designed to handle different aspects of an application. Each microservice is responsible for specific functionalities, making the system modular and easier to maintain.

## Table of Contents

1. [Overview](#overview)
2. [Microservices](#microservices)
   - [Order Service](#order-service)
   - [Inventory Service](#inventory-service)
3. [Getting Started](#getting-started)
   - [Prerequisites](#prerequisites)
   - [Installation](#installation)
4. [API Endpoints](#api-endpoints)
5. [Data Transfer Examples](#data-transfer-examples)
6. [Contributing](#contributing)
7. [License](#license)

## Overview

The Triply backend is designed as a set of microservices to support an e-commerce platform. It includes services for handling orders and inventory management, among other functionalities. Each service communicates through RESTful APIs and uses PostgreSQL as the database.

Here's the updated Docker configuration README file with the correct port for the Order Service:

## Prerequisites

Ensure you have the following installed on your machine:

- [Docker](https://www.docker.com/get-started)
- [Docker Compose](https://docs.docker.com/compose/install/)

## Steps to Run the Project

1. **Clone the Git Repository**

   ```bash
   git clone <repository-url>
   cd triply-backend
   ```

2. **Start the Docker Containers**

   - To start the PostgreSQL database and the necessary microservices, run:

   ```bash
   docker-compose up
   ```

3. **Access the Microservices**

   - Each microservice will be accessible on its designated port. You can find the specific ports in the `docker-compose.yml` file.
   - For example:
     - **Inventory Service**: `http://localhost:3001`
     - **Order Service**: `http://localhost:3000` _(corrected to 3000)_
     - **Postgres Database**: `localhost:5432`

4. **Stopping the Containers**
   - To stop all running containers, use:
   ```bash
   docker-compose down
   ```

## Troubleshooting

- **Port Conflicts**: If you encounter issues with ports being in use, ensure that no other applications are running on the specified ports. You may need to modify the ports in the `docker-compose.yml` file.
- **Container Errors**: Check the logs for any container-specific errors using:
  ```bash
  docker-compose logs
  ```

## Microservices

### Order Service

The Order Service manages customer orders. It allows creating, updating, and retrieving orders.

#### API Endpoints

- **Create Order**: `POST api/orders`
- **Update Order Status**: `PATCH api/orders/:id/status`
- **Get All Orders**: `GET api/orders`
- **Get Order by ID**: `GET api/orders/:id`

#### Example JSON for Creating an Order

```json
{
  "customerId": "123e4567-e89b-12d3-a456-426614174000",
  "items": [
    {
      "productId": "987e6543-e21b-12d3-a456-426614174001",
      "quantity": 2
    }
  ],
  "status": "PENDING"
}
```

### Inventory Service

The Inventory Service manages product inventory. It allows adding products, updating quantities, and retrieving product details.

#### API Endpoints

- **Add Product**: `POST api/inventory`
- **Update Product Quantity**: `PATCH api/inventory/:productId`
- **Get All Products**: `GET api/inventory`
- **Get Product by ID**: `GET api/inventory/:productId`

#### Example JSON for Updating Product Quantity

```json
{
  "quantity": 50
}
```

## Getting Started

### Prerequisites

Ensure you have the following installed:

- Git
- Node.js
- npm (Node Package Manager)
- Docker (for running the PostgreSQL container)

### Installation

1. **Clone the Git Repository**

   Open your terminal and run the following command to clone the repository:

   ```bash
   git clone <repository-url>
   ```

   Replace `<repository-url>` with the actual URL of your Git repository.

2. **Start the Order Service**

   Navigate to the `order-service` directory:

   ```bash
   cd order-service
   ```

   Install the necessary dependencies:

   ```bash
   npm install
   ```

   Start the Order Service in development mode:

   ```bash
   npm run start:dev
   ```

3. **Start the Inventory Service**

   Open a new terminal window (to keep the order service running) and navigate to the `inventory-service` directory:

   ```bash
   cd inventory-service
   ```

   Install the necessary dependencies:

   ```bash
   npm install
   ```

   Start the Inventory Service in development mode:

   ```bash
   npm run start:dev
   ```

## API Endpoints

The API documentation for each microservice can be found within the service itself. Ensure to explore the routes using a tool like Postman or Swagger UI.

## Data Transfer Examples

### Order Service

#### Creating an Order

```json
{
  "customerId": "123e4567-e89b-12d3-a456-426614174000",
  "items": [
    {
      "productId": "987e6543-e21b-12d3-a456-426614174001",
      "quantity": 2
    }
  ],
  "status": "PENDING"
}
```

#### Updating Order Status

```json
{
  "status": "CONFIRMED"
}
```

### Inventory Service

#### Adding a Product

```json
{
  "name": "Product Name",
  "description": "Product Description",
  "quantity": 100,
  "price": 29.99
}
```

#### Updating Product Quantity

```json
{
  "quantity": 50
}
```

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository.
2. Create your feature branch: `git checkout -b feature/new-feature`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature/new-feature`
5. Open a pull request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

Feel free to modify any sections according to your project's needs!
