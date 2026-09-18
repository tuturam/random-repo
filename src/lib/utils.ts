import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export type languagesType = {
  title: string
  value: string
}[]

export type LanguageSelectItems = {
  name: string,
  description: string,
  stargazers_count: number,
  language: string,
  forks_count: number,
  open_issues_count: number,
  html_url: string
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const dataLanguage = async () => {
  try {
    const response = await fetch("languages.json")
    const data = await response.json()
    return data
  } catch (error) {
    console.log(error)
  }
}
