// Add an event listener that will trigger when the entire HTML document structure (DOM) has been loaded and is ready.
document.addEventListener('DOMContentLoaded', () => {
    // Finding the key elements on the page.
    const competitorTableBody = document.querySelector('#competitor-table tbody'); // Тело таблицы для вывода данных
    const addCompetitorForm = document.getElementById('add-competitor-form'); // Форма для добавления новой записи
    const api_url = 'http://localhost:3000/api/competitors'; // URL нашего бэкенд API

    // An asynchronous function for fetching and displaying the list of competitors.
    const fetchAndDisplayCompetitors = async () => {
        try {
            // Send a GET request to the server to fetch the data.
            const response = await fetch(api_url);
            // If the server response is not "ok" (for example, status 404 or 500), throw an error.
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            // Convert the server response from JSON format into a JavaScript object.
            const competitors = await response.json();

            // Completely clear the current contents of the table body.
            competitorTableBody.innerHTML = '';

            // Iterate over each item in the received array of competitors.
            competitors.forEach(c => {
                // Create a new table row element (<tr>).
                const row = document.createElement('tr');
                // Fill the row with HTML markup containing the competitor's data.
                row.innerHTML = `
                    <td>${c.RegNumber}</td>
                    <td>${c.CompanyName}</td>
                    <td>${c.RegistrationDate}</td>
                    <td>${c.Status}</td>
                `;
                // Add the created row to the table body.
                competitorTableBody.appendChild(row);
            });

        } catch (error) {
            // If an error occurs at any stage (for example, the server is unavailable)
            console.error("Fetch error: ", error); // Выводим ошибку в консоль
            // Display the error message directly in the table.
            competitorTableBody.innerHTML = `<tr><td colspan="3">Error loading data. Is the server running?</td></tr>`;
        }
    };

    // Add a listener for the form submission event.
    addCompetitorForm.addEventListener('submit', async (event) => {
        // Prevent the form's default behavior (which would cause the page to reload).
        event.preventDefault();

        // Locate the input fields in the form.
        const companyNameInput = document.getElementById('companyName');
        const registrationDateInput = document.getElementById('registrationDate');
        const statusInput = document.getElementById('status');

        // Create an object with data from the input fields.
        const newCompetitor = {
            companyName: companyNameInput.value,
            registrationDate: registrationDateInput.value,
            status: statusInput.value
        };

        try {
            // Send a POST request to the server to add a new record.
            const response = await fetch(api_url, {
                method: 'POST', // Specify the request method.
                headers: {
                    'Content-Type': 'application/json', // Inform the server that the data is being sent in JSON format.
                },
                body: JSON.stringify(newCompetitor), // Convert our object into a JSON string.
            });

            // If the server response is not "ok", throw an error.
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // Clear the input fields in the form after a successful submission.
            companyNameInput.value = '';
            registrationDateInput.value = '';
            statusInput.value = '';

            // Call the function to refresh the list on the page.
            fetchAndDisplayCompetitors();

        } catch (error) {
            // If an error occurs during submission
            console.error("Submit error: ", error); // Log the error to the console.
            alert('Failed to add competitor. See console for details.'); // Show an error notification to the user.
        }
    });

    // Call the function to fetch and display data for the first time when the page loads.
    fetchAndDisplayCompetitors();
});
