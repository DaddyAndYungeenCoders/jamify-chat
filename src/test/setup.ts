// Mock logger to avoid console output during tests
jest.mock('../utils/logger', () => ({
    logger: {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
    },
}));

// Set test configuration
process.env.NODE_ENV = 'test';