import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { CaseBrief } from "./models/caseBrief"
import { Brief } from "@/components/BriefCard"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Convert Firebase CaseBrief to UI Brief model
export function caseBriefToBrief(caseBrief: CaseBrief): Brief {
  return {
    id: caseBrief.id || '',
    title: caseBrief.title,
    courseName: caseBrief.court || '',
    facts: caseBrief.facts,
    issue: caseBrief.issue,
    rule: caseBrief.reasoning, // Map reasoning to rule
    analysis: caseBrief.reasoning,
    conclusion: caseBrief.holding,
    summary: `${caseBrief.issue} ${caseBrief.holding}`.substring(0, 200),
    author: 'Community Member', // We could fetch author name if needed
    date: new Date(caseBrief.date).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    }),
    savedCount: 0,
    snippet: caseBrief.facts.substring(0, 150) + (caseBrief.facts.length > 150 ? '...' : ''),
    tags: [caseBrief.court].filter(Boolean),
  }
}

// Convert array of CaseBriefs to array of Briefs
export function caseBriefsToBriefs(caseBriefs: CaseBrief[]): Brief[] {
  return caseBriefs.map(caseBrief => caseBriefToBrief(caseBrief))
}
