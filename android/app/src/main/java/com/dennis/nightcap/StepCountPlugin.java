package com.dennis.nightcap;

import android.content.Intent;
import android.net.Uri;

import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContract;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.Set;

@CapacitorPlugin(name = "StepCount")
public class StepCountPlugin extends Plugin {

    private static final String HEALTH_CONNECT_PACKAGE = "com.google.android.apps.healthdata";

    private ActivityResultLauncher<Set<String>> permissionLauncher;
    private PluginCall pendingPermissionCall;

    @Override
    public void load() {
        ActivityResultContract<Set<String>, Set<String>> contract =
                HealthConnectHelper.createPermissionContract();

        permissionLauncher = getActivity().registerForActivityResult(contract, granted -> {
            PluginCall call = pendingPermissionCall;
            pendingPermissionCall = null;
            if (call == null) return;
            JSObject result = new JSObject();
            result.put("granted", HealthConnectHelper.grantIncludesSteps(granted));
            call.resolve(result);
        });
    }

    @PluginMethod
    public void hasPermission(PluginCall call) {
        boolean available = HealthConnectHelper.isAvailable(getContext());
        JSObject result = new JSObject();
        result.put("available", available);
        result.put("granted", available && HealthConnectHelper.hasStepsPermission(getContext()));
        call.resolve(result);
    }

    @PluginMethod
    public void requestPermission(PluginCall call) {
        if (!HealthConnectHelper.isAvailable(getContext())) {
            openHealthConnectInPlayStore();
            JSObject result = new JSObject();
            result.put("granted", false);
            call.resolve(result);
            return;
        }

        pendingPermissionCall = call;
        permissionLauncher.launch(HealthConnectHelper.requiredPermissions());
    }

    @PluginMethod
    public void getTodaySteps(PluginCall call) {
        boolean available = HealthConnectHelper.isAvailable(getContext());
        JSObject result = new JSObject();
        result.put("available", available);

        if (!available) {
            call.resolve(result);
            return;
        }

        boolean granted = HealthConnectHelper.hasStepsPermission(getContext());
        result.put("granted", granted);

        if (!granted) {
            call.resolve(result);
            return;
        }

        result.put("steps", HealthConnectHelper.getTodaySteps(getContext()));
        call.resolve(result);
    }

    // Health Connect isn't preinstalled on Android 9-13, so send the user to its
    // Play Store listing instead of showing a permission dialog that can't appear yet.
    private void openHealthConnectInPlayStore() {
        try {
            Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse("market://details?id=" + HEALTH_CONNECT_PACKAGE));
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);
        } catch (Exception e) {
            Intent intent = new Intent(Intent.ACTION_VIEW,
                    Uri.parse("https://play.google.com/store/apps/details?id=" + HEALTH_CONNECT_PACKAGE));
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);
        }
    }
}
