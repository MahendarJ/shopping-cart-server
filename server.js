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

const stockCount = async () => {
  const response = await db.query("SELECT COUNT(*) FROM stock");
  const rowCount = parseInt(response.rows[0].count);
  return rowCount;
};

app.post("/store", async (req, res) => {
  try {
    const { id, title, price } = req.body;
    if (!id || !title || !price) {
      return res.status(400).json({ message: "Invalid input data" });
    }
    await db.query("INSERT INTO stock(id, title, price) VALUES ($1, $2, $3)", [
      id,
      title,
      price,
    ]);
    const count = await stockCount();
    res
      .status(201)
      .json({ message: "Stock item created successfully", count: count });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.get("/store", async (req, res) => {
  try {
    const response = await db.query("SELECT * FROM stock");
    res.status(200).json(response.rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
app.delete("/store/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await db.query("DELETE FROM stock WHERE id=$1", [id]);
    const count = await stockCount();
    res
      .status(201)
      .json({ message: "Stock item deleted successfully", count: count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post("/", async (req, res) => {
  const { username, password } = req.body;
  try {
    const response = await db.query("SELECT id,username,password FROM users");
    const user = response.rows.filter(
      (item) => item.username === username && item.password === password
    );
    if (!user) {
      res.status(401).json({ user: "unauthenticated" });
    } else {
      res.status(200).json({ user: user[0]?.username, token: user[0]?.id });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
app.listen(PORT, () => {
  console.log(`Running on http://localhost:${PORT}`);
});
