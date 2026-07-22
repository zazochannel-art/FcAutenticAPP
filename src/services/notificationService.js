import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

Notifications.setNotificationHandler({ handleNotification: async () => ({ shouldShowAlert: true, shouldPlaySound: true, shouldSetBadge: false }) });

export const notificationService = {
  async register() {
    const current = await Notifications.getPermissionsAsync();
    let status = current.status;
    if (status !== "granted") {
      const requested = await Notifications.requestPermissionsAsync();
      status = requested.status;
    }
    if (status !== "granted") throw new Error("Permisiunea pentru notificări nu a fost acceptată.");
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", { name: "default", importance: Notifications.AndroidImportance.DEFAULT });
    }
    return true;
  },
  async scheduleLocal(title, body, seconds = 5) {
    await this.register();
    return Notifications.scheduleNotificationAsync({ content: { title, body }, trigger: { seconds } });
  },
  // Programează un reminder local cu `leadHours` înainte de momentul `when`
  // (Date). Întoarce null dacă momentul e prea aproape/în trecut.
  async scheduleReminder(title, body, when, leadHours = 2) {
    if (!(when instanceof Date) || Number.isNaN(when.getTime())) return null;
    const seconds = Math.floor((when.getTime() - Date.now()) / 1000) - leadHours * 3600;
    if (seconds <= 0) return null;
    await this.register();
    return Notifications.scheduleNotificationAsync({ content: { title, body }, trigger: { seconds } });
  },
};
