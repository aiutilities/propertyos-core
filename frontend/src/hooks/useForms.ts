"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { apiRequest } from "@/lib/api";

import {
  CreateFormInput,
  FormDefinition,
  FormStatus,
  FormSubmission,
  SubmitFormInput,
} from "@/types/forms";

type ApiResponse<T> = {
  success: boolean;
  data: T;
};

export function useForms(
  status = "",
) {
  const [forms, setForms] =
    useState<FormDefinition[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const query = status
        ? `?status=${encodeURIComponent(status)}`
        : "";

      const response = await apiRequest<
        ApiResponse<FormDefinition[]>
      >(`/forms${query}`);

      setForms(response.data ?? []);
    } catch (caught) {
      setForms([]);
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to load forms.",
      );
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    forms,
    loading,
    error,
    refresh,
  };
}

export async function getForm(
  id: string,
): Promise<FormDefinition> {
  const response = await apiRequest<
    ApiResponse<FormDefinition>
  >(`/forms/${id}`);

  return response.data;
}

export async function getFormByCode(
  code: string,
): Promise<FormDefinition> {
  const response = await apiRequest<
    ApiResponse<FormDefinition>
  >(`/forms/code/${encodeURIComponent(code)}`);

  return response.data;
}

export async function createForm(
  input: CreateFormInput,
): Promise<FormDefinition> {
  const response = await apiRequest<
    ApiResponse<FormDefinition>
  >("/forms", {
    method: "POST",
    body: JSON.stringify(input),
  });

  return response.data;
}

export async function updateFormStatus(
  id: string,
  status: FormStatus,
): Promise<FormDefinition> {
  const response = await apiRequest<
    ApiResponse<FormDefinition>
  >(`/forms/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({
      status,
    }),
  });

  return response.data;
}

export async function submitForm(
  id: string,
  input: SubmitFormInput,
): Promise<FormSubmission> {
  const response = await apiRequest<
    ApiResponse<FormSubmission>
  >(`/forms/${id}/submit`, {
    method: "POST",
    body: JSON.stringify(input),
  });

  return response.data;
}

export async function listFormSubmissions(
  id: string,
): Promise<FormSubmission[]> {
  const response = await apiRequest<
    ApiResponse<FormSubmission[]>
  >(`/forms/${id}/submissions`);

  return response.data ?? [];
}
