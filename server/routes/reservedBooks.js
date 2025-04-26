const express = require('express');
const router = express.Router();
const DonatedBook = require('../models/donatedBookModel');
const ReservedBook = require('../models/reservedBookModel');

// ✅ שריון ספר
router.post('/reserve/:id', async (req, res) => {
  try {
    const donatedBookId = req.params.id;
    const { reservedBy } = req.body; // ID של המשתמש שמבקש לשריין

    // חיפוש הספר
    const bookToReserve = await DonatedBook.findById(donatedBookId);
    if (!bookToReserve) {
      return res.status(404).json({ message: 'הספר לא נמצא' });
    }

    // יצירת עותק ב-reservedBooks
    const reservedBook = new ReservedBook({
      donatedBookId: bookToReserve._id,
      userId: bookToReserve.userId,
      reservedBy: reservedBy,
      bookTitle: bookToReserve.bookTitle,
      author: bookToReserve.author,
      grade: bookToReserve.grade,
      barcode: bookToReserve.barcode,
      condition: bookToReserve.condition,
      subject: bookToReserve.subject || null,
      reservedUntil: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // ⏳ שלושה ימים קדימה
    });

    await reservedBook.save();
    await bookToReserve.deleteOne(); // מחיקת הספר מ-donatedBooks

    res.status(200).json({ message: '✅ הספר שוריין בהצלחה', reservedBook });
  } catch (error) {
    console.error('❌ שגיאה בשריון ספר:', error);
    res.status(500).json({ message: 'שגיאה בשרת בעת שריון ספר' });
  }
});

// ✅ ביטול שריון ספר (עם בקשה יזומה)
router.post('/cancel/:id', async (req, res) => {
  try {
    const reservedBookId = req.params.id;

    // חיפוש הספר המשוריין
    const reservedBook = await ReservedBook.findById(reservedBookId);
    if (!reservedBook) {
      return res.status(404).json({ message: 'ספר משוריין לא נמצא' });
    }

    // יצירת עותק חזרה ב-donatedBooks
    const returnedBook = new DonatedBook({
      userId: reservedBook.userId,
      bookTitle: reservedBook.bookTitle,
      author: reservedBook.author,
      grade: reservedBook.grade,
      barcode: reservedBook.barcode,
      condition: reservedBook.condition
    });

    await returnedBook.save();
    await reservedBook.deleteOne(); // מחיקת הספר מ-reservedBooks

    res.status(200).json({ message: '✅ השריון בוטל והספר חזר למאגר התרומות' });
  } catch (error) {
    console.error('❌ שגיאה בביטול שריון:', error);
    res.status(500).json({ message: 'שגיאה בשרת בעת ביטול שריון' });
  }
});

module.exports = router;
