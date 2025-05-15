"use server"

import { revalidatePath } from "next/cache"

export async function detectObjects(formData) {
  try {
    const response = await fetch("https://object-detector-api-production-6f85.up.railway.app/predict", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Server error ${response.status}: ${text}`);
    }

    const data = await response.json();
    return data.predictions;

  } catch (err) {
    console.error("API error:", err);
    throw err;
  }
}
