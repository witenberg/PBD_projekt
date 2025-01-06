const express = require("express");
const router = express.Router();
const { sql, poolPromise } = require("./db");

// Pobierz wszystkie zastępstwa
router.get("/", async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT z.id_zastepstwa, 
             z.id_lekarz_zastepujacy,
             z.id_lekarz_zastepowany,
             p1.imie + ' ' + p1.nazwisko AS lekarz_zastepujacy_imie_nazwisko,
             p2.imie + ' ' + p2.nazwisko AS lekarz_zastepowany_imie_nazwisko,
             z.data_rozpoczecia,
             z.data_zakonczenia
      FROM dbo.Zastepstwo z
      JOIN dbo.Lekarz l1 ON z.id_lekarz_zastepujacy = l1.id_lekarza
      JOIN dbo.Lekarz l2 ON z.id_lekarz_zastepowany = l2.id_lekarza
      JOIN dbo.Pracownik p1 ON l1.id_lekarza = p1.id_pracownika
      JOIN dbo.Pracownik p2 ON l2.id_lekarza = p2.id_pracownika
      ORDER BY z.data_rozpoczecia ASC
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
    `);
    res.json(result.recordset);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Pobierz jedno zastępstwo
router.get("/:id", async (req, res) => {
    const { id } = req.params;
    try {
      const pool = await poolPromise;
      const result = await pool
        .request()
        .input("id", sql.Int, id)
        .query(`
          SELECT z.id_zastepstwa, z.id_lekarz_zastepujacy, z.id_lekarz_zastepowany, z.data_rozpoczecia, z.data_zakonczenia
          FROM dbo.Zastepstwo z
          WHERE z.id_zastepstwa = @id
        `);
      res.json(result.recordset[0]);
    } catch (error) {
      res.status(500).send(error.message);
    }
  });

// Dodaj nowe zastępstwo
router.post("/", async (req, res) => {
  const { id_lekarz_zastepujacy, id_lekarz_zastepowany, data_rozpoczecia, data_zakonczenia } = req.body;
  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("id_lekarz_zastepujacy", sql.Int, id_lekarz_zastepujacy)
      .input("id_lekarz_zastepowany", sql.Int, id_lekarz_zastepowany)
      .input("data_rozpoczecia", sql.Date, data_rozpoczecia)
      .input("data_zakonczenia", sql.Date, data_zakonczenia)
      .query(`
        INSERT INTO dbo.Zastepstwo (id_lekarz_zastepujacy, id_lekarz_zastepowany, data_rozpoczecia, data_zakonczenia)
        OUTPUT INSERTED.id_zastepstwa
        VALUES (@id_lekarz_zastepujacy, @id_lekarz_zastepowany, @data_rozpoczecia, @data_zakonczenia)
      `);
    res.status(201).json({ id_zastepstwa: result.recordset[0].id_zastepstwa, message: "Dodano nowe zastępstwo" });
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Aktualizuj zastępstwo
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { id_lekarz_zastepujacy, id_lekarz_zastepowany, data_rozpoczecia, data_zakonczenia } = req.body;
  try {
    const pool = await poolPromise;
    await pool
      .request()
      .input("id", sql.Int, id)
      .input("id_lekarz_zastepujacy", sql.Int, id_lekarz_zastepujacy)
      .input("id_lekarz_zastepowany", sql.Int, id_lekarz_zastepowany)
      .input("data_rozpoczecia", sql.Date, data_rozpoczecia)
      .input("data_zakonczenia", sql.Date, data_zakonczenia)
      .query(`
        UPDATE dbo.Zastepstwo
        SET id_lekarz_zastepujacy = @id_lekarz_zastepujacy,
            id_lekarz_zastepowany = @id_lekarz_zastepowany,
            data_rozpoczecia = @data_rozpoczecia,
            data_zakonczenia = @data_zakonczenia
        WHERE id_zastepstwa = @id
      `);
    res.send("Zaktualizowano zastępstwo");
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Usuń zastępstwo
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const pool = await poolPromise;
    await pool
      .request()
      .input("id", sql.Int, id)
      .query(`
        DELETE FROM dbo.Zastepstwo WHERE id_zastepstwa = @id
      `);
    res.send("Usunięto zastępstwo");
  } catch (error) {
    res.status(500).send(error.message);
  }
});

module.exports = router;