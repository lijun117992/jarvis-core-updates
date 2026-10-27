package com.jarvis.notificationbridge;

import android.app.Activity;
import android.app.AlertDialog;
import android.app.NotificationManager;
import android.content.ClipData;
import android.content.ComponentName;
import android.content.Intent;
import android.graphics.Color;
import android.os.Bundle;
import android.os.Handler;
import android.provider.Settings;
import android.view.View;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;

public final class BridgeActivity extends Activity {
    private TextView status;
    private final Handler timer = new Handler(android.os.Looper.getMainLooper());
    private final Runnable refresh = new Runnable() { public void run() { refreshStatus(); timer.postDelayed(this, 3000); } };
    private LinearLayout root;
    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        ScrollView scroll = new ScrollView(this); root = new LinearLayout(this); root.setOrientation(LinearLayout.VERTICAL); root.setPadding(48, 70, 48, 40); root.setBackgroundColor(Color.rgb(244,248,253)); scroll.addView(root); setContentView(scroll);
        label("Jarvis 通知桥", 28); label("原生接收 · 本机保存 · Jarvis 按需分析", 14);
        status = label("正在读取状态…", 15);
        button("设置通知使用权", v -> { try { startActivity(new Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS)); } catch (RuntimeException e) { status.setText("系统未提供通知设置入口，请手动进入系统设置。"); } });
        String caller = getCallingPackage();
        if ("com.jarvis.notificationbridge.PAIR".equals(getIntent().getAction()) && trustedCaller(caller)) {
            label("请求读取本机通知的应用：\n" + caller + "\n授权后，Jarvis 可读取这些通知，并按你的配置发往中转站分析。通知桥本身不联网。", 14);
            button("授权连接 Jarvis", v -> {
                Intent result = new Intent().setData(ReceiptProvider.ROOT);
                result.setClipData(ClipData.newRawUri("Jarvis receipts", ReceiptProvider.ROOT));
                result.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION | Intent.FLAG_GRANT_PREFIX_URI_PERMISSION);
                setResult(RESULT_OK, result); finish();
            });
        } else label("回到 Jarvis 的更多设置，点击“连接原生通知桥”完成授权。", 14);
        button("请求重新连接系统监听", v -> { CaptureService.rebind(this); refreshStatus(); });
        button("断开 Jarvis 的读取授权", v -> { revokeUriPermission(ReceiptProvider.ROOT, Intent.FLAG_GRANT_READ_URI_PERMISSION); status.setText("已撤销读取授权，通知仍保留本机。可回 Jarvis 重新连接。"); });
        button("清除本机通知记录", v -> new AlertDialog.Builder(this).setMessage("仅清除此应用保存的通知记录，不影响微信聊天或 Jarvis 记忆。").setNegativeButton("取消", null).setPositiveButton("清除", (d,w) -> { ReceiptStore.get(this).clear(); refreshStatus(); }).show());
        label("仅保存微信、QQ、钉钉实际通知，最多 5000 条、保留 7 天。不会读取应用内部聊天历史。\n脚本退出后本服务可独立接收；强行停止、撤销权限、系统后台限制仍可能漏收。OPPO 请允许后台运行和自启动。", 13);
    }
    static boolean trustedCaller(String pkg) { return "org.autojs.autojs6".equals(pkg) || "org.autojs.autojs6.debug".equals(pkg) || "org.autojs.autojs6.inrt".equals(pkg); }
    private TextView label(String text, int size) { TextView view = new TextView(this); view.setText(text); view.setTextSize(size); view.setTextColor(Color.rgb(35,57,82)); view.setPadding(0,16,0,18); root.addView(view); return view; }
    private void button(String title, View.OnClickListener listener) { Button view = new Button(this); view.setText(title); view.setTextColor(Color.rgb(40,78,118)); view.setOnClickListener(listener); root.addView(view); }
    private void refreshStatus() {
        try {
            boolean granted = ((NotificationManager)getSystemService(NOTIFICATION_SERVICE)).isNotificationListenerAccessGranted(new ComponentName(this, CaptureService.class));
            long[] info = ReceiptStore.get(this).bounds(); String error = getSharedPreferences("health",0).getString("error", "");
            status.setText("通知使用权：" + (granted ? "已授权" : "未授权") + "\n系统监听连接：" + (CaptureService.connected ? "已连接" : "未连接") + "\n本机记录：" + info[2] + " 条" + (error.isEmpty() ? "" : "\n" + error));
        } catch (RuntimeException e) { status.setText("本机数据库暂不可读，请重新打开应用检查。"); }
    }
    @Override protected void onResume() { super.onResume(); timer.post(refresh); }
    @Override protected void onPause() { timer.removeCallbacks(refresh); super.onPause(); }
}
