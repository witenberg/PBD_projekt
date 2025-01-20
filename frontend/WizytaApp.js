// Główna funkcja inicjująca
async function initWizytaApp() {
    const content = document.getElementById("content");
    content.innerHTML = `
      <h1>Wizyty</h1>
      <button id="addWizytaBtn">Dodaj Wizytę</button>
      <table id="wizytaTable">
        <thead>
          <tr>
            <th>Pacjent</th>
            <th>Numer Gabinetu</th>
            <th>Budynek</th>
            <th>Lekarz</th>
            <th>Data i Godzina</th>
            <th>Koszt</th>
            <th>Akcje</th>
          </tr>
        </thead>
        <tbody></tbody>
      </table>
      <div id="wizytaForm" style="display: none;"></div>
    `;
    document.getElementById("addWizytaBtn").addEventListener("click", () => showWizytaForm());
    await loadWizytaTable();
  }
  
  // Załadowanie danych do tabeli
  async function loadWizytaTable() {
    const tableBody = document.querySelector("#wizytaTable tbody");
    tableBody.innerHTML = "";
  
    try {
      const response = await fetch(`${API_URL}/api/wizyta`);
      const data = await response.json();
  
      data.forEach((wizyta) => {
        const row = `
          <tr>
            <td>${wizyta.pacjent_imie_nazwisko}</td>
            <td>${wizyta.numer_gabinetu}</td>
            <td>${wizyta.budynek_nazwa}</td>
            <td>${wizyta.lekarz_imie_nazwisko}</td>
            <td>${formatDateTime(wizyta.data)}</td>
            <td>${wizyta.koszt.toFixed(2)} zł</td>
            <td>
              <button onclick="editWizyta(${wizyta.id_wizyty})">Edytuj</button>
              <button onclick="deleteWizyta(${wizyta.id_wizyty})">Usuń</button>
            </td>
          </tr>
        `;
        tableBody.innerHTML += row;
      });
    } catch (error) {
      console.error("Błąd ładowania danych:", error);
    }
  }
  
  // Formatowanie daty i czasu
  function formatDateTime(dateTimeString) {
    const date = new Date(dateTimeString);
    return date.toLocaleString('pl-PL', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }
  
  // Wyświetlenie formularza dla dodawania/edycji
  async function showWizytaForm(wizyta = null) {
    const formDiv = document.getElementById("wizytaForm");
    formDiv.style.display = "block";
  
    // Pobierz listę pacjentów
    const pacjenciResponse = await fetch(`${API_URL}/api/wizyta/pacjenci`);
    const pacjenci = await pacjenciResponse.json();
  
    // Pobierz listę lekarzy
    const lekarzeResponse = await fetch(`${API_URL}/api/wizyta/lekarze`);
    const lekarze = await lekarzeResponse.json();
  
    // Pobierz listę budynków
    const budynkiResponse = await fetch(`${API_URL}/api/wizyta/budynki`);
    const budynki = await budynkiResponse.json();
  
    const pacjenciOptions = pacjenci
      .map((p) => `<option value="${p.id_pacjenta}" ${wizyta && wizyta.id_pacjenta == p.id_pacjenta ? 'selected' : ''}>${p.imie} ${p.nazwisko}</option>`)
      .join("");
  
    const lekarzeOptions = lekarze
      .map((l) => `<option value="${l.id_lekarza}" ${wizyta && wizyta.id_lekarza == l.id_lekarza ? 'selected' : ''}>${l.imie} ${l.nazwisko}</option>`)
      .join("");
  
    const budynkiOptions = budynki
      .map((b) => `<option value="${b.symbol}" ${wizyta && wizyta.budynek == b.symbol ? 'selected' : ''}>${b.nazwa}</option>`)
      .join("");
   
    formDiv.innerHTML = `
      <h2>${wizyta ? "Edytuj" : "Dodaj"} Wizytę</h2>
      <form id="wizytaFormInner">
        <label>Pacjent:</label>
        <select id="id_pacjenta" ${wizyta ? 'disabled' : 'required'}>
          ${pacjenciOptions}
        </select>
        <label>Budynek:</label>
        <select id="budynek" required onchange="loadGabinety()">
          <option value="">Wybierz budynek</option>
          ${budynkiOptions}
        </select>
        <label>Numer Gabinetu:</label>
        <select id="numer_gabinetu" required disabled>
          <option value="">Najpierw wybierz budynek</option>
        </select>
        <label>Lekarz:</label>
        <select id="id_lekarza" required>
          ${lekarzeOptions}
        </select>
        <label>Data i Godzina:</label>
        <input type="datetime-local" id="data" value="${wizyta ? wizyta.data.slice(0, 16) : ''}" required />
        <label>Koszt:</label>
        <input type="number" id="koszt" step="0.01" value="${wizyta ? wizyta.koszt : ''}" required />
        <button type="submit">${wizyta ? "Zapisz" : "Dodaj"}</button>
        <button type="button" onclick="hideWizytaForm()">Anuluj</button>
      </form>
    `;
  
    document.getElementById("wizytaFormInner").addEventListener("submit", async (event) => {
      event.preventDefault();
      const newData = {
        id_pacjenta: document.getElementById("id_pacjenta").value,
        numer_gabinetu: document.getElementById("numer_gabinetu").value,
        budynek: document.getElementById("budynek").value,
        id_lekarza: document.getElementById("id_lekarza").value,
        data: document.getElementById("data").value,
        koszt: document.getElementById("koszt").value,
      };
  
      if (wizyta) {
        await updateWizyta(wizyta.id_wizyty, newData);
      } else {
        await addWizyta(newData);
      }
  
      hideWizytaForm();
      await loadWizytaTable();
    });
  
    if (wizyta) {
      await loadGabinety(wizyta.budynek, wizyta.numer_gabinetu);
    }
  }
  
  async function loadGabinety(selectedBudynek = null, selectedGabinet = null) {
    const budynekSelect = document.getElementById("budynek");
    const gabinetSelect = document.getElementById("numer_gabinetu");
    
    const budynek = selectedBudynek || budynekSelect.value;
    
    if (!budynek) {
      gabinetSelect.innerHTML = '<option value="">Najpierw wybierz budynek</option>';
      gabinetSelect.disabled = true;
      return;
    }
  
    try {
      const response = await fetch(`${API_URL}/api/wizyta/gabinety/${budynek}`);
      const gabinety = await response.json();
  
      gabinetSelect.innerHTML = '<option value="">Wybierz gabinet</option>';
      gabinety.forEach((gabinet) => {
        const option = document.createElement('option');
        option.value = gabinet.numer;
        option.textContent = `Gabinet ${gabinet.numer}`;
        if (selectedGabinet && selectedGabinet == gabinet.numer) {
          option.selected = true;
        }
        gabinetSelect.appendChild(option);
      });
      gabinetSelect.disabled = false;
    } catch (error) {
      console.error("Błąd ładowania gabinetów:", error);
      gabinetSelect.innerHTML = '<option value="">Brak gabinetów w tym budynku</option>';
    }
  }
  
  // Ukrycie formularza
  function hideWizytaForm() {
    const formDiv = document.getElementById("wizytaForm");
    formDiv.style.display = "none";
  }
  
  // Dodanie nowej wizyty
  async function addWizyta(data) {
    try {
      const response = await fetch(`${API_URL}/api/wizyta`, {
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
  
  // Edycja wizyty
  async function editWizyta(id) {
    try {
      const response = await fetch(`${API_URL}/api/wizyta/${id}`);
      const wizyta = await response.json();
      showWizytaForm(wizyta);
    } catch (error) {
      console.error("Błąd pobierania danych do edycji:", error);
    }
  }
  
  // Aktualizacja wizyty
  async function updateWizyta(id, data) {
    try {
      await fetch(`${API_URL}/api/wizyta/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error("Błąd aktualizacji:", error);
    }
  }
  
  // Usuwanie wizyty
  async function deleteWizyta(id) {
    if (confirm("Czy na pewno chcesz usunąć tę wizytę?")) {
      try {
        await fetch(`${API_URL}/api/wizyta/${id}`, { method: "DELETE" });
        await loadWizytaTable();
      } catch (error) {
        console.error("Błąd usuwania:", error);
      }
    }
  }
  
  initWizytaApp();
  
  