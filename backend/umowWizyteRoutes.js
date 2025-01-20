const express = require('express');
const router = express.Router();
const { sql, poolPromise } = require('./db');

// Pobierz listę lekarzy z ich specjalizacjami
router.get('/lekarze', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT L.id_lekarza, P.imie, P.nazwisko, S.specjalizacja
      FROM Lekarz L
      JOIN Pracownik P ON L.id_lekarza = P.id_pracownika
      JOIN Specjalizacja S ON L.id_lekarza = S.id_lekarza
    `);
    res.json(result.recordset);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Pobierz dostępne terminy dla lekarza
router.get('/dostepne-terminy/:id_lekarza', async (req, res) => {
  const { id_lekarza } = req.params;
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('id_lekarza', sql.Int, id_lekarza)
      .query(`
        DECLARE @StartDate DATE = CAST(GETDATE() AS DATE);
        DECLARE @EndDate DATE = DATEADD(DAY, 30, @StartDate);

        WITH DateRange AS (
            SELECT TOP (DATEDIFF(DAY, @StartDate, @EndDate) + 1)
                DATEADD(DAY, ROW_NUMBER() OVER (ORDER BY a.object_id) - 1, @StartDate) AS Date
            FROM sys.all_objects a
        ),
        TimeSlots AS (
            SELECT 
                DATEADD(HOUR, H.Hour, CAST(Date AS DATETIME)) AS DateTime
            FROM DateRange
            CROSS JOIN (VALUES (7),(8),(9),(10),(11),(12),(13),(14),(15),(16),(17)) AS H(Hour)
        ),
        BusySlots AS (
            SELECT 
                CAST(data AS DATE) AS Date,
                DATEPART(HOUR, data) AS Hour
            FROM Wizyta
            WHERE id_lekarza = @id_lekarza
        )
        SELECT DISTINCT 
            CONVERT(VARCHAR, T.DateTime, 127) AS AvailableDateTime
        FROM TimeSlots T
        LEFT JOIN BusySlots B 
        ON CAST(T.DateTime AS DATE) = B.Date AND DATEPART(HOUR, T.DateTime) = B.Hour
        WHERE B.Hour IS NULL
        AND T.DateTime > GETDATE() -- Użyj czasu lokalnego bez przesunięcia
        ORDER BY AvailableDateTime;
      `);

    // Przekonwertuj terminy na lokalną strefę czasową w aplikacji (jeśli potrzebne)
    res.json(result.recordset.map(r => {
      const date = new Date(r.AvailableDateTime);
      date.setHours(date.getHours() + 1); // Dodaj godzinę
      return date.toISOString(); // Konwersja na ISO 8601 w UTC
    }));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// Pobierz dostępne gabinety
router.post('/dostepne-gabinety', async (req, res) => {
  const { doctorId, date } = req.body;
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('doctorId', sql.Int, doctorId)
      .input('date', sql.DateTime, new Date(date))
      .query(`
        SELECT G.numer, B.nazwa AS budynek_nazwa, B.symbol AS budynek_symbol
        FROM Gabinet G
        JOIN Budynek B ON G.budynek = B.symbol
        WHERE NOT EXISTS (
          SELECT 1 FROM Wizyta W
          WHERE W.numer_gabinetu = G.numer
          AND W.budynek = G.budynek
          AND W.data = @date
        )
      `);
    res.json(result.recordset);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// Umów wizytę
router.post('/', async (req, res) => {
  const { doctorId, date, roomNumber, building, imie, nazwisko } = req.body;
  const pool = await poolPromise;
  const transaction = new sql.Transaction(pool);

  try {
    await transaction.begin();
    let patientResult;
    try {
      patientResult = await new sql.Request(transaction)
        .input('imie', sql.NVarChar(50), imie)
        .input('nazwisko', sql.NVarChar(50), nazwisko)
        .query('SELECT id_pacjenta FROM Pacjent WHERE imie = @imie AND nazwisko = @nazwisko');

      console.log('Wynik zapytania pacjenta:', patientResult.recordset);
    } catch (err) {
      console.error('Błąd przy sprawdzaniu pacjenta:', err.message);
      throw err;
    }

    let patientId;
    if (patientResult.recordset.length === 0) {
      try {
        const newPatientResult = await new sql.Request(transaction)
          .input('imie', sql.NVarChar(50), imie)
          .input('nazwisko', sql.NVarChar(50), nazwisko)
          .query('INSERT INTO Pacjent (imie, nazwisko) OUTPUT INSERTED.id_pacjenta VALUES (@imie, @nazwisko)');

        patientId = newPatientResult.recordset[0].id_pacjenta;
        console.log('Nowy pacjent ID:', patientId);
      } catch (err) {
        console.error('Błąd przy dodawaniu pacjenta:', err.message);
        throw err;
      }
    } else {
      patientId = patientResult.recordset[0].id_pacjenta;
      console.log('Istniejący pacjent ID:', patientId);
    }

    // Dodaj wizytę
    try {
      await new sql.Request(transaction)
        .input('id_pacjenta', sql.Int, patientId)
        .input('numer_gabinetu', sql.Int, roomNumber)
        .input('budynek', sql.NVarChar(10), building)
        .input('id_lekarza', sql.Int, doctorId)
        .input('data', sql.DateTime, new Date(date))
        .input('koszt', sql.Decimal(10, 2), 200.00)
        .query(`
          INSERT INTO Wizyta (id_pacjenta, numer_gabinetu, budynek, id_lekarza, data, koszt)
          VALUES (@id_pacjenta, @numer_gabinetu, @budynek, @id_lekarza, @data, @koszt)
        `);

      console.log('Wizyta została dodana');
    } catch (err) {
      console.error('Błąd przy dodawaniu wizyty:', err.message);
      throw err;
    }

    await transaction.commit();
    res.json({ message: "Wizyta została umówiona pomyślnie." });
  } catch (error) {
    console.error('Błąd w transakcji:', error.message);
    await transaction.rollback();
    res.status(500).json({ message: error.message });
  }
});


module.exports = router;

