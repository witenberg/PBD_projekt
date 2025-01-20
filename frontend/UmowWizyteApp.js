// Główna funkcja inicjująca
async function initUmowWizyteApp() {
  const content = document.getElementById("content");
  content.innerHTML = `
    <h1>Umów Wizytę</h1>
    <div id="doctorList"></div>
    <div id="calendar" style="display: none;"></div>
    <div id="roomSelection" style="display: none;"></div>
    <div id="patientForm" style="display: none;"></div>
  `;
  await loadDoctorList();
}

// Załadowanie listy lekarzy
async function loadDoctorList() {
  try {
    const response = await fetch(`${API_URL}/api/umow-wizyte/lekarze`);
    const doctors = await response.json();
    const doctorList = document.getElementById("doctorList");
    doctorList.innerHTML = "<h2>Wybierz lekarza:</h2>";
    const doctorGrid = document.createElement("div");
    doctorGrid.className = "doctor-grid";
    doctors.forEach(doctor => {
      const doctorCard = document.createElement("div");
      doctorCard.className = "doctor-card";
      doctorCard.innerHTML = `
        <h3>${doctor.imie} ${doctor.nazwisko}</h3>
        <p>Specjalizacja: ${doctor.specjalizacja}</p>
        <button onclick="selectDoctor(${doctor.id_lekarza})">Wybierz</button>
      `;
      doctorGrid.appendChild(doctorCard);
    });
    doctorList.appendChild(doctorGrid);
  } catch (error) {
    console.error("Błąd ładowania listy lekarzy:", error);
  }
}

// Wybór lekarza i wyświetlenie kalendarza
async function selectDoctor(doctorId) {
  try {
    const response = await fetch(`${API_URL}/api/umow-wizyte/dostepne-terminy/${doctorId}`);
    const availableDates = await response.json();
    const calendar = document.getElementById("calendar");
    calendar.style.display = "block";
    calendar.innerHTML = "<h2>Wybierz termin wizyty:</h2>";

    const groupedDates = groupDatesByWeek(availableDates);
    globalGroupedDates = groupedDates;
    displayCalendar(globalGroupedDates, doctorId, 0);
  } catch (error) {
    console.error("Błąd ładowania dostępnych terminów:", error);
  }
}

// Grupowanie dat według tygodni
function groupDatesByWeek(dates) {
  const weeks = {};
  dates.forEach(date => {
    const d = new Date(date);
    const weekStart = new Date(d.setDate(d.getDate() - d.getDay()));
    const weekKey = weekStart.toISOString().split('T')[0];
    if (!weeks[weekKey]) {
      weeks[weekKey] = [];
    }
    weeks[weekKey].push(date);
  });
  return weeks;
}

// Wyświetlanie kalendarza
function displayCalendar(groupedDates, doctorId, weekOffset) {
  const calendar = document.getElementById("calendar");
  const weeks = Object.keys(groupedDates);
  const currentWeek = weeks[weekOffset];

  if (!currentWeek) {
    calendar.innerHTML += "<p>Brak dostępnych terminów w tym tygodniu.</p>";
    return;
  }

  const weekDates = groupedDates[currentWeek];
  const hours = Array.from({length: 10}, (_, i) => i + 8);

  const table = document.createElement("table");
  table.style.borderCollapse = "collapse";

  const headerRow = document.createElement("tr");
  headerRow.innerHTML = "<th>Godzina</th>";
  for (let i = 1; i < 7; i++) {
    const date = new Date(currentWeek);
    date.setDate(date.getDate() + i);
    headerRow.innerHTML += `<th>${date.toLocaleDateString('pl-PL', { weekday: 'short', month: 'numeric', day: 'numeric' })}</th>`;
  }
  table.appendChild(headerRow);

  hours.forEach(hour => {
    const row = document.createElement("tr");
    row.innerHTML = `<td>${hour}:00</td>`;

    for (let i = 1; i < 7; i++) {
      const date = new Date(currentWeek);
      date.setDate(date.getDate() + i);
      const cellTime = new Date(date.setHours(hour, 0, 0, 0));
      const isAvailable = weekDates.some(time => new Date(time).getTime() === cellTime.getTime());

      if (isAvailable) {
        row.innerHTML += `<td><button onclick="selectDate(${doctorId}, '${cellTime.toISOString()}')">Dostępny</button></td>`;
      } else {
        row.innerHTML += '<td style="background-color: #f0f0f0;">-</td>';
      }
    }

    table.appendChild(row);
  });

  calendar.innerHTML = `
    <h2>Wybierz termin wizyty:</h2>
    <div>
      <button onclick="displayCalendar(globalGroupedDates, ${doctorId}, ${weekOffset - 1})" ${weekOffset === 0 ? 'disabled' : ''}>Poprzedni tydzień</button>
      <button onclick="displayCalendar(globalGroupedDates, ${doctorId}, ${weekOffset + 1})" ${weekOffset === weeks.length - 1 ? 'disabled' : ''}>Następny tydzień</button>
    </div>
  `;
  calendar.appendChild(table);
}

// Wybór daty i wyświetlenie dostępnych gabinetów
async function selectDate(doctorId, date) {
  try {
    const response = await fetch(`${API_URL}/api/umow-wizyte/dostepne-gabinety`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ doctorId, date }),
    });
    const availableRooms = await response.json();
    const roomSelection = document.getElementById("roomSelection");
    roomSelection.style.display = "block";
    roomSelection.innerHTML = "<h2>Wybierz gabinet:</h2>";

    const groupedRooms = availableRooms.reduce((acc, room) => {
      if (!acc[room.budynek_nazwa]) {
        acc[room.budynek_nazwa] = [];
      }
      acc[room.budynek_nazwa].push(room);
      return acc;
    }, {});

    Object.entries(groupedRooms).forEach(([buildingName, rooms]) => {
      const buildingSection = document.createElement("div");
      buildingSection.className = "building-section";
      buildingSection.innerHTML = `<h3>Budynek: ${buildingName}</h3>`;
      const roomGrid = document.createElement("div");
      roomGrid.className = "room-grid";
      rooms.forEach(room => {
        const roomButton = document.createElement("button");
        roomButton.className = "room-button";
        roomButton.textContent = `Gabinet ${room.numer}`;
        roomButton.onclick = () => showPatientForm(doctorId, date, room.numer, room.budynek_symbol);
        roomGrid.appendChild(roomButton);
      });
      buildingSection.appendChild(roomGrid);
      roomSelection.appendChild(buildingSection);
    });
  } catch (error) {
    console.error("Błąd ładowania dostępnych gabinetów:", error);
  }
}

// Wyświetlenie formularza pacjenta
function showPatientForm(doctorId, date, roomNumber, building) {
  const patientForm = document.getElementById("patientForm");
  patientForm.style.display = "block";
  patientForm.innerHTML = `
    <h2>Dane pacjenta:</h2>
    <form id="appointmentForm">
      <input type="text" id="imie" placeholder="Imię" required>
      <input type="text" id="nazwisko" placeholder="Nazwisko" required>
      <button type="submit">Umów wizytę</button>
    </form>
  `;
  patientForm.querySelector("form").onsubmit = (e) => {
    e.preventDefault();
    bookAppointment(doctorId, date, roomNumber, building);
  };
}

// Rezerwacja wizyty
async function bookAppointment(doctorId, date, roomNumber, buildingSymbol) {
  const imie = document.getElementById("imie").value;
  const nazwisko = document.getElementById("nazwisko").value;
  try {
    const response = await fetch(`${API_URL}/api/umow-wizyte`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        doctorId,
        date,
        roomNumber,
        building: buildingSymbol,
        imie,
        nazwisko,
      }),
    });
    const result = await response.json();
    if (response.ok) {
      alert("Wizyta została umówiona pomyślnie!");
      initUmowWizyteApp(); // Restart aplikacji
    } else {
      alert(`Błąd: ${result.message}`);
    }
  } catch (error) {
    console.error("Błąd rezerwacji wizyty:", error);
    alert("Wystąpił błąd podczas rezerwacji wizyty.");
  }
}

initUmowWizyteApp();

