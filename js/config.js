/**
 * Probability Lab - Experiment Configurations
 * Single source of truth for all experiment definitions.
 */

const EXPERIMENTS = {
    coin: {
        id: 'coin',
        name: 'Coin Toss',
        actionLabel: 'Toss Coin',
        outcomes: {
            H: { label: 'Heads', theoretical: 0.5, color: '#64ffda' },
            T: { label: 'Tails', theoretical: 0.5, color: '#ff6464' }
        },
        sampler: () => (Math.random() < 0.5 ? 'H' : 'T'),
        defaultTracks: ['H', 'T'],
        explanation: 'Each point shows the proportion of tosses that have been Heads or Tails so far. The dashed lines show the theoretical probability of 50%.',
        formatResult: (val) => ({
            symbol: val,
            text: val === 'H' ? 'Heads' : 'Tails'
        })
    },
    dice: {
        id: 'dice',
        name: 'Dice Roll',
        actionLabel: 'Roll Die',
        outcomes: {
            '1': { label: 'One', theoretical: 1/6, color: '#64ffda' },
            '2': { label: 'Two', theoretical: 1/6, color: '#ff6464' },
            '3': { label: 'Three', theoretical: 1/6, color: '#64aeff' },
            '4': { label: 'Four', theoretical: 1/6, color: '#ffef64' },
            '5': { label: 'Five', theoretical: 1/6, color: '#cf64ff' },
            '6': { label: 'Six', theoretical: 1/6, color: '#64ffbc' }
        },
        sampler: () => (Math.floor(Math.random() * 6) + 1).toString(),
        defaultTracks: ['1', '2', '3', '4', '5', '6'],
        explanation: 'Each line shows how often a particular number has appeared so far. The dashed lines show the theoretical probability of approx 16.67%.',
        formatResult: (val) => {
            const names = { '1': 'One', '2': 'Two', '3': 'Three', '4': 'Four', '5': 'Five', '6': 'Six' };
            return { symbol: val, text: names[val] };
        }
    },
    twoDice: {
        id: 'twoDice',
        name: '2 Dice Sum',
        actionLabel: 'Roll 2 Dice',
        outcomes: {
            '2': { label: 'Two', theoretical: 1/36, color: '#64ffda' },
            '3': { label: 'Three', theoretical: 2/36, color: '#ff6464' },
            '4': { label: 'Four', theoretical: 3/36, color: '#64aeff' },
            '5': { label: 'Five', theoretical: 4/36, color: '#ffef64' },
            '6': { label: 'Six', theoretical: 5/36, color: '#cf64ff' },
            '7': { label: 'Seven', theoretical: 6/36, color: '#ffffff' },
            '8': { label: 'Eight', theoretical: 5/36, color: '#64ffbc' },
            '9': { label: 'Nine', theoretical: 4/36, color: '#ffb364' },
            '10': { label: 'Ten', theoretical: 3/36, color: '#64ffcc' },
            '11': { label: 'Eleven', theoretical: 2/36, color: '#ff64d4' },
            '12': { label: 'Twelve', theoretical: 1/36, color: '#d4ff64' }
        },
        sampler: () => {
            const roll = () => Math.floor(Math.random() * 6) + 1;
            return (roll() + roll()).toString();
        },
        defaultTracks: ['2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
        explanation: 'Each line shows how often a particular sum has appeared so far. The dashed lines show the theoretical probabilities, which are different for each sum because some totals are more likely than others.',
        formatResult: (val) => ({
            symbol: val,
            text: 'Sum of two dice'
        })
    }
};

export default EXPERIMENTS;
