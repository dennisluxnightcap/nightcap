package com.dennis.nightcap

import android.content.Context
import android.util.Log
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.PermissionController
import androidx.health.connect.client.permission.HealthPermission
import androidx.health.connect.client.records.StepsRecord
import androidx.health.connect.client.request.ReadRecordsRequest
import androidx.health.connect.client.time.TimeRangeFilter
import kotlinx.coroutines.runBlocking
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId

/**
 * Thin Kotlin wrapper around Health Connect's coroutine-based API so the
 * Capacitor plugin (Java) can call it as plain blocking methods. Capacitor
 * plugin methods already run off the UI thread, so runBlocking here is safe.
 */
object HealthConnectHelper {
    private val STEPS_PERMISSION = HealthPermission.getReadPermission(StepsRecord::class)

    @JvmStatic
    fun requiredPermissions(): Set<String> = setOf(STEPS_PERMISSION)

    @JvmStatic
    fun isAvailable(context: Context): Boolean =
        HealthConnectClient.getSdkStatus(context) == HealthConnectClient.SDK_AVAILABLE

    @JvmStatic
    fun createPermissionContract() = PermissionController.createRequestPermissionResultContract()

    @JvmStatic
    fun grantIncludesSteps(granted: Set<String>): Boolean = granted.contains(STEPS_PERMISSION)

    @JvmStatic
    fun hasStepsPermission(context: Context): Boolean = runBlocking {
        val client = HealthConnectClient.getOrCreate(context)
        client.permissionController.getGrantedPermissions().contains(STEPS_PERMISSION)
    }

    /**
     * Start of the current "nightcap day": the most recent local noon at or
     * before now. Steps accumulate through the evening and past midnight, so
     * a calendar-midnight boundary would make a 1am query window reset to
     * near-zero mid-ritual; anchoring the seam at noon instead keeps a whole
     * evening-into-early-morning session in one window.
     */
    private fun nightcapDayStart(zone: ZoneId): Instant {
        val today = LocalDate.now(zone)
        val noonToday = today.atTime(12, 0).atZone(zone).toInstant()
        return if (Instant.now().isBefore(noonToday)) {
            today.minusDays(1).atTime(12, 0).atZone(zone).toInstant()
        } else {
            noonToday
        }
    }

    /**
     * Total steps recorded since the start of the current nightcap day, up to now.
     *
     * Deliberately not Health Connect's own aggregate() call: when more than one
     * app writes step data (e.g. a synced Fitbit alongside the phone's own
     * on-device counter), that API can still double-count overlapping records
     * from different sources. Instead, sum raw records per source and take the
     * single highest total — correct with one source, and avoids double-counting
     * when a second source is just mirroring the same real steps.
     */
    @JvmStatic
    fun getTodaySteps(context: Context): Long = runBlocking {
        val client = HealthConnectClient.getOrCreate(context)
        val zone = ZoneId.systemDefault()
        val filter = TimeRangeFilter.between(nightcapDayStart(zone), Instant.now())

        val records = client.readRecords(ReadRecordsRequest(StepsRecord::class, timeRangeFilter = filter)).records
        val totalsBySource = records.groupBy { it.metadata.dataOrigin.packageName }
            .mapValues { (_, recs) -> recs.sumOf { it.count } }

        val best = totalsBySource.maxByOrNull { it.value }
        Log.d("NightcapSteps", "totals by source=$totalsBySource, using=${best?.key}")
        best?.value ?: 0L
    }
}
