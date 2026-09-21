# Order & Delivery Tracker

A simple full-stack app for running a "take orders → buy the items → ship →
deliver" business: track customers, the orders they place, the items in each
order, and each item's journey from ordered → purchased → shipped →
delivered (with tracking numbers and shipping agencies).

Stack: **Node.js/Express + SQLite** backend, **React (Vite)** frontend — no
external services or accounts needed, everything runs locally. The backend
uses Node's built-in SQLite module, so `npm install` never needs to compile
anything — no Visual Studio Build Tools or C++ compiler required. Requires
**Node.js 22.5 or newer** (check with `node -v`; get it from nodejs.org if
you need to upgrade).

## Data model

- **Customer** — name, phone, location, notes.
- **Order** — belongs to a customer, has a date, groups a batch of items
  bought together.
- **Order item** — one product within an order: name, qty, price, shipping
  agency, shipping cost, expected date, tracking number, and two flags:
  `purchased` and `received` (delivered).

Status per item is derived automatically, not stored as a separate field:

```
Ordered → Purchased → Shipped (tracking no. assigned) → Delivered (received = Yes)
```

An order's overall status is the earliest stage among its items — an order
isn't "Delivered" until every item in it is.

## Project layout

```
server/   Express API + SQLite database + Excel importer
client/   React app (Vite)
```

## First-time setup

### 1. Backend

```bash
cd server
npm install
```

If you want to start from your existing spreadsheet data (customers, items,
tracking numbers, statuses), import it now — this only needs to be run once:

```bash
node src/import.js /path/to/Shipping_Customers.xlsx
```

This creates `server/data/app.db` (SQLite file) and reads every sheet as one
customer, each row as one item, grouping items into orders by the order date
on each row.

Then start the API:

```bash
npm start
```

It listens on **http://localhost:4000**.

### 2. Frontend

In a second terminal:

```bash
cd client
npm install
npm run dev
```

Open **http://localhost:5173** — it proxies API calls to the backend
automatically (see `client/vite.config.js`).

## Using the app

- **Dashboard** — counts of customers/orders/items, how many are at each
  stage, overdue deliveries (past expected date, not yet delivered), and a
  breakdown by shipping agency.
- **Customers** — add new customers, see how many items each has pending
  delivery, open a customer to see their full order history.
- **Customer detail** — start a new order (with as many line items as you
  like), edit any item inline (price, agency, tracking number, mark
  purchased/delivered), or delete an item/order.
- **Orders & Delivery** — every item across every customer in one table,
  filterable by status and searchable by customer, item name or tracking
  number. This is the view for "where is everything right now."

## Re-importing or resetting data

The importer is idempotent for customers (it reuses a customer by name if
one already exists) but will add a new batch of orders/items every time it's
run, so don't re-run it against a workbook you've already imported unless
you want duplicates. To start over completely:

```bash
rm server/data/app.db server/data/app.db-shm server/data/app.db-wal
```

then re-run the import (or just `npm start` for an empty database).

## Extending it

Some natural next steps, not built yet:
- Authentication, if you ever want clients to log in and see their own
  orders (you said admin-only for now).
- Per-customer running balance (amount owed for items + shipping).
- Export a customer's order history to Excel/PDF.
- Notifications (SMS/WhatsApp) when an item's status changes.

The code is deliberately small and readable (plain Express routes, plain
SQL via Node's built-in `node:sqlite`, plain React with fetch) so it's easy
to extend yourself alongside your other projects.

## Deploying to Railway (so it's reachable from any device)

Running it locally (above) only works on the one computer that has both
`npm start`/`npm run dev` running. To get a link you can open from your
phone or any computer, deploy it to Railway as **two services** from the
same repo.

Cost note: Railway does not have a permanent free tier anymore — new
accounts get a small trial credit, then it's usage-based billing (a small
app like this typically costs a few dollars a month). If that's not
workable, say so and we can look at alternatives.

### 0. Put the code on GitHub

Railway deploys from a Git repository.

```bash
cd order-delivery-app
git init
git add .
git commit -m "Order and delivery tracker"
```

Then create an empty repository on GitHub (github.com → New repository,
don't initialize with a README), and push:

```bash
git remote add origin https://github.com/<your-username>/<repo-name>.git
git branch -M main
git push -u origin main
```

### 1. Backend service (API + database)

In Railway: **New Project → Deploy from GitHub repo** → pick this repo.

- **Settings → Root Directory**: `server`
- **Settings → Build Command**: `npm install`
- **Settings → Start Command**: `npm start`
- **Add a Volume** (Settings → Volumes → New Volume): mount path `/data`
  — this is what makes your customer/order data survive redeploys.
- **Variables**: add `DATA_DIR` = `/data`
- Deploy, then open **Settings → Networking → Generate Domain** to get a
  public URL, something like `https://order-delivery-api-production.up.railway.app`.

The database starts empty. To load your existing spreadsheet data, either:
- run the import once locally against a copy of the file, then upload
  `server/data/app.db` into the Railway volume (Railway's dashboard lets you
  open a shell for the service — run `node src/import.js` there after
  uploading the xlsx), or
- ask me and I'll walk through it with you once the service is live.

### 2. Frontend service (the web app itself)

Still in the same Railway project: **New → GitHub repo** (same repo again).

- **Settings → Root Directory**: `client`
- **Settings → Build Command**: `npm install && npm run build`
- **Settings → Start Command**: `npm start`
- **Variables**: add `VITE_API_URL` = `https://<your-backend-domain>/api`
  (the backend URL from step 1, with `/api` on the end) — this has to be
  set *before* the build runs, since Vite bakes it into the built files.
- Deploy, then generate a domain for this service too.

That second domain — something like
`https://order-delivery-client-production.up.railway.app` — is the link you
open on any phone, tablet, or computer. Bookmark it.

### Updating the app later

Any time you `git push` a change, both Railway services rebuild
automatically. The backend's data survives because it lives on the Volume,
not in the container itself.
