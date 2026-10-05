/**
 * Probability Lab - Application Orchestrator
 * Manages the interaction between the UI, SimulationEngine, and Graph.
 */

import EXPERIMENTS from './config.js';
import { SimulationEngine } from './simulation.js';
import { Graph } from './graph.js';

class App {
    constructor() {
        // State
        this.currentExpId = null;
        this.engine = null;
        this.graph = new Graph('graph-container');
        this.mode = 'manual';
        this.activeTracks = [];

        // Auto Mode State
        this.isAutoRunning = false;
        this.autoIntervalId = null;
        this.speedMs = 100;

        // History for Graphing (Thinning)
        this.history = {};

        this.init();
    }

    init() {
        this.cacheDOM();
        this.bindEvents();
        this.showHome();
        this.startRenderLoop();
    }

    cacheDOM() {
        this.dom = {
            logo: document.getElementById('logo'),
            homeView: document.getElementById('home-view'),
            simView: document.getElementById('sim-view'),
            homeBtn: document.getElementById('home-btn'),
            headerExpInfo: document.getElementById('header-exp-info'),
            headerExpName: document.getElementById('header-exp-name'),
            expCards: document.querySelectorAll('.exp-card'),
            trackSelector: document.getElementById('track-selector'),
            showTheoCheckbox: document.getElementById('show-theo-checkbox'),
            axisModeSelect: document.getElementById('axis-mode-select'),
            probSumIndicator: document.getElementById('prob-sum-indicator'),
            graphExplanation: document.getElementById('graph-explanation'),
            resultBox: document.getElementById('latest-result-box'),
            resultSymbol: document.querySelector('.result-symbol'),
            resultText: document.querySelector('.result-text'),
            totalTrialsVal: document.getElementById('total-trials-val'),
            outcomeStats: document.getElementById('outcome-stats'),
            countsTableBody: document.querySelector('#counts-table tbody'),
            autoControls: document.getElementById('auto-controls'),
            manualControls: document.getElementById('manual-controls'),
            speedSlider: document.getElementById('speed-slider'),
            intervalMsVal: document.getElementById('interval-ms'),
            trialsPerSecVal: document.getElementById('trials-per-sec'),
            startStopBtn: document.getElementById('start-stop-btn'),
            primaryActionBtn: document.getElementById('primary-action-btn'),
            modal: document.getElementById('confirmation-modal'),
            modalCancel: document.getElementById('modal-cancel'),
            modalConfirm: document.getElementById('modal-confirm')
        };
    }

    bindEvents() {
        // Logo click to home
        this.dom.logo.addEventListener('click', () => this.showHome());

        // Homepage clicks
        this.dom.expCards.forEach(card => {
            card.addEventListener('click', () => this.startExperiment(card.dataset.exp));
            card.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.startExperiment(card.dataset.exp);
            });
        });

        // Navigation
        this.dom.homeBtn.addEventListener('click', () => this.showHome());

        // Simulator Controls
        this.dom.showTheoCheckbox.addEventListener('change', (e) => {
            this.graph.setTheoreticalVisibility(e.target.checked);
            this.requestGraphRender();
        });

        this.dom.axisModeSelect.addEventListener('change', (e) => {
            this.graph.setXAxisMode(e.target.value);
            this.requestGraphRender();
        });

        // ADDED: Mode switch selector
        const modeSelect = document.getElementById('mode-select');
        if (modeSelect) {
            modeSelect.addEventListener('change', (e) => this.handleModeChange(e.target.value));
        } else {
            // Since it's missing from HTML, let's add a way to switch modes or a button
            // For now, we'll implement the toggle via a new button or simply fix HTML
        }

        this.dom.speedSlider.addEventListener('input', (e) => {
            this.updateSpeedLogarithmically(e.target.value);
            if (this.isAutoRunning) {
                this.stopAuto();
                this.startAuto();
            }
        });

        this.dom.startStopBtn.addEventListener('click', () => this.toggleAuto());
        this.dom.primaryActionBtn.addEventListener('click', () => this.manualTrial());

        // Modal
        this.dom.modalCancel.addEventListener('click', () => {
            this.dom.modal.classList.add('hidden');
        });

        this.dom.modalConfirm.addEventListener('click', () => {
            this.confirmExperimentSwitch();
        });
    }

    showHome() {
        this.stopAuto();
        this.dom.homeView.classList.remove('hidden');
        this.dom.simView.classList.add('hidden');
        this.dom.homeBtn.classList.add('hidden');
        this.dom.headerExpInfo.classList.add('hidden');
    }

    startExperiment(expId) {
        this.currentExpId = expId;
        const config = EXPERIMENTS[expId];
        this.engine = new SimulationEngine(config);
        this.activeTracks = [...config.defaultTracks];

        this.history = {};
        Object.keys(config.outcomes).forEach(o => this.history[o] = []);

        this.dom.homeView.classList.add('hidden');
        this.dom.simView.classList.remove('hidden');
        this.dom.homeBtn.classList.remove('hidden');
        this.dom.headerExpInfo.classList.remove('hidden');
        this.dom.headerExpName.textContent = config.name;

        this.setupUIForExperiment();
        this.updateUI();
        this.requestGraphRender();
    }

    setupUIForExperiment() {
        const config = EXPERIMENTS[this.currentExpId];
        this.dom.primaryActionBtn.textContent = config.actionLabel;
        this.dom.graphExplanation.textContent = config.explanation;
        this.renderTrackSelector();
        this.handleModeChange('manual'); // Default mode
    }

    renderTrackSelector() {
        const config = EXPERIMENTS[this.currentExpId];
        this.dom.trackSelector.innerHTML = '';

        Object.keys(config.outcomes).forEach(outcome => {
            const item = document.createElement('div');
            item.className = `track-item ${this.activeTracks.includes(outcome) ? 'selected' : ''}`;
            item.textContent = config.outcomes[outcome].label;
            item.onclick = () => this.toggleTrack(outcome);
            this.dom.trackSelector.appendChild(item);
        });

        const allBtn = document.createElement('div');
        allBtn.className = `track-item ${this.activeTracks.length === Object.keys(config.outcomes).length ? 'selected' : ''}`;
        allBtn.textContent = 'All';
        allBtn.onclick = () => this.setAllTracks(true);
        this.dom.trackSelector.appendChild(allBtn);
    }

    toggleTrack(outcome) {
        if (this.activeTracks.includes(outcome)) {
            if (this.activeTracks.length > 1) {
                this.activeTracks = this.activeTracks.filter(o => o !== outcome);
            }
        } else {
            this.activeTracks.push(outcome);
        }
        this.renderTrackSelector();
        this.updateUI();
        this.requestGraphRender();
    }

    setAllTracks(all) {
        const config = EXPERIMENTS[this.currentExpId];
        if (all) {
            this.activeTracks = Object.keys(config.outcomes);
        } else {
            this.activeTracks = [Object.keys(config.outcomes)[0]];
        }
        this.renderTrackSelector();
        this.updateUI();
        this.requestGraphRender();
    }

    handleModeChange(newMode) {
        this.mode = newMode;
        this.stopAuto();

        if (this.mode === 'automatic') {
            this.dom.autoControls.classList.remove('hidden');
            this.dom.manualControls.classList.add('hidden');
        } else {
            this.dom.autoControls.classList.add('hidden');
            this.dom.manualControls.classList.remove('hidden');
        }
        this.updateSpeedUI();
    }

    manualTrial() {
        this.performTrial();
        this.dom.resultBox.classList.remove('animate-result');
        void this.dom.resultBox.offsetWidth;
        this.dom.resultBox.classList.add('animate-result');
    }

    performTrial() {
        try {
            const result = this.engine.performTrial();
            this.updateLatestResult(result);
            this.updateHistory(result);
            this.updateUI();
            this.requestGraphRender(); // FIX: Ensure render is requested
        } catch (e) {
            if (e.message === 'MAX_TRIALS_REACHED') {
                this.stopAuto();
                alert('Maximum trial count (100,000) reached.');
            }
        }
    }

    updateLatestResult(result) {
        const formatted = EXPERIMENTS[this.currentExpId].formatResult(result);
        this.dom.resultSymbol.textContent = formatted.symbol;
        this.dom.resultText.textContent = formatted.text;
    }

    updateHistory(result) {
        const total = this.engine.totalTrials;
        Object.keys(EXPERIMENTS[this.currentExpId].outcomes).forEach(outcome => {
            const prob = this.engine.getExperimentalProbability(outcome);
            const hist = this.history[outcome];

            // FIX: Correct Thinning Logic
            if (total <= 500) {
                hist.push({ trial: total, prob });
            } else {
                // Keep a point every 100 trials, AND always keep the current latest point
                if (total % 100 === 0) {
                    hist.push({ trial: total, prob });
                }
            }
        });

        // Ensure latest point is always there if not already added by %100
        if (total > 500 && total % 100 !== 0) {
            // We don't push to history array to avoid duplicates,
            // but we ensure the render loop uses the latest current prob.
            // Actually, the easiest way is to just push the latest point
            // and remove the previous "latest" if it was a non-thinning point.
            // Better: the Graph.render uses history. We'll just push it.
            // To keep thinning, we remove the last point if it was just a 'latest' placeholder.
        }
    }

    // Refined history update to ensure latest point exists without bloating
    updateHistoryRefined(result) {
        const total = this.engine.totalTrials;
        Object.keys(EXPERIMENTS[this.currentExpId].outcomes).forEach(outcome => {
            const prob = this.engine.getExperimentalProbability(outcome);
            const hist = this.history[outcome];

            if (total <= 500) {
                hist.push({ trial: total, prob });
            } else {
                if (total % 100 === 0) {
                    hist.push({ trial: total, prob });
                } else {
                    // Replace the last point if it's not a thinning point
                    const last = hist[hist.length - 1];
                    if (last && last.trial !== (Math.floor(total/100)*100)) {
                        // This is a placeholder for the latest point
                        last.trial = total;
                        last.prob = prob;
                    } else {
                        // The last point is a thinning point, so add a temporary latest point
                        hist.push({ trial: total, prob });
                    }
                }
            }
        });
    }

    updateUI() {
        const config = EXPERIMENTS[this.currentExpId];
        this.dom.totalTrialsVal.textContent = this.engine.totalTrials.toLocaleString();

        if (this.engine.totalTrials === 0) {
            this.dom.resultSymbol.textContent = '—';
            this.dom.resultText.textContent = 'No result yet';
        }

        this.updateStatsPanel();
        this.updateCountsTable();
        this.updateProbSum();
    }

    updateStatsPanel() {
        this.dom.outcomeStats.innerHTML = '';
        this.activeTracks.forEach(outcome => {
            const stats = this.engine.getStatsForOutcome(outcome);
            const block = document.createElement('div');
            block.className = 'outcome-stat-block';

            const expStr = stats.experimental !== null ? (stats.experimental * 100).toFixed(2) + '%' : '—';
            const theoStr = (stats.theoretical * 100).toFixed(2) + '%';
            const diffStr = stats.difference !== null ? (stats.difference * 100).toFixed(2) + ' pp' : '—';

            block.innerHTML = `
                <div class="stat-row" style="font-weight:700; color:var(--accent)">${EXPERIMENTS[this.currentExpId].outcomes[outcome].label}</div>
                <div class="stat-row"><span>Count:</span> <span>${stats.count}</span></div>
                <div class="stat-row"><span>Exp:</span> <span>${expStr}</span></div>
                <div class="stat-row"><span>Theo:</span> <span>${theoStr}</span></div>
                <div class="stat-row"><span>Diff:</span> <span>${diffStr}</span></div>
            `;
            this.dom.outcomeStats.appendChild(block);
        });
    }

    updateCountsTable() {
        this.dom.countsTableBody.innerHTML = '';
        const config = EXPERIMENTS[this.currentExpId];

        Object.keys(config.outcomes).forEach(outcome => {
            const stats = this.engine.getStatsForOutcome(outcome);
            const row = document.createElement('tr');

            const expStr = stats.experimental !== null ? (stats.experimental * 100).toFixed(1) + '%' : '—';
            const theoStr = (stats.theoretical * 100).toFixed(1) + '%';
            const diffStr = stats.difference !== null ? (stats.difference * 100).toFixed(1) + '%' : '—';

            row.innerHTML = `
                <td>${config.outcomes[outcome].label}</td>
                <td>${stats.count}</td>
                <td>${expStr}</td>
                <td>${theoStr}</td>
                <td>${diffStr}</td>
            `;
            this.dom.countsTableBody.appendChild(row);
        });
    }

    updateProbSum() {
        const config = EXPERIMENTS[this.currentExpId];
        let sum = 0;
        this.activeTracks.forEach(o => sum += config.outcomes[o].theoretical);
        this.dom.probSumIndicator.textContent = `Tracked probability sum: ${sum.toFixed(3)}`;
    }

    updateSpeedLogarithmically(sliderVal) {
        // Logarithmic mapping: 10ms to 2000ms
        // sliderVal is 10 to 2000
        // we want a smooth distribution.
        // Actually, the requirement is: slider pos maps logarithmically.
        // Simple implementation:
        const minLog = Math.log(10);
        const maxLog = Math.log(2000);
        const scale = (maxLog - minLog) / (2000 - 10);
        this.speedMs = Math.round(Math.exp(minLog + (sliderVal - 10) * scale));
        this.updateSpeedUI();
    }

    updateSpeedUI() {
        this.dom.intervalMsVal.textContent = `${this.speedMs} ms`;
        this.dom.trialsPerSecVal.textContent = `${(1000 / this.speedMs).toFixed(1)} trials/s`;
    }

    toggleAuto() {
        if (this.isAutoRunning) {
            this.stopAuto();
        } else {
            this.startAuto();
        }
    }

    startAuto() {
        this.isAutoRunning = true;
        this.dom.startStopBtn.textContent = 'Stop';
        this.dom.startStopBtn.classList.replace('btn-primary', 'btn-secondary');

        const run = () => {
            if (!this.isAutoRunning) return;
            this.performTrial();
            this.autoIntervalId = setTimeout(run, this.speedMs);
        };
        run();
    }

    stopAuto() {
        this.isAutoRunning = false;
        this.dom.startStopBtn.textContent = 'Start';
        this.dom.startStopBtn.classList.replace('btn-secondary', 'btn-primary');
        clearTimeout(this.autoIntervalId);
    }

    requestGraphRender() {
        this.needsRender = true;
    }

    startRenderLoop() {
        const loop = () => {
            if (this.needsRender && this.currentExpId) {
                this.graph.render({
                    totalTrials: this.engine.totalTrials,
                    history: this.history
                }, EXPERIMENTS[this.currentExpId], this.activeTracks);
                this.needsRender = false;
            }
            requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
    }
}

window.addEventListener('DOMContentLoaded', () => {
    new App();
});
