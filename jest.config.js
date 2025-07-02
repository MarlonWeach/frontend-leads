const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // Fornecer o caminho para o seu aplicativo Next.js
  dir: './',
});

// Configuração personalizada do Jest
const customJestConfig = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js', '<rootDir>/test/setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/src/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    // Mock dos componentes de gráficos para evitar problemas de ES Modules
    '^@/components/ui/AnimatedBarChart$': '<rootDir>/src/components/ui/AnimatedBarChart.jsx',
    '^@/components/ui/AnimatedLineChart$': '<rootDir>/src/components/ui/AnimatedLineChart.jsx',
    '^@/components/ui/AnimatedPieChart$': '<rootDir>/src/components/ui/AnimatedPieChart.jsx'
  },
  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }]
  },
  transformIgnorePatterns: [
    '/node_modules/(?!(@supabase|@supabase/.*|@supabase-js|@supabase-js/.*|@nivo|d3|d3-.*|d3-interpolate|d3-array|d3-color|d3-format|d3-time|d3-time-format|d3-scale|d3-shape|d3-path|d3-ease|d3-timer|d3-transition|d3-selection|d3-drag|d3-zoom|d3-brush|d3-chord|d3-force|d3-geo|d3-hierarchy|d3-polygon|d3-quadtree|d3-random|d3-sankey|d3-symbol|d3-voronoi|d3-dsv|d3-fetch|d3-delaunay|d3-contour|d3-hexbin|d3-histogram|d3-threshold|d3-bisect|d3-ticks|d3-utc)/)'
  ],
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json'
    }
  },
  moduleDirectories: ['node_modules', '<rootDir>/src'],
  roots: ['<rootDir>/src', '<rootDir>/test'],
  testEnvironmentOptions: {
    customExportConditions: ['node', 'node-addons']
  }
};

module.exports = createJestConfig(customJestConfig); 