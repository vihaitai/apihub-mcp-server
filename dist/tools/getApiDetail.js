import { GetApiDetailInputSchema, GetApiDetailOutputSchema } from "../schema/api.js";
import { NotFoundError } from "../swagger/store.js";
export function registerGetApiDetailTool(server, store) {
    server.registerTool("get_api_detail", {
        description: "Get detailed API definition by operationId or method/path.",
        inputSchema: GetApiDetailInputSchema.shape
    }, async (args) => {
        try {
            const data = GetApiDetailOutputSchema.parse({
                ...store.getMeta(),
                item: store.getApiDetail(args)
            });
            return asToolResult(data);
        }
        catch (error) {
            if (error instanceof NotFoundError) {
                return {
                    content: [{ type: "text", text: error.message }],
                    isError: true
                };
            }
            throw error;
        }
    });
}
function asToolResult(data) {
    return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        structuredContent: data
    };
}
