// Добавляем "слушателя" событий, который сработает, когда вся структура HTML-документа (DOM) будет загружена и готова
document.addEventListener('DOMContentLoaded', () => {
    // Находим ключевые элементы на странице
    const competitorTableBody = document.querySelector('#competitor-table tbody'); // Тело таблицы для вывода данных
    const addCompetitorForm = document.getElementById('add-competitor-form'); // Форма для добавления новой записи
    const api_url = 'http://localhost:3000/api/competitors'; // URL нашего бэкенд API

    // Асинхронная функция для получения и отображения списка конкурентов
    const fetchAndDisplayCompetitors = async () => {
        try {
            // Отправляем GET-запрос на сервер для получения данных
            const response = await fetch(api_url);
            // Если ответ сервера не "ok" (например, статус 404 или 500), выбрасываем ошибку
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            // Преобразуем ответ сервера из формата JSON в JavaScript-объект
            const competitors = await response.json();

            // Полностью очищаем текущее содержимое тела таблицы
            competitorTableBody.innerHTML = '';

            // Проходимся по каждому элементу в полученном массиве конкурентов
            competitors.forEach(c => {
                // Создаем новый элемент строки таблицы (<tr>)
                const row = document.createElement('tr');
                // Заполняем строку HTML-разметкой с данными о конкуренте
                row.innerHTML = `
                    <td>${c.RegNumber}</td>
                    <td>${c.CompanyName}</td>
                    <td>${c.RegistrationDate}</td>
                    <td>${c.Status}</td>
                `;
                // Добавляем созданную строку в тело таблицы
                competitorTableBody.appendChild(row);
            });

        } catch (error) {
            // Если на любом этапе произошла ошибка (например, сервер недоступен)
            console.error("Fetch error: ", error); // Выводим ошибку в консоль
            // Отображаем сообщение об ошибке прямо в таблице
            competitorTableBody.innerHTML = `<tr><td colspan="3">Error loading data. Is the server running?</td></tr>`;
        }
    };

    // Добавляем "слушателя" на событие отправки формы
    addCompetitorForm.addEventListener('submit', async (event) => {
        // Предотвращаем стандартное поведение формы (которое привело бы к перезагрузке страницы)
        event.preventDefault();

        // Находим поля ввода в форме
        const companyNameInput = document.getElementById('companyName');
        const registrationDateInput = document.getElementById('registrationDate');
        const statusInput = document.getElementById('status');

        // Создаем объект с данными из полей ввода
        const newCompetitor = {
            companyName: companyNameInput.value,
            registrationDate: registrationDateInput.value,
            status: statusInput.value
        };

        try {
            // Отправляем POST-запрос на сервер для добавления новой записи
            const response = await fetch(api_url, {
                method: 'POST', // Указываем метод запроса
                headers: {
                    'Content-Type': 'application/json', // Сообщаем серверу, что отправляем данные в формате JSON
                },
                body: JSON.stringify(newCompetitor), // Преобразуем наш объект в JSON-строку
            });

            // Если ответ сервера не "ok", выбрасываем ошибку
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // Очищаем поля ввода в форме после успешной отправки
            companyNameInput.value = '';
            registrationDateInput.value = '';
            statusInput.value = '';

            // Вызываем функцию для обновления списка на странице
            fetchAndDisplayCompetitors();

        } catch (error) {
            // Если произошла ошибка при отправке
            console.error("Submit error: ", error); // Выводим ошибку в консоль
            alert('Failed to add competitor. See console for details.'); // Показываем пользователю уведомление об ошибке
        }
    });

    // Вызываем функцию получения и отображения данных в первый раз при загрузке страницы
    fetchAndDisplayCompetitors();
});
