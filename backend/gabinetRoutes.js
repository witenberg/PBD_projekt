const express = require("express");
const router = express.Router();
const { sql, poolPromise } = require("./db");

// Pobierz wszystkie gabinety
router.get("/", async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT g.numer, g.budynek, b.nazwa AS budynek_nazwa, g.pietro
      FROM dbo.Gabinet g
      JOIN dbo.Budynek b ON g.budynek = b.symbol
    `);
    res.json(result.recordset);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Pobierz jeden gabinet
router.get("/:numer/:budynek", async (req, res) => {
  const { numer, budynek } = req.params;
  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("numer", sql.Int, numer)
      .input("budynek", sql.NVarChar(10), budynek)
      .query(`
        SELECT g.*, b.nazwa AS budynek_nazwa
        FROM dbo.Gabinet g
        JOIN dbo.Budynek b ON g.budynek = b.symbol
        WHERE g.numer = @numer AND g.budynek = @budynek
      `);
    res.json(result.recordset[0]);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Dodaj nowy gabinet
router.post("/", async (req, res) => {
  const { numer, budynek, pietro } = req.body;
  try {
    const pool = await poolPromise;
    
    // Sprawdź, czy gabinet już istnieje
    const checkResult = await pool
      .request()
      .input("numer", sql.Int, numer)
      .input("budynek", sql.NVarChar(10), budynek)
      .query(`
        SELECT COUNT(*) as count FROM dbo.Gabinet WHERE numer = @numer AND budynek = @budynek
      `);
    
    if (checkResult.recordset[0].count > 0) {
      return res.status(400).json({ message: "Gabinet o podanym numerze i budynku już istnieje." });
    }

    await pool
      .request()
      .input("numer", sql.Int, numer)
      .input("budynek", sql.NVarChar(10), budynek)
      .input("pietro", sql.Int, pietro)
      .query(`
        INSERT INTO dbo.Gabinet (numer, budynek, pietro)
        VALUES (@numer, @budynek, @pietro)
      `);
    res.status(201).send("Dodano nowy gabinet");
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Aktualizuj gabinet
router.put("/:oldNumer/:oldBudynek", async (req, res) => {
  const { oldNumer, oldBudynek } = req.params;
  const { numer, budynek, pietro } = req.body;
  try {
    const pool = await poolPromise;
    await pool
      .request()
      .input("oldNumer", sql.Int, oldNumer)
      .input("oldBudynek", sql.NVarChar(10), oldBudynek)
      .input("numer", sql.Int, numer)
      .input("budynek", sql.NVarChar(10), budynek)
      .input("pietro", sql.Int, pietro)
      .query(`
        UPDATE dbo.Gabinet
        SET numer = @numer, budynek = @budynek, pietro = @pietro
        WHERE numer = @oldNumer AND budynek = @oldBudynek
      `);
    res.send("Zaktualizowano gabinet");
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Usuń gabinet
router.delete("/:numer/:budynek", async (req, res) => {
  const { numer, budynek } = req.params;
  try {
    const pool = await poolPromise;
    await pool
      .request()
      .input("numer", sql.Int, numer)
      .input("budynek", sql.NVarChar(10), budynek)
      .query(`
        DELETE FROM dbo.Gabinet WHERE numer = @numer AND budynek = @budynek
      `);
    res.send("Usunięto gabinet");
  } catch (error) {
    res.status(500).send(error.message);
  }
});

module.exports = router;