package com.jarvis.notificationbridge;

import android.content.ContentProvider;
import android.content.ContentValues;
import android.database.Cursor;
import android.database.CursorWrapper;
import android.net.Uri;
import android.os.Bundle;

public final class ReceiptProvider extends ContentProvider {
    public static final Uri ROOT = Uri.parse("content://com.jarvis.notificationbridge.receipts/notifications");
    @Override public boolean onCreate() { return true; }
    @Override public Cursor query(Uri uri, String[] projection, String selection, String[] args, String order) {
        if (!ROOT.getAuthority().equals(uri.getAuthority()) || !"/notifications".equals(uri.getPath())) throw new IllegalArgumentException("Unsupported receipt URI");
        long after = 0; int limit = 20;
        try { String value = uri.getQueryParameter("after"); if (value != null) after = Long.parseLong(value); value = uri.getQueryParameter("limit"); if (value != null) limit = Integer.parseInt(value); }
        catch (NumberFormatException e) { throw new IllegalArgumentException("Invalid cursor"); }
        ReceiptStore store = ReceiptStore.get(getContext()); final Bundle info = new Bundle();
        long[] bounds = store.bounds(); info.putString("instance_id", store.instanceId()); info.putLong("min_id", bounds[0]); info.putLong("max_id", bounds[1]); info.putLong("count", bounds[2]); info.putBoolean("listener_connected", CaptureService.connected);
        return new CursorWrapper(store.after(after, limit)) { @Override public Bundle getExtras() { return info; } };
    }
    @Override public String getType(Uri uri) { return "vnd.android.cursor.dir/vnd.jarvis.notification-receipt"; }
    @Override public Uri insert(Uri uri, ContentValues values) { throw new UnsupportedOperationException("Read only"); }
    @Override public int update(Uri uri, ContentValues values, String where, String[] args) { throw new UnsupportedOperationException("Read only"); }
    @Override public int delete(Uri uri, String where, String[] args) { throw new UnsupportedOperationException("Read only"); }
}
