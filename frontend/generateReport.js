function generateReport() {
  const formContainer = document.createElement("div")
  formContainer.innerHTML = `
    <h1>Generowanie raportu</h1>
    <form id="report-form">
      <div>
        <label for="report-type">Wybierz typ raportu:</label>
        <select id="report-type" required>
          <option value="">Wybierz typ raportu</option>
          <option value="report1">Raport ilości wizyt w poszczególnych budynkach w podanym okresie</option>
          <option value="report2">Raport wizyt w podanym budynku w podanym przedziale czasowym</option>
          <option value="report3">Raport uczestników szkolenia</option>
        </select>
      </div>
      
      <div id="date-inputs" style="display: none;">
        <label for="start_date">Data początkowa:</label>
        <input type="date" id="start_date" name="start_date">
        
        <label for="end_date">Data końcowa:</label>
        <input type="date" id="end_date" name="end_date">
      </div>
      
      <div id="building-select" style="display: none;">
        <label for="buildings">Wybierz budynki:</label>
        <select id="buildings" multiple>

        </select>
      </div>

      <div id="szkolenie-select" style="display: none;">
        <label for="szkolenie">Wybierz szkolenie:</label>
        <select id="szkolenie" required>

        </select>

        <label for="role">Wybierz rolę:</label>
        <select id="role">
          <option value="">Wybierz rolę</option>
          <option value="Lekarz">Lekarz</option>
          <option value="Recepcjonista">Recepcjonista</option>
        </select>
      </div>
      
      <button type="submit" style="display: none;">Generuj raport</button>
    </form>
  `

  // Dodanie formularza do body
  document.body.appendChild(formContainer)

  const reportTypeSelect = document.getElementById("report-type")
  const dateInputs = document.getElementById("date-inputs")
  const buildingSelect = document.getElementById("building-select")
  const buildingsMultiSelect = document.getElementById("buildings")
  const szkolenieSelect = document.getElementById("szkolenie-select")
  const szkolenieDropdown = document.getElementById("szkolenie")
  const submitButton = document.querySelector('button[type="submit"]')

  reportTypeSelect.addEventListener("change", async function () {
    dateInputs.style.display = "none"
    buildingSelect.style.display = "none"
    szkolenieSelect.style.display = "none"
    submitButton.style.display = "block"

    if (this.value === "report1" || this.value === "report2") {
      dateInputs.style.display = "block"
    }

    if (this.value === "report2") {
      buildingSelect.style.display = "block"
      // Fetch buildings from API
      try {
        const response = await fetch(`${API_URL}/api/budynek`)
        if (response.ok) {
          const buildings = await response.json()
          buildingsMultiSelect.innerHTML = buildings
            .map((building) => `<option value="${building.symbol}">${building.nazwa}</option>`)
            .join("")

          // Enable multiple selection
          buildingsMultiSelect.setAttribute("multiple", "")
          buildingsMultiSelect.size = Math.min(5, buildings.length)
        } else {
          throw new Error("Failed to fetch buildings")
        }
      } catch (error) {
        console.error("Error fetching buildings:", error)
        alert("Nie udało się pobrać listy budynków")
      }
    } else if (this.value === "report3") {
      szkolenieSelect.style.display = "block"
      // Fetch szkolenia from API
      try {
        const response = await fetch(`${API_URL}/api/szkolenie`)
        if (response.ok) {
          const szkolenia = await response.json()
          szkolenieDropdown.innerHTML = szkolenia
            .map((szkolenie) => `<option value="${szkolenie.id_szkolenia}">${szkolenie.tytul}</option>`)
            .join("")
        } else {
          throw new Error("Failed to fetch szkolenia")
        }
      } catch (error) {
        console.error("Error fetching szkolenia:", error)
        alert("Nie udało się pobrać listy szkoleń")
      }
    }
  })

  // Obsługa zdarzenia submit na formularzu
  document.getElementById("report-form").addEventListener("submit", async (event) => {
    event.preventDefault()

    const reportType = reportTypeSelect.value

    if (!reportType) {
      alert("Proszę wybrać typ raportu")
      return
    }

    let url, body

    switch (reportType) {
      case "report1":
        const startDate1 = document.getElementById("start_date").value
        const endDate1 = document.getElementById("end_date").value
        if (!startDate1 || !endDate1) {
          alert("Proszę wypełnić daty")
          return
        }
        url = `${API_URL}/api/generate-report/report1`
        body = {
          start_date: `${startDate1}T00:00:00`,
          end_date: `${endDate1}T23:59:59`,
        }
        break
      case "report2":
        const startDate2 = document.getElementById("start_date").value
        const endDate2 = document.getElementById("end_date").value
        const selectedBuildings = Array.from(buildingsMultiSelect.selectedOptions).map((option) => option.value)
        if (!startDate2 || !endDate2 || selectedBuildings.length === 0) {
          alert("Proszę wypełnić wszystkie wymagane pola")
          return
        }
        url = `${API_URL}/api/generate-report/report2`
        body = {
          start_date: startDate2,
          end_date: endDate2,
          buildings: selectedBuildings,
        }
        break
      case "report3":
        const szkolenieId = szkolenieDropdown.value
        const role = document.getElementById("role").value
        if (!szkolenieId || !role) {
          alert("Proszę wybrać szkolenie i rolę")
          return
        }
        url = `${API_URL}/api/generate-report/report3`
        body = {
          id_szkolenia: szkolenieId,
          role: role,
        }
        break
      default:
        alert("Nieprawidłowy typ raportu")
        return
    }

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      })

      if (response.ok) {
        const blob = await response.blob()
        const link = document.createElement("a")
        link.href = URL.createObjectURL(blob)
        link.download = `raport_${reportType}_${new Date().toISOString()}.pdf`
        link.click()
      } else {
        const data = await response.json()
        alert("Błąd: " + (data.error || "Nie udało się wygenerować raportu"))
      }
    } catch (error) {
      console.error("Error generating report:", error)
      alert("Wystąpił błąd: " + error.message)
    }
  })
}

generateReport()

