package com.jarvis.notificationbridge;

import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.os.Bundle;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;

public final class OpenNotificationActivity extends Activity {
    private String pendingKey, targetPackage;
    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        String caller = getCallingPackage();
        try {
            if (caller == null || checkUriPermission(ReceiptProvider.ROOT, -1, getPackageManager().getPackageUid(caller, 0), Intent.FLAG_GRANT_READ_URI_PERMISSION) != PackageManager.PERMISSION_GRANTED) { finish(); return; }
            long id = Long.parseLong(getIntent().getStringExtra("receipt_id"));
            try (Cursor c = ReceiptStore.get(this).row(id)) {
                if (!c.moveToFirst()) { showFallback(null); return; }
                String pkg = c.getString(1), key = c.getString(6);
                if (!ReceiptStore.allowed(pkg)) { finish(); return; }
                pendingKey = key; targetPackage = pkg;
                TextView preparing = new TextView(this); preparing.setPadding(40,80,40,40); preparing.setText("正在请求打开通知对应会话…"); setContentView(preparing);
            }
        } catch (RuntimeException | PackageManager.NameNotFoundException e) { finish(); }
    }
    @Override public void onWindowFocusChanged(boolean focused) {
        super.onWindowFocusChanged(focused);
        if (focused && pendingKey != null) {
            String key = pendingKey; pendingKey = null;
            if (CaptureService.open(this, key)) finish(); else showFallback(targetPackage);
        }
    }
    private void showFallback(String pkg) {
        LinearLayout root = new LinearLayout(this); root.setOrientation(LinearLayout.VERTICAL); root.setPadding(40,80,40,40);
        TextView text = new TextView(this); text.setText("此通知的聊天跳转已失效，未打开指定联系人。可打开应用后选择会话。"); text.setTextSize(17); root.addView(text);
        if (pkg != null) { Button open = new Button(this); open.setText("打开应用"); open.setOnClickListener(v -> { Intent launch = getPackageManager().getLaunchIntentForPackage(pkg); if (launch != null) startActivity(launch); finish(); }); root.addView(open); }
        setContentView(root);
    }
}
