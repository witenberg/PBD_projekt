const express = require("express");
const router = express.Router();
const { sql, poolPromise } = require("./db");

// Pobierz wszystkich pracowników
router.get("/", async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT p.id_pracownika, p.imie, p.nazwisko, p.telefon,
             (SELECT imie + ' ' + nazwisko FROM dbo.Pracownik WHERE id_pracownika = p.id_szef) AS szef,
             CASE 
               WHEN l.id_lekarza IS NOT NULL THEN 'Lekarz'
               WHEN r.id_pracownika IS NOT NULL THEN 'Recepcjonista'
               ELSE NULL
             END AS rola
      FROM dbo.Pracownik p
      LEFT JOIN dbo.Lekarz l ON p.id_pracownika = l.id_lekarza
      LEFT JOIN dbo.Recepcjonista r ON p.id_pracownika = r.id_pracownika
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
        SELECT p.*, 
               CASE 
                 WHEN l.id_lekarza IS NOT NULL THEN 'Lekarz'
                 WHEN r.id_pracownika IS NOT NULL THEN 'Recepcjonista'
                 ELSE NULL
               END AS rola,
               r.wyksztalcenie
        FROM dbo.Pracownik p
        LEFT JOIN dbo.Lekarz l ON p.id_pracownika = l.id_lekarza
        LEFT JOIN dbo.Recepcjonista r ON p.id_pracownika = r.id_pracownika
        WHERE p.id_pracownika = @id
      `);
    res.json(result.recordset[0]);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Dodaj nowego pracownika
router.post("/", async (req, res) => {
  const { imie, nazwisko, telefon, id_szef, rola, wyksztalcenie } = req.body;
  const pool = await poolPromise;
  const transaction = new sql.Transaction(pool);

  try {
    await transaction.begin();

    const result = await new sql.Request(transaction)
      .input("imie", sql.NVarChar(20), imie)
      .input("nazwisko", sql.NVarChar(50), nazwisko)
      .input("telefon", sql.NVarChar(15), telefon || null)
      .input("id_szef", sql.Int, id_szef || null)
      .query(`
        INSERT INTO dbo.Pracownik (imie, nazwisko, telefon, id_szef)
        OUTPUT INSERTED.id_pracownika
        VALUES (@imie, @nazwisko, @telefon, @id_szef)
      `);

    const id_pracownika = result.recordset[0].id_pracownika;

    if (rola === "Lekarz") {
      await new sql.Request(transaction)
        .input("id_lekarza", sql.Int, id_pracownika)
        .query(`
          INSERT INTO dbo.Lekarz (id_lekarza)
          VALUES (@id_lekarza)
        `);
    } else if (rola === "Recepcjonista") {
      await new sql.Request(transaction)
        .input("id_pracownika", sql.Int, id_pracownika)
        .input("wyksztalcenie", sql.NVarChar(100), wyksztalcenie)
        .query(`
          INSERT INTO dbo.Recepcjonista (id_pracownika, wyksztalcenie)
          VALUES (@id_pracownika, @wyksztalcenie)
        `);
    }

    await transaction.commit();
    res.status(201).send("Dodano nowego pracownika");
  } catch (error) {
    await transaction.rollback();
    res.status(500).send(error.message);
  }
});

// Aktualizuj pracownika
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { imie, nazwisko, telefon, id_szef, rola, wyksztalcenie } = req.body;
  const pool = await poolPromise;
  const transaction = new sql.Transaction(pool);

  try {
    await transaction.begin();

    await new sql.Request(transaction)
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

    // Usuń istniejące role
    await new sql.Request(transaction)
      .input("id", sql.Int, id)
      .query(`
        DELETE FROM dbo.Lekarz WHERE id_lekarza = @id;
        DELETE FROM dbo.Recepcjonista WHERE id_pracownika = @id;
      `);

    // Dodaj nową rolę
    if (rola === "Lekarz") {
      await new sql.Request(transaction)
        .input("id_lekarza", sql.Int, id)
        .query(`
          INSERT INTO dbo.Lekarz (id_lekarza)
          VALUES (@id_lekarza)
        `);
    } else if (rola === "Recepcjonista") {
      await new sql.Request(transaction)
        .input("id_pracownika", sql.Int, id)
        .input("wyksztalcenie", sql.NVarChar(100), wyksztalcenie)
        .query(`
          INSERT INTO dbo.Recepcjonista (id_pracownika, wyksztalcenie)
          VALUES (@id_pracownika, @wyksztalcenie)
        `);
    }

    await transaction.commit();
    res.send("Zaktualizowano pracownika");
  } catch (error) {
    await transaction.rollback();
    res.status(500).send(error.message);
  }
});

// Usuń pracownika
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  const pool = await poolPromise;
  const transaction = new sql.Transaction(pool);

  try {
    await transaction.begin();

    // Usuń powiązane rekordy z tabel Lekarz i Recepcjonista
    await new sql.Request(transaction)
      .input("id", sql.Int, id)
      .query(`
        DELETE FROM dbo.Lekarz WHERE id_lekarza = @id;
        DELETE FROM dbo.Recepcjonista WHERE id_pracownika = @id;
      `);

    // Usuń pracownika
    await new sql.Request(transaction)
      .input("id", sql.Int, id)
      .query(`
        DELETE FROM dbo.Pracownik WHERE id_pracownika = @id
      `);

    await transaction.commit();
    res.send("Usunięto pracownika");
  } catch (error) {
    await transaction.rollback();
    res.status(500).send(error.message);
  }
});

module.exports = router;