"""Host checks for native SQL and the actual built APK. Not Android instrumentation."""
from pathlib import Path
import hashlib
import json
import re
import sqlite3
import unittest
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
NATIVE = ROOT / 'android-notifications'
APK = ROOT / 'dist/Jarvis-Notification-Bridge-v0.1.0-preview.apk'
ANDROID = '{http://schemas.android.com/apk/res/android}'

class BridgeTests(unittest.TestCase):
    def test_private_read_only_provider_and_minimal_permissions(self):
        manifest = ET.parse(NATIVE / 'AndroidManifest.xml').getroot()
        permissions = {x.attrib[ANDROID+'name'] for x in manifest.findall('uses-permission')}
        self.assertEqual(permissions, {'android.permission.RECEIVE_BOOT_COMPLETED'})
        provider = manifest.find('application/provider')
        self.assertEqual(provider.attrib[ANDROID+'exported'], 'false')
        self.assertEqual(provider.attrib[ANDROID+'grantUriPermissions'], 'true')
        self.assertEqual(manifest.find('application/service').attrib[ANDROID+'permission'], 'android.permission.BIND_NOTIFICATION_LISTENER_SERVICE')
        self.assertEqual(manifest.find('application').attrib[ANDROID+'allowBackup'], 'false')

    def test_real_schema_keeps_unique_receipts_and_a_monotonic_cursor_after_clear(self):
        source = (NATIVE / 'src/com/jarvis/notificationbridge/ReceiptStore.java').read_text(encoding='utf-8')
        sql = re.findall(r'db\.execSQL\("([^"\n]+)"\)', source)
        db = sqlite3.connect(':memory:')
        for statement in sql:
            if statement.startswith('CREATE TABLE'):
                db.execute(statement)
        insert = 'INSERT OR IGNORE INTO receipts(package,sender,text,posted_at,received_at,event_key) VALUES(?,?,?,?,?,?)'
        db.execute(insert, ('com.tencent.mm', 'synthetic', 'test', 1, 1, 'event'))
        db.execute(insert, ('com.tencent.mm', 'synthetic', 'test', 1, 1, 'event'))
        self.assertEqual(db.execute('SELECT COUNT(*) FROM receipts').fetchone()[0], 1)
        old = db.execute('SELECT MAX(_id) FROM receipts').fetchone()[0]
        db.execute('DELETE FROM receipts')
        db.execute(insert, ('com.tencent.mm', 'synthetic', 'new', 2, 2, 'next'))
        self.assertGreater(db.execute('SELECT MAX(_id) FROM receipts').fetchone()[0], old)
        for i in range(5100):
            db.execute(insert, ('com.tencent.mm', 'synthetic', 'row', i, i, 'synthetic-'+str(i)))
        prune = next(s for s in sql if s.startswith('DELETE FROM receipts'))
        db.execute(prune)
        self.assertEqual(db.execute('SELECT COUNT(*) FROM receipts').fetchone()[0], 5000)
        db.execute('DELETE FROM receipts WHERE received_at < ?', (5000,))
        self.assertEqual(db.execute('SELECT MIN(received_at) FROM receipts').fetchone()[0], 5000)
        db.close()

    def test_actual_apk_hash_signature_and_permissions(self):
        report = json.loads(APK.with_suffix('.verification.json').read_text(encoding='utf-8'))
        self.assertEqual(hashlib.sha256(APK.read_bytes()).hexdigest(), report['sha256'])
        self.assertRegex(report['certificate'], r'Verified using v[23] scheme \(APK Signature Scheme v[23]\): true')
        self.assertNotIn('android.permission.INTERNET', report['badging'])
        self.assertIn("package: name='com.jarvis.notificationbridge'", report['badging'])
        self.assertEqual(report['android_device_test'], 'NOT RUN')

if __name__ == '__main__':
    unittest.main(verbosity=2)
