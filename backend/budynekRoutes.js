const express = require("express");
const router = express.Router();
const { sql, poolPromise } = require("./db");

// Pobierz wszystkie budynki
router.get("/", async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT * FROM dbo.Budynek
    `);
    res.json(result.recordset);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Pobierz jeden budynek
router.get("/:symbol", async (req, res) => {
  const { symbol } = req.params;
  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("symbol", sql.NVarChar(10), symbol)
      .query(`
        SELECT * FROM dbo.Budynek WHERE symbol = @symbol
      `);
    res.json(result.recordset[0]);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Dodaj nowy budynek
router.post("/", async (req, res) => {
  const { symbol, nazwa, adres } = req.body;
  try {
    const pool = await poolPromise;
    
    // Sprawdź, czy symbol już istnieje
    const checkResult = await pool
      .request()
      .input("symbol", sql.NVarChar(10), symbol)
      .query(`
        SELECT COUNT(*) as count FROM dbo.Budynek WHERE symbol = @symbol
      `);
    
    if (checkResult.recordset[0].count > 0) {
      return res.status(400).json({ message: "Budynek o podanym symbolu już istnieje." });
    }

    await pool
      .request()
      .input("symbol", sql.NVarChar(10), symbol)
      .input("nazwa", sql.NVarChar(50), nazwa)
      .input("adres", sql.NVarChar(100), adres)
      .query(`
        INSERT INTO dbo.Budynek (symbol, nazwa, adres)
        VALUES (@symbol, @nazwa, @adres)
      `);
    res.status(201).send("Dodano nowy budynek");
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Aktualizuj budynek
router.put("/:symbol", async (req, res) => {
  const { symbol } = req.params;
  const { nazwa, adres } = req.body;
  try {
    const pool = await poolPromise;
    await pool
      .request()
      .input("symbol", sql.NVarChar(10), symbol)
      .input("nazwa", sql.NVarChar(50), nazwa)
      .input("adres", sql.NVarChar(100), adres)
      .query(`
        UPDATE dbo.Budynek
        SET nazwa = @nazwa, adres = @adres
        WHERE symbol = @symbol
      `);
    res.send("Zaktualizowano budynek");
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Usuń budynek
router.delete("/:symbol", async (req, res) => {
  const { symbol } = req.params;
  try {
    const pool = await poolPromise;

    // Sprawdzenie, czy do budynku są przypisane gabinety
    const result = await pool
      .request()
      .input("symbol", sql.NVarChar(10), symbol)
      .query(`
        SELECT COUNT(*) AS gabinetyCount
        FROM dbo.Gabinet
        WHERE budynek = @symbol
      `);

    const gabinetyCount = result.recordset[0].gabinetyCount;

    if (gabinetyCount > 0) {
      // Zwrócenie informacji o przypisanych gabinetach
      return res.status(400).send(`Nie można usunąć budynku. Do tego budynku przypisane są gabinety.`);
    }

    // Usunięcie budynku
    await pool
      .request()
      .input("symbol", sql.NVarChar(10), symbol)
      .query(`
        DELETE FROM dbo.Budynek WHERE symbol = @symbol
      `);

    res.send("Usunięto budynek");
  } catch (error) {
    res.status(500).send(error.message);
  }
});


module.exports = router;