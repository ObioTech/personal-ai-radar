# Contributing to Obio Radar

First off, thank you for considering contributing to Obio Radar! It's people like you that make open source such a great community.

## Development Setup

1. **Prerequisites**: Node.js >= 18.
2. **Clone the repo** and install dependencies:
   ```bash
   git clone https://github.com/obiotech/obio-radar.git
   cd obio-radar
   npm install
   ```
3. **Set up environment**:
   ```bash
   cp .env.example .env
   # Add your GEMINI_API_KEY for testing
   ```

## Development Workflow

- Run a dry-run to test the pipeline without writing any databases or sending alerts:
  ```bash
  npm run dev
  ```
- Before submitting your code, make sure all tests and type checks pass:
  ```bash
  npm run typecheck
  npm run test
  ```

## Pull Request Process

1. Fork the repository and create your branch from `main`.
2. If you've added code that should be tested, add tests.
3. If you've changed APIs or features, update the documentation.
4. Ensure your code passes linting, tests, and type checking.
5. Create a Pull Request, describing clearly the problem it solves and how you solved it.
