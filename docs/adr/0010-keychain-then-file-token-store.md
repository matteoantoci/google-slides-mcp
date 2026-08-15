# Keychain first, file if the keychain is missing

This process persists the Google credential in the OS keychain. It writes `~/.config/google-slides-mcp/credential.json` with mode `0600` when the keychain is not available. Env can override one field. Env is never required. A first start with a missing refresh token opens a loopback page, then Google consent. We do this so a host config does not hold the refresh token. MCP authorization stays off.
