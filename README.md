# UHS - Personal Expense Tracker

A full-stack application for tracking personal expenses, built with React (TypeScript) and Java Spring Boot.

## Project Structure

```
UHS/
├── backend/          # Java Spring Boot backend
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/uhs/
│   │   │   └── resources/
│   │   └── test/
│   └── pom.xml
├── frontend/         # React TypeScript frontend
│   ├── src/
│   │   ├── components/
│   │   ├── services/
│   │   ├── types/
│   │   └── test/
│   └── package.json
└── README.md
```

## Features

- ✅ Create, read, update, and delete expenses
- ✅ Expense categories (Food, Transport, Shopping, Bills, Entertainment, Other)
- ✅ Date tracking for expenses
- ✅ RESTful API communication
- ✅ Unit tests for both frontend and backend
- ✅ Modern, responsive UI

## Prerequisites

- Java 17 or higher
- Maven 3.6+
- Node.js 18+ and npm/yarn
- Your preferred IDE (IntelliJ IDEA, VS Code, etc.)

## Getting Started

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Build and run the application:
   ```bash
   mvn spring-boot:run
   ```

   The backend will start on `http://localhost:8080`

3. Run tests:
   ```bash
   mvn test
   ```

4. Access H2 Console (for database inspection):
   - URL: `http://localhost:8080/h2-console`
   - JDBC URL: `jdbc:h2:mem:uhsdb`
   - Username: `sa`
   - Password: (leave empty)

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

   The frontend will start on `http://localhost:5173`

4. Run tests:
   ```bash
   npm test
   ```

5. Build for production:
   ```bash
   npm run build
   ```

## API Endpoints

The backend provides the following REST API endpoints:

- `GET /api/expenses` - Get all expenses
- `GET /api/expenses/{id}` - Get expense by ID
- `POST /api/expenses` - Create a new expense
- `PUT /api/expenses/{id}` - Update an existing expense
- `DELETE /api/expenses/{id}` - Delete an expense

### Example Request (Create Expense)

```json
POST /api/expenses
Content-Type: application/json

{
  "description": "Groceries",
  "amount": 75.50,
  "expenseDate": "2024-01-15T10:00:00",
  "category": "Food"
}
```

## Technology Stack

### Backend
- **Java 17**
- **Spring Boot 3.2.0**
- **Spring Data JPA**
- **H2 Database** (in-memory, for development)
- **JUnit 5** & **Mockito** for testing
- **Maven** for dependency management

### Frontend
- **React 18**
- **TypeScript**
- **Vite** for build tooling
- **Axios** for HTTP requests
- **Vitest** & **React Testing Library** for testing

## Development Notes

- The backend uses an in-memory H2 database. Data will be lost when the application restarts.
- CORS is configured to allow requests from `http://localhost:5173` (frontend dev server).
- No authentication is implemented as this is for local use only.

## Future Enhancements

- Persistent database (PostgreSQL, MySQL, etc.)
- Expense filtering and search
- Expense statistics and charts
- Export functionality
- Category management

## License

This project is for personal use.

