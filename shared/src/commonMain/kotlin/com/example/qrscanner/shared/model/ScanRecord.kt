package com.example.qrscanner.shared.model

import kotlinx.serialization.Serializable

@Serializable
data class ScanRecord(
    val value: String,
    val format: String,
    val timestampEpochMs: Long
)
