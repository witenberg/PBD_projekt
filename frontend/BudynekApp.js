// Główna funkcja inicjująca
async function initBudynekApp() {
  const content = document.getElementById("content");
  content.innerHTML = `
      <h1>Budynki</h1>
      <button id="addBudynekBtn">Dodaj Budynek</button>
      <table id="budynekTable">
        <thead>
          <tr>
            <th>Symbol</th>
            <th>Nazwa</th>
            <th>Adres</th>
            <th>Akcje</th>
          </tr>
        </thead>
        <tbody></tbody>
      </table>
      <div id="budynekForm" style="display: none;"></div>
    `;

  document.getElementById("addBudynekBtn").addEventListener("click", () => showBudynekForm());

  await loadBudynekTable();
}

// Załadowanie danych do tabeli
async function loadBudynekTable() {
  const tableBody = document.querySelector("#budynekTable tbody");
  tableBody.innerHTML = ""; // Wyczyść tabelę

  try {
    const response = await fetch(`${API_URL}/api/budynek`);
    const data = await response.json();
    console.log(data);

    data.forEach((budynek) => {
      const row = `
          <tr>
            <td>${budynek.symbol}</td>
            <td>${budynek.nazwa}</td>
            <td>${budynek.adres}</td>
            <td>
              <button onclick="editBudynek('${budynek.symbol}')">Edytuj</button>
              <button onclick="deleteBudynek('${budynek.symbol}')">Usuń</button>
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
async function showBudynekForm(budynek = null) {
  const formDiv = document.getElementById("budynekForm");
  formDiv.style.display = "block";

  formDiv.innerHTML = `
      <h2>${budynek ? "Edytuj" : "Dodaj"} Budynek</h2>
      <form id="budynekFormInner">
        <label>Symbol:</label>
        <input type="text" id="symbol" value="${budynek ? budynek.symbol : ''}" ${budynek ? 'readonly' : 'required'} />
        <label>Nazwa:</label>
        <input type="text" id="nazwa" value="${budynek ? budynek.nazwa : ''}" required />
        <label>Adres:</label>
        <input type="text" id="adres" value="${budynek ? budynek.adres : ''}" required />
        <button type="submit">${budynek ? "Zapisz" : "Dodaj"}</button>
        <button type="button" onclick="hideBudynekForm()">Anuluj</button>
      </form>
    `;

  document.getElementById("budynekFormInner").addEventListener("submit", async (event) => {
    event.preventDefault();
    const newData = {
      symbol: document.getElementById("symbol").value,
      nazwa: document.getElementById("nazwa").value,
      adres: document.getElementById("adres").value,
    };

    if (budynek) {
      await updateBudynek(budynek.symbol, newData);
    } else {
      await addBudynek(newData);
    }

    hideBudynekForm();
    await loadBudynekTable();
  });
}

// Ukrycie formularza
function hideBudynekForm() {
  const formDiv = document.getElementById("budynekForm");
  formDiv.style.display = "none";
}

// Dodanie nowego budynku
async function addBudynek(data) {
  try {
    const response = await fetch(`${API_URL}/api/budynek`, {
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

// Edycja budynku
async function editBudynek(symbol) {
  try {
    const response = await fetch(`${API_URL}/api/budynek/${symbol}`);
    const budynek = await response.json();
    showBudynekForm(budynek);
  } catch (error) {
    console.error("Błąd pobierania danych do edycji:", error);
  }
}

// Aktualizacja budynku
async function updateBudynek(symbol, data) {
  try {
    await fetch(`${API_URL}/api/budynek/${symbol}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  } catch (error) {
    console.error("Błąd aktualizacji:", error);
  }
}

// Usuwanie budynku
async function deleteBudynek(symbol) {
  if (confirm("Czy na pewno chcesz usunąć ten budynek?")) {
    try {
      const response = await fetch(`${API_URL}/api/budynek/${symbol}`, { method: "DELETE" });

      if (!response.ok) {
        const errorMessage = await response.text();
        alert(errorMessage); // Wyświetlenie komunikatu z backendu
      } else {
        alert("Budynek został pomyślnie usunięty.");
        await loadBudynekTable();
      }
    } catch (error) {
      console.error("Błąd usuwania:", error);
      alert("Wystąpił błąd podczas próby usunięcia budynku.");
    }
  }
}


initBudynekApp();
