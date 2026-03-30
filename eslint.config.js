import eslint from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import globals from 'globals';

export default [
  {
    rules: {
      'no-unused-vars': 'off',
    },
  },
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        RTCPeerConnection: 'readonly',
        RTCDataChannel: 'readonly',
        RTCIceServer: 'readonly',
        RTCIceCandidateInit: 'readonly',
        RTCSessionDescriptionInit: 'readonly',
        RTCPeerConnectionState: 'readonly',
        crypto: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
  {
    ignores: ['dist', 'node_modules', '*.config.js', 'packages/webrtc/dist'],
  },
];
