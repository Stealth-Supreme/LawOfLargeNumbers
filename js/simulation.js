/**
 * Probability Lab - Simulation Engine
 * Handles the mathematical state and sampling logic.
 * Remains experiment-agnostic.
 */

export class SimulationEngine {
    constructor(config) {
        this.config = config;
        this.reset();
    }

    reset() {
        this.totalTrials = 0;
        this.counts = {};
        this.latestResult = null;

        // Initialize counts for all defined outcomes
        Object.keys(this.config.outcomes).forEach(outcome => {
            this.counts[outcome] = 0;
        });
    }

    /**
     * Performs a single trial.
     * Returns the outcome value.
     * Throws error if max trials reached.
     */
    performTrial() {
        if (this.totalTrials >= 100000) {
            throw new Error('MAX_TRIALS_REACHED');
        }

        const result = this.config.sampler();

        this.totalTrials++;
        this.counts[result]++;
        this.latestResult = result;

        return result;
    }

    /**
     * Calculates the experimental probability for a given outcome.
     * Returns null if totalTrials is 0 to avoid division by zero.
     */
    getExperimentalProbability(outcome) {
        if (this.totalTrials === 0) return null;
        return this.counts[outcome] / this.totalTrials;
    }

    getTheoreticalProbability(outcome) {
        return this.config.outcomes[outcome]?.theoretical || 0;
    }

    getStatsForOutcome(outcome) {
        const expProb = this.getExperimentalProbability(outcome);
        const theoProb = this.getTheoreticalProbability(outcome);

        return {
            count: this.counts[outcome] || 0,
            experimental: expProb,
            theoretical: theoProb,
            difference: expProb !== null ? expProb - theoProb : null
        };
    }

    getState() {
        return {
            totalTrials: this.totalTrials,
            counts: { ...this.counts },
            latestResult: this.latestResult
        };
    }
}
