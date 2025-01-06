// Główna funkcja inicjująca
async function initRecepcjonistaApp() {
    const content = document.getElementById("content");
    content.innerHTML = `
      <h1>Recepcjoniści</h1>
      <button id="addRecepcjonistaBtn">Dodaj Recepcjonistę</button>
      <table id="recepcjonistaTable">
        <thead>
          <tr>
            <th>Imię i Nazwisko</th>
            <th>Wykształcenie</th>
            <th>Akcje</th>
          </tr>
        </thead>
        <tbody></tbody>
      </table>
      <div id="recepcjonistaForm" style="display: none;"></div>
    `;
  
    document.getElementById("addRecepcjonistaBtn").addEventListener("click", () => showRecepcjonistaForm());
  
    await loadRecepcjonistaTable();
  }
  
  // Załadowanie danych do tabeli
  async function loadRecepcjonistaTable() {
    const tableBody = document.querySelector("#recepcjonistaTable tbody");
    tableBody.innerHTML = ""; // Wyczyść tabelę
  
    try {
      const response = await fetch(`${API_URL}/api/recepcjonista`);
      const data = await response.json();
      console.log(data);
  
      data.forEach((recepcjonista) => {
        const row = `
          <tr>
            <td>${recepcjonista.imie_nazwisko}</td>
            <td>${recepcjonista.wyksztalcenie || 'Brak danych'}</td>
            <td>
              <button onclick="editRecepcjonista(${recepcjonista.id_pracownika})">Edytuj</button>
              <button onclick="deleteRecepcjonista(${recepcjonista.id_pracownika})">Usuń</button>
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
async function showRecepcjonistaForm(recepcjonista = null) {
    const formDiv = document.getElementById("recepcjonistaForm");
    formDiv.style.display = "block";
  
    // Pobierz listę dostępnych pracowników
    const pracownicyResponse = await fetch(`${API_URL}/api/recepcjonista/dostepni-pracownicy`);
    const pracownicy = await pracownicyResponse.json();
  
    // Jeśli edytujemy, ustaw wybranego pracownika jako disabled
    const pracownicyOptions = pracownicy
      .map((p) => {
        if (recepcjonista && recepcjonista.id_pracownika == p.id_pracownika) {
          return `<option value="${p.id_pracownika}" selected>${p.imie} ${p.nazwisko}</option>`;
        }
        return `<option value="${p.id_pracownika}">${p.imie} ${p.nazwisko}</option>`;
      })
      .join("");
  
    formDiv.innerHTML = `
      <h2>${recepcjonista ? "Edytuj" : "Dodaj"} Recepcjonistę</h2>
      <form id="recepcjonistaFormInner">
        <label>Pracownik:</label>
        ${recepcjonista 
          ? `<input type="text" value="${recepcjonista.imie} ${recepcjonista.nazwisko}" disabled />
             <input type="hidden" id="id_pracownika" value="${recepcjonista.id_pracownika}" />`
          : `<select id="id_pracownika" required>
               <option value="" disabled selected>Wybierz pracownika</option>
               ${pracownicyOptions}
             </select>`}
        <label>Wykształcenie:</label>
        <input type="text" id="wyksztalcenie" value="${recepcjonista ? recepcjonista.wyksztalcenie || '' : ''}" />
        <button type="submit">${recepcjonista ? "Zapisz" : "Dodaj"}</button>
        <button type="button" onclick="hideRecepcjonistaForm()">Anuluj</button>
      </form>
    `;
  
    // Obsługa przesyłania formularza
    document.getElementById("recepcjonistaFormInner").addEventListener("submit", async (event) => {
      event.preventDefault();
      const newData = {
        id_pracownika: document.getElementById("id_pracownika").value,
        wyksztalcenie: document.getElementById("wyksztalcenie").value,
      };
  
      if (recepcjonista) {
        await updateRecepcjonista(recepcjonista.id_pracownika, newData);
      } else {
        await addRecepcjonista(newData);
      }
  
      hideRecepcjonistaForm();
      await loadRecepcjonistaTable();
    });
  }
  
  
  // Ukrycie formularza
  function hideRecepcjonistaForm() {
    const formDiv = document.getElementById("recepcjonistaForm");
    formDiv.style.display = "none";
  }
  
  // Dodanie nowego recepcjonisty
  async function addRecepcjonista(data) {
    try {
      const response = await fetch(`${API_URL}/api/recepcjonista`, {
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
  
  // Edycja recepcjonisty
  async function editRecepcjonista(id) {
    try {
      const response = await fetch(`${API_URL}/api/recepcjonista/${id}`);
      const recepcjonista = await response.json();
      console.log("Dane recepcjonisty:", recepcjonista); // Sprawdź dane
      showRecepcjonistaForm(recepcjonista);
    } catch (error) {
      console.error("Błąd pobierania danych do edycji:", error);
    }
  }
  
  // Aktualizacja recepcjonisty
  async function updateRecepcjonista(id, data) {
    try {
      await fetch(`${API_URL}/api/recepcjonista/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error("Błąd aktualizacji:", error);
    }
  }
  
  // Usuwanie recepcjonisty
  async function deleteRecepcjonista(id) {
    if (confirm("Czy na pewno chcesz usunąć tego recepcjonistę?")) {
      try {
        await fetch(`${API_URL}/api/recepcjonista/${id}`, { method: "DELETE" });
        await loadRecepcjonistaTable();
      } catch (error) {
        console.error("Błąd usuwania:", error);
      }
    }
  }
  
  initRecepcjonistaApp();
  
  