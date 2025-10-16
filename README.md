# Calligraphy - Digital Graph Paper

Calligraphy is a web-based application that provides digital graph paper with various customizable grid types and drawing functionalities. It's designed to be a simple yet powerful tool for sketching, note-taking, or practicing calligraphy.

## Features

*   **Freehand Drawing:** Draw freely on the canvas with touch or mouse input.
*   **Pinch and Pan (Touchpad/Touchscreen):** Seamless navigation and zooming using intuitive pinch and pan gestures, allowing for detailed work and easy canvas manipulation.
*   **Multiple Grid Types:**
    *   Basic Grid
    *   Rice Grid
    *   Calligraphy Grid
    *   Cross Grid
*   **Undo/Redo Functionality:** Easily correct mistakes with comprehensive undo and redo history.
*   **Save/Load State:** Automatically saves your canvas state to local storage, allowing you to resume your work across sessions.
*   **Eraser Tool:** Clear parts of your drawing with an eraser.
*   **Clear Canvas:** Quickly clear the entire drawing.
*   **Responsive Design:** Adapts to various screen sizes and devices.

## Development Highlights

This project emphasizes modern web development practices, including:

*   **TypeScript:** For type safety and improved code quality.
*   **Vite:** A fast build tool for modern web projects.
*   **Konva.js:** A 2D HTML5 Canvas JavaScript framework for desktop and mobile applications.
*   **Vitest:** A fast and modern testing framework for unit and integration tests.
*   **ESLint & Prettier:** Enforcing code style and best practices for consistent and maintainable code.
*   **GitHub Actions:** Automated CI/CD pipeline for building and deploying the application to GitHub Pages.

## Getting Started

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/azye/calligraphy.git
    cd calligraphy
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```

### Running Locally

To start the development server:

```bash
npm run dev
```

This will open the application in your browser, usually at `http://localhost:5173`.

### Building for Production

To build the application for production:

```bash
npm run build
```

The production-ready files will be generated in the `dist` directory.

### Running Tests

To run the unit tests:

```bash
npm test
```

To run tests with a UI:

```bash
npm run test:ui
```

### Linting and Formatting

To lint and automatically fix code style issues:

```bash
npm run lint
npm run format
```