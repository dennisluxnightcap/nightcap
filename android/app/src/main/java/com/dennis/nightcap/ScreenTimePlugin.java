package com.dennis.nightcap;

import android.app.AppOpsManager;
import android.app.usage.UsageEvents;
import android.app.usage.UsageStatsManager;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.provider.Settings;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.ArrayList;
import java.util.Calendar;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@CapacitorPlugin(name = "ScreenTime")
public class ScreenTimePlugin extends Plugin {

    @PluginMethod
    public void hasPermission(PluginCall call) {
        JSObject result = new JSObject();
        result.put("granted", hasUsagePermission());
        call.resolve(result);
    }

    @PluginMethod
    public void requestPermission(PluginCall call) {
        Intent intent = new Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        getContext().startActivity(intent);
        call.resolve();
    }

    @PluginMethod
    public void getScreenTime(PluginCall call) {
        if (!hasUsagePermission()) {
            JSObject result = new JSObject();
            result.put("hasPermission", false);
            call.resolve(result);
            return;
        }

        UsageStatsManager usm = (UsageStatsManager) getContext()
                .getSystemService(Context.USAGE_STATS_SERVICE);

        Calendar cal = Calendar.getInstance();
        cal.set(Calendar.HOUR_OF_DAY, 0);
        cal.set(Calendar.MINUTE, 0);
        cal.set(Calendar.SECOND, 0);
        cal.set(Calendar.MILLISECOND, 0);
        long startTime = cal.getTimeInMillis();
        long endTime = System.currentTimeMillis();

        UsageEvents events = usm.queryEvents(startTime, endTime);
        UsageEvents.Event event = new UsageEvents.Event();

        // Screen-bounded per-app tracking
        boolean isScreenOn = false;
        long screenOnTime = 0L;
        long totalScreenTime = 0L;

        // Per-app: packageName -> foreground start time (only while screen is on)
        Map<String, Long> appFgStart = new HashMap<>();
        // Per-app: packageName -> total time
        Map<String, Long> appTimeMap = new HashMap<>();

        while (events.hasNextEvent()) {
            events.getNextEvent(event);
            long ts = event.getTimeStamp();
            String pkg = event.getPackageName();

            switch (event.getEventType()) {
                case UsageEvents.Event.SCREEN_INTERACTIVE:
                    isScreenOn = true;
                    screenOnTime = ts;
                    break;

                case UsageEvents.Event.SCREEN_NON_INTERACTIVE:
                    if (isScreenOn && screenOnTime > 0) {
                        totalScreenTime += (ts - screenOnTime);
                        // Close all open app sessions
                        for (Map.Entry<String, Long> entry : appFgStart.entrySet()) {
                            long elapsed = ts - entry.getValue();
                            appTimeMap.merge(entry.getKey(), elapsed, Long::sum);
                        }
                        appFgStart.clear();
                    }
                    isScreenOn = false;
                    screenOnTime = 0L;
                    break;

                case UsageEvents.Event.ACTIVITY_RESUMED:
                    if (isScreenOn) {
                        appFgStart.put(pkg, ts);
                    }
                    break;

                case UsageEvents.Event.ACTIVITY_PAUSED:
                    Long fgStart = appFgStart.remove(pkg);
                    if (fgStart != null && isScreenOn) {
                        long elapsed = ts - fgStart;
                        appTimeMap.merge(pkg, elapsed, Long::sum);
                    }
                    break;
            }
        }

        // If screen is still on, close open sessions up to now
        if (isScreenOn && screenOnTime > 0) {
            totalScreenTime += (endTime - screenOnTime);
            for (Map.Entry<String, Long> entry : appFgStart.entrySet()) {
                long elapsed = endTime - entry.getValue();
                appTimeMap.merge(entry.getKey(), elapsed, Long::sum);
            }
        }

        // Build app list — only user-launchable apps used > 1 min
        PackageManager pm = getContext().getPackageManager();
        List<JSObject> apps = new ArrayList<>();

        for (Map.Entry<String, Long> entry : appTimeMap.entrySet()) {
            String pkg = entry.getKey();
            long time = entry.getValue();
            if (time < 60000) continue;

            Intent launchIntent = pm.getLaunchIntentForPackage(pkg);
            if (launchIntent == null) continue;

            // Skip Nightcap itself
            if (pkg.equals(getContext().getPackageName())) continue;

            String appName;
            try {
                ApplicationInfo info = pm.getApplicationInfo(pkg, 0);
                appName = pm.getApplicationLabel(info).toString();
            } catch (PackageManager.NameNotFoundException e) {
                continue;
            }

            JSObject app = new JSObject();
            app.put("appName", appName);
            app.put("packageName", pkg);
            app.put("timeMs", time);
            apps.add(app);
        }

        Collections.sort(apps, (a, b) -> {
            try { return Long.compare(b.getLong("timeMs"), a.getLong("timeMs")); }
            catch (Exception e) { return 0; }
        });

        JSArray topApps = new JSArray();
        for (int i = 0; i < Math.min(5, apps.size()); i++) {
            topApps.put(apps.get(i));
        }

        JSObject result = new JSObject();
        result.put("hasPermission", true);
        result.put("totalMs", totalScreenTime);
        result.put("apps", topApps);
        call.resolve(result);
    }

    private boolean hasUsagePermission() {
        AppOpsManager appOps = (AppOpsManager) getContext()
                .getSystemService(Context.APP_OPS_SERVICE);
        int mode = appOps.checkOpNoThrow(
                AppOpsManager.OPSTR_GET_USAGE_STATS,
                android.os.Process.myUid(),
                getContext().getPackageName()
        );
        return mode == AppOpsManager.MODE_ALLOWED;
    }
}
