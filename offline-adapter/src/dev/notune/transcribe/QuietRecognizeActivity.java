package dev.notune.transcribe;

import android.Manifest;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.graphics.drawable.ColorDrawable;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.os.SystemClock;
import android.speech.RecognizerIntent;
import android.view.View;
import android.view.WindowManager;
import java.util.ArrayList;

/** User-triggered foreground recording through the proven Activity/JNI path.
 * Original runtime microphone checks, model loader and result delivery remain.
 * This is a transparent Activity, not a background recording service.
 */
public final class QuietRecognizeActivity extends RecognizeActivity {
    public static final String CONTROL = "com.jarvis.offlineinput.CONTROL";
    private final Handler handler = new Handler(Looper.getMainLooper());
    private String token = "";
    private boolean completed, finishingCapture, heardSpeech, registered;
    private int speechFrames;
    private long startedAt, lastSpeechAt;

    private final BroadcastReceiver controls = new BroadcastReceiver() {
        @Override public void onReceive(Context context, Intent intent) {
            if (completed || token.isEmpty() || !token.equals(intent.getStringExtra("session"))) return;
            if ("stop".equals(intent.getStringExtra("command"))) finishCapture();
            else if ("cancel".equals(intent.getStringExtra("command"))) cancelQuietly(null);
        }
    };
    private final Runnable tick = new Runnable() {
        @Override public void run() {
            if (completed) return;
            long now = SystemClock.elapsedRealtime();
            if (!finishingCapture) {
                if (!heardSpeech && now - startedAt >= 2000) { cancelQuietly(null); return; }
                if (heardSpeech && now - lastSpeechAt >= 2000) { finishCapture(); }
                else if (now - startedAt >= 45000) { finishCapture(); }
            }
            if (now - startedAt >= 120000) { cancelQuietly("离线模型处理超时"); return; }
            handler.postDelayed(this, 100);
        }
    };

    @Override public void onCreate(Bundle state) {
        // The manifest's transparent theme prevents an initial panel flash.
        super.onCreate(state);
        token = getIntent().getStringExtra("jarvis_session");
        if (token == null) token = "";
        getWindow().setBackgroundDrawable(new ColorDrawable(Color.TRANSPARENT));
        getWindow().clearFlags(WindowManager.LayoutParams.FLAG_DIM_BEHIND);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE
                | WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE);
        getWindow().setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_STATE_ALWAYS_HIDDEN);
        WindowManager.LayoutParams params = getWindow().getAttributes();
        params.alpha = 0f;
        params.dimAmount = 0f;
        getWindow().setAttributes(params);
        getWindow().setLayout(1, 1);
        getWindow().getDecorView().setAlpha(0f);
        if (token.length() < 16) { cancelQuietly("听写会话无效"); return; }
        if (checkSelfPermission(Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
            cancelQuietly("请允许 Jarvis 离线听写的麦克风权限"); return;
        }
        if (!hasModel()) { cancelQuietly("请在 Jarvis 离线听写中选中中文模型并等待 Ready"); return; }
        IntentFilter filter = new IntentFilter(CONTROL);
        if (Build.VERSION.SDK_INT >= 33) registerReceiver(controls, filter, Context.RECEIVER_EXPORTED);
        else registerReceiver(controls, filter);
        registered = true;
        startedAt = lastSpeechAt = SystemClock.elapsedRealtime();
        handler.post(tick);
    }

    private boolean hasModel() {
        try {
            java.lang.reflect.Method method = Class.forName("dev.notune.transcribe.ModelStore")
                    .getDeclaredMethod("hasAnyModel", Context.class);
            method.setAccessible(true);
            return Boolean.TRUE.equals(method.invoke(null, this));
        } catch (Exception ignored) {
            // R8 may rename ModelStore. The original Activity still checks the
            // real model; avoid an unverified reflection name blocking capture.
            return true;
        }
    }

    @Override public void onAudioLevel(float level) {
        handler.post(() -> {
            if (completed || finishingCapture) return;
            if (level >= 0.025f) {
                if (++speechFrames >= 3) heardSpeech = true;
                lastSpeechAt = SystemClock.elapsedRealtime();
            } else speechFrames = 0;
        });
    }
    @Override public void onAutoStop() { handler.post(this::finishCapture); }
    private void finishCapture() {
        if (completed || finishingCapture) return;
        if (!heardSpeech) { cancelQuietly(null); return; }
        finishingCapture = true;
        super.onAutoStop();
    }
    @Override public void onStatusUpdate(String value) {
        if (value != null && value.startsWith("Error")) handler.post(() -> cancelQuietly(value));
    }
    @Override public void onTextTranscribed(String text) {
        handler.post(() -> {
            if (completed) return;
            if (text == null || text.trim().isEmpty() || !heardSpeech) { cancelQuietly(null); return; }
            completed = true;
            handler.removeCallbacks(tick);
            ArrayList<String> results = new ArrayList<>();
            results.add(text.trim());
            Intent data = new Intent().putStringArrayListExtra(RecognizerIntent.EXTRA_RESULTS, results)
                    .putExtra("jarvis_session", token);
            setResult(RESULT_OK, data);
            finish();
        });
    }
    private void cancelQuietly(String error) {
        if (completed) return;
        completed = true;
        handler.removeCallbacks(tick);
        // Cancel JNI without the upstream button's early finish(), so our error
        // and session token are attached before Android dispatches the result.
        try {
            java.lang.reflect.Method cancel = RecognizeActivity.class.getDeclaredMethod("cancelRecording");
            cancel.setAccessible(true);
            cancel.invoke(this);
        } catch (Exception ignored) { /* upstream onDestroy still releases JNI */ }
        Intent data = new Intent().putExtra("jarvis_session", token);
        if (error != null) data.putExtra("jarvis_error", error);
        setResult(RESULT_CANCELED, data);
        finish();
    }
    @Override public void onDestroy() {
        completed = true;
        handler.removeCallbacksAndMessages(null);
        if (registered) { unregisterReceiver(controls); registered = false; }
        super.onDestroy();
    }
}
