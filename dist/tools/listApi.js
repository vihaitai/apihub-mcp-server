import { ListApiInputSchema, ListApiOutputSchema } from "../schema/api.js";
export function registerListApiTool(server, store) {
    server.registerTool("list_api", {
        description: "List API summaries with pagination and optional filters.",
        inputSchema: ListApiInputSchema.shape
    }, async (args) => {
        const data = ListApiOutputSchema.parse({
            ...store.getMeta(),
            ...store.listApi(args)
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
