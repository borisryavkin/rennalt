package com.example.qrscanner.shared.store

import android.content.Context
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import com.example.qrscanner.shared.model.ScanRecord
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import kotlinx.serialization.builtins.ListSerializer
import kotlinx.serialization.json.Json

private const val STORE_NAME = "scan_history"
private const val KEY_NAME = "history_json"

private val Context.scanHistoryDataStore by preferencesDataStore(name = STORE_NAME)

class HistoryStore(private val context: Context) {
    private val json = Json { ignoreUnknownKeys = true }
    private val key = stringPreferencesKey(KEY_NAME)

    val historyFlow: Flow<List<ScanRecord>> = context.scanHistoryDataStore.data.map { prefs ->
        val raw = prefs[key] ?: return@map emptyList()
        runCatching { json.decodeFromString(ListSerializer(ScanRecord.serializer()), raw) }
            .getOrDefault(emptyList())
    }

    suspend fun add(record: ScanRecord, maxItems: Int = 200) {
        context.scanHistoryDataStore.edit { prefs ->
            val current = prefs[key]?.let { raw ->
                runCatching { json.decodeFromString(ListSerializer(ScanRecord.serializer()), raw) }
                    .getOrDefault(emptyList())
            } ?: emptyList()

            val updated = listOf(record) + current
            val trimmed = if (updated.size > maxItems) updated.take(maxItems) else updated
            prefs[key] = json.encodeToString(ListSerializer(ScanRecord.serializer()), trimmed)
        }
    }
}
