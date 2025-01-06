const express = require("express");
const router = express.Router();
const { sql, poolPromise } = require("./db");

// Pobierz wszystkie zabiegi
router.get("/", async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT z.id_zabiegu, z.nazwa, z.czas_trwania, 
             p_lekarz.imie + ' ' + p_lekarz.nazwisko AS lekarz_imie_nazwisko,
             p_pacjent.imie + ' ' + p_pacjent.nazwisko AS pacjent_imie_nazwisko
      FROM dbo.Zabieg z
      JOIN dbo.Lekarz l ON z.id_lekarza = l.id_lekarza
      JOIN dbo.Pracownik p_lekarz ON l.id_lekarza = p_lekarz.id_pracownika
      JOIN dbo.Pacjent p_pacjent ON z.id_pacjenta = p_pacjent.id_pacjenta
      ORDER BY z.nazwa
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

// Pobierz jeden zabieg
router.get("/:id", async (req, res) => {
    const { id } = req.params;
    try {
      const pool = await poolPromise;
      const result = await pool
        .request()
        .input("id", sql.Int, id)
        .query(`
          SELECT z.id_zabiegu, z.nazwa, z.czas_trwania, z.id_lekarza, z.id_pacjenta
          FROM dbo.Zabieg z
          WHERE z.id_zabiegu = @id
        `);
      res.json(result.recordset[0]);
    } catch (error) {
      res.status(500).send(error.message);
    }
  });

// Dodaj nowy zabieg
router.post("/", async (req, res) => {
  const { nazwa, czas_trwania, id_lekarza, id_pacjenta } = req.body;
  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("nazwa", sql.NVarChar(100), nazwa)
      .input("czas_trwania", sql.Time, czas_trwania)
      .input("id_lekarza", sql.Int, id_lekarza)
      .input("id_pacjenta", sql.Int, id_pacjenta)
      .query(`
        INSERT INTO dbo.Zabieg (nazwa, czas_trwania, id_lekarza, id_pacjenta)
        OUTPUT INSERTED.id_zabiegu
        VALUES (@nazwa, @czas_trwania, @id_lekarza, @id_pacjenta)
      `);
    res.status(201).json({ id_zabiegu: result.recordset[0].id_zabiegu, message: "Dodano nowy zabieg" });
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Aktualizuj zabieg
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { nazwa, czas_trwania, id_lekarza, id_pacjenta } = req.body;
  try {
    const pool = await poolPromise;
    await pool
      .request()
      .input("id", sql.Int, id)
      .input("nazwa", sql.NVarChar(100), nazwa)
      .input("czas_trwania", sql.Time, czas_trwania)
      .input("id_lekarza", sql.Int, id_lekarza)
      .input("id_pacjenta", sql.Int, id_pacjenta)
      .query(`
        UPDATE dbo.Zabieg
        SET nazwa = @nazwa,
            czas_trwania = @czas_trwania,
            id_lekarza = @id_lekarza,
            id_pacjenta = @id_pacjenta
        WHERE id_zabiegu = @id
      `);
    res.send("Zaktualizowano zabieg");
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Usuń zabieg
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const pool = await poolPromise;
    await pool
      .request()
      .input("id", sql.Int, id)
      .query(`
        DELETE FROM dbo.Zabieg WHERE id_zabiegu = @id
      `);
    res.send("Usunięto zabieg");
  } catch (error) {
    res.status(500).send(error.message);
  }
});

module.exports = router;