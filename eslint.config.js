import js from '@eslint/js'
import globals from 'globals'
import { defineConfig } from 'eslint/config'
import stylistic from '@stylistic/eslint-plugin'

export default defineConfig(
  stylistic.configs.recommended, [
    { files: ['**/*.{js,mjs,cjs}'], plugins: { js }, extends: ['js/recommended'], languageOptions: { globals: globals.browser }, rules:
        { 'jsx-a11y/anchor-is-valid': 'off', 'jsx-a11y/click-events-have-key-events': 'off',
        } },
  ])
