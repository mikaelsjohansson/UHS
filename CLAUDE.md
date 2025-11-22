# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**UHS** is a full-stack personal expense tracker with:
- **Backend**: Java 17, Spring Boot 3.2.0, Maven, SQLite database
- **Frontend**: React 18, TypeScript, Vite, Vitest + React Testing Library
- **Purpose**: Track personal expenses by category with trends and analytics

## Mandatory Development Workflow

This project uses a **strict role-based development workflow**. Every single change—no matter how small—must follow this sequence:

1. **Tech Lead Phase** (read `rules/tech-lead.md`)
   - Analyze requirements and clarify ambiguities
   - Plan solution with architectural considerations
   - Present 3 options if design choices exist
   - Approve any new package/dependency additions
   - Delegate to appropriate engineer

2. **Engineer Phase** (read `rules/backend-engineer.md` or `rules/frontend-engineer.md`)
   - Follow TDD: Red → Green → Refactor
   - Write failing tests first, then implement
   - Escalate unclear requirements to Tech Lead
   - Never add packages without Tech Lead approval

3. **Reviewer Phase** (read `rules/backend-reviewer.md` or `rules/frontend-reviewer.md`)
   - Build the code (`mvn -s settings.xml clean compile` for backend, `npm run build` for frontend)
   - Run all tests (`mvn -s settings.xml test` or `npm test`)
   - Cannot approve if build or tests fail
   - Verify no unauthorized packages added
   - Reject with specific feedback if issues found

4. **Iterative Fixes** (if Reviewer rejects)
   - Reviewer provides detailed feedback on what needs fixing
   - Return to Engineer Phase to address feedback
   - Engineer makes fixes and re-runs tests locally
   - Return to Reviewer Phase for re-review
   - Repeat until Reviewer approves

**Critical rule**: There are NO exceptions for small changes. Every modification requires all three phases. If rejected, iterate until approved.

## Common Development Commands

### Backend (Java/Spring Boot)

```bash
# Navigate to backend directory
cd backend

# Run the application
mvn -s settings.xml spring-boot:run

# Build the project
mvn -s settings.xml clean compile

# Run all tests
mvn -s settings.xml test

# Run a single test class
mvn -s settings.xml test -Dtest=ExpenseServiceTest

# Run a single test method
mvn -s settings.xml test -Dtest=ExpenseServiceTest#testCreateExpense

# Build for production
mvn -s settings.xml clean package
```

**Backend runs on**: `http://localhost:8080`

### Frontend (React/TypeScript)

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Run all tests
npm test

# Run tests with UI
npm test:ui

# Run tests with coverage report
npm test:coverage

# Build for production
npm run build

# Preview production build locally
npm run preview
```

**Frontend runs on**: `http://localhost:5173`

## Architecture Overview

### Backend Structure

```
backend/src/main/java/com/uhs/
├── controller/          # REST endpoints
│   ├── ExpenseController
│   ├── CategoryController
│   └── ConfigController
├── service/             # Business logic
│   ├── ExpenseService   (complex: multi-category trends, analytics)
│   ├── CategoryService
├── repository/          # Data access (Spring Data JPA)
│   ├── ExpenseRepository
│   └── CategoryRepository
├── model/               # JPA entities
├── dto/                 # Data transfer objects
└── config/              # Configuration & initialization
```

**Key Architectural Notes**:
- SQLite with WAL mode for concurrent access (configured in `application.properties`)
- JPA/Hibernate for ORM with custom dialect
- Controllers expose REST API, services handle business logic
- ExpenseService has complex analytics for multi-category trends (see `MultiCategoryTrendDto`)

### Frontend Structure

```
frontend/src/
├── pages/               # Page-level components
│   ├── ExpensesPage     (CRUD operations for expenses)
│   ├── AnalyticsPage    (trends, charts using Recharts)
│   └── CategoriesPage   (category management)
├── components/          # Reusable UI components
│   ├── ExpenseForm      (create/edit expenses)
│   ├── ExpenseList      (display expenses)
│   ├── CategoryForm     (create/edit categories)
│   ├── CategoryList     (display categories)
│   ├── CategoryPieChart (expense breakdown)
│   ├── CategoryTrendChart (time-series trends)
│   ├── Modal            (generic modal wrapper)
│   ├── DeleteConfirmationModal
│   ├── CategoryDeleteConfirmationModal
│   └── Layout           (app shell with navigation)
├── services/            # API clients
│   ├── expenseService
│   ├── categoryService
│   └── configService
├── types/               # TypeScript interfaces
│   ├── expense.ts
│   ├── category.ts
│   └── analytics.ts
├── utils/               # Helper functions
│   └── currency.ts      (currency formatting)
└── App.tsx              # Router configuration
```

**Key Architectural Notes**:
- React Router for navigation (Expenses, Analytics, Categories)
- Axios for HTTP requests
- Recharts for data visualization (pie chart, trend charts)
- Services use Axios to communicate with backend REST API
- Form components handle validation and submission

## API Endpoints

### Expenses

```
GET    /api/expenses              # Get all expenses
GET    /api/expenses/{id}         # Get expense by ID
POST   /api/expenses              # Create new expense
PUT    /api/expenses/{id}         # Update expense
DELETE /api/expenses/{id}         # Delete expense
```

### Categories

```
GET    /api/categories            # Get all categories
GET    /api/categories/{id}       # Get category by ID
POST   /api/categories            # Create new category
PUT    /api/categories/{id}       # Update category
DELETE /api/categories/{id}       # Delete category
```

### Analytics

```
GET    /api/trends/{category}     # Get trend data for category
GET    /api/trends                # Get multi-category trends
```

### Configuration

```
GET    /api/config                # Get app config (currency, etc.)
```

## Database Schema (SQLite)

**Key entities**:
- `expense` (id, description, amount, expense_date, category_id, created_at)
- `category` (id, name, is_active, created_at)

Database initializes with default categories via `DataInitializer.java`.

## Testing Strategy

### Backend Testing

- **Unit tests**: `src/test/java/com/uhs/service/` (mock repositories)
- **Integration tests**: `ExpenseControllerIntegrationTest` (tests full HTTP stack)
- **Concurrency tests**: `ExpenseServiceConcurrencyTest` (SQLite concurrent access)
- **Framework**: JUnit 5 + Mockito

### Frontend Testing

- **Component tests**: `src/components/__tests__/` (React Testing Library)
- **Utility tests**: `src/utils/__tests__/`
- **Framework**: Vitest + React Testing Library

## Code Standards from .cursorrules

Key rules for this project:
- Every change must follow the three-phase workflow (Tech Lead → Engineer → Reviewer)
- Engineers use TDD (red-green-refactor)
- Reviewers must build and test before approval
- No new packages without Tech Lead approval
- Role declaration is mandatory when switching phases
- If Reviewer rejects code, Engineer returns to fix issues

See `.cursorrules` for complete workflow details.

## Important Configuration

- **Currency**: Configured as `SEK` in `application.properties`
- **CORS**: Allows `http://localhost:5173` (frontend dev server)
- **SQLite WAL mode**: Enables concurrent access (configured via connection properties)
- **Frontend API base URL**: Configured in services, defaults to `http://localhost:8080`

## Common Development Scenarios

### Adding a new expense field

1. Add field to `Expense` entity (backend/src/main/java/com/uhs/model/)
2. Update `ExpenseDto` (backend/src/main/java/com/uhs/dto/)
3. Update `ExpenseService` if business logic changes needed
4. Update `ExpenseController` if API contract changes
5. Update frontend `ExpenseForm` component
6. Update frontend `expenseService.ts` API client
7. Update tests in both backend and frontend

### Adding a new analytics chart

1. Design the data structure (backend: new DTO or extend existing)
2. Add endpoint to `ExpenseController` or create new controller
3. Implement analytics logic in `ExpenseService`
4. Create new component in frontend `components/`
5. Add page or integrate into `AnalyticsPage`
6. Call API endpoint from component using `expenseService`
7. Test with sample data

### Fixing a database issue

- SQLite database file: `uhs.db` (in project root when backend runs)
- For schema changes, update entity and let Hibernate handle it via `ddl-auto=update`
- Concurrency issues: Check `ExpenseServiceConcurrencyTest` for patterns
