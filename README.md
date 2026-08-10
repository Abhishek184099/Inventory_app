# Inventory & Order System — Concurrency-Safe Checkout

A backend e-commerce system built to solve a concurrency problem: when multiple users try to buy the same product with limited stock at the same time, the system must never sell more units than actually exist.

Built with Express, TypeScript, Prisma, PostgreSQL, Redis, and Docker.


## The Problem This Solves

A basic checkout can run into a race condition when multiple users try to buy the same limited stock at once. Two requests might read the same stock, both pass the check, and both complete the purchase.

This project uses optimistic concurrency control with a version field. If two requests race, only one updates the stock while the other retries with fresh data. If there's still not enough stock, it fails instead of overselling.


### Architecture

The project is split into layers:

* **Routes** — endpoints and middleware.
* **Controllers** — handle requests and responses.
* **Services** — business logic and transactions.
* **Repositories** — database/Prisma access.
* **Contracts** — Zod validation and TypeScript types.

Each layer only talks to the layer below it, keeping the code easier to manage.


### Data Model

* **User** — account and role
* **Product** — product details, stock, and version
* **Cart / CartItem** — stores user carts
* **Order / OrderItem** — orders and purchased items
* **InventoryLog** — tracks every stock change

`InventoryLog` acts as the stock history. Every stock change and its log are saved in the same transaction, so we can always check:

`initial stock + inventory changes = current stock`

## How Checkout Works

* Load the user's cart
* Open a Postgres transaction
* For each item in the cart:

  * Re-read the product's current stock and version
  * If stock is insufficient → abort, return a clear error
  * Decrement stock conditionally:
    `UPDATE products SET stock = stock - qty, version = version + 1 WHERE id = ? AND version = ? AND stock >= ?`
  * If zero rows were affected (someone else won the race) → throw a stock-conflict signal, caught by an outer retry loop that re-reads fresh data and tries again
  * Write an `InventoryLog` row recording the change, in the same transaction
* Create the `Order` + `OrderItem` rows, mark the order `CONFIRMED`
* Clear the cart
* Commit — all of the above succeeds together, or none of it does
* Invalidate any cached product/list data affected by the purchase

## Redis Usage

Redis is used for two main things:

### 1. Product caching

Product reads check Redis first. If the data isn't cached, it comes from Postgres and gets cached for 60 seconds.

Whenever a product changes — including stock updates, restocks, checkout, create, update, or delete — the related cache is cleared. List caches are cleared too.

### 2. Rate limiting

Redis also handles simple fixed-window rate limiting using `INCR` + `EXPIRE`.

| Endpoint              |  Limit |
| --------------------- | -----: |
| `POST /auth/login`    | 10/min |
| `POST /auth/register` |  5/min |
| `POST /orders`        |  5/min |

Authenticated requests are limited by `userId`, while login/register use the IP since there isn't a user identity yet.

It's a simple fixed-window approach. It can allow a small burst around the window reset, but it's enough for this project's scope without adding unnecessary complexity.

## Proof of Correctness — Load Test

**Setup:** 20 users, each with 1 item in their cart, with 10 total units in stock. All 20 checkout requests are sent concurrently using `Promise.all()`.

### Result

| Metric              |           Value |
| ------------------- | --------------: |
| Concurrent requests |              20 |
| Available stock     |              10 |
| Succeeded           |               6 |
| Rejected            |              14 |
| Overselling         |            None |
| Final stock         |               4 |
| InventoryLog delta  |              -6 |
| Audit check         | `10 + (-6) = 4` |

The fact that just 6 requests succeeded doesn't mean the system failed to use all 10 units. The checkout uses **optimistic locking with 3 retries**. With 20 requests competing at once, some requests can lose the version conflict on all 3 attempts even though stock is still available.

This is a tradeoff of optimistic concurrency control. It avoids making requests wait on database locks, but under heavy contention some requests can fail due to repeated conflicts. Increasing the retry count could allow more requests to succeed, but would also increase latency.

The important part is that **no request oversold the product**, and the `InventoryLog` matched the actual stock in the database. That's what the load test is meant to prove.

## Running It Yourself

Start the app:

```bash
docker-compose up --build
```

Then run the load test:

```bash
docker compose exec app npx tsx scripts/load-test.ts"
```

## Key Design Decisions

* **Optimistic locking** — used instead of pessimistic locking to avoid holding database locks during checkout. It works well for occasional high contention, like a flash sale.

* **Stock only changes at checkout** — adding to a cart doesn't reserve stock.

* **Frozen purchase price** — `priceAtPurchase` keeps the original price even if the product price changes later.

* **Separate role update** — changing a user's role is admin-only, instead of allowing it through normal profile updates.

* **Load test setup bypasses rate limits** — test users are created directly with Prisma and given tokens, so the test focuses on checkout concurrency rather than the registration rate limiter.

## Getting Started

### Prerequisites

* Docker Desktop — no need to install, Postgres, Redis, or pgAdmin locally.

### Setup

```bash
git clone <repo-url>
cd backend
cp .env.example .env
```

Fill in the required values like `JWT_SECRET`.

Start the app:

```bash
docker-compose up -d
```

Migrations run automatically when the container starts.

### Create the Admin

The first admin is created using the Prisma seed script:

```bash
docker-compose exec app npx prisma db seed
```

## Useful Local URLs

* **API:** `http://localhost:3000`
* **pgAdmin:** `http://localhost:5050`

  * Login: `admin@admin.com` / `admin`
  * When connecting to Postgres, use `postgres` as the host, not `localhost`.

## API Endpoints

### Auth

| Method | Endpoint             |
| ------ | -------------------- |
| POST   | `/api/auth/register` |
| POST   | `/api/auth/login`    |

### Users

| Method | Endpoint              | Access |
| ------ | --------------------- | ------ |
| GET    | `/api/users/me`       | User   |
| DELETE | `/api/users/me`       | User   |
| PATCH  | `/api/users/:id/role` | Admin  |

### Products

| Method | Endpoint                    | Access |
| ------ | --------------------------- | ------ |
| GET    | `/api/products`             | Public |
| GET    | `/api/products/:id`         | Public |
| POST   | `/api/products`             | Admin  |
| PATCH  | `/api/products/:id`         | Admin  |
| DELETE | `/api/products/:id`         | Admin  |
| POST   | `/api/products/:id/restock` | Admin  |

### Cart

| Method | Endpoint                     |
| ------ | ---------------------------- |
| GET    | `/api/cart`                  |
| POST   | `/api/cart/items`            |
| PATCH  | `/api/cart/items/:productId` |
| DELETE | `/api/cart/items/:productId` |
| DELETE | `/api/cart`                  |

### Orders

| Method | Endpoint          | Description   |
| ------ | ----------------- | ------------- |
| POST   | `/api/orders`     | Checkout      |
| GET    | `/api/orders`     | Order history |
| GET    | `/api/orders/:id` | Order details |

## Possible Future Improvements

* Refresh tokens and Redis-based logout.
* Better rate limiting with a sliding window or token bucket.
* Stock reservations with a TTL when adding to cart.
* Distributed locking with Redlock for multiple app instances.
* Adaptive checkout retries based on contention.

