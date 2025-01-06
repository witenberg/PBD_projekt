const express = require("express");
const router = express.Router();
const { sql, poolPromise } = require("./db");

// Pobierz wszystkich lekarzy
router.get("/", async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT l.id_lekarza, p.imie + ' ' + p.nazwisko AS imie_nazwisko
      FROM dbo.Lekarz l
      JOIN dbo.Pracownik p ON l.id_lekarza = p.id_pracownika
    `);
    res.json(result.recordset);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Pobierz dostępnych pracowników (nie będących lekarzami ani recepcjonistami)
router.get("/dostepni-pracownicy", async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT id_pracownika, imie, nazwisko
      FROM dbo.Pracownik
      WHERE id_pracownika NOT IN (SELECT id_lekarza FROM dbo.Lekarz)
        AND id_pracownika NOT IN (SELECT id_pracownika FROM dbo.Recepcjonista)
    `);
    res.json(result.recordset);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Dodaj nowego lekarza
router.post("/", async (req, res) => {
  const { id_lekarza } = req.body;
  try {
    const pool = await poolPromise;
    
    // Sprawdź, czy pracownik nie jest już recepcjonistą
    const checkResult = await pool
      .request()
      .input("id_pracownika", sql.Int, id_lekarza)
      .query(`
        SELECT COUNT(*) as count FROM dbo.Recepcjonista WHERE id_pracownika = @id_pracownika
      `);
    
    if (checkResult.recordset[0].count > 0) {
      return res.status(400).json({ message: "Ten pracownik jest już recepcjonistą i nie może być lekarzem." });
    }

    await pool
      .request()
      .input("id_lekarza", sql.Int, id_lekarza)
      .query(`
        INSERT INTO dbo.Lekarz (id_lekarza)
        VALUES (@id_lekarza)
      `);
    res.status(201).send("Dodano nowego lekarza");
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Usuń lekarza
router.delete("/:id_lekarza", async (req, res) => {
  const { id_lekarza } = req.params;
  try {
    const pool = await poolPromise;
    await pool
      .request()
      .input("id_lekarza", sql.Int, id_lekarza)
      .query(`
        DELETE FROM dbo.Lekarz WHERE id_lekarza = @id_lekarza
      `);
    res.send("Usunięto lekarza");
  } catch (error) {
    res.status(500).send(error.message);
  }
});

module.exports = router;