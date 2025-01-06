const express = require("express");
const router = express.Router();
const { sql, poolPromise } = require("./db");

// Pobierz wszystkich pacjentów
router.get("/", async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT id_pacjenta, imie, nazwisko FROM dbo.Pacjent
    `);
    res.json(result.recordset);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Pobierz jednego pacjenta
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("id", sql.Int, id)
      .query(`
        SELECT id_pacjenta, imie, nazwisko FROM dbo.Pacjent WHERE id_pacjenta = @id
      `);
    res.json(result.recordset[0]);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Dodaj nowego pacjenta
router.post("/", async (req, res) => {
  const { imie, nazwisko } = req.body;
  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("imie", sql.NVarChar(50), imie)
      .input("nazwisko", sql.NVarChar(50), nazwisko)
      .query(`
        INSERT INTO dbo.Pacjent (imie, nazwisko)
        OUTPUT INSERTED.id_pacjenta
        VALUES (@imie, @nazwisko)
      `);
    res.status(201).json({ id_pacjenta: result.recordset[0].id_pacjenta, message: "Dodano nowego pacjenta" });
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Aktualizuj pacjenta
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { imie, nazwisko } = req.body;
  try {
    const pool = await poolPromise;
    await pool
      .request()
      .input("id", sql.Int, id)
      .input("imie", sql.NVarChar(50), imie)
      .input("nazwisko", sql.NVarChar(50), nazwisko)
      .query(`
        UPDATE dbo.Pacjent
        SET imie = @imie, nazwisko = @nazwisko
        WHERE id_pacjenta = @id
      `);
    res.send("Zaktualizowano pacjenta");
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Usuń pacjenta
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const pool = await poolPromise;
    await pool
      .request()
      .input("id", sql.Int, id)
      .query(`
        DELETE FROM dbo.Pacjent WHERE id_pacjenta = @id
      `);
    res.send("Usunięto pacjenta");
  } catch (error) {
    res.status(500).send(error.message);
  }
});

module.exports = router;