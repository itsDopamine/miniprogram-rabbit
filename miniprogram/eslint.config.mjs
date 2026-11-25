// ESLint 配置放在 miniprogramRoot 内：与 node_modules 同层，import 才能解析到 @eslint/js
import js from '@eslint/js'
import globals from 'globals'

// ESLint 不认识小程序全局对象，不声明会让 no-undef 全部报红
const WX_GLOBALS = {
  wx: 'readonly',
  App: 'readonly',
  Page: 'readonly',
  Component: 'readonly',
  Behavior: 'readonly',
  getApp: 'readonly',
  getCurrentPages: 'readonly',
  requirePlugin: 'readonly',
  // 开发者工具与真机都提供，不属于 ES / Node
  console: 'readonly',
  setTimeout: 'readonly',
  clearTimeout: 'readonly',
  setInterval: 'readonly',
  clearInterval: 'readonly'
}

export default [
  {
    // miniprogram_npm 是「构建 npm」的产物，node_modules 是依赖，都不该被 lint
    ignores: ['node_modules/**', 'miniprogram_npm/**']
  },
  js.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: {
      // 源码是 ESM，由开发者工具编译成 CommonJS
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.es2021, ...WX_GLOBALS }
    },
    rules: {
      // 格式统一交给 Prettier，这里只留正确性规则
      eqeqeq: ['error', 'smart'],
      'no-var': 'error',
      'prefer-const': 'error',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }]
    }
  }
]
