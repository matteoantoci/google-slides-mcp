# Google Slides MCP Server

This process is an MCP server for the Google Slides API. A host talks to it on stdio. The first start opens a browser. You paste a Desktop client id and client secret. Google consent follows. Later starts read the token store.

## Prerequisites

- Node.js 20 or later
- A Google Cloud project with the Google Slides API enabled
- An OAuth Desktop client id and client secret

You do not need a refresh token. You do not need process env.

## Claude Code

1. Create a Desktop OAuth client. Use the Google Auth platform steps below.
2. In Claude Code run:

```
/plugin marketplace add matteoantoci/claude-plugins
/plugin install google-slides-mcp@matteoantoci-plugins
```

3. Run `/reload-plugins` if Claude asks.
4. The first start opens a browser. Paste the client id and the client secret. Finish Google consent.

Later sessions read the token store. No host JSON. No env.

## Other hosts

1. Clone this repository.
2. Run `npm install`.
3. Run `npm run build`.
4. Create a Desktop OAuth client in [Google Cloud Console](https://console.cloud.google.com/):
   - Open [Google Auth platform](https://console.cloud.google.com/auth/branding).
   - If the page says the platform is not configured, click **Get Started**.
   - App name: `Google Slides MCP`. User support email: your address.
   - Audience: **External**.
   - Contact email: your address. Agree to the policy. Click **Create**.
   - Open [Audience](https://console.cloud.google.com/auth/audience). Add your Gmail as a test user.
   - Open [Data Access](https://console.cloud.google.com/auth/scopes). Add `https://www.googleapis.com/auth/presentations` and `https://www.googleapis.com/auth/drive.readonly`. Save.
   - Open [Clients](https://console.cloud.google.com/auth/clients). Click **Create Client**. Application type: **Desktop app**. Name: `Google Slides MCP Desktop`. Click **Create**.
   - Copy the client id and the client secret.
5. Run `npm run start`. Paste the client id and the client secret. Finish Google consent. Then stop the process.
6. Point the host at `node /path/to/google-slides-mcp/build/index.js`. Do not set env.

Example host config:

```json
"google-slides-mcp": {
  "transportType": "stdio",
  "command": "node",
  "args": [
    "/path/to/google-slides-mcp/build/index.js"
  ]
}
```

Replace the path with the compiled `build/index.js` on your machine.

## First start

The process opens a loopback page.

- If the store has no client id or client secret, paste those two values.
- Continue to Google consent.
- Close the success page.

The process writes the Google credential to the token store. It tries the OS keychain first. It uses `~/.config/google-slides-mcp/credential.json` if the keychain is not available. File mode is `0600`.

Later starts use the store. No browser.

`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `GOOGLE_REFRESH_TOKEN` can override one field. They are never required. If env supplies a missing field, the process writes the merged credential to the store.

## Run without a host

```bash
npm run start
```

The process listens on stdio. Stderr prints `Google Slides MCP server running and connected via stdio.`

## Available Tools

- **`create_presentation`**: Creates a new Google Slides presentation.
  - **Input:**
    - `title` (string, required): The title for the new presentation.
  - **Output:** JSON object representing the created presentation details.

- **`get_presentation`**: Retrieves details about an existing presentation.
  - **Input:**
    - `presentationId` (string, required): The ID of the presentation to retrieve.
    - `fields` (string, optional): A field mask (e.g., "slides,pageSize") to limit the returned data.
  - **Output:** JSON object representing the presentation details.

- **`batch_update_presentation`**: Applies a series of updates to a presentation. This is the primary method for modifying slides (adding text, shapes, images, creating slides, etc.).
  - **Input:**
    - `presentationId` (string, required): The ID of the presentation to update.
    - `requests` (array, required): An array of request objects defining the updates. Refer to the [Google Slides API `batchUpdate` documentation](https://developers.google.com/slides/api/reference/rest/v1/presentations/batchUpdate#requestbody) for the structure of individual requests.
    - `writeControl` (object, optional): Controls write request execution (e.g., using revision IDs).
  - **Output:** JSON object representing the result of the batch update.

- **`get_page`**: Retrieves details about a specific page (slide) within a presentation.
  - **Input:**
    - `presentationId` (string, required): The ID of the presentation to retrieve.
    - `pageObjectId` (string, required): The object ID of the page (slide) to retrieve.
  - **Output:** JSON object representing the page details.

- **`summarize_presentation`**: Extracts and formats all text content from a presentation for easier summarization.
  - **Input:**
    - `presentationId` (string, required): The ID of the presentation to summarize.
    - `include_notes` (boolean, optional): Whether to include speaker notes in the summary. Defaults to false.
  - **Output:** JSON object containing:
    - `title`: The presentation's title
    - `slideCount`: Total number of slides
    - `lastModified`: Revision information
    - `slides`: Array of slide objects containing:
      - `slideNumber`: Position in presentation
      - `slideId`: Object ID of the slide
      - `content`: All text extracted from the slide
      - `notes`: Speaker notes (if requested and available)
