const express = require("express");
const router = express.Router();
const { sql, poolPromise } = require("./db");

// Pobierz wszystkich pracowników
router.get("/", async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT p.id_pracownika, p.imie, p.nazwisko, p.telefon,
             (SELECT imie + ' ' + nazwisko FROM dbo.Pracownik WHERE id_pracownika = p.id_szef) AS szef
      FROM dbo.Pracownik p
    `);
    res.json(result.recordset);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Pobierz listę szefów
router.get("/szefowie", async (req, res) => {
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

// Pobierz jednego pracownika
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("id", sql.Int, id)
      .query(`
        SELECT * FROM dbo.Pracownik WHERE id_pracownika = @id
      `);
    res.json(result.recordset[0]);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Dodaj nowego pracownika
router.post("/", async (req, res) => {
  const { imie, nazwisko, telefon, id_szef } = req.body;
  try {
    const pool = await poolPromise;
    await pool
      .request()
      .input("imie", sql.NVarChar(20), imie)
      .input("nazwisko", sql.NVarChar(50), nazwisko)
      .input("telefon", sql.NVarChar(15), telefon || null)
      .input("id_szef", sql.Int, id_szef || null)
      .query(`
        INSERT INTO dbo.Pracownik (imie, nazwisko, telefon, id_szef)
        VALUES (@imie, @nazwisko, @telefon, @id_szef)
      `);
    res.status(201).send("Dodano nowego pracownika");
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Aktualizuj pracownika
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { imie, nazwisko, telefon, id_szef } = req.body;
  try {
    const pool = await poolPromise;
    await pool
      .request()
      .input("id", sql.Int, id)
      .input("imie", sql.NVarChar(20), imie)
      .input("nazwisko", sql.NVarChar(50), nazwisko)
      .input("telefon", sql.NVarChar(15), telefon || null)
      .input("id_szef", sql.Int, id_szef || null)
      .query(`
        UPDATE dbo.Pracownik
        SET imie = @imie, nazwisko = @nazwisko, telefon = @telefon, id_szef = @id_szef
        WHERE id_pracownika = @id
      `);
    res.send("Zaktualizowano pracownika");
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Usuń pracownika
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const pool = await poolPromise;

    // Sprawdzenie, czy pracownik jest przypisany do tabeli Lekarz
    const result = await pool
      .request()
      .input("id", sql.Int, id)
      .query(`
        SELECT id_lekarza
        FROM dbo.Lekarz
        WHERE id_lekarza = @id
      `);

    if (result.recordset.length > 0) {
      return res.status(400).json({
        message: `Pracownik jest przypisany jako lekarz. Aby go usunąć, usuń go z tabeli 'Lekarz'`,
      });
    }

    // Usunięcie pracownika
    await pool
      .request()
      .input("id", sql.Int, id)
      .query(`
        DELETE FROM dbo.Pracownik WHERE id_pracownika = @id
      `);

    res.send("Usunięto pracownika");
  } catch (error) {
    res.status(500).send(error.message);
  }
});


module.exports = router;
