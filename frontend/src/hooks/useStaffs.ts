"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { apiRequest } from "@/lib/api";
import {
  ApiResponse,
  CreateStaffInput,
  Staff,
  StaffAttendance,
  StaffAttendanceType,
  StaffFilters,
  StaffMetrics,
  StaffStatus,
  UpdateStaffInput,
} from "@/types/staff";

function queryString(filters: StaffFilters): string {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      params.set(key, String(value));
    }
  });

  const query = params.toString();

  return query ? `?${query}` : "";
}

export function useStaffs(filters: StaffFilters = {}) {
  const [staffs, setStaffs] = useState<Staff[]>([]);
  const [metrics, setMetrics] = useState<StaffMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const filterQuery = useMemo(
    () => queryString(filters),
    [
      filters.propertyId,
      filters.zoneId,
      filters.personId,
      filters.staffType,
      filters.status,
      filters.employeeCode,
      filters.search,
    ],
  );

  const metricsQuery = useMemo(() => {
    if (!filters.propertyId) {
      return "";
    }

    return `?propertyId=${encodeURIComponent(filters.propertyId)}`;
  }, [filters.propertyId]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [staffResponse, metricsResponse] = await Promise.all([
        apiRequest<ApiResponse<Staff[]>>(`/staff${filterQuery}`),
        apiRequest<ApiResponse<StaffMetrics>>(`/staff/metrics${metricsQuery}`),
      ]);

      setStaffs(staffResponse.data ?? []);
      setMetrics(metricsResponse.data ?? null);
    } catch (error) {
      setStaffs([]);
      setMetrics(null);
      setError(
        error instanceof Error ? error.message : "Unable to load staff.",
      );
    } finally {
      setLoading(false);
    }
  }, [filterQuery, metricsQuery]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    staffs,
    metrics,
    loading,
    error,
    refresh,
  };
}

export async function getStaff(id: string): Promise<Staff> {
  const response = await apiRequest<ApiResponse<Staff>>(`/staff/${id}`);

  return response.data;
}

export async function lookupStaffByEmployeeCode(
  propertyId: string,
  employeeCode: string,
): Promise<Staff> {
  const response = await apiRequest<ApiResponse<Staff>>(
    `/staff/lookup/employee/${encodeURIComponent(
      employeeCode,
    )}?propertyId=${encodeURIComponent(propertyId)}`,
  );

  return response.data;
}

export async function lookupStaffByQrCode(qrCode: string): Promise<Staff> {
  const response = await apiRequest<ApiResponse<Staff>>(
    `/staff/lookup/qr/${encodeURIComponent(qrCode)}`,
  );

  return response.data;
}

export async function lookupStaffByRfidTag(rfidTag: string): Promise<Staff> {
  const response = await apiRequest<ApiResponse<Staff>>(
    `/staff/lookup/rfid/${encodeURIComponent(rfidTag)}`,
  );

  return response.data;
}

export async function createStaff(input: CreateStaffInput): Promise<Staff> {
  const response = await apiRequest<ApiResponse<Staff>>("/staff", {
    method: "POST",
    body: JSON.stringify(input),
  });

  return response.data;
}

export async function updateStaff(
  id: string,
  input: UpdateStaffInput,
): Promise<Staff> {
  const response = await apiRequest<ApiResponse<Staff>>(`/staff/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });

  return response.data;
}

export async function updateStaffStatus(
  id: string,
  status: StaffStatus,
  changedByPersonId: string,
  reason?: string,
): Promise<Staff> {
  const response = await apiRequest<ApiResponse<Staff>>(`/staff/${id}/status`, {
    method: "POST",
    body: JSON.stringify({
      status,
      changedByPersonId,
      reason,
    }),
  });

  return response.data;
}

export async function recordStaffAttendance(
  id: string,
  attendanceType: StaffAttendanceType,
  recordedByPersonId: string,
  gate?: string,
  remarks?: string,
  occurredAt?: string,
): Promise<StaffAttendance> {
  const response = await apiRequest<ApiResponse<StaffAttendance>>(
    `/staff/${id}/attendance`,
    {
      method: "POST",
      body: JSON.stringify({
        attendanceType,
        recordedByPersonId,
        gate,
        remarks,
        occurredAt,
      }),
    },
  );

  return response.data;
}
