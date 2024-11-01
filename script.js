
// State Management
const state = {
  apps: JSON.parse(localStorage.getItem("apps") || "[]").map(app => ({
    name: app.name,
    script_path: app.script_path,
    environment_path: app.environment_path,
    status: app.status || "stopped" ,// Default to "stopped" if status is missing
    port_number: app.port_number // Default to null if port_number is missing
  })),
  logs: JSON.parse(localStorage.getItem("logs") || "[]"),
};

// Initialize Bootstrap components
const appModal = new bootstrap.Modal(document.getElementById("appModal"));

// Utility Functions
function saveState() {
localStorage.setItem("apps", JSON.stringify(state.apps));
localStorage.setItem("logs", JSON.stringify(state.logs));
}


function showConfirmation(message, onConfirm) {
const confirmationMessage = document.getElementById("confirmationMessage");
confirmationMessage.textContent = message;

const confirmButton = document.getElementById("confirmAction");

// Remove any existing click event listener to avoid duplicate actions
confirmButton.replaceWith(confirmButton.cloneNode(true));

document.getElementById("confirmAction").addEventListener("click", () => {
  onConfirm(); // Execute the callback function if confirmed
  const confirmationModal = bootstrap.Modal.getInstance(document.getElementById("confirmationModal"));
  confirmationModal.hide();
});

// Show the confirmation modal
const confirmationModal = new bootstrap.Modal(document.getElementById("confirmationModal"));
confirmationModal.show();
}

function showToast(message, type = "success") {
const toastContainer = document.querySelector(".toast-container");
const toastEl = document.createElement("div");
toastEl.className = `toast align-items-center text-white bg-${type} border-0`;
toastEl.innerHTML = `
              <div class="d-flex">
                  <div class="toast-body">
                      <i class="bi bi-${
                        type === "success"
                          ? "check-circle"
                          : "exclamation-circle"
                      }"></i>
                      ${message}
                  </div>
                  <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
              </div>
          `;
toastContainer.appendChild(toastEl);
const toast = new bootstrap.Toast(toastEl);
toast.show();
toastEl.addEventListener("hidden.bs.toast", () => toastEl.remove());
}

function addLog(message, type = "info") {
const log = {
  id: Date.now(),
  message,
  type,
  timestamp: new Date().toISOString(),
};
state.logs.unshift(log);
if (state.logs.length > 100)
  {state.logs.pop();} 
saveState();
renderLogs();
}
document.getElementById('themeToggle').addEventListener('change', (e) => {
document.documentElement.setAttribute('data-bs-theme', e.target.checked ? 'dark' : 'light');
localStorage.setItem('theme', e.target.checked ? 'dark' : 'light');
renderApps();
});

// Render Functions
function renderApps() {
  const container = document.getElementById("appsContainer");
  const runningApps = state.apps.filter((app) => app.status === "running");
  document.getElementById("runningCount").textContent = runningApps.length;
  const isDarkMode = document.documentElement.getAttribute("data-bs-theme") === "dark";
const iconColorClass = isDarkMode ? "text-light" : "text-dark";
  if (state.apps.length === 0) {
      container.innerHTML = `
          <div class="text-center py-5 text-muted">
              <i class="bi bi-inbox fs-1"></i>
              <p class="mt-2">No applications added yet</p>
          </div>
      `;
      return;
  }

  container.innerHTML = state.apps
      .map(
          (app) => `
              <div class="app-card card mb-3 border-0 shadow-sm">
                  <div class="card-body">
                      <div class="d-flex justify-content-between align-items-start mb-3">
                          <div>
                              <h5 class="card-title mb-1">
                                  <span class="status-dot bg-${app.status === "running" ? "success" : "danger"}"></span>
                                  ${app.name} 
                                  <span class="badge bg-${app.status === "running" ? "success" : "danger"} ms-2">${app.status}</span>
                                  ${app.status === "running" ? `<span class="badge bg-info ms-2">Port: ${app.port_number}</span>` : ''}
                              </h5>
                              <div class="path-text"><i class="bi bi-file-earmark-code"></i> ${app.script_path}</div>
                              <div class="path-text"><i class="bi bi-folder"></i> ${app.environment_path}</div>
                          </div>
                          <div class="dropdown ">
                              <button class="btn btn-link ${iconColorClass}" data-bs-toggle="dropdown">
                                  <i class="bi bi-three-dots-vertical"></i>
                              </button>
                              <ul class="dropdown-menu shadow">
                                  <li>
                                      <a class="dropdown-item" href="#" onclick="window.editApp('${app.name}')">
                                          <i class="bi bi-pencil"></i> Edit
                                      </a>
                                  </li>
                                  <li>
                                      <a class="dropdown-item text-danger" href="#" onclick="window.deleteApp('${app.name}')">
                                          <i class="bi bi-trash"></i> Remove
                                      </a>
                                  </li>
                              </ul>
                          </div>
                      </div>
                      <button class="btn btn-${app.status === "running" ? "danger" : "success"} btn-sm" 
                              onclick="window.toggleApp('${app.name}')"
                              data-app="${app.name}">
                          <i class="bi bi-${app.status === "running" ? "stop-fill" : "play-fill"}"></i>
                          ${app.status === "running" ? "Stop" : "Start"}
                      </button>
                  </div>
              </div>
          `
      )
      .join("");
}

// document.getElementById('themeToggle').addEventListener('change', (e) => {
//   document.documentElement.setAttribute('data-bs-theme', e.target.checked ? 'dark' : 'light');
//   localStorage.setItem('theme', e.target.checked ? 'dark' : 'light');
// });
// const themeToggle = document.getElementById("themeToggle");

// // Set the initial theme on page load
// document.documentElement.setAttribute("data-bs-theme", localStorage.getItem("theme") || "light");

// themeToggle.addEventListener("change", (e) => {
//     const theme = e.target.checked ? "dark" : "light";
//     document.documentElement.setAttribute("data-bs-theme", theme);
//     localStorage.setItem("theme", theme);
// });

// // Call renderApps to apply any new theme classes immediately after toggling
// themeToggle.addEventListener("change", () => renderApps());

function renderLogs() {
const container = document.getElementById("logsContainer");
container.innerHTML = state.logs.length
  ? state.logs
      .map(
        (log) => `
              <div class="border-bottom px-3 py-2">
                  <div class="text-${log.type} small">
                      <i class="bi bi-${
                        log.type === "error"
                          ? "exclamation-circle"
                          : "info-circle"
                      }"></i>
                      ${log.message}
                  </div>
                  <div class="text-muted" style="font-size: 0.75rem;">
                      ${new Date(log.timestamp).toLocaleString()}
                  </div>
              </div>
          `
      )
      .join("")
  : `
              <div class="text-center py-4 text-muted">
                  <i class="bi bi-clock-history"></i> No activity logs
              </div>
          `;
}
// Port Status
document.getElementById('checkPort').addEventListener('click', async () => {
  const checkPortInput = document.getElementById('checkPortInput');
  const port = parseInt(checkPortInput.value);
  const statusDiv = document.getElementById('portStatus');

  if (!port || port < 1 || port > 65535) {
      showToast('Please enter a valid port number (1-65535)', 'danger');
      return;
  }

  statusDiv.innerHTML = `
      <div class="text-center py-3">
          <div class="spinner-border text-primary"></div>
      </div>
  `;

  try {
      // Call the updated endpoint
      const response = await fetch(`http://127.0.0.1:5001/check_specific_port?port=${port}`);
      
      if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to check port');
      }

      const result = await response.json();
      const status = result[port]; // Access the returned status for the specific port
      
      // Update the status display
      statusDiv.innerHTML = `
          <div class="alert alert-${status[1] === 'occupied' ? 'danger' : 'success'}">
              <h6>Port ${port}</h6>
              ${status[1] === 'occupied' ? `In use by: ${status[2] || 'Unknown Process'}` : 'Available'}
          </div>
      `;
  } catch (err) {
      statusDiv.innerHTML = `
          <div class="alert alert-danger">
              Failed to check port: ${err.message}
          </div>
      `;
  }
});


// Event Handlers
// Event Handlers
window.toggleApp = async (appName) => {
  const app = state.apps.find((a) => a.name === appName);
  const btn = document.querySelector(`button[data-app="${appName}"]`);
  const action = app.status === "running" ? "stop" : "start";

  try {
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';

    // Prepare the request body with all necessary properties
    const requestBody = {
      app_name: appName,
      script_path: app.script_path, // Include the script path
      environment_path: app.environment_path, // Include the environment path
      port_number: app.port_number // Include the port number
    };

    // Make the actual API call
    const response = await fetch(`http://127.0.0.1:5001/${action}_app`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Something went wrong");
    }

    // Update the app status based on the response
    app.status = action === "start" ? "running" : "stopped";
    saveState();
    renderApps();
    addLog(`${appName} ${action}ed successfully`);
    showToast(`${appName} ${action}ed successfully`);
  } catch (error) {
    showToast(`Failed to ${action} ${appName}: ${error.message}`, "danger");
    addLog(`Failed to ${action} ${appName}: ${error.message}`, "error");
  } finally {
    btn.disabled = false; // Re-enable the button
    btn.innerHTML = action === "start" ? 'Start' : 'Stop'; // Update button text
  }
};


window.editApp = (appName) => {
  const app = state.apps.find((a) => a.name === appName);
  document.getElementById("editMode").value = "edit";
  document.getElementById("modalTitle").textContent = "Edit Application";
  document.getElementById("appName").value = app.name;
  document.getElementById("scriptPath").value = app.script_path; // Use script_path from app
  document.getElementById("envPath").value = app.environment_path; // Use environment_path from app
  document.getElementById("portInput").value = app.port_number; // Populate the port number
  appModal.show();
};

window.saveApp = () => {
  const appName = document.getElementById("appName").value;
  const scriptPath = document.getElementById("scriptPath").value;
  const envPath = document.getElementById("envPath").value;
  const portNumber = document.getElementById("portInput").value; // Get the port number

  if (document.getElementById("editMode").value === "edit") {
    const appIndex = state.apps.findIndex((app) => app.name === appName);
    state.apps[appIndex] = {
      ...state.apps[appIndex],
      script_path: scriptPath,
      environment_path: envPath,
      port_number: portNumber // Update the port number
    };
    addLog(`Updated app: ${appName}`);
    showToast(`${appName} updated successfully`);
  } else {
    state.apps.push({
      name: appName,
      script_path: scriptPath,
      environment_path: envPath,
      status: "stopped",
      port_number: portNumber // Set the new port number
    });
    addLog(`Added new app: ${appName}`);
    showToast(`${appName} added successfully`);
  }

  saveState();
  renderApps();
  appModal.hide();
};

window.deleteApp = (appName) => {
  showConfirmation(`Are you sure you want to remove ${appName}?`, () => {
    state.apps = state.apps.filter((app) => app.name !== appName);
    saveState();
    renderApps();
    addLog(`Removed app: ${appName}`);
    showToast(`${appName} removed successfully`);
  });
};

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  renderApps();
  renderLogs();

  document.getElementById("addAppBtn").addEventListener("click", () => {
    document.getElementById("editMode").value = "add";
    document.getElementById("modalTitle").textContent = "Add Application";
    document.getElementById("appForm").reset();
    appModal.show();
  });

  document.getElementById("saveApp").addEventListener("click", () => {
    const name = document.getElementById("appName").value.trim();
    const scriptPath = document.getElementById("scriptPath").value.trim();
    const envPath = document.getElementById("envPath").value.trim();
    const portNumber = document.getElementById("portInput").value.trim(); // Get the port number
    const editMode = document.getElementById("editMode").value;

    if (!name || !scriptPath || !envPath || !portNumber) {
      showToast("Please fill all required fields", "danger");
      return;
    }

    if (editMode === "add" && state.apps.some((app) => app.name === name)) {
      showToast("An app with this name already exists", "danger");
      return;
    }

    if (editMode === "add") {
      state.apps.push({
        name,
        script_path: scriptPath,
        environment_path: envPath,
        port_number: portNumber, // Set the port number
        status: "stopped",
      });
      addLog(`Added new app: ${name}`);
    } else {
      const app = state.apps.find((a) => a.name === name);
      app.script_path = scriptPath; // Update script_path
      app.environment_path = envPath; // Update environment_path
      app.port_number = portNumber; // Update the port number
      addLog(`Updated app: ${name}`);
    }

    saveState();
    renderApps();
    appModal.hide();
    showToast(
      `Application ${editMode === "add" ? "added" : "updated"} successfully`
    );
  });

  document.getElementById("clearLogs").addEventListener("click", () => {
    showConfirmation("Clear all logs?", () => {
      state.logs = [];
      saveState();
      renderLogs();
      showToast("Logs cleared successfully");
    });
  });
  
});