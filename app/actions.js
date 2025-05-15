"use server"

import { revalidatePath } from "next/cache"

export async function detectObjects(formData) {
  try {
    // Get the image file from the form data
    const imageFile = formData.get("file")

    if (!imageFile) {
      throw new Error("No image file provided")
    }

    // using a REST API:
    const response = await fetch("https://object-detector-api-production-6f85.up.railway.app/predict", {
      method: 'POST',
      body: formData,
    })
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }
    
    const data = await response.json()
    return data.predictions

    
  } catch (error) {
    console.error("Error in detectObjects:", error)
    throw new Error("Failed to process image")
  }
}
