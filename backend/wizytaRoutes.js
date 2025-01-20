const express = require("express");
const router = express.Router();
const { sql, poolPromise } = require("./db");

// Pobierz wszystkie wizyty
router.get("/", async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT w.id_wizyty, 
             p.imie + ' ' + p.nazwisko AS pacjent_imie_nazwisko, 
             w.numer_gabinetu, 
             b.nazwa AS budynek_nazwa,
             pr.imie + ' ' + pr.nazwisko AS lekarz_imie_nazwisko,
             w.data,
             w.koszt
      FROM dbo.Wizyta w
      JOIN dbo.Pacjent p ON w.id_pacjenta = p.id_pacjenta
      JOIN dbo.Budynek b ON w.budynek = b.symbol
      JOIN dbo.Lekarz l ON w.id_lekarza = l.id_lekarza
      JOIN dbo.Pracownik pr ON l.id_lekarza = pr.id_pracownika
      ORDER BY w.data ASC
    `);
    res.json(result.recordset);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Pobierz listę pacjentów
router.get("/pacjenci", async (req, res) => {
    try {
      const pool = await poolPromise;
      const result = await pool.request().query(`
        SELECT id_pacjenta, imie, nazwisko
        FROM dbo.Pacjent
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

// Pobierz listę budynków
router.get("/budynki", async (req, res) => {
    try {
      const pool = await poolPromise;
      const result = await pool.request().query(`
        SELECT symbol, nazwa
        FROM dbo.Budynek
      `);
      res.json(result.recordset);
    } catch (error) {
      res.status(500).send(error.message);
    }
  });

// Pobierz wszystkie gabinety
router.get("/gabinety", async (req, res) => {
    try {
      const pool = await poolPromise;
      const result = await pool.request().query(`
        SELECT g.numer, g.budynek, g.pietro, b.nazwa AS nazwa_budynku
        FROM dbo.Gabinet g
        JOIN dbo.Budynek b ON g.budynek = b.symbol
        ORDER BY b.nazwa, g.numer
      `);
      res.json(result.recordset);
    } catch (error) {
      res.status(500).send(error.message);
    }
  });
  
  // Pobierz gabinety budynku
  router.get("/gabinety/:budynek", async (req, res) => {
    const { numer, budynek } = req.params;
    try {
      const pool = await poolPromise;
      const result = await pool
        .request()
        .input("budynek", sql.NVarChar(10), budynek)
        .query(`
          SELECT g.numer, g.budynek, g.pietro, b.nazwa AS nazwa_budynku
          FROM dbo.Gabinet g
          JOIN dbo.Budynek b ON g.budynek = b.symbol
          WHERE g.budynek = @budynek
        `);
      if (result.recordset.length > 0) {
        res.json(result.recordset);
      } else {
        res.status(404).send("Gabinet nie znaleziony");
      }
    } catch (error) {
      res.status(500).send(error.message);
    }
  });
  
  // Dodaj nowy gabinet
  router.post("/gabinety", async (req, res) => {
    const { numer, budynek, pietro } = req.body;
    try {
      const pool = await poolPromise;
      await pool
        .request()
        .input("numer", sql.Int, numer)
        .input("budynek", sql.NVarChar(10), budynek)
        .input("pietro", sql.Int, pietro)
        .query(`
          INSERT INTO dbo.Gabinet (numer, budynek, pietro)
          VALUES (@numer, @budynek, @pietro)
        `);
      res.status(201).send("Gabinet dodany pomyślnie");
    } catch (error) {
      res.status(500).send(error.message);
    }
  });
  
// Pobierz jedną wizytę
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("id", sql.Int, id)
      .query(`
        SELECT w.id_wizyty, w.id_pacjenta, w.numer_gabinetu, w.budynek, w.id_lekarza, w.data, w.koszt
        FROM dbo.Wizyta w
        WHERE w.id_wizyty = @id
      `);
    res.json(result.recordset[0]);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Dodaj nową wizytę
router.post("/", async (req, res) => {
  const { id_pacjenta, numer_gabinetu, budynek, id_lekarza, data, koszt } = req.body;
  try {
    const utcDate = new Date(data).toISOString();
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("id_pacjenta", sql.Int, id_pacjenta)
      .input("numer_gabinetu", sql.Int, numer_gabinetu)
      .input("budynek", sql.NVarChar(10), budynek)
      .input("id_lekarza", sql.Int, id_lekarza)
      .input("data", sql.DateTime, utcDate)
      .input("koszt", sql.Decimal(10, 2), koszt)
      .query(`
        INSERT INTO dbo.Wizyta (id_pacjenta, numer_gabinetu, budynek, id_lekarza, data, koszt)
        OUTPUT INSERTED.id_wizyty
        VALUES (@id_pacjenta, @numer_gabinetu, @budynek, @id_lekarza, @data, @koszt)
      `);

    res.status(201).json({ id_wizyty: result.recordset[0].id_wizyty, message: "Dodano nową wizytę" });
  } catch (error) {
    res.status(500).send(error.message);
  }
});


// Aktualizuj wizytę
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { numer_gabinetu, budynek, id_lekarza, data, koszt } = req.body;
  try {
    const pool = await poolPromise;
    await pool
      .request()
      .input("id", sql.Int, id)
      .input("numer_gabinetu", sql.Int, numer_gabinetu)
      .input("budynek", sql.NVarChar(10), budynek)
      .input("id_lekarza", sql.Int, id_lekarza)
      .input("data", sql.DateTime, new Date(data))
      .input("koszt", sql.Decimal(10, 2), koszt)
      .query(`
        UPDATE dbo.Wizyta
        SET numer_gabinetu = @numer_gabinetu,
            budynek = @budynek,
            id_lekarza = @id_lekarza,
            data = @data,
            koszt = @koszt
        WHERE id_wizyty = @id
      `);
    res.send("Zaktualizowano wizytę");
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Usuń wizytę
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const pool = await poolPromise;
    await pool
      .request()
      .input("id", sql.Int, id)
      .query(`
        DELETE FROM dbo.Wizyta WHERE id_wizyty = @id
      `);
    res.send("Usunięto wizytę");
  } catch (error) {
    res.status(500).send(error.message);
  }
});

module.exports = router;