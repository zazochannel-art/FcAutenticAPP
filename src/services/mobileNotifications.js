import { Platform } from "react-native";
import * as Notifications from "expo-notifications";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function scheduleLocalReminder(title, body, seconds = 5) {
  if (Platform.OS === "web") return { scheduled: false, reason: "web-preview" };

  const current = await Notifications.getPermissionsAsync();
  let status = current.status;
  if (status !== "granted") {
    const requested = await Notifications.requestPermissionsAsync();
    status = requested.status;
  }
  if (status !== "granted") return { scheduled: false, reason: "permission-denied" };

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "FC Autentic",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const id = await Notifications.scheduleNotificationAsync({
    content: { title, body, sound: "default" },
    trigger: { seconds },
  });

  return { scheduled: true, id };
}
