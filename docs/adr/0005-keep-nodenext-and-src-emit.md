# Keep NodeNext and src-to-build emit

TypeScript 7 defaults `module` to `esnext` and `rootDir` to `./`. This package is Node ESM, so we keep `module`/`moduleResolution` at `NodeNext`, `rootDir` at `./src`, and `outDir` at `./build`. We turn on `noUncheckedSideEffectImports`, which is the new default that applies here.
