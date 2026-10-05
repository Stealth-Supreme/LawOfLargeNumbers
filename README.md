# Probability Lab

A premium, scientific simulation tool designed to visualize the convergence of experimental probability toward theoretical truth.

## 🚀 Tech Stack
- **Frontend**: HTML5, CSS3, JavaScript (ES6+).
- **Visualization**: High-performance custom SVG implementation.
- **Architecture**: Configuration-driven, experiment-agnostic engine.

## 🛠️ Installation & Running
This is a static website.
1. Open `index.html` in any modern web browser.
2. Or serve via local server: `python -m http.server 8000`.

## 🧪 How the Simulation Works

### Experimental vs. Theoretical Probability
The lab demonstrates the **Law of Large Numbers**.
- **Theoretical Probability**: The ideal ratio based on mathematics (e.g., 0.5 for a coin).
- **Experimental Probability**: The actual observed ratio after $N$ trials.

As trials increase, the experimental result generally moves closer to the theoretical value, though random fluctuations persist.

### The 2d6 Distribution
The "2 Dice Sum" experiment highlights non-uniform distributions. Because there are 36 possible outcomes of two independent dice, the sum follows a triangular distribution where 7 is the most likely outcome (6/36) and 2 or 12 are the least likely (1/36).

### Graph Performance & Thinning
To maintain 60fps responsiveness up to 100,000 trials, the app employs a **data thinning** strategy:
- The first 500 trials are plotted exactly.
- After 500, the graph samples points every 100 trials.
- The most recent trial is always included.
This prevents SVG DOM bloat while preserving the visual trend of convergence.

### Linear vs. Logarithmic Scale
- **Linear**: Best for observing the final convergence.
- **Logarithmic**: Essential for visualizing the highly volatile early stages of an experiment when trial counts are already in the thousands.

## 🧩 Adding a New Experiment
The system is designed for extensibility. To add a new discrete experiment (e.g., a 3-dice sum or a custom spinner):

1. Add a new entry to the `EXPERIMENTS` object in `js/config.js`.
2. Define the `outcomes` with their theoretical probabilities and colors.
3. Provide a `sampler` function that returns one of the outcome keys.
4. Define the `formatResult` for the latest-result display.

## 🧪 Testing Instructions
1. **Functional**: Verify that selecting an experiment from the homepage loads the simulator, and "Back to Experiments" returns cleanly.
2. **Mathematical**: Run 100k trials for 2d6; verify 7 occurs substantially more than 2 or 12.
3. **Performance**: Set automatic mode to 10ms; verify the UI remains responsive and the graph renders smoothly.
