// Główna funkcja inicjująca
async function initPacjentApp() {
    const content = document.getElementById("content");
    content.innerHTML = `
      <h1>Pacjenci</h1>
      <button id="addPacjentBtn">Dodaj Pacjenta</button>
      <table id="pacjentTable">
        <thead>
          <tr>
            <th>Imię</th>
            <th>Nazwisko</th>
            <th>Akcje</th>
          </tr>
        </thead>
        <tbody></tbody>
      </table>
      <div id="pacjentForm" style="display: none;"></div>
    `;
  
    document.getElementById("addPacjentBtn").addEventListener("click", () => showPacjentForm());
  
    await loadPacjentTable();
  }
  
  // Załadowanie danych do tabeli
  async function loadPacjentTable() {
    const tableBody = document.querySelector("#pacjentTable tbody");
    tableBody.innerHTML = ""; // Wyczyść tabelę
  
    try {
      const response = await fetch(`${API_URL}/api/pacjent`);
      const data = await response.json();
      console.log(data);
  
      data.forEach((pacjent) => {
        const row = `
          <tr>
            <td>${pacjent.imie}</td>
            <td>${pacjent.nazwisko}</td>
            <td>
              <button onclick="editPacjent(${pacjent.id_pacjenta})">Edytuj</button>
              <button onclick="deletePacjent(${pacjent.id_pacjenta})">Usuń</button>
            </td>
          </tr>
        `;
        tableBody.innerHTML += row;
      });
    } catch (error) {
      console.error("Błąd ładowania danych:", error);
    }
  }
  
  // Wyświetlenie formularza dla dodawania/edycji
  async function showPacjentForm(pacjent = null) {
    const formDiv = document.getElementById("pacjentForm");
    formDiv.style.display = "block";
  
    formDiv.innerHTML = `
      <h2>${pacjent ? "Edytuj" : "Dodaj"} Pacjenta</h2>
      <form id="pacjentFormInner">
        <label>Imię:</label>
        <input type="text" id="imie" value="${pacjent ? pacjent.imie : ''}" required />
        <label>Nazwisko:</label>
        <input type="text" id="nazwisko" value="${pacjent ? pacjent.nazwisko : ''}" required />
        <button type="submit">${pacjent ? "Zapisz" : "Dodaj"}</button>
        <button type="button" onclick="hidePacjentForm()">Anuluj</button>
      </form>
    `;
  
    document.getElementById("pacjentFormInner").addEventListener("submit", async (event) => {
      event.preventDefault();
      const newData = {
        imie: document.getElementById("imie").value,
        nazwisko: document.getElementById("nazwisko").value,
      };
  
      if (pacjent) {
        await updatePacjent(pacjent.id_pacjenta, newData);
      } else {
        await addPacjent(newData);
      }
  
      hidePacjentForm();
      await loadPacjentTable();
    });
  }
  
  // Ukrycie formularza
  function hidePacjentForm() {
    const formDiv = document.getElementById("pacjentForm");
    formDiv.style.display = "none";
  }
  
  // Dodanie nowego pacjenta
  async function addPacjent(data) {
    try {
      const response = await fetch(`${API_URL}/api/pacjent`, {
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
  
  // Edycja pacjenta
  async function editPacjent(id) {
    try {
      const response = await fetch(`${API_URL}/api/pacjent/${id}`);
      const pacjent = await response.json();
      showPacjentForm(pacjent);
    } catch (error) {
      console.error("Błąd pobierania danych do edycji:", error);
    }
  }
  
  // Aktualizacja pacjenta
  async function updatePacjent(id, data) {
    try {
      await fetch(`${API_URL}/api/pacjent/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error("Błąd aktualizacji:", error);
    }
  }
  
  // Usuwanie pacjenta
  async function deletePacjent(id) {
    if (confirm("Czy na pewno chcesz usunąć tego pacjenta? Wraz z nim zostaną usunięte wszystkie jego wizyty i zabiegi.")) {
      try {
        await fetch(`${API_URL}/api/pacjent/${id}`, { method: "DELETE" });
        await loadPacjentTable();
      } catch (error) {
        console.error("Błąd usuwania:", error);
      }
    }
  }
  
  initPacjentApp();
  
  