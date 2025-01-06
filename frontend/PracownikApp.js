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
          <th>Rola</th>
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
          <td>${pracownik.rola || "Brak"}</td>
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
      <label>Rola:</label>
      <select id="rola" onchange="toggleWyksztalcenie()" ${pracownik.id_pracownika ? 'disabled' : ''} required>
        <option value="">Wybierz rolę</option>
        <option value="Lekarz">Lekarz</option>
        <option value="Recepcjonista">Recepcjonista</option>
      </select>
      <div id="wyksztalcenieContainer" style="display: none;">
        <label>Wykształcenie:</label>
        <input type="text" id="wyksztalcenie" ${pracownik.id_pracownika && pracownik.rola === "Recepcjonista" ? 'disabled' : ''} />
      </div>
      <button type="submit">${pracownik.id_pracownika ? "Zapisz" : "Dodaj"}</button>
      <button type="button" onclick="hidePracownikForm()">Anuluj</button>
    </form>
  `;

  document.getElementById("pracownikFormInner").addEventListener("submit", async (event) => {
    event.preventDefault();
    const roleSelect = document.getElementById("rola");
    if (!pracownik.id_pracownika && !roleSelect.value) {
      alert("Proszę wybrać rolę pracownika.");
      return;
    }
    const newData = {
      imie: document.getElementById("imie").value,
      nazwisko: document.getElementById("nazwisko").value,
      telefon: document.getElementById("telefon").value,
      id_szef: document.getElementById("id_szef").value || null,
      rola: document.getElementById("rola").value,
      wyksztalcenie: document.getElementById("wyksztalcenie").value || null,
    };

    if (pracownik.id_pracownika) {
      await updatePracownik(pracownik.id_pracownika, newData);
    } else {
      await addPracownik(newData);
    }

    hidePracownikForm();
    await loadPracownikTable();
  });

  if (pracownik.id_pracownika) {
    document.getElementById("id_szef").value = pracownik.id_szef || "";
    document.getElementById("rola").value = pracownik.rola || "";
    document.getElementById("rola").disabled = true;
    toggleWyksztalcenie();
    if (pracownik.rola === "Recepcjonista") {
      const wyksztalcenieInput = document.getElementById("wyksztalcenie");
      wyksztalcenieInput.value = pracownik.wyksztalcenie || "";
      wyksztalcenieInput.disabled = true;
    }
  }
}

// Ukrycie formularza
function hidePracownikForm() {
  const formDiv = document.getElementById("pracownikForm");
  formDiv.style.display = "none";
}

// Przełączanie pola wykształcenia
function toggleWyksztalcenie() {
  const rola = document.getElementById("rola").value;
  const wyksztalcenieContainer = document.getElementById("wyksztalcenieContainer");
  wyksztalcenieContainer.style.display = rola === "Recepcjonista" ? "block" : "none";
}

// Dodanie nowego pracownika
async function addPracownik(data) {
  try {
    const response = await fetch(`${API_URL}/api/pracownik`, {
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

// Edycja pracownika
async function editPracownik(id) {
  const response = await fetch(`${API_URL}/api/pracownik/${id}`);
  const pracownik = await response.json();
  showPracownikForm(pracownik);
}

// Aktualizacja pracownika
async function updatePracownik(id, data) {
  try {
    const response = await fetch(`${API_URL}/api/pracownik/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message);
    }
  } catch (error) {
    console.error("Błąd aktualizacji:", error);
    alert(error.message);
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

      alert("Pracownik został usunięty.");
      await loadPracownikTable();
    } catch (error) {
      console.error("Błąd usuwania:", error);
      alert("Wystąpił błąd podczas próby usunięcia pracownika.");
    }
  }
}

initPracownikApp();

