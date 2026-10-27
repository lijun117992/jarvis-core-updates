package com.jarvis.notificationbridge;

import android.app.Notification;
import android.app.Activity;
import android.app.ActivityOptions;
import android.app.PendingIntent;
import android.content.ComponentName;
import android.content.Context;
import android.service.notification.NotificationListenerService;
import android.service.notification.StatusBarNotification;
import java.util.concurrent.ConcurrentHashMap;

public final class CaptureService extends NotificationListenerService {
    static volatile boolean connected;
    private static final ConcurrentHashMap<String, PendingIntent> links = new ConcurrentHashMap<>();
    @Override public void onListenerConnected() {
        connected = true;
        try { StatusBarNotification[] active = getActiveNotifications(); if (active != null) for (int i = Math.max(0, active.length - 100); i < active.length; i++) receive(active[i]); }
        catch (RuntimeException e) { getSharedPreferences("health", 0).edit().putString("error", "重连补收失败，请检查系统权限").apply(); }
    }
    @Override public void onListenerDisconnected() { connected = false; rebind(this); }
    @Override public void onDestroy() { connected = false; super.onDestroy(); }
    @Override public void onNotificationPosted(StatusBarNotification sbn) { receive(sbn); }
    private void receive(StatusBarNotification sbn) {
        if (sbn == null || !ReceiptStore.allowed(sbn.getPackageName())) return;
        Notification n = sbn.getNotification();
        if (n == null || n.extras == null || (n.flags & Notification.FLAG_GROUP_SUMMARY) != 0) return;
        String sender = ReceiptStore.clipped(n.extras.getCharSequence(Notification.EXTRA_TITLE), 200);
        CharSequence big = n.extras.getCharSequence(Notification.EXTRA_BIG_TEXT);
        String text = ReceiptStore.clipped(big == null ? n.extras.getCharSequence(Notification.EXTRA_TEXT) : big, 2000).trim();
        if (text.isEmpty()) return;
        String key = ReceiptStore.eventKey(sbn, sender, text);
        try {
            // Commit the receipt before any later AI work. No network or API key.
            ReceiptStore.get(this).add(sbn.getPackageName(), sender, text, sbn.getPostTime(), key);
            if (n.contentIntent != null) { if (links.size() >= 5000) links.clear(); links.put(key, n.contentIntent); }
            getSharedPreferences("health", 0).edit().putLong("last_received", System.currentTimeMillis()).remove("error").apply();
        } catch (RuntimeException e) { getSharedPreferences("health", 0).edit().putString("error", "本机通知数据库写入失败").apply(); }
    }
    static boolean open(Activity activity, String eventKey) {
        PendingIntent intent = links.get(eventKey);
        if (intent == null || !activity.hasWindowFocus()) return false;
        try {
            if (android.os.Build.VERSION.SDK_INT >= 34) {
                ActivityOptions options = ActivityOptions.makeBasic();
                int mode = android.os.Build.VERSION.SDK_INT >= 36 ? ActivityOptions.class.getField("MODE_BACKGROUND_ACTIVITY_START_ALLOW_IF_VISIBLE").getInt(null) : ActivityOptions.MODE_BACKGROUND_ACTIVITY_START_ALLOWED;
                options.setPendingIntentBackgroundActivityStartMode(mode);
                intent.send(activity, 0, null, null, null, null, options.toBundle());
            } else intent.send();
            return true; // Request dispatched, not proof that the target rendered.
        } catch (PendingIntent.CanceledException | ReflectiveOperationException | RuntimeException e) { links.remove(eventKey); return false; }
    }
    static void clearLinks() { links.clear(); }
    static void rebind(Context context) { try { requestRebind(new ComponentName(context, CaptureService.class)); } catch (RuntimeException ignored) {} }
}
