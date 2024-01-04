import express from "express";
import cors from "cors";
import Stripe from "stripe";
import pg from "pg";

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  port: 5432,
  password: "10121998",
  database: "shopping inventory",
});
db.connect();

const stripe = new Stripe(
  "sk_test_51OU9vSSD9cF8fKGZDZDZOm28CgQH7n4oEtfsjT8kul00oji1LGrE5LEN5DduUT3Fmn7rMPEdiVMx71OkyBbeKetE00pu4JJIe7"
);
const PORT = 3000;
const app = express();
app.use(cors());
app.use(express.static("public"));
app.use(express.json());

app.post("/checkout", async (req, res) => {
  const { items } = req.body;

  let lineItems = [];

  items.forEach((item) => {
    lineItems.push({
      price: item.id,
      quantity: item.quantity,
    });
  });
  const session = await stripe.checkout.sessions.create({
    line_items: lineItems,
    mode: "payment",
    success_url: "http://localhost:5173/success",
    cancel_url: "http://localhost:5173/cancel",
  });

  res.send(
    JSON.stringify({
      url: session.url,
    })
  );
});

app.post("/", async (req, res) => {
  const { id, title, price } = req.body;
  try {
    await db.query("INSERT INTO stock(id,title,price) VALUES ($1,$2,$3)", [
      id,
      title,
      price,
    ]);
    const response = await db.query("SELECT * FROM stock");
    res.status(200).json({ message: response.rows.length });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.get("/", async (req, res) => {
  try {
    const response = await db.query("SELECT * FROM stock");
    res.status(200).json(response.rows);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Running on http://localhost:${PORT}`);
});
