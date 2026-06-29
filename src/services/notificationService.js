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
  }
};
