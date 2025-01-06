const express = require("express");
const router = express.Router();
const { sql, poolPromise } = require("./db");

// Pobierz wszystkie powiązania pracownik-szkolenie
router.get("/", async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT ps.id_pracownika, ps.id_szkolenia, 
             p.imie + ' ' + p.nazwisko AS pracownik, 
             s.tytul AS szkolenie
      FROM dbo.PracownikSzkolenie ps
      JOIN dbo.Pracownik p ON ps.id_pracownika = p.id_pracownika
      JOIN dbo.Szkolenie s ON ps.id_szkolenia = s.id_szkolenia
    `);
    res.json(result.recordset);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Pobierz jedno powiązanie pracownik-szkolenie
router.get("/:id_pracownika/:id_szkolenia", async (req, res) => {
  const { id_pracownika, id_szkolenia } = req.params;
  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("id_pracownika", sql.Int, id_pracownika)
      .input("id_szkolenia", sql.Int, id_szkolenia)
      .query(`
        SELECT * FROM dbo.PracownikSzkolenie
        WHERE id_pracownika = @id_pracownika AND id_szkolenia = @id_szkolenia
      `);
    res.json(result.recordset[0]);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Dodaj nowe powiązanie pracownik-szkolenie
router.post("/", async (req, res) => {
  const { id_pracownika, id_szkolenia } = req.body;
  try {
    const pool = await poolPromise;
    await pool
      .request()
      .input("id_pracownika", sql.Int, id_pracownika)
      .input("id_szkolenia", sql.Int, id_szkolenia)
      .query(`
        INSERT INTO dbo.PracownikSzkolenie (id_pracownika, id_szkolenia)
        VALUES (@id_pracownika, @id_szkolenia)
      `);
    res.status(201).send("Dodano nowe powiązanie pracownik-szkolenie");
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Aktualizuj powiązanie pracownik-szkolenie
router.put("/:old_id_pracownika/:old_id_szkolenia", async (req, res) => {
  const { old_id_pracownika, old_id_szkolenia } = req.params;
  const { id_pracownika, id_szkolenia } = req.body;
  try {
    const pool = await poolPromise;
    await pool
      .request()
      .input("old_id_pracownika", sql.Int, old_id_pracownika)
      .input("old_id_szkolenia", sql.Int, old_id_szkolenia)
      .input("id_pracownika", sql.Int, id_pracownika)
      .input("id_szkolenia", sql.Int, id_szkolenia)
      .query(`
        UPDATE dbo.PracownikSzkolenie
        SET id_pracownika = @id_pracownika, id_szkolenia = @id_szkolenia
        WHERE id_pracownika = @old_id_pracownika AND id_szkolenia = @old_id_szkolenia
      `);
    res.send("Zaktualizowano powiązanie pracownik-szkolenie");
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Usuń powiązanie pracownik-szkolenie
router.delete("/:id_pracownika/:id_szkolenia", async (req, res) => {
  const { id_pracownika, id_szkolenia } = req.params;
  try {
    const pool = await poolPromise;
    await pool
      .request()
      .input("id_pracownika", sql.Int, id_pracownika)
      .input("id_szkolenia", sql.Int, id_szkolenia)
      .query(`
        DELETE FROM dbo.PracownikSzkolenie 
        WHERE id_pracownika = @id_pracownika AND id_szkolenia = @id_szkolenia
      `);
    res.send("Usunięto powiązanie pracownik-szkolenie");
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Pobierz listę pracowników
router.get("/pracownicy", async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT id_pracownika, imie, nazwisko FROM dbo.Pracownik
    `);
    res.json(result.recordset);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Pobierz listę szkoleń
router.get("/szkolenia", async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT id_szkolenia, tytul FROM dbo.Szkolenie
    `);
    res.json(result.recordset);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

module.exports = router;