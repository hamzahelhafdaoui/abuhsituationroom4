# Third-party integrations

## OSIRIS

Hazard provider selection and normalization in `src/lib/hazards.ts` and `hazard-service.ts` are adapted from [simplifaisoul/osiris](https://github.com/simplifaisoul/osiris), `src/app/api/weather/route.ts` (blob 3537f8132430de2bb005c2b7741021f2c3903db7) and `src/app/api/earthquakes/route.ts` (blob 28933981f9e39c831667c37a8da963a7e8400982). Changes include strict coordinates, safe source URLs, per-provider failures, caching, deduplication, chronological sorting, and retaining provider severity rather than inferring it from event category.

+MIT License

Copyright (c) 2026 simplifaisoul

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## Mapbox MCP packages

Official MIT-licensed runtime packages: @mapbox/mcp-server 0.14.0, @mapbox/mcp-devkit-server 0.8.2, @mapbox/mcp-docs-server 0.3.1. Copyright Mapbox, Inc. Full licenses ship with each package. The user-supplied forks were inspected; official published packages are executed directly rather than copying their source.
