"use server"

import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { z } from "zod"

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
})

export async function registerUser(prevState: any, formData: FormData) {
  const validatedFields = schema.safeParse(Object.fromEntries(formData))

  if (!validatedFields.success) return { error: "Invalid fields" }

  const { name, email, password } = validatedFields.data
  const hashedPassword = await bcrypt.hash(password, 10)

  try {
    await prisma.user.create({
      data: { name, email, password: hashedPassword },
    })
    return { success: "User created" }
  } catch (e) {
    return { error: "Email already exists" }
  }
}