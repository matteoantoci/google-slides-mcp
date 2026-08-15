const escapeHtml = (value: string): string =>
  value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

const page = (title: string, body: string): string => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${title}</title>
</head>
<body>
  ${body}
</body>
</html>`;

export const setupPage = (clientId: string, clientSecret: string, errorText: string): string => {
  const errorBlock = errorText === '' ? '' : `<p>${escapeHtml(errorText)}</p>`;
  return page(
    'Google Slides MCP setup',
    `${errorBlock}
    <h1>Google Slides MCP setup</h1>
    <p>Paste the Desktop client id and client secret from Google Cloud. Then continue to Google consent.</p>
    <form method="post" action="/setup">
      <p><label>Client id <input name="clientId" value="${escapeHtml(clientId)}" required autocomplete="off"></label></p>
      <p><label>Client secret <input name="clientSecret" value="${escapeHtml(clientSecret)}" required autocomplete="off"></label></p>
      <p><button type="submit">Continue to Google</button></p>
    </form>`
  );
};

export const successPage = (): string =>
  page(
    'Google Slides MCP setup',
    '<h1>Setup complete</h1><p>You can close this window. The server keeps the Google credential in the token store.</p>'
  );

export const errorPage = (message: string): string =>
  page('Google Slides MCP setup', `<h1>Setup failed</h1><p>${escapeHtml(message)}</p>`);
