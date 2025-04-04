import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { CaseBrief } from "./models/caseBrief"
import { Brief } from "@/components/BriefCard"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Convert Firebase CaseBrief to UI Brief model
export function caseBriefToBrief(caseBrief: CaseBrief): Brief {
  // Safely handle undefined values
  const facts = caseBrief?.facts || '';
  const reasoning = caseBrief?.reasoning || '';
  const court = caseBrief?.court || '';
  
  return {
    id: caseBrief?.id || '',
    title: caseBrief?.title || 'Untitled Brief',
    courseName: caseBrief?.citation || court, // Use citation as courseName if available
    court: court, // Set the court field
    facts: facts,
    issue: caseBrief?.issue || '',
    rule: reasoning, // Map reasoning to rule
    analysis: reasoning,
    conclusion: caseBrief?.holding || '',
    author: 'Community Member', // We could fetch author name if needed
    date: caseBrief?.date ? new Date(caseBrief.date).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    }) : 'Unknown Date',
    savedCount: 0,
    viewCount: caseBrief?.viewCount || 0, // Include view count
    snippet: facts.substring(0, 150) + (facts.length > 150 ? '...' : ''), // Truncate snippet
    tags: court ? [court] : [], // Include court as a tag if available
  }
}

// Convert array of CaseBriefs to array of Briefs
export function caseBriefsToBriefs(caseBriefs: CaseBrief[]): Brief[] {
  return caseBriefs.map(caseBrief => caseBriefToBrief(caseBrief))
}
