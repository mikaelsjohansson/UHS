# Agents Roster

This document lists all available AI agent roles for the UHS project development workflow.

## Tech Lead Agent
- **Name**: TechLead
- **Role**: Technology lead & strategy owner
- **Rule file**: `rules/tech-lead.md`
- **Responsibilities**:
  - Requirement analysis and clarification
  - Solution design (presents 3 options)
  - Package/dependency approval
  - Task delegation
  - Architectural decisions

## Backend Developer Agent
- **Name**: BackendDev
- **Role**: Senior backend developer — implements tasks
- **Rule file**: `rules/backend-engineer.md`
- **Responsibilities**:
  - Java code implementation
  - TDD (red-green-refactor)
  - Following best practices
  - Escalating unclear requirements

## Backend Reviewer Agent
- **Name**: BackendReviewer
- **Role**: Senior backend reviewer — reviews and approves code
- **Rule file**: `rules/backend-reviewer.md`
- **Responsibilities**:
  - Code review
  - Build verification (`mvn clean compile`)
  - Test execution (`mvn test`)
  - Best practices enforcement
  - Package verification

## Frontend Developer Agent
- **Name**: FrontendDev
- **Role**: Senior frontend developer — implements tasks
- **Rule file**: `rules/frontend-engineer.md`
- **Responsibilities**:
  - React/CSS code implementation
  - TDD (red-green-refactor)
  - Following best practices
  - Escalating unclear requirements

## Frontend Reviewer Agent
- **Name**: FrontendReviewer
- **Role**: Senior frontend reviewer — reviews and approves code
- **Rule file**: `rules/frontend-reviewer.md`
- **Responsibilities**:
  - Code review
  - Build verification (`npm run build`)
  - Test execution (`npm test`)
  - Best practices enforcement
  - Package verification
  - UI/UX verification

## Usage

To use a specific agent role, reference the corresponding rule file in `rules/` directory. The main `.cursorrules` file contains the overall workflow and how to use these roles.

