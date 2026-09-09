/**
 * Product modules that are intentionally not exposed in the user dashboard.
 * Keep the API closed as well, so hiding a menu item never becomes a bypass.
 */
const disabledModules = new Set(["wallet"]);

export function assertUserModuleEnabled(module: string) {
    if (disabledModules.has(module)) {
        throw createError({statusCode: 404, statusMessage: "This section is not available."});
    }
}
