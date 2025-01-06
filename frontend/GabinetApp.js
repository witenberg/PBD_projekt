// Główna funkcja inicjująca
async function initGabinetApp() {
    const content = document.getElementById("content");
    content.innerHTML = `
      <h1>Gabinety</h1>
      <button id="addGabinetBtn">Dodaj Gabinet</button>
      <table id="gabinetTable">
        <thead>
          <tr>
            <th>Numer</th>
            <th>Budynek</th>
            <th>Piętro</th>
            <th>Akcje</th>
          </tr>
        </thead>
        <tbody></tbody>
      </table>
      <div id="gabinetForm" style="display: none;"></div>
    `;
  
    document.getElementById("addGabinetBtn").addEventListener("click", () => showGabinetForm());
  
    await loadGabinetTable();
  }
  
  // Załadowanie danych do tabeli
  async function loadGabinetTable() {
    const tableBody = document.querySelector("#gabinetTable tbody");
    tableBody.innerHTML = ""; // Wyczyść tabelę
  
    try {
      const response = await fetch(`${API_URL}/api/gabinet`);
      const data = await response.json();
      console.log(data);
  
      data.forEach((gabinet) => {
        const row = `
          <tr>
            <td>${gabinet.numer}</td>
            <td>${gabinet.budynek_nazwa}</td>
            <td>${gabinet.pietro}</td>
            <td>
              <button onclick="editGabinet(${gabinet.numer}, '${gabinet.budynek}')">Edytuj</button>
              <button onclick="deleteGabinet(${gabinet.numer}, '${gabinet.budynek}')">Usuń</button>
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
  async function showGabinetForm(gabinet = null) {
    const formDiv = document.getElementById("gabinetForm");
    formDiv.style.display = "block";
  
    // Pobierz listę budynków
    const budynkiResponse = await fetch(`${API_URL}/api/budynek`);
    const budynki = await budynkiResponse.json();
  
    const budynkiOptions = budynki
      .map((b) => `<option value="${b.symbol}" ${gabinet && gabinet.budynek === b.symbol ? 'selected' : ''}>${b.nazwa}</option>`)
      .join("");
  
    formDiv.innerHTML = `
      <h2>${gabinet ? "Edytuj" : "Dodaj"} Gabinet</h2>
      <form id="gabinetFormInner">
        <label>Numer:</label>
        <input type="number" id="numer" value="${gabinet ? gabinet.numer : ''}" ${gabinet ? 'readonly' : 'required'} />
        <label>Budynek:</label>
        <select id="budynek" required>
          ${budynkiOptions}
        </select>
        <label>Piętro:</label>
        <input type="number" id="pietro" value="${gabinet ? gabinet.pietro : ''}" required />
        <button type="submit">${gabinet ? "Zapisz" : "Dodaj"}</button>
        <button type="button" onclick="hideGabinetForm()">Anuluj</button>
      </form>
    `;
  
    document.getElementById("gabinetFormInner").addEventListener("submit", async (event) => {
      event.preventDefault();
      const newData = {
        numer: document.getElementById("numer").value,
        budynek: document.getElementById("budynek").value,
        pietro: document.getElementById("pietro").value,
      };
  
      if (gabinet) {
        await updateGabinet(gabinet.numer, gabinet.budynek, newData);
      } else {
        await addGabinet(newData);
      }
  
      hideGabinetForm();
      await loadGabinetTable();
    });
  }
  
  // Ukrycie formularza
  function hideGabinetForm() {
    const formDiv = document.getElementById("gabinetForm");
    formDiv.style.display = "none";
  }
  
  // Dodanie nowego gabinetu
  async function addGabinet(data) {
    try {
      const response = await fetch(`${API_URL}/api/gabinet`, {
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
  
  // Edycja gabinetu
  async function editGabinet(numer, budynek) {
    try {
      const response = await fetch(`${API_URL}/api/gabinet/${numer}/${budynek}`);
      const gabinet = await response.json();
      showGabinetForm(gabinet);
    } catch (error) {
      console.error("Błąd pobierania danych do edycji:", error);
    }
  }
  
  // Aktualizacja gabinetu
  async function updateGabinet(oldNumer, oldBudynek, data) {
    try {
      await fetch(`${API_URL}/api/gabinet/${oldNumer}/${oldBudynek}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error("Błąd aktualizacji:", error);
    }
  }
  
  // Usuwanie gabinetu
  async function deleteGabinet(numer, budynek) {
    if (confirm("Czy na pewno chcesz usunąć ten gabinet? Wraz z nim zostaną usunięte wszystkie jego wizyty")) {
      try {
        await fetch(`${API_URL}/api/gabinet/${numer}/${budynek}`, { method: "DELETE" });
        await loadGabinetTable();
      } catch (error) {
        console.error("Błąd usuwania:", error);
      }
    }
  }
  
  initGabinetApp();
  
  