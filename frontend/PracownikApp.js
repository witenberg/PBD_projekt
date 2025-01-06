// Główna funkcja inicjująca
async function initPracownikApp() {
  const content = document.getElementById("content");
  content.innerHTML = `
    <h1>Pracownicy</h1>
    <button id="addPracownikBtn">Dodaj Pracownika</button>
    <table id="pracownikTable">
      <thead>
        <tr>
          <th>Imię</th>
          <th>Nazwisko</th>
          <th>Telefon</th>
          <th>Szef</th>
          <th>Akcje</th>
        </tr>
      </thead>
      <tbody></tbody>
    </table>
    <div id="pracownikForm" style="display: none;"></div>
  `;

  document.getElementById("addPracownikBtn").addEventListener("click", () => showPracownikForm());

  await loadPracownikTable();
}

// Załadowanie danych do tabeli
async function loadPracownikTable() {
  const tableBody = document.querySelector("#pracownikTable tbody");
  tableBody.innerHTML = ""; // Wyczyść tabelę

  try {
    const response = await fetch(`${API_URL}/api/pracownik`);
    const data = await response.json();
    console.log(data);

    data.forEach((pracownik) => {
      const row = `
        <tr>
          <td>${pracownik.imie}</td>
          <td>${pracownik.nazwisko}</td>
          <td>${pracownik.telefon || "Brak"}</td>
          <td>${pracownik.szef || "Brak"}</td>
          <td>
            <button onclick="editPracownik(${pracownik.id_pracownika})">Edytuj</button>
            <button onclick="deletePracownik(${pracownik.id_pracownika})">Usuń</button>
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
async function showPracownikForm(pracownik = {}) {
  const formDiv = document.getElementById("pracownikForm");
  formDiv.style.display = "block";

  // Pobierz listę szefów
  const response = await fetch(`${API_URL}/api/pracownik/szefowie`);
  const szefowie = await response.json();

  const szefOptions = szefowie
    .map((szef) => `<option value="${szef.id_pracownika}">${szef.imie} ${szef.nazwisko}</option>`)
    .join("");

  formDiv.innerHTML = `
    <h2>${pracownik.id_pracownika ? "Edytuj" : "Dodaj"} Pracownika</h2>
    <form id="pracownikFormInner">
      <label>Imię:</label>
      <input type="text" id="imie" value="${pracownik.imie || ""}" required />
      <label>Nazwisko:</label>
      <input type="text" id="nazwisko" value="${pracownik.nazwisko || ""}" required />
      <label>Telefon:</label>
      <input type="text" id="telefon" value="${pracownik.telefon || ""}" />
      <label>Szef:</label>
      <select id="id_szef">
        <option value="">Brak</option>
        ${szefOptions}
      </select>
      <button type="submit">${pracownik.id_pracownika ? "Zapisz" : "Dodaj"}</button>
      <button type="button" onclick="hidePracownikForm()">Anuluj</button>
    </form>
  `;

  document.getElementById("pracownikFormInner").addEventListener("submit", async (event) => {
    event.preventDefault();
    const newData = {
      imie: document.getElementById("imie").value,
      nazwisko: document.getElementById("nazwisko").value,
      telefon: document.getElementById("telefon").value,
      id_szef: document.getElementById("id_szef").value || null,
    };

    if (pracownik.id_pracownika) {
      await updatePracownik(pracownik.id_pracownika, newData);
    } else {
      await addPracownik(newData);
    }

    hidePracownikForm();
    await loadPracownikTable();
  });
}

// Ukrycie formularza
function hidePracownikForm() {
  const formDiv = document.getElementById("pracownikForm");
  formDiv.style.display = "none";
}

// Dodanie nowego pracownika
async function addPracownik(data) {
  try {
    await fetch(`${API_URL}/api/pracownik`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  } catch (error) {
    console.error("Błąd dodawania:", error);
  }
}

// Edycja pracownika
async function editPracownik(id) {
  const response = await fetch(`${API_URL}/api/pracownik/${id}`);
  const pracownik = await response.json();
  showPracownikForm(pracownik);
}

// Aktualizacja pracownika
async function updatePracownik(id, data) {
  try {
    await fetch(`${API_URL}/api/pracownik/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  } catch (error) {
    console.error("Błąd aktualizacji:", error);
  }
}

// Usuwanie pracownika
async function deletePracownik(id) {
  if (confirm("Czy na pewno chcesz usunąć tego pracownika?")) {
    try {
      const response = await fetch(`${API_URL}/api/pracownik/${id}`, { method: "DELETE" });

      if (!response.ok) {
        const errorData = await response.json();
        alert(errorData.message);
        return;
      }

      await loadPracownikTable();
    } catch (error) {
      console.error("Błąd usuwania:", error);
      alert("Wystąpił błąd podczas próby usunięcia pracownika.");
    }
  }
}


initPracownikApp();
