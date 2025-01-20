const express = require('express');
const router = express.Router();
const { NtlmClient } = require('axios-ntlm');

const BASE_URL = 'http://jakub/ReportServer?/Report%20Project1'

const ntlmCredentials = {
  username: 'witenberg',
  password: 'kubawit26',
  domain: ''
};

const ntlmClient = NtlmClient(ntlmCredentials, {
  baseURL: BASE_URL
});

router.post('/report1', async (req, res) => {
  try {
    const { start_date, end_date } = req.body; // Oczekujemy, że te daty przyjdą z frontu w ciele zapytania

    if (!start_date || !end_date) {
      return res.status(400).json({ error: 'Brak wymaganych parametrów: start_date lub end_date' });
    }

    // Tworzenie pełnego URL z parametrami
    const reportUrl = `${BASE_URL}/Report1&start_date=${encodeURIComponent(start_date)}&end_date=${encodeURIComponent(end_date)}&rs:Format=PDF`;
    // Wysyłanie żądania GET z klientem NTLM
    const response = await ntlmClient.get(reportUrl, {
      responseType: 'arraybuffer' // Oczekujemy pliku binarnego, np. PDF
    });

    if (response.status === 200) {
      res.setHeader('Content-Type', 'application/pdf'); // Ustawiamy odpowiedni typ MIME dla pliku PDF
      res.setHeader('Content-Disposition', 'attachment; filename="report.pdf"'); // Wymuszenie pobrania pliku

      res.send(response.data); // Wysyłamy dane (plik PDF) w odpowiedzi
    } else {
      // Jeśli raport nie został pobrany poprawnie, zwróć błąd
      res.status(500).json({ error: 'Nie udało się pobrać raportu' });
    }
  } catch (error) {
    // Obsługa błędów (np. problem z połączeniem)
    console.error('Błąd podczas pobierania raportu:', error.message);
    res.status(500).json({ error: 'Błąd podczas pobierania raportu' });
  }
});


router.post('/report2', async (req, res) => {
  try {
    const { start_date, end_date, buildings } = req.body;
    if (!start_date || !end_date || !buildings) {
      return res.status(400).json({ error: 'Brak wymaganych parametrów: start_date lub end_date lub buildings' });
    }

    const buildingSymbols = buildings.join(','); // Łączenie symboli budynków w jeden ciąg, oddzielony przecinkami
    const reportUrl = `${BASE_URL}/Report2&start_date=${encodeURIComponent(start_date)}&end_date=${encodeURIComponent(end_date)}&buildingSymbols=${encodeURIComponent(buildingSymbols)}&rs:Format=PDF`;

    const response = await ntlmClient.get(reportUrl, {
      responseType: 'arraybuffer'
    });

    if (response.status === 200) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="report.pdf"');
      res.send(response.data);
    } else {
      res.status(500).json({ error: 'Nie udało się pobrać raportu' });
    }
  } catch (error) {
    // Obsługa błędów (np. problem z połączeniem)
    console.error('Błąd podczas pobierania raportu:', error.message);
    res.status(500).json({ error: 'Błąd podczas pobierania raportu' });
  }
});

router.post('/report3', async (req, res) => {
  try {
    const { id_szkolenia, role } = req.body;
    if (!id_szkolenia || !role) {
      return res.status(400).json({ error: 'Brak wymaganych parametrów: start_date lub end_date lub buildings' });
    }

    const reportUrl = `${BASE_URL}/Report3&id_szkolenia=${encodeURIComponent(id_szkolenia)}&rola=${encodeURIComponent(role)}&rs:Format=PDF`;
    
    const response = await ntlmClient.get(reportUrl, {
      responseType: 'arraybuffer'
    });

    if (response.status === 200) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="report.pdf"');
      res.send(response.data);
    } else {
      res.status(500).json({ error: 'Nie udało się pobrać raportu' });
    }
  } catch (error) {
    // Obsługa błędów (np. problem z połączeniem)
    console.error('Błąd podczas pobierania raportu:', error.message);
    res.status(500).json({ error: 'Błąd podczas pobierania raportu' });
  }
});

module.exports = router;
