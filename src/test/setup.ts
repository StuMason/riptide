// This file will be used by Vitest for setting up the test environment
// We'll be using this file for setting up any mocks or global configuration for tests

import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Import jest-dom without assigning it
import '@testing-library/jest-dom';

// Automatically clean up after each test
afterEach(() => {
  cleanup();
});
