/* Shared deterministic logic. Runs in AutoJs6, browsers and Node tests. */
(function(root, factory) {
    if (typeof module === "object" && module.exports) module.exports = factory();
    else root.CompanionCore = factory();
})(this, function() {
    var names = ["IDLE", "LISTENING", "THINKING", "WORKING", "URGENT", "CRYING", "HAPPY", "SPEECHLESS"];
    var fps = [5, 9, 6, 9, 10, 6, 9, 5];
    var atlasFrames = [[56,55,148,180],[206,55,297,180],[357,55,450,180],[509,55,603,180],[658,55,755,180],[812,55,906,180],[963,55,1059,180],[1115,55,1210,180],[39,199,153,328],[192,200,309,328],[347,198,461,328],[497,199,613,328],[648,200,764,328],[800,200,918,328],[955,197,1074,328],[1106,200,1221,328],[51,353,151,485],[205,353,303,485],[355,354,454,485],[508,353,607,485],[659,353,759,485],[814,354,912,485],[965,354,1065,485],[1115,354,1215,485],[49,505,153,639],[203,507,303,639],[352,508,455,639],[507,507,608,639],[659,507,762,639],[811,506,916,640],[964,508,1067,639],[1115,507,1218,639],[42,655,158,789],[198,658,310,790],[349,659,466,790],[503,655,619,790],[656,655,774,790],[810,657,923,790],[961,658,1076,790],[1116,656,1224,789],[51,811,149,934],[185,811,307,934],[349,809,455,935],[483,814,609,935],[655,813,764,935],[798,813,924,935],[960,809,1063,935],[1100,812,1226,935],[47,949,158,1080],[201,953,305,1081],[353,952,459,1082],[506,952,611,1081],[657,951,765,1081],[811,955,918,1083],[963,950,1068,1081],[1113,951,1220,1081],[51,1102,147,1230],[204,1102,303,1230],[355,1102,455,1230],[509,1102,606,1230],[660,1101,759,1230],[813,1101,912,1230],[970,1102,1067,1230],[1117,1101,1217,1230]]; // ATLAS_RECTS
    function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }
    function frame(state, elapsed, width, height) {
        var row = names.indexOf(state); if (row < 0) row = 0;
        var col = Math.floor(Math.max(0, elapsed) * fps[row] / 1000) % 8;
        var rect = atlasFrames ? atlasFrames[row * 8 + col] : [Math.round(col * width / 8), Math.round(row * height / 8), Math.round((col + 1) * width / 8), Math.round((row + 1) * height / 8)];
        return { row: row, col: col, left: rect[0], top: rect[1], right: rect[2], bottom: rect[3] };
    }
    function mirror(centerX, width) { return centerX < width / 2; }
    function chooseState(listening, thinking, working, mood) {
        return listening ? "LISTENING" : thinking ? "THINKING" : working ? "WORKING" : names.indexOf(mood) >= 0 ? mood : "IDLE";
    }
    function bubble(x, y, actorSize, width, height, bw, bh) {
        var gap = 9, left = clamp(x + actorSize / 2 - bw / 2, 10, Math.max(10, width - bw - 10));
        var above = y >= bh + gap + 32;
        var top = above ? y - bh - gap : y + actorSize + gap;
        top = clamp(top, 30, Math.max(30, height - bh - 50));
        return { x: Math.round(left), y: Math.round(top), above: above,
            tail: clamp(x + actorSize / 2 - left, 20, bw - 20) };
    }
    function splitSentences(text, maxLength) {
        var max = maxLength || 42, chars = Array.from ? Array.from(String(text)) : String(text).split("");
        var output = [], current = "";
        for (var i = 0; i < chars.length; i++) {
            current += chars[i];
            if (/[。！？!?；;\n]/.test(chars[i]) || current.length >= max || (/[，,：:]/.test(chars[i]) && current.length >= 16)) {
                if (current.trim()) output.push(current); else if (output.length) output[output.length - 1] += current;
                current = "";
            }
        }
        if (current.trim()) output.push(current); else if (current && output.length) output[output.length - 1] += current;
        return output;
    }
    function progressCount(text, positionMs, durationMs) {
        var chars = Array.from ? Array.from(String(text)) : String(text).split("");
        return Math.floor(chars.length * clamp(durationMs > 0 ? positionMs / durationMs : 0, 0, 1));
    }
    function speechBlocks(text, maxLength) {
        var s = String(text), max = maxLength || 2200, out = [];
        while (s.length > max) {
            var cut = s.slice(0, max).lastIndexOf("\n");
            if (cut < max / 2) cut = max;
            else cut += 1;
            var code = s.charCodeAt(cut - 1);
            if (code >= 0xD800 && code <= 0xDBFF) cut--;
            out.push(s.slice(0, cut)); s = s.slice(cut);
        }
        if (s) out.push(s);
        return out;
    }
    function prefix(text, count) { return (Array.from ? Array.from(String(text)) : String(text).split("")).slice(0, count).join(""); }
    function destination(f, size) {
        var maxW = 1, maxH = 1;
        if (atlasFrames) atlasFrames.forEach(function(r) { maxW = Math.max(maxW, r[2] - r[0]); maxH = Math.max(maxH, r[3] - r[1]); });
        else { maxW = f.right - f.left; maxH = f.bottom - f.top; }
        var scale = Math.min(size * 0.88 / maxW, size * 0.90 / maxH);
        var w = (f.right - f.left) * scale, h = (f.bottom - f.top) * scale;
        return { x: (size - w) / 2, y: size * 0.94 - h, width: w, height: h };
    }
    function speed(base, mood, provider) {
        var rate = Number(base); if (!isFinite(rate)) rate = 1;
        var factor = mood === "URGENT" ? 1.05 : mood === "CRYING" ? 0.95 : 1;
        return Math.round(clamp(rate * factor, provider === "system" ? 0.5 : 0.8, provider === "system" ? 2 : 1.3) * 100) / 100;
    }
    function fishText(text, mood, emphasis, firstSentence) {
        var tags = { HAPPY: "[happy]", CRYING: "[sad]", URGENT: "[concerned]", SPEECHLESS: firstSentence ? "[sigh]" : "" };
        var tag = tags[mood] || "", spoken = String(text);
        var words = Array.isArray(emphasis) ? emphasis.slice(0, 3) : [];
        for (var i = 0; i < words.length; i++) {
            if (typeof words[i] !== "string" || words[i].length < 2 || words[i].length > 12 || /[\[\]]/.test(words[i])) continue;
            var at = spoken.indexOf(words[i]);
            if (at < 0) continue;
            spoken = spoken.slice(0, at) + "[emphasis]" + words[i] + (tag && mood !== "SPEECHLESS" ? tag : "[normal tone]") + spoken.slice(at + words[i].length);
            break;
        }
        return tag + spoken;
    }
    function upsertFishVoice(list, name, id) {
        if (!Array.isArray(list)) throw Error("音色列表格式异常，未覆盖原记录");
        id = String(id || "").trim(); name = String(name || "").trim().slice(0, 32);
        if (!/^[A-Za-z0-9_-]{1,128}$/.test(id) || /^sk-/i.test(id)) throw Error("请输入音色 ID，不要填写 API Key 或网址");
        var out = list.map(function(v) {
            if (!v || typeof v.id !== "string" || typeof v.name !== "string") throw Error("原音色记录格式异常，未覆盖");
            return { name: v.name, id: v.id };
        });
        var found = -1;
        for (var i = 0; i < out.length; i++) if (out[i].id === id) { found = i; break; }
        var item = { name: name || (found >= 0 ? out[found].name : "音色 " + (out.length + 1)), id: id };
        if (found >= 0) out[found] = item; else out.push(item);
        return out;
    }
    function cloneFishVoices(list) {
        if (!Array.isArray(list)) throw Error("音色列表格式异常，未覆盖原记录");
        return list.map(function(v) {
            if (!v || typeof v.id !== "string" || typeof v.name !== "string") throw Error("原音色记录格式异常，未覆盖");
            return { name: v.name, id: v.id };
        });
    }
    function planFishImport(list, raw, overwriteNames) {
        var items = cloneFishVoices(list), text = String(raw || "").replace(/^\uFEFF/, "").trim();
        if (!text) throw Error("请先粘贴音色名单");
        if (text.length > 200000) throw Error("一次导入内容过长，请分批导入");
        var rows = [], errors = [], seen = [], added = 0, updated = 0, duplicates = 0;
        if (/^[\[{]/.test(text)) {
            var data;
            try { data = JSON.parse(text); } catch (e) { throw Error("JSON 格式不正确，未导入"); }
            if (!Array.isArray(data)) throw Error("JSON 请使用数组：包含音色 ID 字符串或 name/id 对象");
            rows = data.map(function(v, i) { return { number: i + 1, value: v }; });
        } else {
            text.split(/\r?\n/).forEach(function(line, index) {
                line = line.trim(); if (!line || line.charAt(0) === "#") return;
                var parts = line.split(/[,，\t]/);
                rows.push({ number: index + 1, value: parts.length === 1 ? line : parts.length === 2 ? { name: parts[0].trim(), id: parts[1].trim() } : null });
            });
        }
        if (rows.length > 2000) throw Error("单次最多 2000 条，请分批导入");
        rows.forEach(function(row) {
            try {
                var v = row.value, id, name;
                if (typeof v === "string") { id = v; name = ""; }
                else if (v && typeof v === "object" && typeof v.id === "string" && (v.name === undefined || typeof v.name === "string")) { id = v.id; name = v.name || ""; }
                else throw Error("请使用 ID 或 名称,ID");
                id = id.trim(); name = name.trim();
                // Reuse single-item validation; never echo accidental keys in errors.
                upsertFishVoice([], name, id);
                if (seen.indexOf(id) >= 0) { duplicates++; return; }
                seen.push(id);
                var at = -1;
                for (var i = 0; i < items.length; i++) if (items[i].id === id) { at = i; break; }
                if (at >= 0) {
                    if (overwriteNames && name && items[at].name !== name.slice(0, 32)) { items[at].name = name.slice(0, 32); updated++; }
                    else duplicates++;
                } else { items = upsertFishVoice(items, name, id); added++; }
            } catch (e) { errors.push({ row: row.number, message: String(e.message || e) }); }
        });
        return { items: items, added: added, updated: updated, duplicates: duplicates, errors: errors, total: rows.length };
    }
    function removeFishVoices(list, ids) {
        if (!Array.isArray(ids)) throw Error("请选择要删除的音色");
        return cloneFishVoices(list).filter(function(v) { return ids.indexOf(v.id) < 0; });
    }
    function renameFishVoices(list, ids, prefix) {
        prefix = String(prefix || "").trim();
        if (!prefix || prefix.length > 28) throw Error("命名前缀请填写 1—28 个字符");
        var result = cloneFishVoices(list), count = 0;
        result.forEach(function(v) { if (ids.indexOf(v.id) >= 0) v.name = prefix + " " + (++count); });
        return result;
    }
    return { states: names, fps: fps, frame: frame, mirror: mirror, chooseState: chooseState, bubble: bubble, splitSentences: splitSentences, speechBlocks: speechBlocks, progressCount: progressCount, prefix: prefix, fishText: fishText, destination: destination, speed: speed, upsertFishVoice: upsertFishVoice, cloneFishVoices: cloneFishVoices, planFishImport: planFishImport, removeFishVoices: removeFishVoices, renameFishVoices: renameFishVoices };
});
