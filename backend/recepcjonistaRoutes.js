const express = require("express");
const router = express.Router();
const { sql, poolPromise } = require("./db");

// Pobierz wszystkich recepcjonistów
router.get("/", async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT r.id_pracownika, p.imie + ' ' + p.nazwisko AS imie_nazwisko, r.wyksztalcenie
      FROM dbo.Recepcjonista r
      JOIN dbo.Pracownik p ON r.id_pracownika = p.id_pracownika
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

// Pobierz jednego recepcjonistę
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("id", sql.Int, id)
      .query(`
        SELECT r.id_pracownika, p.imie, p.nazwisko, r.wyksztalcenie
        FROM dbo.Recepcjonista r
        JOIN dbo.Pracownik p ON r.id_pracownika = p.id_pracownika
        WHERE r.id_pracownika = @id
      `);
    res.json(result.recordset[0]);
  } catch (error) {
    res.status(500).send(error.message);
  }
});


// Dodaj nowego recepcjonistę
router.post("/", async (req, res) => {
  const { id_pracownika, wyksztalcenie } = req.body;
  try {
    const pool = await poolPromise;
    
    // Sprawdź, czy pracownik nie jest już lekarzem
    const checkResult = await pool
      .request()
      .input("id_pracownika", sql.Int, id_pracownika)
      .query(`
        SELECT COUNT(*) as count FROM dbo.Lekarz WHERE id_lekarza = @id_pracownika
      `);
    
    if (checkResult.recordset[0].count > 0) {
      return res.status(400).json({ message: "Ten pracownik jest już lekarzem i nie może być recepcjonistą." });
    }

    await pool
      .request()
      .input("id_pracownika", sql.Int, id_pracownika)
      .input("wyksztalcenie", sql.NVarChar(100), wyksztalcenie)
      .query(`
        INSERT INTO dbo.Recepcjonista (id_pracownika, wyksztalcenie)
        VALUES (@id_pracownika, @wyksztalcenie)
      `);
    res.status(201).send("Dodano nowego recepcjonistę");
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Aktualizuj recepcjonistę
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { wyksztalcenie } = req.body;
  try {
    const pool = await poolPromise;
    await pool
      .request()
      .input("id", sql.Int, id)
      .input("wyksztalcenie", sql.NVarChar(100), wyksztalcenie)
      .query(`
        UPDATE dbo.Recepcjonista
        SET wyksztalcenie = @wyksztalcenie
        WHERE id_pracownika = @id
      `);
    res.send("Zaktualizowano recepcjonistę");
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Usuń recepcjonistę
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const pool = await poolPromise;
    await pool
      .request()
      .input("id", sql.Int, id)
      .query(`
        DELETE FROM dbo.Recepcjonista WHERE id_pracownika = @id
      `);
    res.send("Usunięto recepcjonistę");
  } catch (error) {
    res.status(500).send(error.message);
  }
});

module.exports = router;