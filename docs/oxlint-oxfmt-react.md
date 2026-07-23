# Oxlint and Oxfmt for React, TypeScript, and Vite+

Research date: 2026-07-23.

## Recommendation

Keep both configurations in `vite.config.ts`. Vite+ reads Oxlint settings
from `lint` and Oxfmt settings from `fmt`; `vp check` combines formatting,
linting, and type checking. Separate `.oxlintrc` and `.oxfmtrc` files would
duplicate the toolchain's intended configuration surface.

This is a strict but practical baseline:

```ts
lint: {
  categories: {
    correctness: 'error',
    suspicious: 'error',
    perf: 'warn',
  },
  env: {
    browser: true,
    builtin: true,
    node: true,
  },
  ignorePatterns: ['coverage/**', 'dist/**'],
  options: {
    denyWarnings: true,
    reportUnusedDisableDirectives: 'error',
    typeAware: true,
    typeCheck: true,
  },
  plugins: [
    'eslint',
    'typescript',
    'unicorn',
    'oxc',
    'react',
    'jsx-a11y',
    'import',
    'react-perf',
  ],
  rules: {
    eqeqeq: 'error',
    'import/no-cycle': 'error',
    'import/no-unassigned-import': ['error', {
      allow: ['**/*.css'],
    }],
    'react/only-export-components': ['warn', {
      allowConstantExport: true,
    }],
    'react/react-in-jsx-scope': 'off',
    'react/rules-of-hooks': 'error',
    'typescript/consistent-type-imports': 'warn',
  },
},
fmt: {
  ignorePatterns: ['coverage/**', 'dist/**'],
  semi: false,
  singleQuote: true,
  sortImports: true,
  sortPackageJson: true,
  sortTailwindcss: true,
},
```

The severity choices are project policy rather than an official preset.
`correctness` catches code that is wrong or useless and is Oxlint's default
category. `suspicious` is valuable for likely mistakes, while `perf` is better
introduced as warnings because performance rules can be context-sensitive.
Do not globally enable `pedantic`, `style`, `restriction`, or `nursery` at the
start: pedantic rules can have false positives, restriction rules represent
case-by-case policy, and nursery rules are explicitly unstable. Opt individual
rules into those categories when they express an architectural decision.

With `denyWarnings: true`, warnings still fail CI. Their value is to communicate
that they represent a softer policy than correctness errors.

## Plugins

Oxlint's default plugins are `eslint`, `typescript`, `unicorn`, and `oxc`.
Setting `plugins` replaces that default list; it does not extend it. Therefore
an explicit list must retain all four before adding:

- `react`, which includes rules originating from React, React Hooks, React
  Refresh, and React Compiler
- `jsx-a11y` for accessible JSX
- `import` for module-boundary checks
- `react-perf` for React-specific performance checks

Add `vitest` only if test-specific rules are wanted, preferably in an override
for `src/**/*.test.{ts,tsx}`. There is no reason for a browser-only app to add
the `node` plugin merely because `vite.config.ts` runs in Node; the Node
environment globals and the Node plugin rule set are separate concerns.

Source: [Oxlint built-in plugins](https://oxc.rs/docs/guide/usage/linter/plugins).

## React rules

Enabling the `react` plugin plus `correctness` turns on
`react/exhaustive-deps`; it checks Hook dependency lists. However,
`react/rules-of-hooks` belongs to the pedantic category, so it must be enabled
explicitly when pedantic is not globally enabled.

For Vite Fast Refresh, `react/only-export-components` is useful with
`allowConstantExport: true`, which the rule documentation says is supported by
the Vite preset. Keep it a warning initially because registry and route modules
may intentionally mix component and non-component exports.

`react/react-compiler` runs React Compiler analysis but is experimental,
classified as nursery, and off by default. Leave it off unless the project
actually adopts React Compiler and accepts churn in the rule.

Sources:

- [Exhaustive dependencies](https://oxc.rs/docs/guide/usage/linter/rules/react/exhaustive-deps)
- [Rules of Hooks](https://oxc.rs/docs/guide/usage/linter/rules/react/rules-of-hooks)
- [Fast Refresh exports](https://oxc.rs/docs/guide/usage/linter/rules/react/only-export-components)
- [Experimental React Compiler rule](https://oxc.rs/docs/guide/usage/linter/rules/react/react-compiler.html)

## Imports, accessibility, and performance

The category configuration activates the applicable correctness, suspicious,
and performance rules from every enabled plugin. Avoid manually listing those
rules again unless changing their severity or options.

`import/no-cycle` is worth an explicit error because this project intends to
preserve strong boundaries between `app`, `platform`, `ui`, and individual
games. `import/no-unassigned-import` should allow CSS side-effect imports rather
than being disabled wholesale.

The `jsx-a11y` plugin's correctness rules catch issues such as interactive
controls without accessible labels. This is particularly important for the
icon-heavy and touch-oriented mobile UI.

React performance rules can flag fresh arrays, objects, and functions passed as
props. They are useful signals, but a blanket error policy can encourage
unnecessary memoization. The category-level warning is the better initial
tradeoff.

Sources:

- [Import cycles](https://oxc.rs/docs/guide/usage/linter/rules/import/no-cycle)
- [Side-effect imports](https://oxc.rs/docs/guide/usage/linter/rules/import/no-unassigned-import.html)
- [Accessible control labels](https://oxc.rs/docs/guide/usage/linter/rules/jsx_a11y/control-has-associated-label)
- [React array-prop performance rule](https://oxc.rs/docs/guide/usage/linter/rules/react_perf/jsx-no-new-array-as-prop)

## Type-aware linting

Vite+ explicitly recommends enabling both:

```ts
options: {
  typeAware: true,
  typeCheck: true,
}
```

This makes `vp lint` and `vp check` use the full type-aware path, and makes
`vp check` the single static-check command. Vite+ uses the TypeScript Go
toolchain and tsgolint for this path.

Upstream Oxlint currently requires TypeScript 7+ for type-aware linting and
does not support legacy options such as `compilerOptions.baseUrl`. The repo's
TypeScript 7 configuration is suitable; aliases should use modern `paths`
resolution rather than `baseUrl`.

Sources:

- [Vite+ lint configuration](https://viteplus.dev/config/lint)
- [Vite+ check guide](https://viteplus.dev/guide/check)
- [Oxlint type-aware linting](https://oxc.rs/docs/guide/usage/linter/type-aware.html)

## Formatter

Oxfmt already has React-friendly defaults: 100-column width, two-space
indentation, trailing commas, parenthesized arrow parameters, and final
newlines. `semi: false` and `singleQuote: true` are taste choices that preserve
this repo's existing style, not performance optimizations.

Enable the three useful built-in sorters:

- `sortImports` is off by default. Its default grouping separates built-ins,
  external packages, internal aliases, relative imports, styles, and unknown
  imports. The default internal patterns include `@/`, matching this repo.
- `sortTailwindcss` is off by default and uses the same ordering algorithm as
  `prettier-plugin-tailwindcss`. Passing `true` is sufficient for Tailwind v4;
  a Tailwind v3 config path is unnecessary here.
- `sortPackageJson` is on by default, but setting it explicitly records project
  intent.

Sources:

- [Oxfmt configuration](https://oxc.rs/docs/guide/usage/formatter/config.html)
- [Oxfmt sorting](https://oxc.rs/docs/guide/usage/formatter/sorting.html)
- [Oxfmt configuration reference](https://oxc.rs/docs/guide/usage/formatter/config-file-reference)
- [Vite+ format configuration](https://viteplus.dev/config/fmt)

## Vite+ 0.2.5 and 0.2.6 compatibility

The common configuration above is supported by both versions:

- The locally installed 0.2.5 dependency graph contains Oxlint 1.73.0 and
  Oxfmt 0.58.0.
- The resolved 0.2.6 dependency graph contains Oxlint 1.75.0 and Oxfmt 0.60.0.
- Both bundled Oxfmt schemas contain `sortImports`, `sortTailwindcss`, and
  `sortPackageJson`.
- Vite+ documents the embedded `lint`, `fmt`, and `check` blocks and recommends
  `typeAware` plus `typeCheck`.

Online documentation tracks the latest release rather than preserving a page
for every 0.2.x patch. Consequently, the authoritative compatibility check
after changing the pinned Vite+ version is the local `defineConfig` TypeScript
type plus `vp check`. Avoid copying newer schema fields if the pinned package's
types reject them.

Sources:

- [Vite+ configuration model](https://viteplus.dev/config/)
- [Vite+ check configuration](https://viteplus.dev/config/check)
- Local primary artifacts:
  `node_modules/.pnpm/oxfmt@0.58.0_*/node_modules/oxfmt/configuration_schema.json`
  and
  `node_modules/.pnpm/oxfmt@0.60.0_*/node_modules/oxfmt/configuration_schema.json`

## Operational notes

- Keep `check.fmt` and `check.lint` enabled so `vp check` remains the canonical
  command.
- Use `vp check --fix` for safe formatter and linter fixes, then review changes.
  Some rules label their fixes as dangerous; do not apply those mechanically.
- `vite.config.ts` is loaded even for lint and format commands. If plugin
  initialization becomes slow or side-effectful, Vite+ recommends
  `lazyPlugins` for build plugins.
- The Oxc editor extension can be pointed at `./vite.config.ts` so editor
  diagnostics use the same embedded configuration as the CLI.

Sources:

- [Vite+ troubleshooting and lazy plugins](https://viteplus.dev/guide/troubleshooting)
- [Vite+ format guide](https://viteplus.dev/guide/fmt)
- [Vite+ lint guide](https://viteplus.dev/guide/lint)
