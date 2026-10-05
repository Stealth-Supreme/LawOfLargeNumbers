/**
 * Probability Lab - Visualization Engine
 * Custom SVG implementation for plotting running probabilities.
 */

export class Graph {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.width = 800;
        this.height = 400;
        this.padding = { top: 30, right: 40, bottom: 50, left: 60 };

        this.options = {
            xAxisMode: 'linear', // 'linear' or 'log'
            showTheoretical: true,
            ...options
        };

        this.setupSVG();
    }

    setupSVG() {
        this.container.innerHTML = '';
        this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.svg.setAttribute('viewBox', `0 0 ${this.width} ${this.height}`);
        this.svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
        this.svg.classList.add('prob-graph');

        this.gridGroup = this.createGroup();
        this.theoreticalGroup = this.createGroup();
        this.experimentalGroup = this.createGroup();
        this.axisGroup = this.createGroup();

        this.svg.appendChild(this.gridGroup);
        this.svg.appendChild(this.theoreticalGroup);
        this.svg.appendChild(this.experimentalGroup);
        this.svg.appendChild(this.axisGroup);

        this.container.appendChild(this.svg);
    }

    createGroup() {
        return document.createElementNS('http://www.w3.org/2000/svg', 'g');
    }

    getY(prob) {
        const chartHeight = this.height - this.padding.top - this.padding.bottom;
        return this.height - this.padding.bottom - (prob * chartHeight);
    }

    getX(trial, totalTrials) {
        const chartWidth = this.width - this.padding.left - this.padding.right;
        if (totalTrials <= 1) return this.padding.left;

        if (this.options.xAxisMode === 'linear') {
            return this.padding.left + (trial / totalTrials) * chartWidth;
        } else {
            const logTrial = Math.log10(Math.max(1, trial));
            const logTotal = Math.log10(Math.max(1, totalTrials));
            if (logTotal === 0) return this.padding.left;
            return this.padding.left + (logTrial / logTotal) * chartWidth;
        }
    }

    render(simulationData, config, activeTracks) {
        const { totalTrials, history } = simulationData;

        this.renderAxes(totalTrials);
        this.renderTheoreticalLines(config, activeTracks);
        this.renderExperimentalLines(history, totalTrials, activeTracks, config);
    }

    renderAxes(totalTrials) {
        this.axisGroup.innerHTML = '';

        // Y axis
        const yLine = this.createLine(this.padding.left, this.padding.top, this.padding.left, this.height - this.padding.bottom, 'axis-line');
        this.axisGroup.appendChild(yLine);

        // X axis
        const xLine = this.createLine(this.padding.left, this.height - this.padding.bottom, this.width - this.padding.right, this.height - this.padding.bottom, 'axis-line');
        this.axisGroup.appendChild(xLine);

        // Y ticks (0 to 1)
        for (let i = 0; i <= 10; i++) {
            const val = i / 10;
            const y = this.getY(val);
            const tick = this.createLine(this.padding.left - 5, y, this.padding.left, y, 'axis-line');
            this.axisGroup.appendChild(tick);

            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', this.padding.left - 10);
            text.setAttribute('y', y + 4);
            text.setAttribute('text-anchor', 'end');
            text.setAttribute('class', 'axis-text');
            text.textContent = val.toFixed(1);
            this.axisGroup.appendChild(text);
        }

        // X Ticks
        if (totalTrials > 0) {
            const tickCount = 5;
            for (let i = 1; i <= tickCount; i++) {
                let trialLabel;
                let xPos;

                if (this.options.xAxisMode === 'linear') {
                    trialLabel = Math.round((totalTrials / tickCount) * i);
                    xPos = this.getX(trialLabel, totalTrials);
                } else {
                    // Logarithmic ticks: 1, 10, 100...
                    const exponent = Math.floor(Math.log10(totalTrials));
                    const val = Math.pow(10, i - 1);
                    if (val > totalTrials) break;
                    trialLabel = val;
                    xPos = this.getX(val, totalTrials);
                }

                const tick = this.createLine(xPos, this.height - this.padding.bottom, xPos, this.height - this.padding.bottom + 5, 'axis-line');
                this.axisGroup.appendChild(tick);

                const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                text.setAttribute('x', xPos);
                text.setAttribute('y', this.height - this.padding.bottom + 15);
                text.setAttribute('text-anchor', 'middle');
                text.setAttribute('class', 'axis-text');
                text.textContent = trialLabel.toLocaleString();
                this.axisGroup.appendChild(text);
            }
        }

        const xLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        xLabel.setAttribute('x', this.width / 2);
        xLabel.setAttribute('y', this.height - 10);
        xLabel.setAttribute('text-anchor', 'middle');
        xLabel.setAttribute('class', 'axis-text');
        xLabel.style.fontSize = '13px';
        xLabel.textContent = `Number of Trials (${this.options.xAxisMode === 'linear' ? 'Linear' : 'Logarithmic'})`;
        this.axisGroup.appendChild(xLabel);
    }

    renderTheoreticalLines(config, activeTracks) {
        this.theoreticalGroup.innerHTML = '';
        if (!this.options.showTheoretical) return;

        activeTracks.forEach(outcome => {
            const prob = config.outcomes[outcome].theoretical;
            const color = config.outcomes[outcome].color;
            const y = this.getY(prob);
            const line = this.createLine(this.padding.left, y, this.width - this.padding.right, y, 'theo-line');
            line.setAttribute('stroke', color);
            line.setAttribute('data-outcome', outcome);
            this.theoreticalGroup.appendChild(line);
        });
    }

    renderExperimentalLines(history, totalTrials, activeTracks, config) {
        this.experimentalGroup.innerHTML = '';
        if (totalTrials === 0) return;

        activeTracks.forEach(outcome => {
            const points = history[outcome] || [];
            if (points.length === 0) return;

            const color = config.outcomes[outcome].color;

            if (points.length === 1) {
                // FIX: Render a visible point for the first trial
                const pt = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                pt.setAttribute('cx', this.getX(points[0].trial, totalTrials));
                pt.setAttribute('cy', this.getY(points[0].prob));
                pt.setAttribute('r', '4');
                pt.setAttribute('fill', color);
                pt.setAttribute('data-outcome', outcome);
                pt.setAttribute('class', 'exp-point');
                this.experimentalGroup.appendChild(pt);
            } else {
                const polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
                const pointsAttr = points
                    .map(p => `${this.getX(p.trial, totalTrials)},${this.getY(p.prob)}`)
                    .join(' ');

                polyline.setAttribute('points', pointsAttr);
                polyline.setAttribute('stroke', color);
                polyline.setAttribute('data-outcome', outcome);
                polyline.setAttribute('class', 'exp-line');
                this.experimentalGroup.appendChild(polyline);
            }
        });
    }

    createLine(x1, y1, x2, y2, className) {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', x1);
        line.setAttribute('y1', y1);
        line.setAttribute('x2', x2);
        line.setAttribute('y2', y2);
        if (className) line.setAttribute('class', className);
        return line;
    }

    setXAxisMode(mode) {
        this.options.xAxisMode = mode;
    }

    setTheoreticalVisibility(visible) {
        this.options.showTheoretical = visible;
    }

    highlightOutcome(outcome) {
        this.svg.setAttribute('data-highlighted', outcome);

        // We can use CSS to handle the dimming/highlighting based on data-highlighted
        // But for precise control over colors/widths:
        const allLines = this.svg.querySelectorAll('.exp-line, .exp-point, .theo-line');
        allLines.forEach(line => {
            if (line.getAttribute('data-outcome') === outcome) {
                line.classList.add('highlighted');
                line.classList.remove('dimmed');
            } else {
                line.classList.add('dimmed');
                line.classList.remove('highlighted');
            }
        });
    }

    clearHighlight() {
        this.svg.removeAttribute('data-highlighted');
        const allLines = this.svg.querySelectorAll('.exp-line, .exp-point, .theo-line');
        allLines.forEach(line => {
            line.classList.remove('highlighted', 'dimmed');
        });
    }
}
