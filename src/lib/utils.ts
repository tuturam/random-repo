import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import languagesData from "./languages.json"

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

export const dataLanguage = () => {
  return languagesData
}
