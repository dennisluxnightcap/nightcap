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
import java.util.Arrays;
import java.util.Calendar;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

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

        long startTime = nightcapDayStart();
        long endTime = System.currentTimeMillis();

        UsageEvents events = usm.queryEvents(startTime, endTime);
        UsageEvents.Event event = new UsageEvents.Event();

        // Packages to exclude from screen time (automotive, system chrome, etc.)
        Set<String> excludedPackages = new HashSet<>(Arrays.asList(
            "com.google.android.projection.gearhead",  // Android Auto
            "com.android.systemui",
            "com.sec.android.app.launcher",
            "com.android.launcher3",
            "com.samsung.android.app.cocktailbarservice",
            "com.android.settings"
        ));

        // Screen-bounded per-app tracking
        boolean isScreenOn = false;
        long screenOnTime = 0L;

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
                    if (isScreenOn) {
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
        if (isScreenOn) {
            for (Map.Entry<String, Long> entry : appFgStart.entrySet()) {
                long elapsed = endTime - entry.getValue();
                appTimeMap.merge(entry.getKey(), elapsed, Long::sum);
            }
        }

        // Total = sum of individual app times, excluding automotive/system packages
        long totalScreenTime = 0L;
        for (Map.Entry<String, Long> entry : appTimeMap.entrySet()) {
            if (!excludedPackages.contains(entry.getKey())) {
                totalScreenTime += entry.getValue();
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

    // Hour before which "now" is still treated as last night rather than a
    // new day -- deliberately early (4am), since clock time alone can't
    // tell "still up from last night" apart from "just woke up"; past 4am
    // it's overwhelmingly the latter, so a normal morning check still reads
    // as a fresh day instead of inheriting yesterday's numbers.
    private static final int SEAM_HOUR = 4;

    // Start of the current "nightcap day": midnight of today, unless it's
    // currently before SEAM_HOUR, in which case the ritual that's finishing
    // now started the PREVIOUS calendar day -- so roll back to yesterday's
    // midnight instead of resetting to near-zero. SEAM_HOUR is only the
    // cutoff for which day we roll back to; the window itself always starts
    // at an actual midnight, so a normal evening check still gets the whole day.
    private long nightcapDayStart() {
        Calendar cal = Calendar.getInstance();
        if (cal.get(Calendar.HOUR_OF_DAY) < SEAM_HOUR) {
            cal.add(Calendar.DAY_OF_YEAR, -1);
        }
        cal.set(Calendar.HOUR_OF_DAY, 0);
        cal.set(Calendar.MINUTE, 0);
        cal.set(Calendar.SECOND, 0);
        cal.set(Calendar.MILLISECOND, 0);
        return cal.getTimeInMillis();
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
