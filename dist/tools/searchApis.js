import { SearchApisInputSchema, SearchApisOutputSchema } from "../schema/api.js";
export function registerSearchApisTool(server, store) {
    server.registerTool("search_apis", {
        description: "Search APIs by keyword, tag, and HTTP method.",
        inputSchema: SearchApisInputSchema.shape
    }, async (args) => {
        const data = SearchApisOutputSchema.parse({
            ...store.getMeta(),
            ...store.searchApis(args)
        });
        return asToolResult(data);
    });
}
function asToolResult(data) {
    return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        structuredContent: data
    };
}
