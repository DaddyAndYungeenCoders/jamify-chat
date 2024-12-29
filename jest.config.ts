// jest.config.js
module.exports = {
    preset: 'ts-jest',  // Indique à Jest d'utiliser ts-jest
    testEnvironment: 'node',  // Environnement de test Node.js
    moduleFileExtensions: ['ts', 'js'],  // Extensions de fichiers à gérer
    transform: {
        '^.+\\.(ts|tsx)$': 'ts-jest'  // Transformer les fichiers .ts avec ts-jest
    },
    testMatch: ['**/__tests__/**/*.spec.ts'],  // Pattern pour trouver les fichiers de test
    roots: ['<rootDir>/src'],  // Dossier racine des tests
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1'  // Pour gérer les alias de chemins si vous en utilisez
    },
    clearMocks: true,  // Réinitialise les mocks entre les tests
    coverageDirectory: 'coverage',  // Dossier pour les rapports de couverture
    coveragePathIgnorePatterns: [
        '/node_modules/',
        '/dist/'
    ]
};