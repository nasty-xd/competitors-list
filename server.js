// Импортируем необходимые модули
const express = require('express'); // Фреймворк для создания веб-сервера
const fs = require('fs'); // Модуль для работы с файловой системой (чтение/запись файлов)
const path = require('path'); // Модуль для работы с путями к файлам
const cors = require('cors'); // Middleware для обработки CORS (Cross-Origin Resource Sharing)
const crypto = require('crypto'); // Модуль для криптографических функций, используется для генерации ID

// Создаем экземпляр приложения Express
const app = express();
// Определяем порт, на котором будет работать сервер
const PORT = 3000;
// Составляем абсолютный путь к файлу с данными
const CSV_PATH = path.join(__dirname, 'Data', 'competitors.csv');

// --- Middleware (Промежуточное ПО) ---
// Используем CORS, чтобы разрешить запросы с других доменов (например, с нашего фронтенда)
app.use(cors());
// Middleware для разбора JSON-тела входящих запросов
app.use(express.json());
// Middleware для раздачи статических файлов (HTML, CSS, JS) из папки 'public'
app.use(express.static('public'));

// Функция для парсинга (разбора) данных из формата CSV
const parseCSV = (data) => {
    // Преобразуем данные в строку, убираем пробелы по краям, делим на строки по символу новой строки и фильтруем пустые строки
    const lines = data.toString().trim().split('\n').filter(line => line.trim() !== '');
    // Если строк меньше двух (заголовок + данные), возвращаем пустой массив
    if (lines.length < 2) return [];
    // Первая строка - это заголовки. Делим ее по запятым и убираем пробелы у каждого заголовка
    const headers = lines[0].split(',').map(h => h.trim());
    // Обрабатываем остальные строки (данные)
    return lines.slice(1).map(line => {
        // Делим строку с данными по запятым
        const values = line.split(',').map(v => v.trim());
        // Если количество значений не совпадает с количеством заголовков, строка некорректна, возвращаем null
        if (values.length !== headers.length) return null;
        // Создаем объект для текущей строки
        let obj = {};
        // Заполняем объект: каждому заголовку сопоставляем соответствующее значение
        headers.forEach((header, index) => {
            obj[header] = values[index];
        });
        return obj;
    }).filter(Boolean); // Фильтруем все null значения, которые могли появиться из-за некорректных строк
};

// --- API Endpoints (Точки доступа API) ---

// Endpoint для получения списка всех конкурентов (метод GET)
app.get('/api/competitors', (req, res) => {
    // Проверяем, существует ли файл CSV
    if (!fs.existsSync(CSV_PATH)) {
        return res.status(404).json({ message: 'Competitors file not found.' });
    }
    // Читаем файл в кодировке utf8
    fs.readFile(CSV_PATH, 'utf8', (err, data) => {
        // Если произошла ошибка при чтении, отправляем ошибку 500
        if (err) {
            return res.status(500).json({ message: 'Error reading competitors file.' });
        }
        // Парсим CSV данные
        const competitors = parseCSV(data);
        // Отправляем данные в формате JSON
        res.json(competitors);
    });
});

// Endpoint для добавления нового конкурента (метод POST)
app.post('/api/competitors', (req, res) => {
    // Извлекаем данные из тела запроса
    const { companyName, registrationDate, status } = req.body;

    // Проверяем, были ли предоставлены все необходимые данные
    if (!companyName || !registrationDate || !status) {
        return res.status(400).json({ message: 'Company name and registration date are required.' });
    }

    // Создаем объект нового конкурента с уникальным RegNumber
    const newCompetitor = {
        RegNumber: `REG-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
        CompanyName: companyName,
        RegistrationDate: registrationDate,
        Status: status
    };

    // Формируем строку для добавления в CSV файл
    const csvLine = `\n${newCompetitor.RegNumber},${newCompetitor.CompanyName},${newCompetitor.RegistrationDate},${newCompetitor.Status}`;

    // Добавляем новую строку в конец файла
    fs.appendFile(CSV_PATH, csvLine, 'utf8', (err) => {
        // Если произошла ошибка при записи, отправляем ошибку 500
        if (err) {
            return res.status(500).json({ message: 'Error saving new competitor.' });
        }
        // Отправляем успешный статус 201 (Created) и данные нового конкурента
        res.status(201).json(newCompetitor);
    });
});

// Главный endpoint, который отдает HTML-страницу приложения
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Запускаем сервер и начинаем прослушивать указанный порт
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
