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
import java.time.ZoneId
import java.time.ZonedDateTime

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

    // Hour before which "now" is still treated as last night rather than a
    // new day -- deliberately early (4am), since clock time alone can't
    // tell "still up from last night" apart from "just woke up"; past 4am
    // it's overwhelmingly the latter, so a normal morning check still reads
    // as a fresh day instead of inheriting yesterday's numbers.
    private const val SEAM_HOUR = 4

    /**
     * Start of the current "nightcap day": midnight of today, unless it's
     * currently before SEAM_HOUR, in which case the ritual finishing now
     * started the PREVIOUS calendar day -- so roll back to yesterday's
     * midnight instead of resetting to near-zero. SEAM_HOUR is only the
     * cutoff for which day to roll back to; the window itself always starts
     * at an actual midnight, so a normal evening check still gets the whole day.
     */
    private fun nightcapDayStart(zone: ZoneId): Instant {
        val now = ZonedDateTime.now(zone)
        val today = now.toLocalDate()
        val dayStart = if (now.hour < SEAM_HOUR) today.minusDays(1) else today
        return dayStart.atStartOfDay(zone).toInstant()
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
