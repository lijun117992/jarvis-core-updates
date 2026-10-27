package com.jarvis.notificationbridge;

import android.app.Notification;
import android.content.ContentValues;
import android.content.Context;
import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;
import android.database.sqlite.SQLiteOpenHelper;
import android.service.notification.StatusBarNotification;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.UUID;

final class ReceiptStore extends SQLiteOpenHelper {
    static final String[] COLUMNS = {"_id", "package", "sender", "text", "posted_at", "received_at", "event_key"};
    private static ReceiptStore instance;
    private final Context context;
    static synchronized ReceiptStore get(Context context) {
        if (instance == null) instance = new ReceiptStore(context.getApplicationContext());
        return instance;
    }
    private ReceiptStore(Context context) {
        super(context, "receipts.db", null, 1); this.context = context;
        setWriteAheadLoggingEnabled(true);
    }
    @Override public void onConfigure(SQLiteDatabase db) { db.execSQL("PRAGMA synchronous=FULL"); }
    @Override public void onCreate(SQLiteDatabase db) {
        db.execSQL("CREATE TABLE receipts (_id INTEGER PRIMARY KEY AUTOINCREMENT, package TEXT NOT NULL, sender TEXT NOT NULL, text TEXT NOT NULL, posted_at INTEGER NOT NULL, received_at INTEGER NOT NULL, event_key TEXT NOT NULL UNIQUE)");
        db.execSQL("CREATE TABLE metadata (name TEXT PRIMARY KEY, value TEXT NOT NULL)");
        ContentValues value = new ContentValues(); value.put("name", "instance"); value.put("value", UUID.randomUUID().toString()); db.insertOrThrow("metadata", null, value);
    }
    @Override public void onUpgrade(SQLiteDatabase db, int from, int to) { throw new IllegalStateException("Unsupported database version"); }
    static boolean allowed(String pkg) { return "com.tencent.mm".equals(pkg) || "com.tencent.mobileqq".equals(pkg) || "com.alibaba.android.rimet".equals(pkg); }
    static String clipped(CharSequence value, int max) { String s = value == null ? "" : value.toString(); return s.length() > max ? s.substring(0, max) : s; }
    static String eventKey(StatusBarNotification sbn, String sender, String text) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest((sbn.getKey() + "\n" + sbn.getPostTime() + "\n" + sender + "\n" + text).getBytes(StandardCharsets.UTF_8));
            StringBuilder key = new StringBuilder(); for (byte b : digest) key.append(String.format(java.util.Locale.ROOT, "%02x", b & 255)); return key.toString();
        } catch (Exception e) { throw new IllegalStateException("Notification fingerprint unavailable", e); }
    }
    synchronized long add(String pkg, String sender, String text, long postedAt, String eventKey) {
        SQLiteDatabase db = getWritableDatabase(); long result;
        db.beginTransaction();
        try {
            ContentValues row = new ContentValues(); row.put("package", pkg); row.put("sender", sender); row.put("text", text); row.put("posted_at", postedAt); row.put("received_at", System.currentTimeMillis()); row.put("event_key", eventKey);
            result = db.insertWithOnConflict("receipts", null, row, SQLiteDatabase.CONFLICT_IGNORE);
            db.delete("receipts", "received_at < ?", new String[]{Long.toString(System.currentTimeMillis() - 7L * 86400000L)});
            db.execSQL("DELETE FROM receipts WHERE _id NOT IN (SELECT _id FROM receipts ORDER BY _id DESC LIMIT 5000)");
            db.setTransactionSuccessful();
        } finally { db.endTransaction(); }
        return result;
    }
    private void expire() { getWritableDatabase().delete("receipts", "received_at < ?", new String[]{Long.toString(System.currentTimeMillis() - 7L * 86400000L)}); }
    synchronized Cursor after(long id, int limit) { expire(); return getReadableDatabase().query("receipts", COLUMNS, "_id > ?", new String[]{Long.toString(Math.max(0, id))}, null, null, "_id ASC", Integer.toString(Math.max(1, Math.min(50, limit)))); }
    synchronized Cursor row(long id) { expire(); return getReadableDatabase().query("receipts", COLUMNS, "_id = ?", new String[]{Long.toString(id)}, null, null, null); }
    synchronized String instanceId() { try (Cursor c = getReadableDatabase().rawQuery("SELECT value FROM metadata WHERE name='instance'", null)) { if (!c.moveToFirst()) throw new IllegalStateException("Missing instance id"); return c.getString(0); } }
    synchronized long[] bounds() { expire(); try (Cursor c = getReadableDatabase().rawQuery("SELECT MIN(_id),MAX(_id),COUNT(*) FROM receipts", null)) { c.moveToFirst(); return new long[]{c.isNull(0) ? 0 : c.getLong(0), c.isNull(1) ? 0 : c.getLong(1), c.getLong(2)}; } }
    synchronized void clear() { getWritableDatabase().delete("receipts", null, null); CaptureService.clearLinks(); }
}
