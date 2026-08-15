# Whole-repo pre-commit gate

Every commit runs oxfmt, oxlint with type-aware rules, and `tsc --noEmit` on the whole repo. `simple-git-hooks` installs the hook. `npm run build` is the only emit path. We do not use lint-staged. We do not add CI in this change.
