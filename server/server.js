const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const User = require("./models/userModel");
const bookRoutes = require("./routes/books"); // ✅ חדש

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect("mongodb+srv://ofekwe:FPDBM100@cluster0.lza1t9s.mongodb.net/textbooks")
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// ✅ התחברות למערכת הספרים
app.use("/api/books", bookRoutes);

// ✅ מסלול הרשמה
app.post("/register", async (req, res) => {
  try {
    const { username, email, password, phone, city } = req.body;

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: "האימייל כבר רשום" });

    const newUser = new User({ username, email, password, phone, city });
    await newUser.save();

    res.status(201).json({ message: "ההרשמה הצליחה!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "שגיאה בשרת" });
  }
});

// ✅ מסלול כניסת משתמש
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "האימייל לא נמצא" });
    }

    if (user.password !== password) {
      return res.status(401).json({ message: "סיסמה שגויה" });
    }

    res.status(200).json({ message: "התחברת בהצלחה", user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "שגיאה בשרת" });
  }
});

app.listen(3001, () => console.log("🚀 Server running on port 3001"));

const donatedBooksRouter = require('./routes/donatedBooks');

// ואז בחיבור ראוטים
app.use('/api/donatedBooks', donatedBooksRouter);


 
const reservedBooksRoutes = require('./routes/reservedBooks');
app.use('/api/reservedBooks', reservedBooksRoutes);
