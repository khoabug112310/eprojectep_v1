// Vitest Configuration for CineBook Form Security Testing
// Comprehensive test setup with coverage, mocking, and performance monitoring

import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    // Test Environment
    environment: 'jsdom',
    
    // Global Setup
    setupFiles: ['./src/tests/setup.ts'],
    
    // Test Files
    include: [
      'src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      'src/tests/**/*.test.{js,ts,jsx,tsx}'
    ],
    exclude: [
      'node_modules',
      'dist',
      '.idea',
      '.git',
      '.cache'
    ],
    
    // Globals
    globals: true,
    
    // Coverage Configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: [
        'src/services/**/*.ts',
        'src/components/security/**/*.tsx',
        'src/hooks/**/*.ts'
      ],
      exclude: [
        'src/**/*.test.ts',
        'src/**/*.test.tsx',
        'src/tests/**/*',
        'src/**/*.d.ts',
        'src/main.tsx',
        'src/vite-env.d.ts'
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        },
        'src/services/FormSecurityMiddleware.ts': {
          branches: 90,
          functions: 90,
          lines: 90,
          statements: 90
        },
        'src/services/ValidationRulesEngine.ts': {
          branches: 85,
          functions: 85,
          lines: 85,
          statements: 85
        }
      }
    },
    
    // Test Timeout
    testTimeout: 10000,
    hookTimeout: 10000,
    
    // Reporters
    reporter: ['verbose', 'json', 'html'],
    outputFile: {
      json: './test-results/results.json',
      html: './test-results/index.html'
    },
    
    // Watch Mode
    watch: false,
    
    // Pool Options for Performance
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
        maxThreads: 4,
        minThreads: 1
      }
    },
    
    // Mock Settings
    clearMocks: true,
    mockReset: true,
    restoreMocks: true,
    
    // Benchmark Configuration
    benchmark: {
      include: ['**/*.bench.{js,ts}'],
      exclude: ['node_modules'],
      reporter: 'verbose'
    },
    
    // Performance Monitoring
    logHeapUsage: true,
    
    // Fail Fast on First Error (for CI)
    bail: process.env.CI ? 1 : 0,
    
    // Retry Failed Tests
    retry: process.env.CI ? 2 : 0,
    
    // Sequence Options
    sequence: {
      concurrent: true,
      shuffle: false,
      hooks: 'parallel'
    }
  },
  
  // Path Resolution
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@components': resolve(__dirname, './src/components'),
      '@services': resolve(__dirname, './src/services'),
      '@hooks': resolve(__dirname, './src/hooks'),
      '@tests': resolve(__dirname, './src/tests'),
      '@styles': resolve(__dirname, './src/styles')
    }
  },
  
  // Define Global Variables for Tests
  define: {
    'import.meta.env.VITE_TEST_MODE': true,
    'import.meta.env.VITE_API_BASE_URL': JSON.stringify('http://localhost:8000/api'),
    'import.meta.env.VITE_CSRF_COOKIE_NAME': JSON.stringify('XSRF-TOKEN')
  }
});