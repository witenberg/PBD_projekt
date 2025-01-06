// Główna funkcja inicjująca
async function initZastepstwoApp() {
    const content = document.getElementById("content");
    content.innerHTML = `
      <h1>Zastępstwa</h1>
      <button id="addZastepstwoBtn">Dodaj Zastępstwo</button>
      <table id="zastepstwoTable">
        <thead>
          <tr>
            <th>Lekarz zastępujący</th>
            <th>Lekarz zastępowany</th>
            <th>Data rozpoczęcia</th>
            <th>Data zakończenia</th>
            <th>Akcje</th>
          </tr>
        </thead>
        <tbody></tbody>
      </table>
      <div id="zastepstwoForm" style="display: none;"></div>
    `;
  
    document.getElementById("addZastepstwoBtn").addEventListener("click", () => showZastepstwoForm());
  
    await loadZastepstwoTable();
  }
  
  // Załadowanie danych do tabeli
  async function loadZastepstwoTable() {
    const tableBody = document.querySelector("#zastepstwoTable tbody");
    tableBody.innerHTML = ""; // Wyczyść tabelę
  
    try {
      const response = await fetch(`${API_URL}/api/zastepstwo`);
      const data = await response.json();
      console.log(data);
  
      data.forEach((zastepstwo) => {
        const row = `
          <tr>
            <td>${zastepstwo.lekarz_zastepujacy_imie_nazwisko}</td>
            <td>${zastepstwo.lekarz_zastepowany_imie_nazwisko}</td>
            <td>${formatDate(zastepstwo.data_rozpoczecia)}</td>
            <td>${zastepstwo.data_zakonczenia ? formatDate(zastepstwo.data_zakonczenia) : 'Nie określono'}</td>
            <td>
              <button onclick="editZastepstwo(${zastepstwo.id_zastepstwa})">Edytuj</button>
              <button onclick="deleteZastepstwo(${zastepstwo.id_zastepstwa})">Usuń</button>
            </td>
          </tr>
        `;
        tableBody.innerHTML += row;
      });
    } catch (error) {
      console.error("Błąd ładowania danych:", error);
    }
  }
  
  // Formatowanie daty
  function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('pl-PL');
  }
  
  // Walidacja dat
  function validateDates(startDate, endDate) {
    if (endDate && new Date(startDate) > new Date(endDate)) {
      alert("Data zakończenia musi być późniejsza niż data rozpoczęcia.");
      return false;
    }
    return true;
  }
  
  // Wyświetlenie formularza dla dodawania/edycji
  async function showZastepstwoForm(zastepstwo = null) {
    const formDiv = document.getElementById("zastepstwoForm");
    formDiv.style.display = "block";
  
    // Pobierz listę lekarzy
    const lekarzeResponse = await fetch(`${API_URL}/api/zastepstwo/lekarze`);
    const lekarze = await lekarzeResponse.json();
  
    const lekarzeOptions = lekarze
      .map((l) => `<option value="${l.id_lekarza}">${l.imie} ${l.nazwisko}</option>`)
      .join("");
  
    formDiv.innerHTML = `
      <h2>${zastepstwo ? "Edytuj" : "Dodaj"} Zastępstwo</h2>
      <form id="zastepstwoFormInner">
        <label>Lekarz zastępujący:</label>
        <select id="id_lekarz_zastepujacy" required onchange="updateLekarzZastepowanyOptions()">
          <option value="">Wybierz lekarza</option>
          ${lekarzeOptions}
        </select>
        <label>Lekarz zastępowany:</label>
        <select id="id_lekarz_zastepowany" required>
          <option value="">Wybierz lekarza</option>
          ${lekarzeOptions}
        </select>
        <label>Data rozpoczęcia:</label>
        <input type="date" id="data_rozpoczecia" required />
        <label>Data zakończenia:</label>
        <input type="date" id="data_zakonczenia" />
        <button type="submit">${zastepstwo ? "Zapisz" : "Dodaj"}</button>
        <button type="button" onclick="hideZastepstwoForm()">Anuluj</button>
      </form>
    `;
  
    document.getElementById("zastepstwoFormInner").addEventListener("submit", async (event) => {
      event.preventDefault();
      const newData = {
        id_lekarz_zastepujacy: document.getElementById("id_lekarz_zastepujacy").value,
        id_lekarz_zastepowany: document.getElementById("id_lekarz_zastepowany").value,
        data_rozpoczecia: document.getElementById("data_rozpoczecia").value,
        data_zakonczenia: document.getElementById("data_zakonczenia").value || null,
      };
  
      if (!validateDates(newData.data_rozpoczecia, newData.data_zakonczenia)) {
        return;
      }
  
      if (zastepstwo) {
        await updateZastepstwo(zastepstwo.id_zastepstwa, newData);
      } else {
        await addZastepstwo(newData);
      }
  
      hideZastepstwoForm();
      await loadZastepstwoTable();
    });
  
    if (zastepstwo) {
      document.getElementById("id_lekarz_zastepujacy").value = zastepstwo.id_lekarz_zastepujacy;
      document.getElementById("id_lekarz_zastepowany").value = zastepstwo.id_lekarz_zastepowany;
      document.getElementById("data_rozpoczecia").value = zastepstwo.data_rozpoczecia.split('T')[0];
      if (zastepstwo.data_zakonczenia) {
        document.getElementById("data_zakonczenia").value = zastepstwo.data_zakonczenia.split('T')[0];
      }
      updateLekarzZastepowanyOptions();
    }
  
    updateLekarzZastepowanyOptions();
  }
  
  // Aktualizacja opcji dla lekarza zastępowanego
  function updateLekarzZastepowanyOptions() {
    const lekarzZastepujacySelect = document.getElementById("id_lekarz_zastepujacy");
    const lekarzZastepowanySelect = document.getElementById("id_lekarz_zastepowany");
    const selectedLekarzZastepujacy = lekarzZastepujacySelect.value;
  
    // Włącz wszystkie opcje
    Array.from(lekarzZastepowanySelect.options).forEach(option => {
      option.disabled = false;
    });
  
    // Wyłącz opcję wybraną w pierwszym select
    if (selectedLekarzZastepujacy) {
      const optionToDisable = lekarzZastepowanySelect.querySelector(`option[value="${selectedLekarzZastepujacy}"]`);
      if (optionToDisable) {
        optionToDisable.disabled = true;
      }
    }
  
    // Jeśli aktualnie wybrana opcja została wyłączona, zresetuj wybór
    if (lekarzZastepowanySelect.selectedOptions[0].disabled) {
      lekarzZastepowanySelect.value = "";
    }
  }
  
  // Ukrycie formularza
  function hideZastepstwoForm() {
    const formDiv = document.getElementById("zastepstwoForm");
    formDiv.style.display = "none";
  }
  
  // Dodanie nowego zastępstwa
  async function addZastepstwo(data) {
    try {
      const response = await fetch(`${API_URL}/api/zastepstwo`, {
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
  
  // Edycja zastępstwa
  async function editZastepstwo(id) {
    try {
      const response = await fetch(`${API_URL}/api/zastepstwo/${id}`);
      const zastepstwo = await response.json();
      showZastepstwoForm(zastepstwo);
    } catch (error) {
      console.error("Błąd pobierania danych do edycji:", error);
    }
  }
  
  // Aktualizacja zastępstwa
  async function updateZastepstwo(id, data) {
    try {
      await fetch(`${API_URL}/api/zastepstwo/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error("Błąd aktualizacji:", error);
    }
  }
  
  // Usuwanie zastępstwa
  async function deleteZastepstwo(id) {
    if (confirm("Czy na pewno chcesz usunąć to zastępstwo?")) {
      try {
        await fetch(`${API_URL}/api/zastepstwo/${id}`, { method: "DELETE" });
        await loadZastepstwoTable();
      } catch (error) {
        console.error("Błąd usuwania:", error);
      }
    }
  }
  
  initZastepstwoApp();
  
  