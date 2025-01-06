// Główna funkcja inicjująca
async function initLekarzApp() {
    const content = document.getElementById("content");
    content.innerHTML = `
      <h1>Lekarze</h1>
      <button id="addLekarzBtn">Dodaj Lekarza</button>
      <table id="lekarzTable">
        <thead>
          <tr>
            <th>Imię i Nazwisko</th>
            <th>Akcje</th>
          </tr>
        </thead>
        <tbody></tbody>
      </table>
      <div id="lekarzForm" style="display: none;"></div>
    `;
  
    document.getElementById("addLekarzBtn").addEventListener("click", () => showLekarzForm());
  
    await loadLekarzTable();
  }
  
  // Załadowanie danych do tabeli
  async function loadLekarzTable() {
    const tableBody = document.querySelector("#lekarzTable tbody");
    tableBody.innerHTML = ""; // Wyczyść tabelę
  
    try {
      const response = await fetch(`${API_URL}/api/lekarz`);
      const data = await response.json();
      console.log(data);
  
      data.forEach((lekarz) => {
        const row = `
          <tr>
            <td>${lekarz.imie_nazwisko}</td>
            <td>
              <button onclick="deleteLekarz(${lekarz.id_lekarza})">Usuń</button>
            </td>
          </tr>
        `;
        tableBody.innerHTML += row;
      });
    } catch (error) {
      console.error("Błąd ładowania danych:", error);
    }
  }
  
  // Wyświetlenie formularza dla dodawania
  async function showLekarzForm() {
    const formDiv = document.getElementById("lekarzForm");
    formDiv.style.display = "block";
  
    // Pobierz listę pracowników, którzy nie są lekarzami ani recepcjonistami
    const pracownicyResponse = await fetch(`${API_URL}/api/lekarz/dostepni-pracownicy`);
    const pracownicy = await pracownicyResponse.json();
  
    const pracownicyOptions = pracownicy
      .map((p) => `<option value="${p.id_pracownika}">${p.imie} ${p.nazwisko}</option>`)
      .join("");
  
    formDiv.innerHTML = `
      <h2>Dodaj Lekarza</h2>
      <form id="lekarzFormInner">
        <label>Pracownik:</label>
        <select id="id_pracownika" required>
          ${pracownicyOptions}
        </select>
        <button type="submit">Dodaj</button>
        <button type="button" onclick="hideLekarzForm()">Anuluj</button>
      </form>
    `;
  
    document.getElementById("lekarzFormInner").addEventListener("submit", async (event) => {
      event.preventDefault();
      const newData = {
        id_lekarza: document.getElementById("id_pracownika").value,
      };
  
      await addLekarz(newData);
      hideLekarzForm();
      await loadLekarzTable();
    });
  }
  
  // Ukrycie formularza
  function hideLekarzForm() {
    const formDiv = document.getElementById("lekarzForm");
    formDiv.style.display = "none";
  }
  
  // Dodanie nowego lekarza
  async function addLekarz(data) {
    try {
      const response = await fetch(`${API_URL}/api/lekarz`, {
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
  
  // Usuwanie lekarza
  async function deleteLekarz(id_lekarza) {
    if (confirm("Czy na pewno chcesz usunąć tego lekarza? Wraz z nim zostaną usunięte wszystkie jego wizyty i zabiegi")) {
      try {
        await fetch(`${API_URL}/api/lekarz/${id_lekarza}`, { method: "DELETE" });
        await loadLekarzTable();
      } catch (error) {
        console.error("Błąd usuwania:", error);
      }
    }
  }
  
  initLekarzApp();
  
  