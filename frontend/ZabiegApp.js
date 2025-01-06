// Główna funkcja inicjująca
async function initZabiegApp() {
    const content = document.getElementById("content");
    content.innerHTML = `
      <h1>Zabiegi</h1>
      <button id="addZabiegBtn">Dodaj Zabieg</button>
      <table id="zabiegTable">
        <thead>
          <tr>
            <th>Nazwa</th>
            <th>Czas trwania</th>
            <th>Lekarz</th>
            <th>Pacjent</th>
            <th>Akcje</th>
          </tr>
        </thead>
        <tbody></tbody>
      </table>
      <div id="zabiegForm" style="display: none;"></div>
    `;
  
    document.getElementById("addZabiegBtn").addEventListener("click", () => showZabiegForm());
  
    await loadZabiegTable();
  }
  
  // Załadowanie danych do tabeli
  async function loadZabiegTable() {
    const tableBody = document.querySelector("#zabiegTable tbody");
    tableBody.innerHTML = ""; // Wyczyść tabelę
  
    try {
      const response = await fetch(`${API_URL}/api/zabieg`);
      const data = await response.json();
      console.log(data);
  
      data.forEach((zabieg) => {
        const row = `
          <tr>
            <td>${zabieg.nazwa}</td>
            <td>${formatTime(zabieg.czas_trwania)}</td>
            <td>${zabieg.lekarz_imie_nazwisko}</td>
            <td>${zabieg.pacjent_imie_nazwisko}</td>
            <td>
              <button onclick="editZabieg(${zabieg.id_zabiegu})">Edytuj</button>
              <button onclick="deleteZabieg(${zabieg.id_zabiegu})">Usuń</button>
            </td>
          </tr>
        `;
        tableBody.innerHTML += row;
      });
    } catch (error) {
      console.error("Błąd ładowania danych:", error);
    }
  }
  
  // Formatowanie czasu
  function formatTime(timeString) {
    // Parsowanie godziny i minut z formatu "1970-01-01T00:50"
    const time = new Date(timeString);
    
    // Pobranie godzin i minut
    const hours = time.getHours().toString().padStart(2, '0');
    const minutes = time.getMinutes().toString().padStart(2, '0');

    // Zwrócenie sformatowanego czasu
    return `${hours}:${minutes}`;
}
  
  // Wyświetlenie formularza dla dodawania/edycji
  async function showZabiegForm(zabieg = null) {
    const formDiv = document.getElementById("zabiegForm");
    formDiv.style.display = "block";
  
    // Pobierz listę lekarzy
    const lekarzeResponse = await fetch(`${API_URL}/api/zabieg/lekarze`);
    const lekarze = await lekarzeResponse.json();
  
    // Pobierz listę pacjentów
    const pacjenciResponse = await fetch(`${API_URL}/api/zabieg/pacjenci`);
    const pacjenci = await pacjenciResponse.json();
  
    const lekarzeOptions = lekarze
      .map((l) => `<option value="${l.id_lekarza}" ${zabieg && zabieg.id_lekarza == l.id_lekarza ? 'selected' : ''}>${l.imie} ${l.nazwisko}</option>`)
      .join("");
  
    const pacjenciOptions = pacjenci
      .map((p) => `<option value="${p.id_pacjenta}" ${zabieg && zabieg.id_pacjenta == p.id_pacjenta ? 'selected' : ''}>${p.imie} ${p.nazwisko}</option>`)
      .join("");
  
    formDiv.innerHTML = `
      <h2>${zabieg ? "Edytuj" : "Dodaj"} Zabieg</h2>
      <form id="zabiegFormInner">
        <label>Nazwa:</label>
        <input type="text" id="nazwa" value="${zabieg ? zabieg.nazwa : ''}" required />
        <label>Czas trwania (HH:MM):</label>
        <input type="time" id="czas_trwania" value="${zabieg ? formatTime(zabieg.czas_trwania) : ''}" required />
        <label>Lekarz:</label>
        <select id="id_lekarza" required>
          ${lekarzeOptions}
        </select>
        <label>Pacjent:</label>
        <select id="id_pacjenta" required>
          ${pacjenciOptions}
        </select>
        <button type="submit">${zabieg ? "Zapisz" : "Dodaj"}</button>
        <button type="button" onclick="hideZabiegForm()">Anuluj</button>
      </form>
    `;
  
    document.getElementById("zabiegFormInner").addEventListener("submit", async (event) => {
      event.preventDefault();
      const newData = {
        nazwa: document.getElementById("nazwa").value,
        czas_trwania: "1970-01-01T" + document.getElementById("czas_trwania").value,
        id_lekarza: document.getElementById("id_lekarza").value,
        id_pacjenta: document.getElementById("id_pacjenta").value,
      };
  
      if (zabieg) {
        await updateZabieg(zabieg.id_zabiegu, newData);
      } else {
        await addZabieg(newData);
      }
  
      hideZabiegForm();
      await loadZabiegTable();
    });
  }
  
  // Ukrycie formularza
  function hideZabiegForm() {
    const formDiv = document.getElementById("zabiegForm");
    formDiv.style.display = "none";
  }
  
  // Dodanie nowego zabiegu
  async function addZabieg(data) {
    try {
    console.log(data);
      const response = await fetch(`${API_URL}/api/zabieg`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message);
      }
    } catch (error) {
      console.error("Błąd dodawania:", error);
      alert(error.message);
    }
  }
  
  // Edycja zabiegu
  async function editZabieg(id) {
    try {
      const response = await fetch(`${API_URL}/api/zabieg/${id}`);
      const zabieg = await response.json();
      showZabiegForm(zabieg);
    } catch (error) {
      console.error("Błąd pobierania danych do edycji:", error);
    }
  }
  
  // Aktualizacja zabiegu
  async function updateZabieg(id, data) {
    try {
      await fetch(`${API_URL}/api/zabieg/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error("Błąd aktualizacji:", error);
    }
  }
  
  // Usuwanie zabiegu
  async function deleteZabieg(id) {
    if (confirm("Czy na pewno chcesz usunąć ten zabieg?")) {
      try {
        await fetch(`${API_URL}/api/zabieg/${id}`, { method: "DELETE" });
        await loadZabiegTable();
      } catch (error) {
        console.error("Błąd usuwania:", error);
      }
    }
  }
  
  initZabiegApp();
  
  