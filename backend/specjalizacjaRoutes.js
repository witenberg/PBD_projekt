const express = require("express");
const router = express.Router();
const { sql, poolPromise } = require("./db");

// Pobierz wszystkie specjalizacje
router.get("/", async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT s.id_specjalizacji, s.id_lekarza, p.imie + ' ' + p.nazwisko AS imie_nazwisko, s.specjalizacja
      FROM dbo.Specjalizacja s
      JOIN dbo.Lekarz l ON s.id_lekarza = l.id_lekarza
      JOIN dbo.Pracownik p ON l.id_lekarza = p.id_pracownika
    `);
    res.json(result.recordset);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Pobierz listę lekarzy
router.get("/lekarze", async (req, res) => {
    try {
      const pool = await poolPromise;
      const result = await pool.request().query(`
        SELECT l.id_lekarza, p.imie, p.nazwisko
        FROM dbo.Lekarz l
        JOIN dbo.Pracownik p ON l.id_lekarza = p.id_pracownika
        WHERE l.id_lekarza NOT IN (SELECT id_lekarza FROM Specjalizacja)
      `);
      res.json(result.recordset);
    } catch (error) {
      res.status(500).send(error.message);
    }
  });

// Pobierz jedną specjalizację
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("id", sql.Int, id)
      .query(`
        SELECT s.id_specjalizacji, s.id_lekarza, p.imie, p.nazwisko, s.specjalizacja
        FROM dbo.Specjalizacja s
        JOIN dbo.Lekarz l ON s.id_lekarza = l.id_lekarza
        JOIN dbo.Pracownik p ON l.id_lekarza = p.id_pracownika
        WHERE s.id_specjalizacji = @id
      `);
    res.json(result.recordset[0]);
  } catch (error) {
    res.status(500).send(error.message);
  }
});


// Dodaj nową specjalizację
router.post("/", async (req, res) => {
  const { id_lekarza, specjalizacja } = req.body;
  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("id_lekarza", sql.Int, id_lekarza)
      .input("specjalizacja", sql.NVarChar(100), specjalizacja)
      .query(`
        INSERT INTO dbo.Specjalizacja (id_lekarza, specjalizacja)
        OUTPUT INSERTED.id_specjalizacji
        VALUES (@id_lekarza, @specjalizacja)
      `);
    res.status(201).json({ id_specjalizacji: result.recordset[0].id_specjalizacji, message: "Dodano nową specjalizację" });
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Aktualizuj specjalizację
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { specjalizacja } = req.body;
  try {
    const pool = await poolPromise;
    await pool
      .request()
      .input("id", sql.Int, id)
      .input("specjalizacja", sql.NVarChar(100), specjalizacja)
      .query(`
        UPDATE dbo.Specjalizacja
        SET specjalizacja = @specjalizacja
        WHERE id_specjalizacji = @id
      `);
    res.send("Zaktualizowano specjalizację");
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Usuń specjalizację
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const pool = await poolPromise;
    await pool
      .request()
      .input("id", sql.Int, id)
      .query(`
        DELETE FROM dbo.Specjalizacja WHERE id_specjalizacji = @id
      `);
    res.send("Usunięto specjalizację");
  } catch (error) {
    res.status(500).send(error.message);
  }
});

module.exports = router;