import { chart1, chart2, chart3, chart4, chart5, chart6 } from "./login.js";

const login = document.getElementById("login");
const dropdown = document.getElementById("dropdown");

let usecases = []; // Global variable to store the server response

async function fetchUserProfile() {
  const resp = await fetch("/api/auth/profile");
  if (!resp.ok) throw new Error("Failed to fetch user profile");
  return await resp.json();
}

async function fetchContexts() {
  const resp = await fetch("/api/contract");
  if (!resp.ok) throw new Error("Failed to fetch dropdown data");
  return await resp.json();
}

// Function to update charts with new data
function updateCharts(usecases) {
  chart1(document.getElementById("myChart1"), usecases[0].result);
  chart2(document.getElementById("myChart2"), usecases[1].result);
  chart3(document.getElementById("myChart3"), usecases[2].result);
  chart4(document.getElementById("myChart4"), usecases[3].result);
  chart5(document.getElementById("myChart5"), usecases[4].result);
  chart6(document.getElementById("myChart6"), usecases[5].result);
}

// Function to initialize charts after getting the context data
async function initializeCharts(usecases) {
  if (usecases) {
    updateCharts(usecases); // Update the charts with the new usecase1 data
  } else {
    console.log("No data to update charts.");
  }
}

async function initialize() {
  try {
    const resp = await fetch("/api/auth/profile");
    if (resp.ok) {
      const user = await resp.json();
      login.innerText = `Logout (${user.name})`;
      login.onclick = () => {
        const iframe = document.createElement("iframe");
        iframe.style.visibility = "hidden";
        iframe.src = "https://accounts.autodesk.com/Authentication/LogOut";
        document.body.appendChild(iframe);
        iframe.onload = () => {
          window.location.replace("/api/auth/logout");
          document.body.removeChild(iframe);
        };
      };
    } else {
      login.innerText = "Login";
      login.onclick = () => window.location.replace("/api/auth/login");
    }

    // Make sure login button is visible
    login.style.visibility = "visible";

    // Initialize dropdown
    const data = await fetchContexts();
    dropdown.innerHTML =
      '<option value="" disabled selected>Select a Contract Number</option>';
    data.forEach((item) => {
      const option = document.createElement("option");
      option.value = item.contractNumber;
      option.textContent = item.contractNumber;
      dropdown.appendChild(option);
    });

    dropdown.addEventListener("change", async () => {
      const selectedValue = dropdown.value;
      console.log("Selected Value:", selectedValue);
      alert(`You selected: ${selectedValue}`);

      // Send the selected contextId to the server
      const response = await fetch("/api/submit-dropdown", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ selectedValue: selectedValue }),
      });

      if (response.ok) {
        const data = await response.json();
        usecases = data; // Store the received data in the usecase1 variable

        console.log("Server Response:", data);
        // Initialize charts only after receiving the usecase1 data

        initializeCharts(usecases);
      } else {
        console.error("Error fetching data from server");
      }
    });
  } catch (err) {
    console.error("Error during initialization:", err);
    alert(
      "Could not initialize the application. See console for more details."
    );
  }
}

// Initialize the application
initialize();
