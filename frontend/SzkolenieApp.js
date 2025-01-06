// Główna funkcja inicjująca
async function initSzkolenieApp() {
  const content = document.getElementById("content");
  content.innerHTML = `
    <h1>Szkolenia</h1>
    <button id="addSzkolenieBtn">Dodaj Szkolenie</button>
    <table id="szkolenieTable">
      <thead>
        <tr>
          <th>Tytuł</th>
          <th>Data</th>
          <th>Akcje</th>
        </tr>
      </thead>
      <tbody></tbody>
    </table>
    <div id="szkolenieForm" style="display: none;"></div>
  `;

  document.getElementById("addSzkolenieBtn").addEventListener("click", () => showSzkolenieForm());

  await loadSzkolenieTable();
}

// Załadowanie danych do tabeli
async function loadSzkolenieTable() {
  const tableBody = document.querySelector("#szkolenieTable tbody");
  tableBody.innerHTML = ""; // Wyczyść tabelę

  try {
    const response = await fetch(`${API_URL}/api/szkolenie`);
    const data = await response.json();

    data.forEach((szkolenie) => {
      const formattedDate = new Date(szkolenie.data).toLocaleDateString('pl-PL', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      const row = `
        <tr>
          <td>${szkolenie.tytul}</td>
          <td>${formattedDate}</td>
          <td>
            <button onclick="editSzkolenie(${szkolenie.id_szkolenia})">Edytuj</button>
            <button onclick="deleteSzkolenie(${szkolenie.id_szkolenia})">Usuń</button>
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
async function showSzkolenieForm(szkolenie = {}) {
  const formDiv = document.getElementById("szkolenieForm");
  formDiv.style.display = "block";

  formDiv.innerHTML = `
    <h2>${szkolenie.id_szkolenia ? "Edytuj" : "Dodaj"} Szkolenie</h2>
    <form id="szkolenieFormInner">
      <label>Tytuł:</label>
      <input type="text" id="tytul" value="${szkolenie.tytul || ""}" required />
      <label>Data:</label>
      <input type="date" id="data" value="${szkolenie.data || ""}" required />
      <button type="submit">${szkolenie.id_szkolenia ? "Zapisz" : "Dodaj"}</button>
      <button type="button" onclick="hideSzkolenieForm()">Anuluj</button>
    </form>
  `;

  document.getElementById("szkolenieFormInner").addEventListener("submit", async (event) => {
    event.preventDefault();
    const newData = {
      tytul: document.getElementById("tytul").value,
      data: document.getElementById("data").value,
    };

    if (szkolenie.id_szkolenia) {
      await updateSzkolenie(szkolenie.id_szkolenia, newData);
    } else {
      await addSzkolenie(newData);
    }

    hideSzkolenieForm();
    await loadSzkolenieTable();
  });
}

// Ukrycie formularza
function hideSzkolenieForm() {
  const formDiv = document.getElementById("szkolenieForm");
  formDiv.style.display = "none";
}

// Dodanie nowego szkolenia
async function addSzkolenie(data) {
  try {
    await fetch(`${API_URL}/api/szkolenie`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  } catch (error) {
    console.error("Błąd dodawania:", error);
  }
}

// Edycja szkolenia
async function editSzkolenie(id) {
  const response = await fetch(`${API_URL}/api/szkolenie/${id}`);
  const szkolenie = await response.json();
  showSzkolenieForm(szkolenie);
}

// Aktualizacja szkolenia
async function updateSzkolenie(id, data) {
  try {
    await fetch(`${API_URL}/api/szkolenie/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  } catch (error) {
    console.error("Błąd aktualizacji:", error);
  }
}

// Usuwanie szkolenia
async function deleteSzkolenie(id) {
  if (confirm("Czy na pewno chcesz usunąć to szkolenie?")) {
    try {
      const response = await fetch(`${API_URL}/api/szkolenie/${id}`, { method: "DELETE" });

      if (!response.ok) {
        const errorData = await response.json();
        alert(errorData.message);
        return;
      }

      await loadSzkolenieTable();
    } catch (error) {
      console.error("Błąd usuwania:", error);
      alert("Wystąpił błąd podczas próby usunięcia szkolenia.");
    }
  }
}


initSzkolenieApp();
