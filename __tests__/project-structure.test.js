/**
 * Test-Driven Development: Project Structure Validation
 * 
 * These tests define the expected project structure and configuration
 * before any production code is written.
 */

const fs = require('fs');
const path = require('path');

describe('Project Structure', () => {
  describe('Chrome Extension Structure', () => {
    test('should have manifest.json with Manifest V3 configuration', () => {
      const manifestPath = path.join(process.cwd(), 'manifest.json');
      expect(fs.existsSync(manifestPath)).toBe(true);

      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      expect(manifest.manifest_version).toBe(3);
      expect(manifest.name).toBeDefined();
      expect(manifest.version).toBeDefined();
      expect(manifest.description).toBeDefined();
    });

    test('should have required extension directories', () => {
      const requiredDirs = [
        'src',
        'src/content',
        'src/background',
        'src/popup',
        'src/options',
        'src/shared'
      ];

      requiredDirs.forEach(dir => {
        const dirPath = path.join(process.cwd(), dir);
        expect(fs.existsSync(dirPath)).toBe(true);
        expect(fs.statSync(dirPath).isDirectory()).toBe(true);
      });
    });

    test('should have TypeScript configuration', () => {
      const tsconfigPath = path.join(process.cwd(), 'tsconfig.json');
      expect(fs.existsSync(tsconfigPath)).toBe(true);

      const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
      expect(tsconfig.compilerOptions).toBeDefined();
      expect(tsconfig.compilerOptions.target).toBeDefined();
      expect(tsconfig.compilerOptions.module).toBeDefined();
    });
  });

  describe('Testing Framework Configuration', () => {
    test('should have Jest configuration', () => {
      const jestConfigPath = path.join(process.cwd(), 'jest.config.js');
      expect(fs.existsSync(jestConfigPath)).toBe(true);
    });

    test('should have package.json with required dependencies', () => {
      const packagePath = path.join(process.cwd(), 'package.json');
      expect(fs.existsSync(packagePath)).toBe(true);

      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      expect(packageJson.devDependencies).toBeDefined();
      expect(packageJson.devDependencies.jest).toBeDefined();
      expect(packageJson.devDependencies.typescript).toBeDefined();
      expect(packageJson.devDependencies['@types/chrome']).toBeDefined();
    });

    test('should have test helper utilities directory', () => {
      const helpersPath = path.join(process.cwd(), '__tests__/helpers');
      expect(fs.existsSync(helpersPath)).toBe(true);
      expect(fs.statSync(helpersPath).isDirectory()).toBe(true);
    });
  });
});