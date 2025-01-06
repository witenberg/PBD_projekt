const express = require("express");
const router = express.Router();
const { sql, poolPromise } = require("./db");

// Funkcja pomocnicza do logowania akcji w konsoli
function logAction(action, details = "") {
  console.log(`[DB LOG]: ${action} ${details}`);
}

// Pobierz wszystkie szkolenia
router.get("/", async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT id_szkolenia, tytul, FORMAT(data, 'yyyy-MM-dd') AS data
      FROM dbo.Szkolenie
    `);
    res.json(result.recordset);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Pobierz szczegóły wybranego szkolenia
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("id_szkolenia", sql.Int, id)
      .query(`
        SELECT id_szkolenia, tytul, FORMAT(data, 'yyyy-MM-dd') AS data
        FROM dbo.Szkolenie WHERE id_szkolenia = @id_szkolenia
      `);
    res.json(result.recordset[0]);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Dodaj nowe szkolenie
router.post("/", async (req, res) => {
  const { tytul, data } = req.body;
  try {
    const pool = await poolPromise;
    await pool.request().query(`
      INSERT INTO dbo.Szkolenie (tytul, data)
      VALUES ('${tytul}', '${data}')
    `);
    logAction("Dodano nowe szkolenie", `Tytuł: ${tytul}, Data: ${data}`);
    res.status(201).send("Szkolenie zostało pomyślnie dodane.");
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Aktualizuj szkolenie
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { tytul, data } = req.body;
  try {
    const pool = await poolPromise;
    await pool.request().query(`
      UPDATE dbo.Szkolenie
      SET tytul = '${tytul}', data = '${data}'
      WHERE id_szkolenia = ${id}
    `);
    logAction("Zaktualizowano szkolenie", `ID: ${id}`);
    res.send("Szkolenie zostało pomyślnie zaktualizowane.");
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Usuń szkolenie
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const pool = await poolPromise;

    // Sprawdzenie, czy szkolenie jest przypisane do pracowników
    const result = await pool
      .request()
      .input("id", sql.Int, id)
      .query(`
        SELECT id_pracownika
        FROM dbo.PracownikSzkolenie
        WHERE id_szkolenia = @id
      `);

    if (result.recordset.length > 0) {
      return res.status(400).json({
        message: `Do tego szkolenia przypisani są pracownicy. Aby je usunąć, usuń najpierw jego przypisania w tabeli 'PracownikSzkolenie'.`,
      });
    }

    // Usunięcie szkolenia
    await pool
      .request()
      .input("id", sql.Int, id)
      .query(`
        DELETE FROM dbo.Szkolenie WHERE id_szkolenia = @id
      `);

    logAction("Usunięto szkolenie", `ID: ${id}`);
    res.send("Szkolenie zostało pomyślnie usunięte.");
  } catch (error) {
    res.status(500).send(error.message);
  }
});


module.exports = router;
