const statusElement = document.querySelector("#api-status");

async function checkApi() {
    try {
        const response = await fetch("/api/health");

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        statusElement.textContent =
            `API: ${data.status} | Database: ${data.database}`;
    } catch (error) {
        statusElement.textContent =
            `Không kết nối được API: ${error.message}`;
    }
}

checkApi();
