// Główna funkcja inicjująca
async function initPracownikSzkolenieApp() {
  const content = document.getElementById("content");
  content.innerHTML = `
    <h1>Szkolenia Pracowników</h1>
    <button id="addPracownikSzkolenieBtn">Dodaj Szkolenie dla Pracownika</button>
    <table id="pracownikSzkolenieTable">
      <thead>
        <tr>
          <th>Pracownik</th>
          <th>Szkolenie</th>
          <th>Akcje</th>
        </tr>
      </thead>
      <tbody></tbody>
    </table>
    <div id="pracownikSzkolenieForm" style="display: none;"></div>
  `;

  document.getElementById("addPracownikSzkolenieBtn").addEventListener("click", () => showPracownikSzkolenieForm());

  await loadPracownikSzkolenieTable();
}

// Załadowanie danych do tabeli
async function loadPracownikSzkolenieTable() {
  const tableBody = document.querySelector("#pracownikSzkolenieTable tbody");
  tableBody.innerHTML = ""; // Wyczyść tabelę

  try {
    const response = await fetch(`${API_URL}/api/pracownikSzkolenie`);
    const data = await response.json();
    console.log(data);

    data.forEach((ps) => {
      const row = `
        <tr>
          <td>${ps.pracownik}</td>
          <td>${ps.szkolenie}</td>
          <td>
            <button onclick="editPracownikSzkolenie(${ps.id_pracownika}, ${ps.id_szkolenia})">Edytuj</button>
            <button onclick="deletePracownikSzkolenie(${ps.id_pracownika}, ${ps.id_szkolenia})">Usuń</button>
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
async function showPracownikSzkolenieForm(editData = null) {
  const formDiv = document.getElementById("pracownikSzkolenieForm");
  formDiv.style.display = "block";

  // Pobierz listę pracowników
  const pracownicyResponse = await fetch(`${API_URL}/api/pracownikSzkolenie/pracownicy`);
  const pracownicy = await pracownicyResponse.json();

  // Pobierz listę szkoleń
  const szkoleniaResponse = await fetch(`${API_URL}/api/pracownikSzkolenie/szkolenia`);
  const szkolenia = await szkoleniaResponse.json();

  const pracownicyOptions = pracownicy
    .map((p) => `<option value="${p.id_pracownika}" ${editData && editData.id_pracownika == p.id_pracownika ? 'selected' : ''}>${p.imie} ${p.nazwisko}</option>`)
    .join("");

  const szkoleniaOptions = szkolenia
    .map((s) => `<option value="${s.id_szkolenia}" ${editData && editData.id_szkolenia == s.id_szkolenia ? 'selected' : ''}>${s.tytul}</option>`)
    .join("");

  formDiv.innerHTML = `
    <h2>${editData ? 'Edytuj' : 'Dodaj'} Szkolenie dla Pracownika</h2>
    <form id="pracownikSzkolenieFormInner">
      <label>Pracownik:</label>
      <select id="id_pracownika" required>
        ${pracownicyOptions}
      </select>
      <label>Szkolenie:</label>
      <select id="id_szkolenia" required>
        ${szkoleniaOptions}
      </select>
      <button type="submit">${editData ? 'Zapisz' : 'Dodaj'}</button>
      <button type="button" onclick="hidePracownikSzkolenieForm()">Anuluj</button>
    </form>
  `;

  document.getElementById("pracownikSzkolenieFormInner").addEventListener("submit", async (event) => {
    event.preventDefault();
    const newData = {
      id_pracownika: document.getElementById("id_pracownika").value,
      id_szkolenia: document.getElementById("id_szkolenia").value,
    };

    if (editData) {
      await updatePracownikSzkolenie(editData.id_pracownika, editData.id_szkolenia, newData);
    } else {
      await addPracownikSzkolenie(newData);
    }
    hidePracownikSzkolenieForm();
    await loadPracownikSzkolenieTable();
  });
}

// Ukrycie formularza
function hidePracownikSzkolenieForm() {
  const formDiv = document.getElementById("pracownikSzkolenieForm");
  formDiv.style.display = "none";
}

// Dodanie nowego powiązania pracownik-szkolenie
async function addPracownikSzkolenie(data) {
  try {
    await fetch(`${API_URL}/api/pracownikSzkolenie`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  } catch (error) {
    console.error("Błąd dodawania:", error);
  }
}

// Edycja powiązania pracownik-szkolenie
async function editPracownikSzkolenie(id_pracownika, id_szkolenia) {
  try {
    const response = await fetch(`${API_URL}/api/pracownikSzkolenie/${id_pracownika}/${id_szkolenia}`);
    const data = await response.json();
    showPracownikSzkolenieForm(data);
  } catch (error) {
    console.error("Błąd pobierania danych do edycji:", error);
  }
}

// Aktualizacja powiązania pracownik-szkolenie
async function updatePracownikSzkolenie(oldIdPracownika, oldIdSzkolenia, newData) {
  try {
    await fetch(`${API_URL}/api/pracownikSzkolenie/${oldIdPracownika}/${oldIdSzkolenia}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newData),
    });
  } catch (error) {
    console.error("Błąd aktualizacji:", error);
  }
}

// Usuwanie powiązania pracownik-szkolenie
async function deletePracownikSzkolenie(id_pracownika, id_szkolenia) {
  if (confirm("Czy na pewno chcesz usunąć tego pracownika z tego szkolenia?")) {
    try {
      await fetch(`${API_URL}/api/pracownikSzkolenie/${id_pracownika}/${id_szkolenia}`, { method: "DELETE" });
      await loadPracownikSzkolenieTable();
    } catch (error) {
      console.error("Błąd usuwania:", error);
    }
  }
}

initPracownikSzkolenieApp();

