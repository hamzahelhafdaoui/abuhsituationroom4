# Working repository integrations

These are runtime integrations, not a claim that every linked repository has been integrated.

| Repository | Executed capability | Connection to the app |
|---|---|---|
| mcp-server | Actual Mapbox buffer geometry | Every automatic satellite catalogue search calculates a geodesic search envelope covering the analysis crop. Seven upstream geometry tools also run over MCP. |
| mcp-devkit-server | Actual bounding box and GeoJSON validation | Validates search geometry and generated change polygons before results are returned. Six upstream validation/conversion tools run over MCP. |
| mcp-docs-server | All three upstream documentation tools | Agent-accessible Mapbox documentation search and retrieval over MCP. This is technical documentation, not an intelligence playbook database. |
| OSIRIS | Adapted NASA EONET, GDACS and USGS adapters | Automatic five-minute refresh; existing map layer and DOCS → Feeds. Click a feed row to inspect its location; click a map point for the published source. |

The MCP server exposes 16 read-only upstream tools. Run `npm run mcp`; stdio is for an MCP client, not a browser page. Configure your client with command `node` and the absolute path to `scripts/mcp-server.mjs`, with this repository as its working directory. No token is needed for the selected tools. No LLM credentials, client configuration, or autonomous agent execution is claimed to be installed. Account/token mutation tools are not exposed.

The app's satellite pipeline uses direct server-side upstream tool calls; it does not need a separate MCP process. No Mapbox package or access token should be included in browser assets. No paid imagery or Mapbox API requests are used in this integration.

Hazard events are public reported observations, not damage determinations. Their locations can be broad event locations. Provider dates remain visible. Failed providers have independent status; failed refreshes are not presented as fresh data. Cross-provider reports remain distinct because matching similar headlines is insufficient evidence that they describe the same event.

## Verification

`npm run test:integrations` exercises real MCP stdio discovery/execution, upstream geometry generation and validation, malformed provider data, unsafe URLs, and deduplication. On 20 September 2026, live provider checks returned EONET 2 events, USGS 45, and GDACS 40. Counts change over time. Typecheck passed. See build and browser verification in the PR.

## Still outstanding

OSM-AI-helper/techniques model training and ONNX inference, Astra vector memory, OSINT-War-Room/GeoIntel entity workflows, and additional rendering integrations have not been implemented. GeoIntel is a Gemini-backed photo geolocation package and requires credentials; it is not a corporate ownership registry. The current cinematic camera is the app's existing implementation, not an imported gods-eye-view renderer. mapbox-agent-skills contains agent guidance, not a replacement map engine.

No military-site discovery models, armed-actor tracking enhancements, or projected military flight paths are included. Public civilian/environmental analysis remains the implemented scope. AIS still has no live provider wired; the existing maritime layer must not be described as real-time AIS.
