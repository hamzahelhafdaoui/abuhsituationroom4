import { n as TSS_SERVER_FUNCTION } from "./ssr.mjs";
//#region D:/Codex-work/ahsr-20260920/node_modules/.nitro/vite/services/ssr/assets/createServerRpc-Bq-hU5SP.js
var createServerRpc = (serverFnMeta, splitImportFn) => {
	const url = "/_serverFn/" + serverFnMeta.id;
	return Object.assign(splitImportFn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
//#endregion
export { createServerRpc as t };
