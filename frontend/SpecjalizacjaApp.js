// Główna funkcja inicjująca
async function initSpecjalizacjaApp() {
    const content = document.getElementById("content");
    content.innerHTML = `
      <h1>Specjalizacje Lekarzy</h1>
      <button id="addSpecjalizacjaBtn">Dodaj Specjalizację</button>
      <table id="specjalizacjaTable">
        <thead>
          <tr>
            <th>Lekarz</th>
            <th>Specjalizacja</th>
            <th>Akcje</th>
          </tr>
        </thead>
        <tbody></tbody>
      </table>
      <div id="specjalizacjaForm" style="display: none;"></div>
    `;
  
    document.getElementById("addSpecjalizacjaBtn").addEventListener("click", () => showSpecjalizacjaForm());
  
    await loadSpecjalizacjaTable();
  }
  
  // Załadowanie danych do tabeli
  async function loadSpecjalizacjaTable() {
    const tableBody = document.querySelector("#specjalizacjaTable tbody");
    tableBody.innerHTML = ""; // Wyczyść tabelę
  
    try {
      const response = await fetch(`${API_URL}/api/specjalizacja`);
      const data = await response.json();
      console.log(data);
  
      data.forEach((specjalizacja) => {
        const row = `
          <tr>
            <td>${specjalizacja.imie_nazwisko}</td>
            <td>${specjalizacja.specjalizacja}</td>
            <td>
              <button onclick="editSpecjalizacja(${specjalizacja.id_specjalizacji})">Edytuj</button>
              <button onclick="deleteSpecjalizacja(${specjalizacja.id_specjalizacji})">Usuń</button>
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
  async function showSpecjalizacjaForm(specjalizacja = null) {
    const formDiv = document.getElementById("specjalizacjaForm");
    formDiv.style.display = "block";
  
    // Pobierz listę lekarzy
    const lekarzeResponse = await fetch(`${API_URL}/api/specjalizacja/lekarze`);
    const lekarze = await lekarzeResponse.json();
  
    const lekarzeOptions = lekarze
      .map((l) => `<option value="${l.id_lekarza}" ${specjalizacja && specjalizacja.id_lekarza == l.id_lekarza ? 'selected' : ''}>${l.imie} ${l.nazwisko}</option>`)
      .join("");
  
    formDiv.innerHTML = `
      <h2>${specjalizacja ? "Edytuj" : "Dodaj"} Specjalizację</h2>
      <form id="specjalizacjaFormInner">
        <label>Lekarz:</label>
        <select id="id_lekarza" ${specjalizacja ? 'disabled' : 'required'}>
          ${lekarzeOptions}
        </select>
        <label>Specjalizacja:</label>
        <input type="text" id="specjalizacja" value="${specjalizacja ? specjalizacja.specjalizacja : ''}" required />
        <button type="submit">${specjalizacja ? "Zapisz" : "Dodaj"}</button>
        <button type="button" onclick="hideSpecjalizacjaForm()">Anuluj</button>
      </form>
    `;
  
    document.getElementById("specjalizacjaFormInner").addEventListener("submit", async (event) => {
      event.preventDefault();
      const newData = {
        id_lekarza: document.getElementById("id_lekarza").value,
        specjalizacja: document.getElementById("specjalizacja").value,
      };
  
      if (specjalizacja) {
        await updateSpecjalizacja(specjalizacja.id_specjalizacji, newData);
      } else {
        await addSpecjalizacja(newData);
      }
  
      hideSpecjalizacjaForm();
      await loadSpecjalizacjaTable();
    });
  }
  
  // Ukrycie formularza
  function hideSpecjalizacjaForm() {
    const formDiv = document.getElementById("specjalizacjaForm");
    formDiv.style.display = "none";
  }
  
  // Dodanie nowej specjalizacji
  async function addSpecjalizacja(data) {
    try {
      const response = await fetch(`${API_URL}/api/specjalizacja`, {
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
  
  // Edycja specjalizacji
  async function editSpecjalizacja(id) {
    try {
      const response = await fetch(`${API_URL}/api/specjalizacja/${id}`);
      const specjalizacja = await response.json();
      showSpecjalizacjaForm(specjalizacja);
    } catch (error) {
      console.error("Błąd pobierania danych do edycji:", error);
    }
  }
  
  // Aktualizacja specjalizacji
  async function updateSpecjalizacja(id, data) {
    try {
      await fetch(`${API_URL}/api/specjalizacja/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error("Błąd aktualizacji:", error);
    }
  }
  
  // Usuwanie specjalizacji
  async function deleteSpecjalizacja(id) {
    if (confirm("Czy na pewno chcesz usunąć specjalizację tego lekarza?")) {
      try {
        await fetch(`${API_URL}/api/specjalizacja/${id}`, { method: "DELETE" });
        await loadSpecjalizacjaTable();
      } catch (error) {
        console.error("Błąd usuwania:", error);
      }
    }
  }
  
  initSpecjalizacjaApp();
  
  