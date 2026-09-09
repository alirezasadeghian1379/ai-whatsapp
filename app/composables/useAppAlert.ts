export type AppAlertType = "success" | "error" | "info";
export type AppAlertItem = {id: string; type: AppAlertType; message: string};

export function useAppAlert() {
    const alerts = useState<AppAlertItem[]>("app-alerts", () => []);

    function show(message: string, type: AppAlertType = "info", duration = type === "error" ? 6500 : 4200) {
        const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        alerts.value = [...alerts.value, {id, type, message}].slice(-4);
        if (import.meta.client) window.setTimeout(() => remove(id), duration);
        return id;
    }
    function remove(id: string) {
        alerts.value = alerts.value.filter(item => item.id !== id);
    }
    return {alerts, show, remove, success: (message: string) => show(message, "success"), error: (message: string) => show(message, "error"), info: (message: string) => show(message, "info")};
}
